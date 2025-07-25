import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'
import {
  getClientIP,
  validateRequestSecurity,
  checkIPRateLimit,
  checkEmailRateLimit,
  generateSecureToken,
  validateEmailSecurity,
  logSecurityEvent,
  constantTimeDelay,
  createSecureErrorResponse
} from '@/lib/email-verification-security'

const resendVerificationSchema = z.object({
  email: z.string()
    .min(1, '이메일을 입력해주세요.')
    .max(254, '이메일 주소가 너무 깁니다.')
    .email('올바른 이메일 주소를 입력해주세요.'),
})

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  const clientIP = getClientIP(req)
  const userAgent = req.headers.get('user-agent') || 'unknown'
  
  // Start constant-time delay for all requests
  const delayPromise = constantTimeDelay()
  
  try {
    // Security validation
    const requestValidation = validateRequestSecurity(req)
    if (!requestValidation.success) {
      logSecurityEvent('invalid_request', {
        ip: clientIP,
        userAgent,
        error: requestValidation.error?.code
      })
      
      await delayPromise
      return NextResponse.json(
        createSecureErrorResponse(
          requestValidation.error!.code,
          '잘못된 요청입니다.',
          requestValidation.error!.statusCode
        ),
        { status: requestValidation.error!.statusCode }
      )
    }

    // IP-based rate limiting
    const ipRateCheck = checkIPRateLimit(clientIP)
    if (!ipRateCheck.allowed) {
      logSecurityEvent('rate_limit_exceeded', {
        ip: clientIP,
        userAgent,
        error: ipRateCheck.error?.code
      })
      
      await delayPromise
      return NextResponse.json(
        createSecureErrorResponse(
          ipRateCheck.error!.code,
          '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
          ipRateCheck.error!.statusCode,
          ipRateCheck.error!.retryAfter
        ),
        { 
          status: ipRateCheck.error!.statusCode,
          headers: {
            'Retry-After': ipRateCheck.error!.retryAfter?.toString() || '3600'
          }
        }
      )
    }

    // Parse and validate request body
    let body: unknown
    try {
      body = await req.json()
    } catch (error) {
      logSecurityEvent('invalid_request', {
        ip: clientIP,
        userAgent,
        error: 'Invalid JSON payload'
      })
      
      await delayPromise
      return NextResponse.json(
        createSecureErrorResponse(
          'INVALID_JSON',
          '잘못된 요청 형식입니다.',
          400
        ),
        { status: 400 }
      )
    }

    const validation = resendVerificationSchema.safeParse(body)
    if (!validation.success) {
      logSecurityEvent('invalid_request', {
        ip: clientIP,
        userAgent,
        error: 'Schema validation failed'
      })
      
      await delayPromise
      return NextResponse.json(
        createSecureErrorResponse(
          'INVALID_EMAIL',
          '올바른 이메일 주소를 입력해주세요.',
          400
        ),
        { status: 400 }
      )
    }

    const { email: rawEmail } = validation.data
    
    // Additional email security validation
    const emailValidation = validateEmailSecurity(rawEmail)
    if (!emailValidation.valid) {
      logSecurityEvent('invalid_request', {
        ip: clientIP,
        userAgent,
        email: rawEmail,
        error: emailValidation.error
      })
      
      await delayPromise
      return NextResponse.json(
        createSecureErrorResponse(
          'INVALID_EMAIL_FORMAT',
          '올바른 이메일 주소를 입력해주세요.',
          400
        ),
        { status: 400 }
      )
    }

    const email = emailValidation.normalized!

    // Email-based rate limiting
    const emailRateCheck = checkEmailRateLimit(email)
    if (!emailRateCheck.allowed) {
      logSecurityEvent('rate_limit_exceeded', {
        ip: clientIP,
        userAgent,
        email,
        error: emailRateCheck.error?.code
      })
      
      await delayPromise
      return NextResponse.json(
        createSecureErrorResponse(
          emailRateCheck.error!.code,
          emailRateCheck.error!.message,
          emailRateCheck.error!.statusCode,
          emailRateCheck.error!.retryAfter
        ),
        { 
          status: emailRateCheck.error!.statusCode,
          headers: {
            'Retry-After': emailRateCheck.error!.retryAfter?.toString() || '3600'
          }
        }
      )
    }

    // Log verification request
    logSecurityEvent('verification_request', {
      ip: clientIP,
      userAgent,
      email
    })

    // Database query with security considerations
    let user: { id: string; emailVerified: Date | null } | null = null
    let isAlreadyVerified = false
    
    try {
      user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          emailVerified: true
        }
      })
      
      if (user?.emailVerified) {
        isAlreadyVerified = true
      }
    } catch (dbError) {
      logger.error('Database error during user lookup', {
        email,
        ip: clientIP,
        error: dbError
      })
      
      // Don't reveal database errors to prevent information disclosure
      await delayPromise
      return NextResponse.json(
        createSecureErrorResponse(
          'SERVICE_UNAVAILABLE',
          '서비스를 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.',
          503
        ),
        { status: 503 }
      )
    }

    // Prevent user enumeration by using constant-time responses
    // Always wait for the full delay, regardless of user existence
    await delayPromise

    // Generic response for security (prevents user enumeration)
    const genericResponse = {
      success: true,
      message: '인증 이메일이 발송되었습니다. 이메일을 확인해주세요.'
    }

    // If user doesn't exist or is already verified, return generic success
    // This prevents attackers from determining which emails are registered
    if (!user) {
      logger.info('Verification requested for non-existent user', {
        email,
        ip: clientIP,
        userAgent
      })
      
      return NextResponse.json(genericResponse)
    }

    if (isAlreadyVerified) {
      logger.info('Verification requested for already verified user', {
        email,
        ip: clientIP,
        userAgent
      })
      
      return NextResponse.json(genericResponse)
    }

    // Database operations with transaction for consistency
    let token: string
    try {
      // Generate cryptographically secure token
      token = generateSecureToken()
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24시간 후 만료

      await prisma.$transaction(async (tx) => {
        // Delete existing tokens for this email
        await tx.verificationToken.deleteMany({
          where: {
            identifier: email,
          },
        })

        // Create new verification token
        await tx.verificationToken.create({
          data: {
            identifier: email,
            token,
            expires,
          },
        })
      })
      
      logger.info('Verification token created successfully', {
        email,
        ip: clientIP,
        tokenLength: token.length
      })
    } catch (dbError) {
      logger.error('Failed to create verification token', {
        email,
        ip: clientIP,
        error: dbError
      })
      
      return NextResponse.json(
        createSecureErrorResponse(
          'TOKEN_CREATION_FAILED',
          '서비스를 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.',
          503
        ),
        { status: 503 }
      )
    }

    // Send verification email with proper error handling
    try {
      const { resendVerificationEmail } = await import('@/lib/email')
      const emailResult = await resendVerificationEmail(email, token)
      
      if (!emailResult.success) {
        logger.error('Failed to send verification email', {
          email,
          ip: clientIP,
          error: emailResult.error
        })
        
        // Don't reveal specific email service errors
        return NextResponse.json(
          createSecureErrorResponse(
            'EMAIL_SEND_FAILED',
            '이메일 발송 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
            503
          ),
          { status: 503 }
        )
      }
      
      logger.info('Verification email sent successfully', {
        email,
        ip: clientIP,
        messageId: emailResult.messageId
      })
    } catch (emailError) {
      logger.error('Email module error', {
        email,
        ip: clientIP,
        error: emailError
      })
      
      return NextResponse.json(
        createSecureErrorResponse(
          'EMAIL_SERVICE_ERROR',
          '이메일 서비스를 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.',
          503
        ),
        { status: 503 }
      )
    }
    
    // Development-only token logging (secure)
    if (process.env.NODE_ENV === 'development') {
      logger.debug('[DEV] Verification token generated', {
        email,
        tokenPreview: `${token.substring(0, 8)}...`,
        fullToken: token // Only in development
      })
    }

    // Log successful completion
    const processingTime = Date.now() - startTime
    logger.info('Email verification request completed successfully', {
      email,
      ip: clientIP,
      userAgent,
      processingTimeMs: processingTime
    })

    return NextResponse.json(genericResponse)

  } catch (error) {
    const processingTime = Date.now() - startTime
    
    logger.error('Unexpected error in email verification endpoint', {
      ip: clientIP,
      userAgent,
      processingTimeMs: processingTime,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })

    // Ensure constant-time delay is always applied
    await delayPromise

    // Generic error response to prevent information disclosure
    return NextResponse.json(
      createSecureErrorResponse(
        'INTERNAL_ERROR',
        '서비스를 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.',
        503
      ),
      { status: 503 }
    )
  }
}
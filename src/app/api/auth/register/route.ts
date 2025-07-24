import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword, generateEmailVerificationToken } from '@/lib/utils'
import { registerSchema } from '@/lib/validations'
import { RegisterResponse } from '@/types/auth'
import { logger } from '@/lib/logger'
import { AuthErrorCode, createAuthError } from '@/types/error'
import { handleAuthError, createErrorContext, createErrorResponse } from '@/lib/error-handler'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()

    // 입력 데이터 검증
    const validationResult = registerSchema.safeParse(body)
    if (!validationResult.success) {
      const error = createAuthError(AuthErrorCode.INVALID_INPUT, {
        validationErrors: validationResult.error.errors
      })
      const context = createErrorContext('register')
      handleAuthError(error, context)
      
      return NextResponse.json(
        createErrorResponse(error),
        { status: 400 }
      )
    }

    const { email, password, nickname } = validationResult.data

    const context = createErrorContext('register', undefined, email)

    // 이메일 중복 확인
    const existingEmailUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingEmailUser) {
      const error = createAuthError(AuthErrorCode.EMAIL_ALREADY_EXISTS)
      handleAuthError(error, context)
      return NextResponse.json(
        createErrorResponse(error),
        { status: 400 }
      )
    }

    // 닉네임 중복 확인
    const existingNicknameUser = await prisma.user.findUnique({
      where: { nickname },
    })

    if (existingNicknameUser) {
      const error = createAuthError(AuthErrorCode.NICKNAME_ALREADY_EXISTS)
      handleAuthError(error, context)
      return NextResponse.json(
        createErrorResponse(error),
        { status: 400 }
      )
    }

    // 비밀번호 해싱
    const hashedPassword = await hashPassword(password)

    // 이메일 인증 토큰 생성
    const verificationToken = generateEmailVerificationToken()
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24시간

    // 트랜잭션으로 사용자 생성 및 인증 토큰 저장
    const result = await prisma.$transaction(async (tx) => {
      // 사용자 생성
      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          nickname,
          name: nickname, // NextAuth 호환성을 위해 name도 설정
          emailVerified: null, // 이메일 인증 전이므로 null
        },
      })

      // 이메일 인증 토큰 저장
      await tx.verificationToken.create({
        data: {
          identifier: email,
          token: verificationToken,
          expires: tokenExpires,
        },
      })

      return newUser
    })

    // 이메일 인증 메일 발송
    try {
      const { sendVerificationEmail } = await import('@/lib/email')
      const emailResult = await sendVerificationEmail(email, verificationToken)
      
      if (!emailResult.success) {
        logger.email('이메일 발송 실패', { email, error: emailResult.error })
        // 이메일 발송 실패해도 회원가입은 완료 처리 (사용자가 재발송 가능)
      } else {
        logger.email('인증 이메일 발송 성공', { email, messageId: emailResult.messageId })
      }
    } catch (emailError) {
      logger.error('이메일 모듈 로드 실패', { email, error: emailError instanceof Error ? emailError.message : String(emailError) }, emailError instanceof Error ? emailError : undefined)
      // 이메일 발송 실패해도 회원가입은 완료 처리
    }
    
    // 개발 환경에서는 콘솔에도 토큰 출력 (백업용)
    if (process.env.NODE_ENV === 'development') {
      logger.debug('개발환경 이메일 인증 토큰', { email, verificationUrl: `${process.env.NEXTAUTH_URL}/verify-email?token=${verificationToken}` })
    }

    return NextResponse.json(
      {
        success: true,
        message: '회원가입이 완료되었습니다. 이메일을 확인하여 인증을 완료해주세요.',
        userId: result.id,
      } as RegisterResponse,
      { status: 201 }
    )

  } catch (error) {
    const context = createErrorContext('register', undefined, body?.email)
    const authError = handleAuthError(error, context)
    
    // Determine appropriate status code
    let statusCode = 500
    if (authError.code === AuthErrorCode.EMAIL_ALREADY_EXISTS || 
        authError.code === AuthErrorCode.NICKNAME_ALREADY_EXISTS) {
      statusCode = 400
    }

    return NextResponse.json(
      createErrorResponse(authError),
      { status: statusCode }
    )
  }
}

// OPTIONS 메서드 처리 (CORS)
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
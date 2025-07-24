import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyEmailSchema } from '@/lib/validations'
import { VerifyEmailResponse } from '@/types/auth'
import { AuthErrorCode, createAuthError } from '@/types/error'
import { handleAuthError, createErrorContext, createErrorResponse } from '@/lib/error-handler'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()

    // 입력 데이터 검증
    const validationResult = verifyEmailSchema.safeParse(body)
    if (!validationResult.success) {
      const error = createAuthError(AuthErrorCode.INVALID_TOKEN)
      const context = createErrorContext('verify-email')
      handleAuthError(error, context)
      
      return NextResponse.json(
        createErrorResponse(error),
        { status: 400 }
      )
    }

    const { token } = validationResult.data

    // 인증 토큰 조회
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    })

    if (!verificationToken) {
      const error = createAuthError(AuthErrorCode.TOKEN_NOT_FOUND)
      const context = createErrorContext('verify-email')
      handleAuthError(error, context)
      
      return NextResponse.json(
        createErrorResponse(error),
        { status: 404 }
      )
    }

    const context = createErrorContext('verify-email', undefined, verificationToken.identifier)

    // 토큰 만료 확인
    if (verificationToken.expires < new Date()) {
      // 만료된 토큰 삭제
      await prisma.verificationToken.delete({
        where: { token },
      })

      const error = createAuthError(AuthErrorCode.EXPIRED_TOKEN)
      handleAuthError(error, context)
      
      return NextResponse.json(
        createErrorResponse(error),
        { status: 400 }
      )
    }

    // 사용자 조회
    const user = await prisma.user.findUnique({
      where: { email: verificationToken.identifier },
    })

    if (!user) {
      const error = createAuthError(AuthErrorCode.USER_NOT_FOUND)
      handleAuthError(error, context)
      
      return NextResponse.json(
        createErrorResponse(error),
        { status: 404 }
      )
    }

    // 이미 인증된 사용자인지 확인
    if (user.emailVerified) {
      // 토큰 삭제
      await prisma.verificationToken.delete({
        where: { token },
      })

      const error = createAuthError(AuthErrorCode.ALREADY_VERIFIED)
      // This is not actually an error, just informational
      return NextResponse.json(
        {
          success: true,
          message: error.userMessage,
        } as VerifyEmailResponse,
        { status: 200 }
      )
    }

    // 트랜잭션으로 이메일 인증 완료 처리
    await prisma.$transaction(async (tx) => {
      // 사용자 이메일 인증 완료
      await tx.user.update({
        where: { id: user.id },
        data: {
          emailVerified: new Date(),
        },
      })

      // 사용된 토큰 삭제
      await tx.verificationToken.delete({
        where: { token },
      })
    })

    return NextResponse.json(
      {
        success: true,
        message: '이메일 인증이 완료되었습니다. 이제 로그인하실 수 있습니다.',
      } as VerifyEmailResponse,
      { status: 200 }
    )

  } catch (error) {
    const context = createErrorContext('verify-email')
    const authError = handleAuthError(error, context)
    
    return NextResponse.json(
      createErrorResponse(authError),
      { status: 500 }
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
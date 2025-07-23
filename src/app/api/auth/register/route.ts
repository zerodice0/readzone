import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword, generateEmailVerificationToken } from '@/lib/utils'
import { registerSchema } from '@/lib/validations'
import { RegisterResponse } from '@/types/auth'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()

    // 입력 데이터 검증
    const validationResult = registerSchema.safeParse(body)
    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors[0]?.message || '입력 데이터가 올바르지 않습니다.'
      return NextResponse.json(
        {
          success: false,
          message: errorMessage,
        } as RegisterResponse,
        { status: 400 }
      )
    }

    const { email, password, nickname } = validationResult.data

    // 이메일 중복 확인
    const existingEmailUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingEmailUser) {
      return NextResponse.json(
        {
          success: false,
          message: '이미 사용 중인 이메일입니다.',
        } as RegisterResponse,
        { status: 400 }
      )
    }

    // 닉네임 중복 확인
    const existingNicknameUser = await prisma.user.findUnique({
      where: { nickname },
    })

    if (existingNicknameUser) {
      return NextResponse.json(
        {
          success: false,
          message: '이미 사용 중인 닉네임입니다.',
        } as RegisterResponse,
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
        console.error('이메일 발송 실패:', emailResult.error)
        // 이메일 발송 실패해도 회원가입은 완료 처리 (사용자가 재발송 가능)
      } else {
        console.log('✅ 인증 이메일 발송 성공:', emailResult.messageId)
      }
    } catch (emailError) {
      console.error('이메일 모듈 로드 실패:', emailError)
      // 이메일 발송 실패해도 회원가입은 완료 처리
    }
    
    // 개발 환경에서는 콘솔에도 토큰 출력 (백업용)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV] 이메일 인증 토큰 (${email}): ${verificationToken}`)
      console.log(`[DEV] 인증 URL: ${process.env.NEXTAUTH_URL}/verify-email?token=${verificationToken}`)
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
    console.error('회원가입 에러:', error)

    // Prisma 중복 제약 조건 에러 처리
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'P2002') {
        const target = (error as any).meta?.target
        if (target?.includes('email')) {
          return NextResponse.json(
            {
              success: false,
              message: '이미 사용 중인 이메일입니다.',
            } as RegisterResponse,
            { status: 400 }
          )
        }
        if (target?.includes('nickname')) {
          return NextResponse.json(
            {
              success: false,
              message: '이미 사용 중인 닉네임입니다.',
            } as RegisterResponse,
            { status: 400 }
          )
        }
      }
    }

    return NextResponse.json(
      {
        success: false,
        message: '회원가입 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      } as RegisterResponse,
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
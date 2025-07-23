import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyEmailSchema } from '@/lib/validations'
import { VerifyEmailResponse } from '@/types/auth'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()

    // 입력 데이터 검증
    const validationResult = verifyEmailSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: '잘못된 인증 토큰입니다.',
        } as VerifyEmailResponse,
        { status: 400 }
      )
    }

    const { token } = validationResult.data

    // 인증 토큰 조회
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    })

    if (!verificationToken) {
      return NextResponse.json(
        {
          success: false,
          message: '유효하지 않은 인증 토큰입니다.',
        } as VerifyEmailResponse,
        { status: 400 }
      )
    }

    // 토큰 만료 확인
    if (verificationToken.expires < new Date()) {
      // 만료된 토큰 삭제
      await prisma.verificationToken.delete({
        where: { token },
      })

      return NextResponse.json(
        {
          success: false,
          message: '인증 토큰이 만료되었습니다. 다시 회원가입을 진행해주세요.',
        } as VerifyEmailResponse,
        { status: 400 }
      )
    }

    // 사용자 조회
    const user = await prisma.user.findUnique({
      where: { email: verificationToken.identifier },
    })

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: '사용자를 찾을 수 없습니다.',
        } as VerifyEmailResponse,
        { status: 404 }
      )
    }

    // 이미 인증된 사용자인지 확인
    if (user.emailVerified) {
      // 토큰 삭제
      await prisma.verificationToken.delete({
        where: { token },
      })

      return NextResponse.json(
        {
          success: true,
          message: '이미 인증이 완료된 계정입니다.',
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
    console.error('이메일 인증 에러:', error)

    return NextResponse.json(
      {
        success: false,
        message: '이메일 인증 중 오류가 발생했습니다.',
      } as VerifyEmailResponse,
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
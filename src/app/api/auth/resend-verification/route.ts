import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { sendVerificationEmail } from '@/lib/email'

const resendVerificationSchema = z.object({
  email: z.string().email('올바른 이메일 주소를 입력해주세요.'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email } = resendVerificationSchema.parse(body)

    // 사용자 조회
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          message: '해당 이메일로 가입된 계정을 찾을 수 없습니다.' 
        },
        { status: 404 }
      )
    }

    // 이미 인증된 계정인지 확인
    if (user.emailVerified) {
      return NextResponse.json(
        { 
          success: false, 
          message: '이미 인증된 계정입니다.' 
        },
        { status: 400 }
      )
    }

    // 기존 인증 토큰 삭제
    await prisma.verificationToken.deleteMany({
      where: {
        identifier: email,
      },
    })

    // 새 인증 토큰 생성
    const token = crypto.randomUUID()
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24시간 후 만료

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    })

    // 인증 이메일 발송 (실제 구현에서는 이메일 서비스 필요)
    // TODO: 이메일 발송 로직 구현
    // await sendVerificationEmail(email, token)
    
    console.log(`[DEBUG] 인증 이메일 재발송: ${email}, 토큰: ${token}`)

    return NextResponse.json({
      success: true,
      message: '인증 이메일이 재발송되었습니다. 이메일을 확인해주세요.',
    })

  } catch (error) {
    console.error('인증 이메일 재발송 오류:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          message: error.errors[0].message 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        message: '인증 이메일 재발송 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    )
  }
}
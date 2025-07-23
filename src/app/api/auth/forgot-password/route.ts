import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { sendPasswordResetEmail } from '@/lib/email'
import crypto from 'crypto'

const forgotPasswordSchema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다.'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = forgotPasswordSchema.parse(body)

    console.log('🔐 [FORGOT PASSWORD] 비밀번호 재설정 요청:', { email })

    // 1. 사용자 확인
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, email: true, nickname: true }
    })

    // 보안상 사용자가 존재하지 않아도 동일한 응답을 반환
    if (!user) {
      console.log('⚠️ [FORGOT PASSWORD] 존재하지 않는 사용자:', { email })
      // 보안을 위해 성공 응답을 반환 (사용자 존재 여부를 노출하지 않음)
      return NextResponse.json({
        success: true,
        message: '비밀번호 재설정 링크를 발송했습니다.'
      })
    }

    // 2. 재설정 토큰 생성 (32바이트 랜덤 토큰)
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000) // 15분 후 만료

    console.log('🔑 [FORGOT PASSWORD] 토큰 생성:', { 
      userId: user.id, 
      tokenLength: resetToken.length,
      expiresAt: resetTokenExpiry 
    })

    // 3. 토큰을 데이터베이스에 저장
    await db.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry
      }
    })

    // 4. 비밀번호 재설정 이메일 발송
    try {
      const emailResult = await sendPasswordResetEmail(user.email, user.nickname, resetToken)
      
      if (!emailResult.success) {
        console.error('❌ [FORGOT PASSWORD] 이메일 발송 실패:', emailResult.error)
        return NextResponse.json({
          success: false,
          message: '이메일 발송 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
        }, { status: 500 })
      }

      console.log('✅ [FORGOT PASSWORD] 이메일 발송 성공:', { 
        email: user.email,
        messageId: emailResult.messageId 
      })

      return NextResponse.json({
        success: true,
        message: '비밀번호 재설정 링크를 발송했습니다.',
        debug: process.env.NODE_ENV === 'development' ? {
          email: user.email,
          messageId: emailResult.messageId,
          tokenExpiry: resetTokenExpiry
        } : undefined
      })

    } catch (emailError) {
      console.error('❌ [FORGOT PASSWORD] 이메일 발송 중 예외 발생:', emailError)
      
      // 토큰 정리 (이메일 발송 실패 시)
      await db.user.update({
        where: { id: user.id },
        data: {
          resetToken: null,
          resetTokenExpiry: null
        }
      })

      return NextResponse.json({
        success: false,
        message: '이메일 발송 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ [FORGOT PASSWORD] API 오류:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: '입력된 정보가 올바르지 않습니다.',
        errors: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
    }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

const validateTokenSchema = z.object({
  token: z.string().min(1, '토큰이 필요합니다.'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = validateTokenSchema.parse(body)

    console.log('🔍 [VALIDATE RESET TOKEN] 토큰 검증 요청:', { 
      tokenLength: token.length,
      tokenPrefix: token.substring(0, 8) + '...'
    })

    // 1. 토큰으로 사용자 찾기
    const user = await db.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date() // 만료되지 않은 토큰만
        }
      },
      select: {
        id: true,
        email: true,
        resetTokenExpiry: true
      }
    })

    if (!user) {
      console.log('⚠️ [VALIDATE RESET TOKEN] 유효하지 않은 토큰:', { token: token.substring(0, 8) + '...' })
      return NextResponse.json({
        valid: false,
        message: '토큰이 유효하지 않거나 만료되었습니다.'
      })
    }

    console.log('✅ [VALIDATE RESET TOKEN] 유효한 토큰:', { 
      userId: user.id,
      email: user.email,
      expiresAt: user.resetTokenExpiry 
    })

    return NextResponse.json({
      valid: true,
      message: '유효한 토큰입니다.',
      expiresAt: user.resetTokenExpiry
    })

  } catch (error) {
    console.error('❌ [VALIDATE RESET TOKEN] API 오류:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        valid: false,
        message: '입력된 정보가 올바르지 않습니다.',
        errors: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      valid: false,
      message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
    }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/utils'

const resetPasswordSchema = z.object({
  token: z.string().min(1, '재설정 토큰이 필요합니다.'),
  password: z
    .string()
    .min(8, '비밀번호는 8자 이상이어야 합니다.')
    .regex(
      /^(?=.*[a-zA-Z])(?=.*\d)/,
      '비밀번호는 영문과 숫자를 포함해야 합니다.'
    ),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: '비밀번호가 일치하지 않습니다.',
  path: ['confirmPassword'],
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = resetPasswordSchema.parse(body)

    console.log('🔐 [RESET PASSWORD] 비밀번호 재설정 요청:', { 
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
        nickname: true,
        resetTokenExpiry: true
      }
    })

    if (!user) {
      console.log('⚠️ [RESET PASSWORD] 유효하지 않은 토큰:', { token: token.substring(0, 8) + '...' })
      return NextResponse.json({
        success: false,
        message: '재설정 링크가 유효하지 않거나 만료되었습니다.'
      }, { status: 400 })
    }

    console.log('✅ [RESET PASSWORD] 유효한 토큰 확인:', { 
      userId: user.id,
      email: user.email,
      expiresAt: user.resetTokenExpiry 
    })

    // 2. 비밀번호 해싱
    const hashedPassword = await hashPassword(password)

    // 3. 사용자 비밀번호 업데이트 및 토큰 제거 (트랜잭션)
    try {
      await db.$transaction(async (tx) => {
        // 비밀번호 업데이트
        await tx.user.update({
          where: { id: user.id },
          data: {
            password: hashedPassword,
            resetToken: null,        // 토큰 제거
            resetTokenExpiry: null,  // 만료시간 제거
            updatedAt: new Date()
          }
        })

        console.log('✅ [RESET PASSWORD] 비밀번호 변경 완료:', { 
          userId: user.id,
          email: user.email 
        })
      })

      // 4. 성공 응답
      return NextResponse.json({
        success: true,
        message: '비밀번호가 성공적으로 변경되었습니다.',
        email: user.email // 디버깅용 (개발 환경에서만)
      })

    } catch (dbError) {
      console.error('❌ [RESET PASSWORD] 데이터베이스 업데이트 실패:', dbError)
      return NextResponse.json({
        success: false,
        message: '비밀번호 변경 중 오류가 발생했습니다. 다시 시도해주세요.'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ [RESET PASSWORD] API 오류:', error)

    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      return NextResponse.json({
        success: false,
        message: firstError?.message || '입력된 정보가 올바르지 않습니다.',
        errors: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
    }, { status: 500 })
  }
}
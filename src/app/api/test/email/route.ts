import { NextRequest, NextResponse } from 'next/server'
import { sendTestEmail } from '@/lib/email'

/**
 * 이메일 전송 테스트 API (개발 환경 전용)
 * POST /api/test/email
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // 개발 환경에서만 접근 허용
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: '이 API는 개발 환경에서만 사용할 수 있습니다.' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const { to } = body

    if (!to) {
      return NextResponse.json(
        { error: '받는 사람 이메일 주소가 필요합니다.' },
        { status: 400 }
      )
    }

    const result = await sendTestEmail(to)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: '테스트 이메일이 성공적으로 발송되었습니다.',
        messageId: result.messageId
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('이메일 테스트 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

/**
 * GET 요청으로 간단한 상태 확인
 */
export async function GET(): Promise<NextResponse> {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: '이 API는 개발 환경에서만 사용할 수 있습니다.' },
      { status: 403 }
    )
  }

  const { validateEmailConfig } = await import('@/lib/email')
  const config = validateEmailConfig()

  return NextResponse.json({
    status: 'Email Test API Ready',
    config: config.isValid ? 'Valid' : config.error,
    usage: 'POST with { "to": "email@example.com" }'
  })
}
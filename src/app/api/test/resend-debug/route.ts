import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

/**
 * Resend API 상세 디버깅 및 검증 API (개발 환경 전용)
 * GET /api/test/resend-debug - 설정 검증
 * POST /api/test/resend-debug - 직접 API 테스트
 */

export async function GET(): Promise<NextResponse> {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: '이 API는 개발 환경에서만 사용할 수 있습니다.' },
      { status: 403 }
    )
  }

  try {
    // 환경 변수 확인
    const apiKey = process.env.RESEND_API_KEY
    const fromEmail = process.env.RESEND_FROM_EMAIL

    console.log('🔍 [RESEND DEBUG] 환경 변수 확인:', {
      hasApiKey: !!apiKey,
      apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'MISSING',
      fromEmail: fromEmail || 'MISSING',
      nodeEnv: process.env.NODE_ENV
    })

    if (!apiKey) {
      return NextResponse.json({
        status: 'ERROR',
        message: 'RESEND_API_KEY가 설정되지 않았습니다.',
        debug: {
          hasApiKey: false,
          fromEmail: fromEmail
        }
      })
    }

    if (!fromEmail) {
      return NextResponse.json({
        status: 'ERROR', 
        message: 'RESEND_FROM_EMAIL이 설정되지 않았습니다.',
        debug: {
          hasApiKey: true,
          fromEmail: false
        }
      })
    }

    // Resend 클라이언트 초기화 테스트
    const resend = new Resend(apiKey)
    
    return NextResponse.json({
      status: 'OK',
      message: 'Resend 설정이 올바르게 구성되었습니다.',
      debug: {
        hasApiKey: true,
        apiKeyPrefix: apiKey.substring(0, 10) + '...',
        fromEmail: fromEmail,
        resendInitialized: !!resend,
        nextSteps: [
          'POST 요청으로 실제 이메일 전송 테스트',
          'curl -X POST http://localhost:3001/api/test/resend-debug -H "Content-Type: application/json" -d \'{"to": "your-email@example.com"}\''
        ]
      }
    })

  } catch (error) {
    console.error('❌ [RESEND DEBUG] 설정 검증 실패:', error)
    return NextResponse.json({
      status: 'ERROR',
      message: 'Resend 설정 검증 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
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
        { error: '받는 사람 이메일 주소(to)가 필요합니다.' },
        { status: 400 }
      )
    }

    const apiKey = process.env.RESEND_API_KEY
    const fromEmail = process.env.RESEND_FROM_EMAIL

    if (!apiKey || !fromEmail) {
      return NextResponse.json(
        { error: 'Resend 환경 변수가 올바르게 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    console.log('🔍 [RESEND DIRECT] 직접 API 호출 시도:', {
      from: fromEmail,
      to: to,
      apiKey: apiKey.substring(0, 10) + '...'
    })

    const resend = new Resend(apiKey)
    
    // 직접 Resend API 호출
    const result = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject: '🔍 ReadZone Resend 직접 테스트',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>🔍 Resend API 직접 테스트</h2>
          <p>이 이메일은 Resend API를 직접 호출하여 발송되었습니다.</p>
          <ul>
            <li><strong>발송 시간:</strong> ${new Date().toISOString()}</li>
            <li><strong>환경:</strong> ${process.env.NODE_ENV}</li>
            <li><strong>API 키:</strong> ${apiKey.substring(0, 10)}...</li>
            <li><strong>From:</strong> ${fromEmail}</li>
            <li><strong>To:</strong> ${to}</li>
          </ul>
          <p>이 이메일을 받으셨다면 Resend API가 정상적으로 작동하고 있는 것입니다.</p>
        </div>
      `,
      text: `
ReadZone Resend 직접 테스트

이 이메일은 Resend API를 직접 호출하여 발송되었습니다.

발송 시간: ${new Date().toISOString()}
환경: ${process.env.NODE_ENV}
API 키: ${apiKey.substring(0, 10)}...
From: ${fromEmail}
To: ${to}

이 이메일을 받으셨다면 Resend API가 정상적으로 작동하고 있는 것입니다.
      `,
      tags: [
        { name: 'type', value: 'direct-test' },
        { name: 'environment', value: process.env.NODE_ENV || 'development' }
      ]
    })

    // 상세한 응답 로깅
    console.log('📧 [RESEND DIRECT] API 응답 상세:', {
      success: !!result.data,
      messageId: result.data?.id,
      data: result.data,
      error: result.error,
      fullResult: JSON.stringify(result, null, 2)
    })

    if (result.error) {
      console.error('❌ [RESEND DIRECT] API 오류:', result.error)
      return NextResponse.json({
        success: false,
        message: 'Resend API에서 오류를 반환했습니다.',
        error: result.error,
        debug: {
          from: fromEmail,
          to: to,
          apiKeyPrefix: apiKey.substring(0, 10) + '...'
        }
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Resend API 직접 호출이 성공했습니다.',
      messageId: result.data?.id,
      debug: {
        from: fromEmail,
        to: to,
        apiKeyPrefix: apiKey.substring(0, 10) + '...',
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ [RESEND DIRECT] 직접 API 호출 실패:', error)
    
    // 상세한 에러 정보 추출
    let errorDetails = '알 수 없는 오류'
    if (error instanceof Error) {
      errorDetails = error.message
      console.error('Error stack:', error.stack)
    }

    return NextResponse.json({
      success: false,
      message: 'Resend API 직접 호출 중 오류가 발생했습니다.',
      error: errorDetails,
      debug: {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
      }
    }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { getAuthError, deleteAuthError } from '@/lib/auth-error-store'

// GET: 마지막 인증 에러 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      )
    }

    const cached = getAuthError(email)

    if (!cached) {
      return NextResponse.json(
        { error: 'No recent auth error found' },
        { status: 404 }
      )
    }

    const { error, timestamp } = cached

    // 에러 정보 반환 후 캐시에서 제거 (일회성)
    deleteAuthError(email)

    logger.info('Auth error retrieved', {
      email,
      errorCode: error.code,
      timestamp: new Date(timestamp).toISOString()
    })

    return NextResponse.json({
      success: true,
      error: {
        code: error.code,
        message: error.userMessage,
        details: error.details,
        timestamp
      }
    })

  } catch (error) {
    logger.error('Failed to retrieve auth error:', { error: error as Error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
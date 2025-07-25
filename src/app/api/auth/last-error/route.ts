import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

// 임시 에러 저장소 (프로덕션에서는 Redis 등 사용 권장)
const errorCache = new Map<string, {
  error: any
  timestamp: number
  ttl: number
}>()

const CACHE_TTL = 5 * 60 * 1000 // 5분

// 만료된 캐시 정리
function cleanExpiredCache() {
  const now = Date.now()
  for (const [key, value] of errorCache.entries()) {
    if (now - value.timestamp > value.ttl) {
      errorCache.delete(key)
    }
  }
}

// 에러 정보 저장
export function storeAuthError(email: string, error: any) {
  cleanExpiredCache()
  errorCache.set(email, {
    error,
    timestamp: Date.now(),
    ttl: CACHE_TTL
  })
}

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

    cleanExpiredCache()
    const cached = errorCache.get(email)

    if (!cached) {
      return NextResponse.json(
        { error: 'No recent auth error found' },
        { status: 404 }
      )
    }

    const { error, timestamp } = cached

    // 에러 정보 반환 후 캐시에서 제거 (일회성)
    errorCache.delete(email)

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
    logger.error('Failed to retrieve auth error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
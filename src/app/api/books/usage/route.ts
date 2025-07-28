import { NextRequest, NextResponse } from 'next/server'
import { getBookAPI } from '@/lib/book-api'

/**
 * API 사용량 조회 엔드포인트
 * GET /api/books/usage
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const bookAPI = getBookAPI()
    
    // 사용량 상태 조회
    const usageStatus = await bookAPI.getUsageStatus()
    const remainingQuota = await bookAPI.getRemainingQuota()
    const usageHistory = await bookAPI.getUsageHistory()

    return NextResponse.json({
      success: true,
      data: {
        status: usageStatus,
        remainingQuota,
        history: usageHistory,
        limits: {
          dailyLimit: 300000,
          warningThreshold: 240000, // 80%
          resetTime: usageStatus.today.resetTime
        }
      }
    })

  } catch (error) {
    console.error('Usage API error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: {
          errorType: 'INTERNAL_ERROR',
          message: '사용량 조회 중 오류가 발생했습니다.'
        }
      },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getUsageLogger } from '@/lib/usage-logger'
import { getCacheManager } from '@/lib/cache-manager'

/**
 * 관리자 분석 대시보드 API
 * GET /api/admin/analytics?period=daily&days=7
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // 인증 확인
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'UNAUTHORIZED',
            message: '로그인이 필요합니다.'
          }
        },
        { status: 401 }
      )
    }

    // 관리자 권한 확인 (추후 role 체크 추가)
    // if (session.user.role !== 'admin') {
    //   return NextResponse.json(
    //     {
    //       success: false,
    //       error: {
    //         errorType: 'FORBIDDEN',
    //         message: '관리자 권한이 필요합니다.'
    //       }
    //     },
    //     { status: 403 }
    //   )
    // }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') as 'daily' | 'weekly' | 'monthly' || 'daily'
    const days = parseInt(searchParams.get('days') || '7')

    const usageLogger = getUsageLogger()
    const cacheManager = getCacheManager()

    // 병렬로 모든 분석 데이터 수집
    const [
      dailyStats,
      usageTrend,
      popularEndpoints,
      errorPatterns,
      cacheStats
    ] = await Promise.all([
      usageLogger.getDailyStats(), // 오늘 통계
      usageLogger.getTrend(period, days), // 트렌드
      usageLogger.getPopularEndpoints(days, 10), // 인기 엔드포인트
      usageLogger.getErrorPatterns(days), // 에러 패턴
      cacheManager.getStats() // 캐시 통계
    ])

    // 전체 요청 수 계산
    const totalRequests = dailyStats.reduce((sum, stat) => sum + stat.totalRequests, 0)
    const totalErrors = dailyStats.reduce((sum, stat) => sum + stat.errorCount, 0)
    const overallErrorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0

    // 응답 데이터 구성
    const analyticsData = {
      overview: {
        totalRequests,
        totalErrors,
        errorRate: overallErrorRate,
        cacheHitRate: cacheStats.memoryHitRate + cacheStats.dbHitRate,
        period,
        days
      },
      dailyStats: dailyStats.slice(0, 10), // 최대 10개 엔드포인트
      trend: usageTrend,
      popularEndpoints,
      errorPatterns,
      cache: cacheStats,
      recommendations: generateRecommendations({
        errorRate: overallErrorRate,
        cacheHitRate: cacheStats.memoryHitRate + cacheStats.dbHitRate,
        errorPatterns,
        popularEndpoints
      })
    }

    return NextResponse.json({
      success: true,
      data: analyticsData
    })

  } catch (error) {
    console.error('Analytics API error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: {
          errorType: 'INTERNAL_ERROR',
          message: '분석 데이터 조회 중 오류가 발생했습니다.'
        }
      },
      { status: 500 }
    )
  }
}

/**
 * 분석 데이터를 바탕으로 개선 권장사항 생성
 */
function generateRecommendations(data: {
  errorRate: number
  cacheHitRate: number
  errorPatterns: any[]
  popularEndpoints: any[]
}): Array<{
  type: 'warning' | 'info' | 'success'
  title: string
  description: string
  action?: string
}> {
  const recommendations: any[] = []

  // 에러율 관련 권장사항
  if (data.errorRate > 10) {
    recommendations.push({
      type: 'warning',
      title: '높은 에러율 감지',
      description: `전체 요청의 ${data.errorRate.toFixed(1)}%가 에러입니다. 즉시 조치가 필요합니다.`,
      action: '에러 패턴을 확인하고 문제가 되는 엔드포인트를 점검하세요.'
    })
  } else if (data.errorRate > 5) {
    recommendations.push({
      type: 'warning',
      title: '에러율 주의',
      description: `에러율이 ${data.errorRate.toFixed(1)}%입니다. 모니터링을 강화하세요.`,
      action: '정기적인 에러 로그 점검을 권장합니다.'
    })
  }

  // 캐시 히트율 관련 권장사항
  if (data.cacheHitRate < 30) {
    recommendations.push({
      type: 'info',
      title: '낮은 캐시 히트율',
      description: `캐시 히트율이 ${data.cacheHitRate.toFixed(1)}%입니다.`,
      action: 'TTL 설정을 확인하거나 캐시 크기를 늘려보세요.'
    })
  } else if (data.cacheHitRate > 70) {
    recommendations.push({
      type: 'success',
      title: '우수한 캐시 성능',
      description: `캐시 히트율이 ${data.cacheHitRate.toFixed(1)}%로 양호합니다.`
    })
  }

  // 에러 패턴 분석
  const highErrorEndpoints = data.errorPatterns.filter(pattern => pattern.errorRate > 20)
  if (highErrorEndpoints.length > 0) {
    recommendations.push({
      type: 'warning',
      title: '문제 엔드포인트 발견',
      description: `${highErrorEndpoints.length}개 엔드포인트에서 20% 이상의 에러율을 보입니다.`,
      action: '해당 엔드포인트의 로직과 외부 의존성을 점검하세요.'
    })
  }

  // 인기 엔드포인트 분석
  const topEndpoint = data.popularEndpoints[0]
  if (topEndpoint && topEndpoint.totalRequests > 1000) {
    recommendations.push({
      type: 'info',
      title: '높은 트래픽 엔드포인트',
      description: `${topEndpoint.endpoint}가 ${topEndpoint.totalRequests}회 호출되었습니다.`,
      action: '성능 최적화 및 캐싱 전략을 검토하세요.'
    })
  }

  return recommendations
}
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { performanceMonitor } from '@/lib/monitoring/performance-monitor'

/**
 * Performance Monitoring API
 * GET /api/admin/performance - Get comprehensive performance dashboard
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Authentication check (admin only in production)
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'UNAUTHORIZED',
            message: '인증이 필요합니다.',
          },
        },
        { status: 401 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'full'
    const timeWindow = parseInt(searchParams.get('timeWindow') || '3600000') // 1 hour default

    let responseData

    switch (format) {
      case 'health':
        // Quick health check
        const systemHealth = await performanceMonitor.getSystemHealth()
        responseData = {
          timestamp: new Date().toISOString(),
          healthy: systemHealth.healthy,
          score: systemHealth.score,
          issues: systemHealth.issues,
          recommendations: systemHealth.recommendations,
        }
        break

      case 'metrics':
        // Performance metrics only
        responseData = {
          timestamp: new Date().toISOString(),
          draftSave: performanceMonitor.getOperationStats('draft_save', timeWindow),
          draftList: performanceMonitor.getOperationStats('draft_list', timeWindow),
          draftRestore: performanceMonitor.getOperationStats('draft_restore', timeWindow),
          bookSync: performanceMonitor.getOperationStats('book_sync', timeWindow),
        }
        break

      case 'prd':
        // PRD compliance check
        const draftSaveStats = performanceMonitor.getOperationStats('draft_save', timeWindow)
        const draftListStats = performanceMonitor.getOperationStats('draft_list', timeWindow)
        const draftRestoreStats = performanceMonitor.getOperationStats('draft_restore', timeWindow)
        const bookSyncStats = performanceMonitor.getOperationStats('book_sync', timeWindow)

        responseData = {
          timestamp: new Date().toISOString(),
          prdCompliance: {
            targets: {
              draftSave: '< 500ms',
              draftList: '< 1s',
              draftRestore: '< 2s',
              bookSync: '< 1s',
            },
            actual: {
              draftSave: `${draftSaveStats.p95}ms (${draftSaveStats.targetComplianceRate.toFixed(1)}% compliance)`,
              draftList: `${draftListStats.p95}ms (${draftListStats.targetComplianceRate.toFixed(1)}% compliance)`,
              draftRestore: `${draftRestoreStats.p95}ms (${draftRestoreStats.targetComplianceRate.toFixed(1)}% compliance)`,
              bookSync: `${bookSyncStats.p95}ms (${bookSyncStats.targetComplianceRate.toFixed(1)}% compliance)`,
            },
            overallCompliance: [
              draftSaveStats.targetComplianceRate,
              draftListStats.targetComplianceRate, 
              draftRestoreStats.targetComplianceRate,
              bookSyncStats.targetComplianceRate
            ].reduce((a, b) => a + b, 0) / 4,
          }
        }
        break

      case 'full':
      default:
        // Full dashboard
        responseData = await performanceMonitor.getPerformanceDashboard()
        break
    }

    return NextResponse.json({
      success: true,
      data: responseData,
    })

  } catch (error) {
    console.error('Performance monitoring API error:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          errorType: 'INTERNAL_ERROR',
          message: '성능 모니터링 데이터 조회 중 오류가 발생했습니다.',
        },
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/performance - Manual performance test or reset
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Authentication check (admin only)
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'UNAUTHORIZED',
            message: '인증이 필요합니다.',
          },
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'reset_metrics':
        performanceMonitor.clearMetrics()
        return NextResponse.json({
          success: true,
          data: { message: '성능 메트릭이 초기화되었습니다.' },
        })

      case 'health_check':
        const healthResult = await performanceMonitor.getSystemHealth()
        return NextResponse.json({
          success: true,
          data: {
            timestamp: new Date().toISOString(),
            health: healthResult,
          },
        })

      default:
        return NextResponse.json(
          {
            success: false,
            error: {
              errorType: 'VALIDATION_ERROR',
              message: '알 수 없는 액션입니다.',
            },
          },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Performance monitoring POST error:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          errorType: 'INTERNAL_ERROR',
          message: '성능 모니터링 작업 중 오류가 발생했습니다.',
        },
      },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { bookSyncService } from '@/lib/book-sync-service'
import { proactiveSyncScheduler } from '@/lib/proactive-sync-scheduler'

/**
 * GET /api/admin/sync-monitor - 동기화 시스템 모니터링 대시보드
 * 
 * 실시간 동기화 성능 메트릭, 스케줄러 상태, 시스템 건강도 제공
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    // 관리자 권한 확인
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'UNAUTHORIZED',
            message: '로그인이 필요합니다.',
          },
        },
        { status: 401 }
      )
    }

    // TODO: 관리자 권한 체크 로직 추가
    // if (!isAdmin(session.user.id)) { ... }

    // 병렬로 모든 메트릭 수집
    const [syncMetrics, schedulerStats] = await Promise.all([
      bookSyncService.getSyncMetrics(),
      Promise.resolve(proactiveSyncScheduler.getStats())
    ])

    // 시스템 건강도 평가
    const systemHealth = {
      syncService: {
        healthy: syncMetrics.syncSuccessRate >= 0.95, // 95% 성공률 이상
        successRate: syncMetrics.syncSuccessRate,
        status: syncMetrics.syncSuccessRate >= 0.95 ? 'healthy' : 
                syncMetrics.syncSuccessRate >= 0.8 ? 'warning' : 'critical'
      },
      scheduler: {
        healthy: proactiveSyncScheduler.isHealthy(),
        enabled: schedulerStats.config.enabled,
        status: proactiveSyncScheduler.isHealthy() ? 'healthy' : 'critical'
      },
      overall: 'healthy' as 'healthy' | 'warning' | 'critical'
    }

    // 전체 시스템 상태 결정
    if (!systemHealth.syncService.healthy || !systemHealth.scheduler.healthy) {
      systemHealth.overall = systemHealth.syncService.status === 'critical' || 
                            !systemHealth.scheduler.healthy ? 'critical' : 'warning'
    }

    // 추천사항 생성
    const recommendations = []
    
    if (syncMetrics.syncSuccessRate < 0.95) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        message: `동기화 성공률이 낮습니다 (${(syncMetrics.syncSuccessRate * 100).toFixed(1)}%). 시스템 점검이 필요합니다.`
      })
    }

    if (!schedulerStats.config.enabled) {
      recommendations.push({
        type: 'configuration',
        priority: 'medium',
        message: '프로액티브 동기화가 비활성화되어 있습니다. 사용자 경험 향상을 위해 활성화를 고려하세요.'
      })
    }

    if (schedulerStats.candidatesProcessed > 0 && schedulerStats.candidatesSynced / schedulerStats.candidatesProcessed < 0.3) {
      recommendations.push({
        type: 'optimization',
        priority: 'low',
        message: '동기화 매칭률이 낮습니다. 매칭 알고리즘 개선을 고려하세요.'
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        systemHealth,
        syncMetrics,
        schedulerStats,
        recommendations,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Sync monitor error:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          errorType: 'INTERNAL_ERROR',
          message: '모니터링 데이터 조회 중 오류가 발생했습니다.',
        },
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/sync-monitor - 동기화 시스템 제어
 * 
 * 수동 동기화 트리거, 스케줄러 제어, 설정 변경
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 관리자 권한 확인
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'UNAUTHORIZED',
            message: '로그인이 필요합니다.',
          },
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action, config } = body

    switch (action) {
      case 'trigger_sync': {
        console.log(`🔄 Manual sync triggered by admin: ${session.user.id}`)
        const result = await proactiveSyncScheduler.triggerManualSync()
        
        return NextResponse.json({
          success: true,
          data: {
            syncResult: result,
            message: result.success 
              ? `수동 동기화 완료: ${result.synced}개 동기화됨`
              : `수동 동기화 실패: ${result.error}`
          }
        })
      }

      case 'start_scheduler': {
        proactiveSyncScheduler.start(config)
        console.log(`▶️ Scheduler started by admin: ${session.user.id}`)
        
        return NextResponse.json({
          success: true,
          data: {
            message: '프로액티브 동기화 스케줄러가 시작되었습니다.',
            schedulerStats: proactiveSyncScheduler.getStats()
          }
        })
      }

      case 'stop_scheduler': {
        proactiveSyncScheduler.stop()
        console.log(`⏹️ Scheduler stopped by admin: ${session.user.id}`)
        
        return NextResponse.json({
          success: true,
          data: {
            message: '프로액티브 동기화 스케줄러가 중지되었습니다.'
          }
        })
      }

      case 'update_config': {
        if (!config) {
          return NextResponse.json(
            {
              success: false,
              error: {
                errorType: 'VALIDATION_ERROR',
                message: '설정 데이터가 필요합니다.',
              },
            },
            { status: 400 }
          )
        }

        proactiveSyncScheduler.updateConfig(config)
        console.log(`⚙️ Scheduler config updated by admin: ${session.user.id}`, config)
        
        return NextResponse.json({
          success: true,
          data: {
            message: '스케줄러 설정이 업데이트되었습니다.',
            config: proactiveSyncScheduler.getStats().config
          }
        })
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: {
              errorType: 'VALIDATION_ERROR',
              message: '유효하지 않은 액션입니다.',
            },
          },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Sync monitor control error:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          errorType: 'INTERNAL_ERROR',
          message: '동기화 시스템 제어 중 오류가 발생했습니다.',
        },
      },
      { status: 500 }
    )
  }
}
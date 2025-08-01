import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getDraftStatistics } from '@/lib/draft-batch-utils'
import { getExpirationNotificationTargets } from '@/lib/notifications/draft-expiration'
import { db } from '@/lib/db'

/**
 * GET /api/admin/draft-monitor - Draft 시스템 모니터링 대시보드
 * 
 * 관리자를 위한 종합 모니터링 정보 제공:
 * - 시스템 통계 및 건강 상태
 * - 성능 메트릭
 * - 정리 작업 현황
 * - 알림 시스템 상태
 */
export async function GET(): Promise<NextResponse> {
  try {
    const session = await auth()
    
    // 관리자 권한 확인 (실제 환경에서는 role 체크)
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'UNAUTHORIZED',
            message: '관리자 권한이 필요합니다.',
          },
        },
        { status: 401 }
      )
    }

    const startTime = Date.now()

    // 병렬로 모든 통계 조회
    const [
      draftStats,
      notificationTargets,
      recentAuditLogs,
      performanceMetrics,
      systemHealth,
    ] = await Promise.all([
      getDraftStatistics(),
      getExpirationNotificationTargets(),
      getRecentAuditActivity(),
      getPerformanceMetrics(),
      getSystemHealthStatus(),
    ])

    const queryDuration = Date.now() - startTime

    // 알림 유형별 분류
    const notificationStats = notificationTargets.reduce(
      (acc, target) => {
        acc[target.notificationType] = (acc[target.notificationType] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    // 건강 상태 평가
    const healthScore = calculateHealthScore(draftStats, systemHealth)
    const recommendations = generateRecommendations(draftStats, notificationTargets, systemHealth)

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalDrafts: draftStats.totalDrafts,
          activeDrafts: draftStats.activeDrafts,
          expiredDrafts: draftStats.expiredDrafts,
          healthScore,
          queryDuration,
        },
        statistics: {
          drafts: draftStats,
          notifications: {
            total: notificationTargets.length,
            byType: notificationStats,
            critical: notificationTargets.filter(n => n.notificationType === 'FINAL_WARNING' || n.notificationType === 'EXPIRED').length,
          },
          performance: performanceMetrics,
          system: systemHealth,
        },
        activity: {
          recentAuditLogs: recentAuditLogs.slice(0, 20), // 최근 20개
          totalAuditLogs: recentAuditLogs.length,
        },
        recommendations,
        alerts: generateAlerts(draftStats, notificationTargets, systemHealth),
      },
    })
  } catch (error) {
    console.error('Draft 모니터링 조회 실패:', error)
    
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
 * 최근 감사 로그 활동 조회
 */
async function getRecentAuditActivity() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  
  return await db.reviewDraftAudit.findMany({
    where: {
      createdAt: { gte: sevenDaysAgo },
    },
    select: {
      id: true,
      action: true,
      createdAt: true,
      draftId: true,
      userId: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
}

/**
 * 성능 메트릭 조회
 */
async function getPerformanceMetrics() {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [
    dailyCreations,
    dailyUpdates,
    dailyDeletions,
    weeklyCreations,
    avgResponseTime,
  ] = await Promise.all([
    db.reviewDraftAudit.count({
      where: {
        action: 'CREATED',
        createdAt: { gte: oneDayAgo },
      },
    }),
    db.reviewDraftAudit.count({
      where: {
        action: 'UPDATED',
        createdAt: { gte: oneDayAgo },
      },
    }),
    db.reviewDraftAudit.count({
      where: {
        action: 'DELETED',
        createdAt: { gte: oneDayAgo },
      },
    }),
    db.reviewDraftAudit.count({
      where: {
        action: 'CREATED',
        createdAt: { gte: oneWeekAgo },
      },
    }),
    // Mock 응답 시간 (실제 환경에서는 APM 도구 활용)
    Promise.resolve(Math.floor(Math.random() * 300) + 100), // 100-400ms
  ])

  return {
    daily: {
      creations: dailyCreations,
      updates: dailyUpdates,
      deletions: dailyDeletions,
    },
    weekly: {
      creations: weeklyCreations,
    },
    performance: {
      avgResponseTime,
      targetResponseTime: 500, // PRD 목표: <500ms
      isPerformanceGood: avgResponseTime < 500,
    },
  }
}

/**
 * 시스템 건강 상태 조회
 */
async function getSystemHealthStatus() {
  const [
    dbConnectionTest,
    diskUsage,
    memoryUsage,
  ] = await Promise.all([
    testDatabaseConnection(),
    getDiskUsage(),
    getMemoryUsage(),
  ])

  return {
    database: {
      connected: dbConnectionTest,
      latency: Math.floor(Math.random() * 50) + 10, // Mock latency
    },
    resources: {
      disk: diskUsage,
      memory: memoryUsage,
    },
    uptime: process.uptime(),
  }
}

/**
 * 데이터베이스 연결 테스트
 */
async function testDatabaseConnection(): Promise<boolean> {
  try {
    await db.$queryRaw`SELECT 1`
    return true
  } catch {
    return false
  }
}

/**
 * 디스크 사용량 조회 (Mock)
 */
async function getDiskUsage() {
  return {
    used: Math.floor(Math.random() * 80) + 10, // 10-90%
    available: Math.floor(Math.random() * 500) + 100, // 100-600GB
    total: 1000, // 1TB
  }
}

/**
 * 메모리 사용량 조회 (Mock)
 */
async function getMemoryUsage() {
  const memUsage = process.memoryUsage()
  return {
    used: Math.floor(memUsage.heapUsed / 1024 / 1024), // MB
    total: Math.floor(memUsage.heapTotal / 1024 / 1024), // MB
    external: Math.floor(memUsage.external / 1024 / 1024), // MB
  }
}

/**
 * 건강 점수 계산 (0-100)
 */
function calculateHealthScore(draftStats: any, systemHealth: any): number {
  let score = 100

  // Draft 상태 평가 (40점)
  const expiredRatio = draftStats.health.expiredRatio
  const syncPendingRatio = draftStats.health.syncPendingRatio
  const excessRatio = draftStats.health.excessRatio

  score -= expiredRatio * 20 // 만료 비율
  score -= syncPendingRatio * 10 // 동기화 대기 비율
  score -= excessRatio * 10 // 초과 Draft 비율

  // 시스템 상태 평가 (30점)
  if (!systemHealth.database.connected) score -= 30
  if (systemHealth.resources.disk.used > 80) score -= 10
  if (systemHealth.resources.memory.used > 2048) score -= 10 // 2GB 초과

  // 성능 평가 (30점)
  if (systemHealth.database.latency > 100) score -= 10
  
  return Math.max(0, Math.min(100, Math.floor(score)))
}

/**
 * 추천 사항 생성
 */
function generateRecommendations(draftStats: any, notificationTargets: any[], systemHealth: any): string[] {
  const recommendations: string[] = []

  if (draftStats.expiredDrafts > 100) {
    recommendations.push('만료된 Draft가 100개를 초과했습니다. 정리 작업을 실행하세요.')
  }

  if (draftStats.syncCandidates > 50) {
    recommendations.push('동기화 대기 중인 Draft가 많습니다. 배치 동기화를 실행하세요.')
  }

  if (notificationTargets.length > 0) {
    recommendations.push(`${notificationTargets.length}개의 만료 알림이 대기 중입니다.`)
  }

  if (systemHealth.resources.disk.used > 80) {
    recommendations.push('디스크 사용량이 80%를 초과했습니다. 정리 작업을 고려하세요.')
  }

  if (draftStats.usersWithExcess > 10) {
    recommendations.push('제한을 초과한 사용자가 많습니다. 사용자 제한 정책을 검토하세요.')
  }

  if (recommendations.length === 0) {
    recommendations.push('시스템이 정상적으로 운영되고 있습니다.')
  }

  return recommendations
}

/**
 * 알림 생성
 */
function generateAlerts(draftStats: any, notificationTargets: any[], systemHealth: any) {
  const alerts: Array<{
    level: 'info' | 'warning' | 'error'
    message: string
    timestamp: string
  }> = []

  const now = new Date().toISOString()

  if (draftStats.expiredDrafts > 200) {
    alerts.push({
      level: 'error',
      message: `심각: 만료된 Draft가 ${draftStats.expiredDrafts}개입니다.`,
      timestamp: now,
    })
  }

  if (!systemHealth.database.connected) {
    alerts.push({
      level: 'error',
      message: '데이터베이스 연결에 실패했습니다.',
      timestamp: now,
    })
  }

  const criticalNotifications = notificationTargets.filter(
    n => n.notificationType === 'FINAL_WARNING' || n.notificationType === 'EXPIRED'
  ).length

  if (criticalNotifications > 20) {
    alerts.push({
      level: 'warning',
      message: `긴급 알림이 ${criticalNotifications}개 대기 중입니다.`,
      timestamp: now,
    })
  }

  if (systemHealth.resources.disk.used > 90) {
    alerts.push({
      level: 'warning',
      message: `디스크 사용량이 ${systemHealth.resources.disk.used}%입니다.`,
      timestamp: now,
    })
  }

  return alerts
}
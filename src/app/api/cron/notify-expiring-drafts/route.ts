import { NextRequest, NextResponse } from 'next/server'
import { sendExpirationNotifications } from '@/lib/notifications/draft-expiration'

/**
 * POST /api/cron/notify-expiring-drafts - 만료 예정 Draft 알림 발송 (Cron Job)
 * 
 * 이 엔드포인트는 스케줄된 작업으로 실행되며 다음을 수행합니다:
 * 1. 48시간 내 만료 예정 Draft에 대한 조기 경고
 * 2. 24시간 내 만료 예정 Draft에 대한 최종 경고  
 * 3. 이미 만료된 Draft에 대한 만료 알림
 * 4. 이메일 발송 및 알림 로그 생성
 */

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now()
  
  try {
    // Cron 작업 인증 검증 (보안)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'UNAUTHORIZED',
            message: 'Invalid cron authorization',
          },
        },
        { status: 401 }
      )
    }

    console.log('📮 Draft 만료 알림 작업 시작')

    // 만료 알림 발송
    const result = await sendExpirationNotifications()
    const duration = Date.now() - startTime

    // 결과 로깅
    console.log(`✅ Draft 만료 알림 작업 완료 (${duration}ms):`)
    console.log(`  - 대상: ${result.notifications.length}개`)
    console.log(`  - 성공: ${result.sent}개`)
    console.log(`  - 실패: ${result.failed}개`)
    
    if (result.errors.length > 0) {
      console.log(`  - 에러: ${result.errors.length}개`)
      result.errors.forEach(error => console.error(`    - ${error}`))
    }

    // 알림 유형별 통계
    const stats = result.notifications.reduce(
      (acc, notification) => {
        acc[notification.notificationType] = (acc[notification.notificationType] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    console.log('  - 알림 유형별:')
    Object.entries(stats).forEach(([type, count]) => {
      console.log(`    - ${type}: ${count}개`)
    })

    return NextResponse.json({
      success: true,
      data: {
        notifications: {
          total: result.notifications.length,
          sent: result.sent,
          failed: result.failed,
          types: stats,
        },
        duration,
        message: `${result.sent}개의 만료 알림이 성공적으로 발송되었습니다.`,
      },
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error('💥 Draft 만료 알림 작업 실패:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          errorType: 'INTERNAL_ERROR',
          message: 'Draft 만료 알림 작업 중 오류가 발생했습니다.',
          duration,
        },
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/cron/notify-expiring-drafts - 알림 대상 조회
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'UNAUTHORIZED',
            message: 'Invalid cron authorization',
          },
        },
        { status: 401 }
      )
    }

    const { getExpirationNotificationTargets } = await import('@/lib/notifications/draft-expiration')
    const notifications = await getExpirationNotificationTargets()

    // 알림 유형별 통계
    const stats = notifications.reduce(
      (acc, notification) => {
        acc[notification.notificationType] = (acc[notification.notificationType] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    return NextResponse.json({
      success: true,
      data: {
        total: notifications.length,
        types: stats,
        notifications: notifications.map(n => ({
          draftId: n.draftId,
          userId: n.userId,
          bookTitle: n.bookTitle,
          expiresAt: n.expiresAt,
          daysUntilExpiry: n.daysUntilExpiry,
          notificationType: n.notificationType,
        })),
        recommendations: {
          shouldSendNotifications: notifications.length > 0,
          urgentNotifications: notifications.filter(n => n.notificationType === 'FINAL_WARNING' || n.notificationType === 'EXPIRED').length,
        },
      },
    })
  } catch (error) {
    console.error('Draft 만료 알림 대상 조회 실패:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          errorType: 'INTERNAL_ERROR',
          message: '알림 대상 조회 중 오류가 발생했습니다.',
        },
      },
      { status: 500 }
    )
  }
}
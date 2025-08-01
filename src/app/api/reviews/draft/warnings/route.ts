import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getUserExpirationWarnings } from '@/lib/notifications/draft-expiration'

/**
 * GET /api/reviews/draft/warnings - 사용자의 만료 예정 Draft 경고 조회
 */
export async function GET(): Promise<NextResponse> {
  try {
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

    // 사용자의 만료 예정 Draft 조회
    const warnings = await getUserExpirationWarnings(session.user.id)

    // 경고 수준별 분류
    const classified = warnings.reduce(
      (acc, warning) => {
        if (warning.daysUntilExpiry <= 1) {
          acc.critical.push(warning)
        } else if (warning.daysUntilExpiry <= 2) {
          acc.urgent.push(warning)
        } else {
          acc.normal.push(warning)
        }
        return acc
      },
      {
        critical: [] as typeof warnings,
        urgent: [] as typeof warnings,
        normal: [] as typeof warnings,
      }
    )

    const hasWarnings = warnings.length > 0
    const hasCritical = classified.critical.length > 0

    return NextResponse.json({
      success: true,
      data: {
        total: warnings.length,
        hasWarnings,
        hasCritical,
        warnings: warnings.map(w => ({
          draftId: w.draftId,
          bookTitle: w.bookTitle,
          expiresAt: w.expiresAt,
          daysUntilExpiry: w.daysUntilExpiry,
          notificationType: w.notificationType,
          urgencyLevel: w.daysUntilExpiry <= 1 ? 'critical' : w.daysUntilExpiry <= 2 ? 'urgent' : 'normal',
        })),
        classified: {
          critical: classified.critical.length,
          urgent: classified.urgent.length,
          normal: classified.normal.length,
        },
        recommendations: {
          shouldTakeAction: hasCritical,
          message: hasCritical
            ? '24시간 내 만료 예정인 독후감이 있습니다. 지금 바로 작성을 완료하거나 만료일을 연장해 주세요.'
            : hasWarnings
            ? '만료 예정인 독후감이 있습니다. 작성을 완료하거나 만료일을 연장하는 것을 고려해 보세요.'
            : '모든 독후감이 안전하게 보관되고 있습니다.',
        },
      },
    })
  } catch (error) {
    console.error('Draft 만료 경고 조회 실패:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: {
          errorType: 'INTERNAL_ERROR',
          message: '만료 경고 조회 중 오류가 발생했습니다.',
        },
      },
      { status: 500 }
    )
  }
}
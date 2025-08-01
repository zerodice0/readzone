import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { 
  cleanupCriteriaSchema,
  DRAFT_DEFAULTS,
  type CleanupCriteria 
} from '@/lib/validations/draft'

/**
 * POST /api/cron/cleanup-drafts - 만료된 Draft 정리 (Cron Job)
 * 
 * 이 엔드포인트는 스케줄된 작업으로 실행되며 다음을 수행합니다:
 * 1. 7일 이상 된 만료된 Draft 삭제
 * 2. 사용자당 5개 초과 Draft 정리
 * 3. 고아 Draft (연결된 사용자 없음) 삭제
 * 4. 감사 로그 생성
 */

interface CleanupResult {
  totalProcessed: number
  expiredDeleted: number
  excessDeleted: number
  orphanedDeleted: number
  auditLogsCreated: number
  duration: number
  errors: string[]
}

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

    // 요청 데이터 파싱 (선택적 파라미터)
    const body = await request.json().catch(() => ({}))
    const validationResult = cleanupCriteriaSchema.safeParse({
      olderThan: body.olderThan || new Date(Date.now() - DRAFT_DEFAULTS.EXPIRY_DAYS * 24 * 60 * 60 * 1000),
      status: body.status || ['EXPIRED', 'ABANDONED'],
      batchSize: body.batchSize || 100,
      dryRun: body.dryRun || false,
    })

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'VALIDATION_ERROR',
            message: '정리 조건이 올바르지 않습니다.',
            details: validationResult.error.errors,
          },
        },
        { status: 400 }
      )
    }

    const criteria: CleanupCriteria = validationResult.data
    const result: CleanupResult = {
      totalProcessed: 0,
      expiredDeleted: 0,
      excessDeleted: 0,
      orphanedDeleted: 0,
      auditLogsCreated: 0,
      duration: 0,
      errors: [],
    }

    console.log(`🧹 Draft 정리 작업 시작 (DryRun: ${criteria.dryRun})`)

    if (!criteria.dryRun) {
      // 1. 만료된 Draft 상태 업데이트 (EXPIRED로 마킹)
      const expiredResult = await db.reviewDraft.updateMany({
        where: {
          expiresAt: { lt: criteria.olderThan },
          status: 'DRAFT',
        },
        data: {
          status: 'EXPIRED',
        },
      })

      console.log(`📅 만료된 Draft ${expiredResult.count}개를 EXPIRED 상태로 변경`)

      // 2. EXPIRED와 ABANDONED 상태의 Draft 삭제
      const expiredDrafts = await db.reviewDraft.findMany({
        where: {
          status: { in: criteria.status },
          OR: [
            { expiresAt: { lt: criteria.olderThan } },
            { status: 'ABANDONED' },
          ],
        },
        select: { id: true, userId: true, title: true, status: true },
        take: criteria.batchSize,
      })

      for (const draft of expiredDrafts) {
        try {
          // 감사 로그 먼저 생성
          await db.reviewDraftAudit.create({
            data: {
              draftId: draft.id,
              userId: draft.userId,
              action: 'DELETED',
              oldData: JSON.stringify({
                status: draft.status,
                title: draft.title,
                deletedBy: 'CRON_CLEANUP',
              }),
            },
          })

          // Draft 삭제
          await db.reviewDraft.delete({
            where: { id: draft.id },
          })

          result.expiredDeleted++
          result.auditLogsCreated++
        } catch (error) {
          result.errors.push(`Failed to delete draft ${draft.id}: ${error}`)
          console.error(`❌ Draft ${draft.id} 삭제 실패:`, error)
        }
      }

      // 3. 사용자당 5개 초과 Draft 정리
      const userDraftCounts = await db.reviewDraft.groupBy({
        by: ['userId'],
        _count: { id: true },
        having: {
          id: { _count: { gt: DRAFT_DEFAULTS.MAX_DRAFTS_PER_USER } },
        },
      })

      for (const userCount of userDraftCounts) {
        try {
          // 가장 오래된 Draft부터 삭제 (최대 개수까지)
          const excessDrafts = await db.reviewDraft.findMany({
            where: { userId: userCount.userId },
            orderBy: [
              { lastAccessed: 'asc' },
              { updatedAt: 'asc' },
            ],
            skip: DRAFT_DEFAULTS.MAX_DRAFTS_PER_USER,
            select: { id: true, userId: true, title: true },
          })

          for (const draft of excessDrafts) {
            // 감사 로그 생성
            await db.reviewDraftAudit.create({
              data: {
                draftId: draft.id,
                userId: draft.userId,
                action: 'DELETED',
                oldData: JSON.stringify({
                  title: draft.title,
                  deletedBy: 'CRON_CLEANUP_EXCESS',
                  reason: 'MAX_DRAFTS_EXCEEDED',
                }),
              },
            })

            // Draft 삭제
            await db.reviewDraft.delete({
              where: { id: draft.id },
            })

            result.excessDeleted++
            result.auditLogsCreated++
          }
        } catch (error) {
          result.errors.push(`Failed to cleanup excess drafts for user ${userCount.userId}: ${error}`)
          console.error(`❌ 사용자 ${userCount.userId}의 초과 Draft 정리 실패:`, error)
        }
      }

      // 4. 고아 Draft 삭제 (사용자가 삭제된 경우)
      try {
        const orphanedDrafts = await db.reviewDraft.findMany({
          where: {
            user: { is: undefined },
          },
          select: { id: true, userId: true },
          take: criteria.batchSize,
        })

        for (const draft of orphanedDrafts) {
          await db.reviewDraft.delete({
            where: { id: draft.id },
          })
          result.orphanedDeleted++
        }

        if (orphanedDrafts.length > 0) {
          console.log(`🧹 고아 Draft ${orphanedDrafts.length}개 삭제`)
        }
      } catch (error) {
        result.errors.push(`Failed to cleanup orphaned drafts: ${error}`)
        console.error('❌ 고아 Draft 정리 실패:', error)
      }

      result.totalProcessed = result.expiredDeleted + result.excessDeleted + result.orphanedDeleted
    } else {
      // Dry run 모드: 삭제 대상만 카운트
      const [expiredCount, userCounts, orphanedCount] = await Promise.all([
        db.reviewDraft.count({
          where: {
            status: { in: criteria.status },
            OR: [
              { expiresAt: { lt: criteria.olderThan } },
              { status: 'ABANDONED' },
            ],
          },
        }),
        db.reviewDraft.groupBy({
          by: ['userId'],
          _count: { id: true },
          having: {
            id: { _count: { gt: DRAFT_DEFAULTS.MAX_DRAFTS_PER_USER } },
          },
        }),
        db.reviewDraft.count({
          where: {
            user: { is: undefined },
          },
        }),
      ])

      result.expiredDeleted = expiredCount
      result.excessDeleted = userCounts.reduce(
        (total, user) => total + Math.max(0, user._count.id - DRAFT_DEFAULTS.MAX_DRAFTS_PER_USER),
        0
      )
      result.orphanedDeleted = orphanedCount
      result.totalProcessed = result.expiredDeleted + result.excessDeleted + result.orphanedDeleted
    }

    result.duration = Date.now() - startTime

    // 정리 결과 로깅
    console.log(`✅ Draft 정리 완료 (${result.duration}ms):`)
    console.log(`  - 만료 삭제: ${result.expiredDeleted}개`)
    console.log(`  - 초과 삭제: ${result.excessDeleted}개`)
    console.log(`  - 고아 삭제: ${result.orphanedDeleted}개`)
    console.log(`  - 총 처리: ${result.totalProcessed}개`)
    
    if (result.errors.length > 0) {
      console.log(`  - 에러: ${result.errors.length}개`)
    }

    return NextResponse.json({
      success: true,
      data: {
        cleanup: result,
        message: criteria.dryRun 
          ? `DryRun: ${result.totalProcessed}개 Draft가 정리 대상입니다.`
          : `${result.totalProcessed}개 Draft가 성공적으로 정리되었습니다.`,
      },
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error('💥 Draft 정리 작업 실패:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          errorType: 'INTERNAL_ERROR',
          message: 'Draft 정리 작업 중 오류가 발생했습니다.',
          duration,
        },
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/cron/cleanup-drafts - 정리 작업 상태 조회
 */
export async function GET(): Promise<NextResponse> {
  try {
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // 정리 대상 통계 조회
    const [
      totalDrafts,
      expiredDrafts,
      abandonedDrafts,
      recentAuditLogs,
      userExcessCounts,
      orphanedDrafts,
    ] = await Promise.all([
      db.reviewDraft.count(),
      db.reviewDraft.count({
        where: { 
          expiresAt: { lt: now },
          status: 'DRAFT',
        },
      }),
      db.reviewDraft.count({
        where: { status: 'ABANDONED' },
      }),
      db.reviewDraftAudit.count({
        where: {
          action: 'DELETED',
          createdAt: { gte: sevenDaysAgo },
        },
      }),
      db.reviewDraft.groupBy({
        by: ['userId'],
        _count: { id: true },
        having: {
          id: { _count: { gt: DRAFT_DEFAULTS.MAX_DRAFTS_PER_USER } },
        },
      }),
      db.reviewDraft.count({
        where: {
          user: { is: undefined },
        },
      }),
    ])

    const excessDraftsCount = userExcessCounts.reduce(
      (total, user) => total + Math.max(0, user._count.id - DRAFT_DEFAULTS.MAX_DRAFTS_PER_USER),
      0
    )

    return NextResponse.json({
      success: true,
      data: {
        statistics: {
          totalDrafts,
          cleanupTargets: {
            expired: expiredDrafts,
            abandoned: abandonedDrafts,
            excess: excessDraftsCount,
            orphaned: orphanedDrafts,
            total: expiredDrafts + abandonedDrafts + excessDraftsCount + orphanedDrafts,
          },
          recentCleanups: recentAuditLogs,
          usersWithExcess: userExcessCounts.length,
        },
        recommendations: {
          shouldRunCleanup: (expiredDrafts + abandonedDrafts + excessDraftsCount + orphanedDrafts) > 0,
          urgencyLevel: expiredDrafts > 100 ? 'high' : expiredDrafts > 50 ? 'medium' : 'low',
        },
      },
    })
  } catch (error) {
    console.error('Draft 정리 상태 조회 실패:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          errorType: 'INTERNAL_ERROR',
          message: '정리 상태 조회 중 오류가 발생했습니다.',
        },
      },
      { status: 500 }
    )
  }
}
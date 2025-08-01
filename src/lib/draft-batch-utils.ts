/**
 * Draft Batch Processing Utilities
 * Provides efficient batch operations for draft management
 */

import { db } from '@/lib/db'
import { DRAFT_DEFAULTS } from '@/lib/validations/draft'

export interface BatchSyncResult {
  processed: number
  synced: number
  failed: number
  duration: number
  errors: string[]
}

export interface BookSyncCandidate {
  draftId: string
  userId: string
  bookData: string
  title?: string
}

/**
 * 여러 Draft의 도서 정보를 일괄 동기화
 */
export async function batchSyncBooks(
  candidates: BookSyncCandidate[],
  batchSize: number = 10
): Promise<BatchSyncResult> {
  const startTime = Date.now()
  const result: BatchSyncResult = {
    processed: 0,
    synced: 0,
    failed: 0,
    duration: 0,
    errors: [],
  }

  console.log(`📚 도서 일괄 동기화 시작: ${candidates.length}개 Draft`)

  // 배치 단위로 처리
  for (let i = 0; i < candidates.length; i += batchSize) {
    const batch = candidates.slice(i, i + batchSize)
    
    await Promise.all(
      batch.map(async (candidate) => {
        try {
          result.processed++
          
          // 카카오 도서 데이터 파싱
          const kakaoBookData = JSON.parse(candidate.bookData)
          
          // 기존 도서 검색 (병렬 처리)
          const [isbnMatch, titleMatch] = await Promise.all([
            // ISBN13으로 정확한 매칭
            kakaoBookData.isbn13 
              ? db.book.findFirst({
                  where: { isbn13: kakaoBookData.isbn13 },
                  select: { id: true },
                })
              : null,
            // 제목과 저자로 유사 매칭
            kakaoBookData.title && kakaoBookData.authors?.length > 0
              ? db.book.findFirst({
                  where: {
                    title: { contains: kakaoBookData.title },
                    authors: { 
                      contains: JSON.stringify(kakaoBookData.authors[0]) 
                    },
                  },
                  select: { id: true },
                })
              : null,
          ])

          const existingBook = isbnMatch || titleMatch

          if (existingBook) {
            // Draft를 기존 도서와 연결
            await db.reviewDraft.update({
              where: { id: candidate.draftId },
              data: {
                bookId: existingBook.id,
                bookData: null, // 동기화 후 원본 데이터 제거
                lastAccessed: new Date(),
              },
            })

            // 감사 로그 생성
            await db.reviewDraftAudit.create({
              data: {
                draftId: candidate.draftId,
                userId: candidate.userId,
                action: 'BOOK_SYNCED',
                oldData: JSON.stringify({ bookId: null }),
                newData: JSON.stringify({ bookId: existingBook.id }),
              },
            })

            result.synced++
          }
        } catch (error) {
          result.failed++
          result.errors.push(`Draft ${candidate.draftId}: ${error}`)
          console.error(`❌ Draft ${candidate.draftId} 동기화 실패:`, error)
        }
      })
    )
  }

  result.duration = Date.now() - startTime
  
  console.log(`✅ 도서 일괄 동기화 완료 (${result.duration}ms):`)
  console.log(`  - 처리: ${result.processed}개`)
  console.log(`  - 동기화: ${result.synced}개`)
  console.log(`  - 실패: ${result.failed}개`)

  return result
}

/**
 * 도서 동기화 후보 Draft 조회
 */
export async function findSyncCandidates(limit: number = 100): Promise<BookSyncCandidate[]> {
  const candidates = await db.reviewDraft.findMany({
    where: {
      bookData: { not: null },
      bookId: null,
      status: 'DRAFT',
    },
    select: {
      id: true,
      userId: true,
      bookData: true,
      title: true,
    },
    orderBy: { lastAccessed: 'desc' },
    take: limit,
  })

  return candidates
    .filter(draft => draft.bookData) // null 체크
    .map(draft => ({
      draftId: draft.id,
      userId: draft.userId,
      bookData: draft.bookData!,
      title: draft.title || undefined,
    }))
}

/**
 * Draft 통계 정보 조회
 */
export async function getDraftStatistics() {
  const [
    totalDrafts,
    activeDrafts,
    expiredDrafts,
    syncCandidates,
    userCounts,
    recentActivity,
  ] = await Promise.all([
    db.reviewDraft.count(),
    db.reviewDraft.count({ where: { status: 'DRAFT' } }),
    db.reviewDraft.count({ 
      where: { 
        expiresAt: { lt: new Date() },
        status: 'DRAFT',
      } 
    }),
    db.reviewDraft.count({
      where: {
        bookData: { not: null },
        bookId: null,
        status: 'DRAFT',
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
        lastAccessed: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // 최근 24시간
        },
      },
    }),
  ])

  const usersWithExcess = userCounts.length
  const excessDrafts = userCounts.reduce(
    (total, user) => total + Math.max(0, user._count.id - DRAFT_DEFAULTS.MAX_DRAFTS_PER_USER),
    0
  )

  return {
    totalDrafts,
    activeDrafts,
    expiredDrafts,
    syncCandidates,
    excessDrafts,
    usersWithExcess,
    recentActivity,
    health: {
      expiredRatio: totalDrafts > 0 ? (expiredDrafts / totalDrafts) : 0,
      syncPendingRatio: totalDrafts > 0 ? (syncCandidates / totalDrafts) : 0,
      excessRatio: totalDrafts > 0 ? (excessDrafts / totalDrafts) : 0,
    },
  }
}

interface EnforceUserDraftLimitsResult {
  removed: number
  errors: string[]
}

/**
 * 사용자별 Draft 제한 확인 및 정리
 */
export async function enforceUserDraftLimits(userId: string): Promise<EnforceUserDraftLimitsResult> {
  const result: EnforceUserDraftLimitsResult = { removed: 0, errors: [] }

  try {
    // 사용자의 Draft 개수 확인
    const userDraftCount = await db.reviewDraft.count({
      where: { 
        userId,
        status: 'DRAFT',
      },
    })

    if (userDraftCount > DRAFT_DEFAULTS.MAX_DRAFTS_PER_USER) {
      // 가장 오래된 Draft부터 삭제
      const excessDrafts = await db.reviewDraft.findMany({
        where: { 
          userId,
          status: 'DRAFT',
        },
        orderBy: [
          { lastAccessed: 'asc' },
          { updatedAt: 'asc' },
        ],
        skip: DRAFT_DEFAULTS.MAX_DRAFTS_PER_USER,
        select: { id: true, title: true },
      })

      for (const draft of excessDrafts) {
        try {
          // 감사 로그 생성
          await db.reviewDraftAudit.create({
            data: {
              draftId: draft.id,
              userId,
              action: 'DELETED',
              oldData: JSON.stringify({
                title: draft.title,
                deletedBy: 'LIMIT_ENFORCEMENT',
                reason: 'MAX_DRAFTS_EXCEEDED',
              }),
            },
          })

          // Draft 삭제
          await db.reviewDraft.delete({
            where: { id: draft.id },
          })

          result.removed++
        } catch (error) {
          result.errors.push(`Failed to delete draft ${draft.id}: ${error}`)
        }
      }
    }
  } catch (error) {
    result.errors.push(`Failed to enforce limits for user ${userId}: ${error}`)
  }

  return result
}

/**
 * Draft 메타데이터 최적화 (크기 축소)
 */
export async function optimizeDraftMetadata(draftId: string): Promise<{
  originalSize: number
  optimizedSize: number
  saved: number
}> {
  const draft = await db.reviewDraft.findUnique({
    where: { id: draftId },
    select: { metadata: true },
  })

  if (!draft) {
    throw new Error(`Draft ${draftId} not found`)
  }

  const originalSize = draft.metadata.length
  let optimizedMetadata = draft.metadata

  try {
    const metadata = JSON.parse(draft.metadata)
    
    // 메타데이터 최적화 로직
    const optimized = {
      ...metadata,
      // 불필요한 필드 제거
      __temp: undefined,
      __cache: undefined,
      // 큰 배열 압축
      history: metadata.history ? metadata.history.slice(-10) : undefined,
      // 중복 데이터 제거
      lastSaved: metadata.lastSaved || new Date().toISOString(),
    }

    // undefined 값 제거
    Object.keys(optimized).forEach(key => {
      if (optimized[key] === undefined) {
        delete optimized[key]
      }
    })

    optimizedMetadata = JSON.stringify(optimized)
    
    // 최적화된 메타데이터로 업데이트
    if (optimizedMetadata !== draft.metadata) {
      await db.reviewDraft.update({
        where: { id: draftId },
        data: { metadata: optimizedMetadata },
      })
    }
  } catch (error) {
    console.error(`메타데이터 최적화 실패 (Draft ${draftId}):`, error)
  }

  const optimizedSize = optimizedMetadata.length
  const saved = originalSize - optimizedSize

  return {
    originalSize,
    optimizedSize,
    saved,
  }
}
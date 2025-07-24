import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// 배치 요청 스키마
const batchLikeSchema = z.object({
  reviewIds: z.array(z.string()).optional(),
  commentIds: z.array(z.string()).optional(),
  actions: z.record(z.enum(['like', 'unlike']))
})

interface BatchResult {
  [key: string]: {
    isLiked: boolean
    likeCount: number
    error?: string
  }
}

/**
 * POST /api/likes/batch - 배치 좋아요 처리
 * 
 * 여러 좋아요 요청을 한 번에 처리하여 성능을 최적화
 * 
 * @example
 * ```json
 * {
 *   "reviewIds": ["review1", "review2"],
 *   "commentIds": ["comment1"],
 *   "actions": {
 *     "review-review1": "like",
 *     "review-review2": "unlike",
 *     "comment-comment1": "like"
 *   }
 * }
 * ```
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 인증 확인
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

    const userId = session.user.id

    // 요청 데이터 검증
    const body = await request.json()
    const validationResult = batchLikeSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'INVALID_REQUEST',
            message: '잘못된 요청 형식입니다.',
            details: validationResult.error.issues
          },
        },
        { status: 400 }
      )
    }

    const { reviewIds = [], commentIds = [], actions } = validationResult.data

    // 최대 배치 크기 제한
    const totalRequests = reviewIds.length + commentIds.length
    if (totalRequests > 50) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'BATCH_TOO_LARGE',
            message: '한 번에 처리할 수 있는 요청은 최대 50개입니다.',
          },
        },
        { status: 400 }
      )
    }

    if (totalRequests === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'EMPTY_BATCH',
            message: '처리할 요청이 없습니다.',
          },
        },
        { status: 400 }
      )
    }

    const results: BatchResult = {}

    // 트랜잭션으로 모든 좋아요 처리를 원자적으로 실행
    await prisma.$transaction(async (tx) => {
      // 독후감 좋아요 처리
      for (const reviewId of reviewIds) {
        const key = `review-${reviewId}`
        const action = actions[key]
        
        if (!action) {
          results[key] = {
            isLiked: false,
            likeCount: 0,
            error: '액션이 지정되지 않았습니다.'
          }
          continue
        }

        try {
          // 독후감 존재 여부 확인
          const review = await tx.bookReview.findUnique({
            where: { id: reviewId },
            select: { id: true }
          })

          if (!review) {
            results[key] = {
              isLiked: false,
              likeCount: 0,
              error: '독후감을 찾을 수 없습니다.'
            }
            continue
          }

          // 기존 좋아요 확인
          const existingLike = await tx.reviewLike.findUnique({
            where: {
              userId_reviewId: {
                userId,
                reviewId
              }
            }
          })

          let isLiked: boolean

          if (action === 'like') {
            if (!existingLike) {
              await tx.reviewLike.create({
                data: {
                  userId,
                  reviewId
                }
              })
            }
            isLiked = true
          } else { // unlike
            if (existingLike) {
              await tx.reviewLike.delete({
                where: {
                  userId_reviewId: {
                    userId,
                    reviewId
                  }
                }
              })
            }
            isLiked = false
          }

          // 좋아요 수 조회
          const likeCount = await tx.reviewLike.count({
            where: { reviewId }
          })

          results[key] = {
            isLiked,
            likeCount
          }

        } catch (error) {
          console.error(`Review like error for ${reviewId}:`, error)
          results[key] = {
            isLiked: false,
            likeCount: 0,
            error: '좋아요 처리 중 오류가 발생했습니다.'
          }
        }
      }

      // 댓글 좋아요 처리 (구현 필요 시)
      for (const commentId of commentIds) {
        const key = `comment-${commentId}`
        const action = actions[key]
        
        if (!action) {
          results[key] = {
            isLiked: false,
            likeCount: 0,
            error: '액션이 지정되지 않았습니다.'
          }
          continue
        }

        try {
          // TODO: 댓글 좋아요 로직 구현
          // 현재는 플레이스홀더
          results[key] = {
            isLiked: action === 'like',
            likeCount: 0,
            error: '댓글 좋아요는 아직 구현되지 않았습니다.'
          }

        } catch (error) {
          console.error(`Comment like error for ${commentId}:`, error)
          results[key] = {
            isLiked: false,
            likeCount: 0,
            error: '좋아요 처리 중 오류가 발생했습니다.'
          }
        }
      }
    })

    // 성공한 처리 수와 실패한 처리 수 계산
    const successCount = Object.values(results).filter(r => !r.error).length
    const errorCount = Object.values(results).filter(r => r.error).length

    // 성능 메트릭 로깅 (개발 환경)
    if (process.env.NODE_ENV === 'development') {
      console.debug(`Batch like processing: ${successCount} success, ${errorCount} errors, ${totalRequests} total`)
    }

    return NextResponse.json({
      success: true,
      data: {
        results,
        summary: {
          total: totalRequests,
          success: successCount,
          errors: errorCount
        }
      }
    })

  } catch (error) {
    console.error('Batch like processing error:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          errorType: 'INTERNAL_ERROR',
          message: '배치 좋아요 처리 중 오류가 발생했습니다.',
        },
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/likes/batch/status - 배치 처리 상태 확인
 * 개발/모니터링 용도
 */
export async function GET(): Promise<NextResponse> {
  try {
    // 간단한 상태 정보 반환
    const status = {
      service: 'batch-like-processor',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      limits: {
        maxBatchSize: 50,
        maxRetries: 3
      }
    }

    return NextResponse.json(status)
  } catch (error) {
    return NextResponse.json(
      { error: 'Status check failed' },
      { status: 500 }
    )
  }
}
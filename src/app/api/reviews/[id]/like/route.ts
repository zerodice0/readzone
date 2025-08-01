import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import type { PrismaTransaction } from '@/types/prisma'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

/**
 * POST /api/reviews/[id]/like - 좋아요 토글
 */
export async function POST(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id: reviewId } = await params

    if (!reviewId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'INVALID_PARAMS',
            message: '독후감 ID가 필요합니다.',
          },
        },
        { status: 400 }
      )
    }

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

    // 독후감 존재 여부 확인
    const review = await prisma.bookReview.findUnique({
      where: { id: reviewId },
      select: { id: true }
    })

    if (!review) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'NOT_FOUND',
            message: '독후감을 찾을 수 없습니다.',
          },
        },
        { status: 404 }
      )
    }

    // 트랜잭션으로 좋아요 토글 및 카운트 조회를 원자적으로 처리
    const result = await prisma.$transaction(async (tx: PrismaTransaction) => {
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

      if (existingLike) {
        // 좋아요 취소
        await tx.reviewLike.delete({
          where: {
            userId_reviewId: {
              userId,
              reviewId
            }
          }
        })
        isLiked = false
      } else {
        // 좋아요 추가
        await tx.reviewLike.create({
          data: {
            userId,
            reviewId
          }
        })
        isLiked = true
      }

      // 전체 좋아요 수 조회 (트랜잭션 내에서)
      const likeCount = await tx.reviewLike.count({
        where: { reviewId }
      })

      return { isLiked, likeCount }
    })

    const { isLiked, likeCount } = result

    return NextResponse.json({
      success: true,
      data: {
        isLiked,
        likeCount,
        message: isLiked ? '좋아요를 추가했습니다.' : '좋아요를 취소했습니다.'
      }
    })

  } catch (error) {
    console.error('Like toggle error:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          errorType: 'INTERNAL_ERROR',
          message: '좋아요 처리 중 오류가 발생했습니다.',
        },
      },
      { status: 500 }
    )
  }
}
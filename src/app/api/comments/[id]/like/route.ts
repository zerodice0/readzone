import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { 
  validateAuthSession, 
  validateCommentAccess,
  logCommentAction 
} from '@/lib/comment-security'
import { logger } from '@/lib/logger'
import type { PrismaTransaction } from '@/types/prisma'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

/**
 * POST /api/comments/[id]/like - 댓글 좋아요 토글
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id: commentId } = await params

    // 인증 확인
    const authResult = await validateAuthSession()
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        {
          success: false,
          error: authResult.error || { message: 'Authentication failed', statusCode: 401 },
        },
        { status: authResult.error?.statusCode || 401 }
      )
    }

    const { user } = authResult

    // 댓글 존재 여부 및 권한 확인
    const commentValidation = await validateCommentAccess(commentId, user.id)
    if (!commentValidation.success || !commentValidation.comment) {
      return NextResponse.json(
        {
          success: false,
          error: commentValidation.error || { message: 'Comment not found', statusCode: 404 },
        },
        { status: commentValidation.error?.statusCode || 404 }
      )
    }

    const { comment } = commentValidation

    // 자신의 댓글에는 좋아요 불가
    if (comment.userId === user.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'FORBIDDEN',
            message: '자신의 댓글에는 좋아요를 할 수 없습니다.',
          },
        },
        { status: 403 }
      )
    }

    // 클라이언트 IP 주소 추출 (로깅용)
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown'

    // 트랜잭션으로 좋아요 토글 및 카운트 조회를 원자적으로 처리
    const result = await prisma.$transaction(async (tx: PrismaTransaction) => {
      // 기존 좋아요 확인
      const existingLike = await tx.commentLike.findUnique({
        where: {
          userId_commentId: {
            userId: user.id,
            commentId,
          },
        },
      })

      let isLiked: boolean
      let action: 'like' | 'unlike'

      if (existingLike) {
        // 좋아요 취소
        await tx.commentLike.delete({
          where: {
            userId_commentId: {
              userId: user.id,
              commentId,
            },
          },
        })
        isLiked = false
        action = 'unlike'
      } else {
        // 좋아요 추가
        await tx.commentLike.create({
          data: {
            userId: user.id,
            commentId,
          },
        })
        isLiked = true
        action = 'like'
      }

      // 전체 좋아요 수 조회 (트랜잭션 내에서)
      const likeCount = await tx.commentLike.count({
        where: { commentId },
      })

      return { isLiked, likeCount, action }
    })

    const { isLiked, likeCount, action } = result

    // 작업 로깅
    logCommentAction(action, {
      userId: user.id,
      commentId,
      reviewId: comment.review.id,
      ipAddress,
    })

    return NextResponse.json({
      success: true,
      data: {
        isLiked,
        likeCount,
        message: isLiked ? '댓글에 좋아요를 추가했습니다.' : '댓글 좋아요를 취소했습니다.',
      },
    })

  } catch (error) {
    logger.error('Comment like toggle failed', { 
      commentId: (await params).id, 
      error: error instanceof Error ? error.message : 'Unknown error'
    })

    return NextResponse.json(
      {
        success: false,
        error: {
          errorType: 'INTERNAL_ERROR',
          message: '댓글 좋아요 처리 중 오류가 발생했습니다.',
        },
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/comments/[id]/like - 댓글 좋아요 취소 (명시적)
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id: commentId } = await params

    // 인증 확인
    const authResult = await validateAuthSession()
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        {
          success: false,
          error: authResult.error || { message: 'Authentication failed', statusCode: 401 },
        },
        { status: authResult.error?.statusCode || 401 }
      )
    }

    const { user } = authResult

    // 댓글 존재 여부 및 권한 확인
    const commentValidation = await validateCommentAccess(commentId, user.id)
    if (!commentValidation.success || !commentValidation.comment) {
      return NextResponse.json(
        {
          success: false,
          error: commentValidation.error || { message: 'Comment not found', statusCode: 404 },
        },
        { status: commentValidation.error?.statusCode || 404 }
      )
    }

    const { comment } = commentValidation

    // 클라이언트 IP 주소 추출 (로깅용)
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown'

    // 트랜잭션으로 좋아요 삭제 및 카운트 조회
    const result = await prisma.$transaction(async (tx: PrismaTransaction) => {
      // 기존 좋아요 확인 및 삭제
      const deletedLike = await tx.commentLike.deleteMany({
        where: {
          userId: user.id,
          commentId,
        },
      })

      // 좋아요가 없었던 경우
      if (deletedLike.count === 0) {
        return { wasLiked: false, likeCount: 0 }
      }

      // 전체 좋아요 수 조회
      const likeCount = await tx.commentLike.count({
        where: { commentId },
      })

      return { wasLiked: true, likeCount }
    })

    if (!result.wasLiked) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'NOT_FOUND',
            message: '좋아요를 찾을 수 없습니다.',
          },
        },
        { status: 404 }
      )
    }

    // 작업 로깅
    logCommentAction('unlike', {
      userId: user.id,
      commentId,
      reviewId: comment.review.id,
      ipAddress,
    })

    return NextResponse.json({
      success: true,
      data: {
        isLiked: false,
        likeCount: result.likeCount,
        message: '댓글 좋아요를 취소했습니다.',
      },
    })

  } catch (error) {
    logger.error('Comment like removal failed', { 
      commentId: (await params).id, 
      error: error instanceof Error ? error.message : 'Unknown error'
    })

    return NextResponse.json(
      {
        success: false,
        error: {
          errorType: 'INTERNAL_ERROR',
          message: '댓글 좋아요 취소 중 오류가 발생했습니다.',
        },
      },
      { status: 500 }
    )
  }
}
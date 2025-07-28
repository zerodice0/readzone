import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { 
  validateAuthSession, 
  validateCommentAccess,
  validateEditTimeLimit,
  sanitizeCommentContent,
  logCommentAction 
} from '@/lib/comment-security'
import { 
  updateCommentSchema
} from '@/lib/validations'
import { commentInclude } from '@/types/comment'
import { logger } from '@/lib/logger'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

/**
 * GET /api/comments/[id] - 댓글 상세 조회
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id: commentId } = await params

    // 현재 사용자 확인 (선택적)
    const authResult = await validateAuthSession()
    const currentUserId = authResult.success && authResult.user ? authResult.user.id : undefined

    // 댓글 존재 여부 및 권한 확인
    const commentValidation = await validateCommentAccess(commentId, currentUserId)
    if (!commentValidation.success) {
      return NextResponse.json(
        {
          success: false,
          error: commentValidation.error,
        },
        { status: commentValidation.error?.statusCode || 400 }
      )
    }

    // comment validation passed, continue with detailed query

    // 상세 댓글 정보 조회
    const detailedComment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        ...commentInclude,
        likes: currentUserId ? {
          where: { userId: currentUserId },
          select: { id: true },
        } : false,
      },
    })

    if (!detailedComment) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'NOT_FOUND',
            message: '댓글을 찾을 수 없습니다.',
          },
        },
        { status: 404 }
      )
    }

    // 응답 데이터 가공
    const responseComment = {
      id: detailedComment.id,
      content: detailedComment.content,
      createdAt: detailedComment.createdAt,
      updatedAt: detailedComment.updatedAt,
      parentId: detailedComment.parentId,
      depth: detailedComment.depth,
      isDeleted: detailedComment.isDeleted,
      deletedAt: detailedComment.deletedAt,
      userId: detailedComment.userId,
      reviewId: detailedComment.reviewId,
      user: detailedComment.user,
      replies: detailedComment.replies?.map(reply => ({
        ...reply,
        isLiked: false, // replies에는 likes 정보가 포함되지 않음
        canEdit: currentUserId === reply.userId,
        canDelete: currentUserId === reply.userId,
      })) || [],
      _count: detailedComment._count,
      isLiked: currentUserId ? detailedComment.likes?.length > 0 : false,
      canEdit: currentUserId === detailedComment.userId,
      canDelete: currentUserId === detailedComment.userId,
    }

    return NextResponse.json({
      success: true,
      data: {
        comment: responseComment,
      },
    })

  } catch (error) {
    logger.error('Comment retrieval failed', { 
      commentId: (await params).id, 
      error: error instanceof Error ? error.message : 'Unknown error'
    })

    return NextResponse.json(
      {
        success: false,
        error: {
          errorType: 'INTERNAL_ERROR',
          message: '댓글 조회 중 오류가 발생했습니다.',
        },
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/comments/[id] - 댓글 수정
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id: commentId } = await params

    // 인증 확인
    const authResult = await validateAuthSession()
    if (!authResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: authResult.error,
        },
        { status: authResult.error?.statusCode || 401 }
      )
    }

    const { user } = authResult

    // 요청 본문 파싱 및 검증
    const body = await request.json()
    const validation = updateCommentSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'INVALID_INPUT',
            message: '입력 데이터가 올바르지 않습니다.',
            details: validation.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      )
    }

    const { content } = validation.data

    // 댓글 존재 여부 및 권한 확인
    const commentValidation = await validateCommentAccess(commentId, user?.id)
    if (!commentValidation.success) {
      return NextResponse.json(
        {
          success: false,
          error: commentValidation.error,
        },
        { status: commentValidation.error?.statusCode || 400 }
      )
    }

    const { comment, permissions } = commentValidation

    // 편집 권한 확인
    if (!permissions?.canEdit) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'FORBIDDEN',
            message: '댓글을 수정할 권한이 없습니다.',
          },
        },
        { status: 403 }
      )
    }

    // 편집 시간 제한 확인 (24시간)
    if (!comment || !validateEditTimeLimit(comment.createdAt)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'FORBIDDEN',
            message: '댓글 작성 후 24시간이 지나면 수정할 수 없습니다.',
          },
        },
        { status: 403 }
      )
    }

    // 댓글 내용 보안 검증 및 정제
    const contentSanitization = sanitizeCommentContent(content)
    if (!contentSanitization.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'INVALID_CONTENT',
            message: contentSanitization.error,
          },
        },
        { status: 400 }
      )
    }

    const sanitizedContent = contentSanitization.content!

    // 클라이언트 IP 주소 추출 (로깅용)
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown'

    // 댓글 수정
    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        content: sanitizedContent,
        updatedAt: new Date(),
      },
      include: {
        ...commentInclude,
        likes: user?.id ? {
          where: { userId: user.id },
          select: { id: true },
        } : false,
      },
    })

    // 작업 로깅
    if (user?.id) {
      logCommentAction('update', {
        userId: user.id,
        commentId,
        reviewId: updatedComment.reviewId,
        ipAddress,
      })
    }

    // 응답 데이터 가공
    const responseComment = {
      id: updatedComment.id,
      content: updatedComment.content,
      createdAt: updatedComment.createdAt,
      updatedAt: updatedComment.updatedAt,
      parentId: updatedComment.parentId,
      depth: updatedComment.depth,
      isDeleted: updatedComment.isDeleted,
      deletedAt: updatedComment.deletedAt,
      userId: updatedComment.userId,
      reviewId: updatedComment.reviewId,
      user: updatedComment.user,
      replies: updatedComment.replies || [],
      _count: updatedComment._count,
      isLiked: updatedComment.likes?.length > 0,
      canEdit: true,
      canDelete: permissions?.canDelete || false,
      canReply: updatedComment.depth === 0,
    }

    return NextResponse.json({
      success: true,
      data: {
        comment: responseComment,
        message: '댓글이 수정되었습니다.',
      },
    })

  } catch (error) {
    logger.error('Comment update failed', { 
      commentId: (await params).id, 
      error: error instanceof Error ? error.message : 'Unknown error'
    })

    return NextResponse.json(
      {
        success: false,
        error: {
          errorType: 'INTERNAL_ERROR',
          message: '댓글 수정 중 오류가 발생했습니다.',
        },
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/comments/[id] - 댓글 삭제 (소프트 삭제)
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id: commentId } = await params

    // 인증 확인
    const authResult = await validateAuthSession()
    if (!authResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: authResult.error,
        },
        { status: authResult.error?.statusCode || 401 }
      )
    }

    const { user } = authResult

    // 댓글 존재 여부 및 권한 확인
    const commentValidation = await validateCommentAccess(commentId, user?.id)
    if (!commentValidation.success) {
      return NextResponse.json(
        {
          success: false,
          error: commentValidation.error,
        },
        { status: commentValidation.error?.statusCode || 400 }
      )
    }

    const { comment, permissions } = commentValidation

    // 삭제 권한 확인
    if (!permissions?.canDelete) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'FORBIDDEN',
            message: '댓글을 삭제할 권한이 없습니다.',
          },
        },
        { status: 403 }
      )
    }

    // 클라이언트 IP 주소 추출 (로깅용)
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown'

    // 트랜잭션으로 소프트 삭제 및 관련 데이터 정리
    const result = await prisma.$transaction(async (tx) => {
      // 답글이 있는지 확인
      const replyCount = await tx.comment.count({
        where: {
          parentId: commentId,
          isDeleted: false,
        },
      })

      // 소프트 삭제 수행
      const deletedComment = await tx.comment.update({
        where: { id: commentId },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          // 답글이 있는 경우 내용을 "삭제된 댓글입니다"로 변경
          content: replyCount > 0 ? "삭제된 댓글입니다." : (comment?.content || ""),
        },
      })

      // 댓글 좋아요 모두 삭제 (실제 삭제)
      await tx.commentLike.deleteMany({
        where: { commentId },
      })

      return { deletedComment, hadReplies: replyCount > 0 }
    })

    // 작업 로깅
    if (user?.id && comment?.review?.id) {
      logCommentAction('delete', {
        userId: user.id,
        commentId,
        reviewId: comment.review.id,
        ipAddress,
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        message: result.hadReplies 
          ? '댓글이 삭제되었습니다. (답글이 있어 내용만 삭제됩니다)'
          : '댓글이 삭제되었습니다.',
        deletedAt: result.deletedComment.deletedAt,
      },
    })

  } catch (error) {
    logger.error('Comment deletion failed', { 
      commentId: (await params).id, 
      error: error instanceof Error ? error.message : 'Unknown error'
    })

    return NextResponse.json(
      {
        success: false,
        error: {
          errorType: 'INTERNAL_ERROR',
          message: '댓글 삭제 중 오류가 발생했습니다.',
        },
      },
      { status: 500 }
    )
  }
}
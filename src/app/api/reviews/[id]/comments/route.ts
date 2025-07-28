import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { 
  validateAuthSession, 
  validateReviewAccess, 
  validateReplyDepth,
  validateCommentRateLimit,
  sanitizeCommentContent,
  logCommentAction
} from '@/lib/comment-security'
import { 
  createCommentSchema, 
  listCommentsSchema
} from '@/lib/validations'
import { commentInclude } from '@/types/comment'
import { buildCommentTree, sortComments } from '@/lib/comment-utils'
import { logger } from '@/lib/logger'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

/**
 * GET /api/reviews/[id]/comments - 댓글 목록 조회
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id: reviewId } = await params
    const { searchParams } = new URL(request.url)

    // 쿼리 파라미터 검증
    const queryValidation = listCommentsSchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      sort: searchParams.get('sort'),
      parentId: searchParams.get('parentId'),
    })

    if (!queryValidation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'INVALID_PARAMS',
            message: '잘못된 요청 파라미터입니다.',
            details: queryValidation.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      )
    }

    const { page, limit, sort, parentId } = queryValidation.data

    // 독후감 존재 여부 확인
    const reviewValidation = await validateReviewAccess(reviewId)
    if (!reviewValidation.success) {
      return NextResponse.json(
        {
          success: false,
          error: reviewValidation.error,
        },
        { status: reviewValidation.error?.statusCode || 400 }
      )
    }

    // 현재 사용자 확인 (선택적)
    const authResult = await validateAuthSession()
    const currentUserId = authResult.success && authResult.user ? authResult.user.id : undefined

    // 댓글 조회 조건 설정
    const whereCondition: any = {
      reviewId,
      isDeleted: false,
    }

    // parentId 필터 적용
    if (parentId === 'null' || parentId === '') {
      whereCondition.parentId = null // 최상위 댓글만
    } else if (parentId) {
      whereCondition.parentId = parentId // 특정 부모 댓글의 답글만
    }

    // 페이지네이션 계산
    const skip = (page - 1) * limit

    // 댓글 조회
    const [comments, totalCount] = await Promise.all([
      prisma.comment.findMany({
        where: whereCondition,
        include: {
          ...commentInclude,
          likes: currentUserId ? {
            where: { userId: currentUserId },
            select: { id: true },
          } : false,
        },
        orderBy: sort === 'latest' 
          ? { createdAt: 'desc' }
          : sort === 'oldest' 
          ? { createdAt: 'asc' }
          : { createdAt: 'desc' }, // most_liked는 별도 처리
        skip,
        take: limit,
      }),
      prisma.comment.count({
        where: whereCondition,
      }),
    ])

    // 댓글 데이터 가공
    const processedComments = comments.map(comment => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      parentId: comment.parentId,
      depth: comment.depth,
      isDeleted: comment.isDeleted,
      deletedAt: comment.deletedAt,
      userId: comment.userId,
      reviewId: comment.reviewId,
      user: comment.user,
      replies: comment.replies?.map(reply => ({
        ...reply,
        isLiked: false, // replies에는 likes 정보가 포함되지 않음
        canEdit: currentUserId === reply.userId,
        canDelete: currentUserId === reply.userId || currentUserId === reviewValidation.review?.userId,
      })) || [],
      _count: comment._count,
      isLiked: currentUserId ? comment.likes?.length > 0 : false,
      canEdit: currentUserId === comment.userId,
      canDelete: currentUserId === comment.userId || currentUserId === reviewValidation.review?.userId,
      canReply: comment.depth === 0,
    }))

    // 좋아요순 정렬이 요청된 경우
    const finalComments = sort === 'most_liked' 
      ? sortComments(processedComments, 'most_liked')
      : processedComments

    // 트리 구조 생성 (parentId가 지정되지 않은 경우)
    const responseData = !parentId ? buildCommentTree(finalComments) : finalComments

    // 페이지네이션 정보
    const hasMore = skip + comments.length < totalCount
    const nextCursor = hasMore ? (page + 1).toString() : undefined

    return NextResponse.json({
      success: true,
      data: {
        comments: responseData,
        pagination: {
          page,
          limit,
          total: totalCount,
          hasMore,
          nextCursor,
        },
        meta: {
          sort,
          parentId: parentId || null,
          isAuthenticated: !!currentUserId,
        },
      },
    })

  } catch (error) {
    logger.error('Comment list retrieval failed', { 
      reviewId: (await params).id, 
      error: error instanceof Error ? error.message : 'Unknown error'
    })

    return NextResponse.json(
      {
        success: false,
        error: {
          errorType: 'INTERNAL_ERROR',
          message: '댓글 목록 조회 중 오류가 발생했습니다.',
        },
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/reviews/[id]/comments - 댓글 작성
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id: reviewId } = await params

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
    const validation = createCommentSchema.safeParse(body)

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

    const { content, parentId } = validation.data

    // 독후감 존재 여부 확인
    const reviewValidation = await validateReviewAccess(reviewId)
    if (!reviewValidation.success) {
      return NextResponse.json(
        {
          success: false,
          error: reviewValidation.error,
        },
        { status: reviewValidation.error?.statusCode || 400 }
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

    // 스팸 방지 - 댓글 작성 제한 확인
    if (!user?.id) {
      return NextResponse.json({
        success: false,
        error: { errorType: 'UNAUTHORIZED', message: '인증 정보가 없습니다.' }
      }, { status: 401 })
    }

    const rateLimitResult = await validateCommentRateLimit(user.id)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: rateLimitResult.error,
        },
        { status: rateLimitResult.error?.statusCode || 429 }
      )
    }

    // 대댓글인 경우 깊이 및 부모 댓글 검증
    let depth = 0
    if (parentId) {
      const replyValidation = await validateReplyDepth(parentId)
      if (!replyValidation.success) {
        return NextResponse.json(
          {
            success: false,
            error: replyValidation.error,
          },
          { status: replyValidation.error?.statusCode || 400 }
        )
      }
      depth = replyValidation.newDepth || 0
    }

    // 클라이언트 IP 주소 추출 (로깅용)
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown'

    // 댓글 생성
    const newComment = await prisma.comment.create({
      data: {
        content: sanitizedContent,
        userId: user.id,
        reviewId,
        parentId: parentId || null,
        depth,
      },
      include: {
        ...commentInclude,
        likes: {
          where: { userId: user.id },
          select: { id: true },
        },
      },
    })

    // 작업 로깅
    logCommentAction('create', {
      userId: user.id,
      commentId: newComment.id,
      reviewId,
      parentId,
      ipAddress,
    })

    // 응답 데이터 가공
    const responseComment = {
      id: newComment.id,
      content: newComment.content,
      createdAt: newComment.createdAt,
      updatedAt: newComment.updatedAt,
      parentId: newComment.parentId,
      depth: newComment.depth,
      isDeleted: newComment.isDeleted,
      deletedAt: newComment.deletedAt,
      userId: newComment.userId,
      reviewId: newComment.reviewId,
      user: newComment.user,
      replies: newComment.replies || [],
      _count: newComment._count,
      isLiked: false,
      canEdit: true,
      canDelete: true,
      canReply: newComment.depth === 0,
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          comment: responseComment,
          message: parentId ? '답글이 작성되었습니다.' : '댓글이 작성되었습니다.',
        },
      },
      { status: 201 }
    )

  } catch (error) {
    logger.error('Comment creation failed', { 
      reviewId: (await params).id, 
      error: error instanceof Error ? error.message : 'Unknown error'
    })

    return NextResponse.json(
      {
        success: false,
        error: {
          errorType: 'INTERNAL_ERROR',
          message: '댓글 작성 중 오류가 발생했습니다.',
        },
      },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { 
  updateReviewSchema,
  type UpdateReviewInput 
} from '@/lib/validations'

/**
 * 개별 독후감 API 라우트
 * - GET: 독후감 상세 조회
 * - PUT: 독후감 수정
 * - DELETE: 독후감 삭제
 */

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

/**
 * GET /api/reviews/[id] - 독후감 상세 조회
 */
export async function GET(
  request: NextRequest,
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

    // 현재 사용자 정보 (선택사항 - 좋아요 여부 확인용)
    const session = await auth()
    const currentUserId = session?.user?.id

    // 독후감 상세 정보 조회
    const review = await db.bookReview.findUnique({
      where: { id: reviewId },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            image: true,
            bio: true,
          },
        },
        book: {
          select: {
            id: true,
            title: true,
            authors: true,
            thumbnail: true,
            publisher: true,
            genre: true,
            pageCount: true,
            isbn: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
        // 현재 사용자의 좋아요 여부 확인
        ...(currentUserId ? {
          likes: {
            where: {
              userId: currentUserId,
            },
            select: {
              id: true,
            },
          },
        } : {}),
      },
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

    // 응답 데이터 포맷팅
    const formattedReview = {
      ...review,
      tags: JSON.parse(review.tags || '[]'),
      book: {
        ...review.book,
        authors: JSON.parse(review.book.authors || '[]'),
      },
      isLiked: currentUserId ? review.likes && review.likes.length > 0 : false,
      canEdit: currentUserId === review.userId,
      // likes 배열 제거 (isLiked로 대체)
      likes: undefined,
    }

    // 조회수 증가 (비동기로 처리하여 응답 속도에 영향 없음)
    db.bookReview.update({
      where: { id: reviewId },
      data: {
        // 조회수 필드가 있다면 증가
        // 현재 스키마에는 없으므로 생략
      },
    }).catch(() => {
      // 조회수 업데이트 실패는 무시
    })

    return NextResponse.json({
      success: true,
      data: {
        review: formattedReview,
      },
    })
  } catch (error) {
    console.error('Get review error:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          errorType: 'INTERNAL_ERROR',
          message: '독후감 조회 중 오류가 발생했습니다.',
        },
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/reviews/[id] - 독후감 수정
 */
export async function PUT(
  request: NextRequest,
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

    // 요청 데이터 파싱 및 검증
    const body = await request.json()
    const validationResult = updateReviewSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'VALIDATION_ERROR',
            message: '입력 데이터가 올바르지 않습니다.',
            details: validationResult.error.errors,
          },
        },
        { status: 400 }
      )
    }

    const data: UpdateReviewInput = validationResult.data

    // 기존 독후감 조회 및 권한 확인
    const existingReview = await db.bookReview.findUnique({
      where: { id: reviewId },
      select: {
        id: true,
        userId: true,
      },
    })

    if (!existingReview) {
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

    if (existingReview.userId !== session.user.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'FORBIDDEN',
            message: '본인의 독후감만 수정할 수 있습니다.',
          },
        },
        { status: 403 }
      )
    }

    // 독후감 수정
    const updatedData: any = {}
    
    if (data.title !== undefined) updatedData.title = data.title
    if (data.content !== undefined) updatedData.content = data.content
    if (data.isRecommended !== undefined) updatedData.isRecommended = data.isRecommended
    if (data.tags !== undefined) updatedData.tags = JSON.stringify(data.tags)
    if (data.purchaseLink !== undefined) updatedData.purchaseLink = data.purchaseLink || null

    const updatedReview = await db.bookReview.update({
      where: { id: reviewId },
      data: updatedData,
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            image: true,
          },
        },
        book: {
          select: {
            id: true,
            title: true,
            authors: true,
            thumbnail: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    })

    // 응답 데이터 포맷팅
    const formattedReview = {
      ...updatedReview,
      tags: JSON.parse(updatedReview.tags || '[]'),
      book: {
        ...updatedReview.book,
        authors: JSON.parse(updatedReview.book.authors || '[]'),
      },
    }

    return NextResponse.json({
      success: true,
      data: {
        review: formattedReview,
        message: '독후감이 성공적으로 수정되었습니다.',
      },
    })
  } catch (error) {
    console.error('Update review error:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          errorType: 'INTERNAL_ERROR',
          message: '독후감 수정 중 오류가 발생했습니다.',
        },
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/reviews/[id] - 독후감 삭제
 */
export async function DELETE(
  request: NextRequest,
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

    // 기존 독후감 조회 및 권한 확인
    const existingReview = await db.bookReview.findUnique({
      where: { id: reviewId },
      select: {
        id: true,
        userId: true,
        title: true,
      },
    })

    if (!existingReview) {
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

    if (existingReview.userId !== session.user.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'FORBIDDEN',
            message: '본인의 독후감만 삭제할 수 있습니다.',
          },
        },
        { status: 403 }
      )
    }

    // 독후감 삭제 (관련 데이터는 Cascade로 자동 삭제됨)
    await db.bookReview.delete({
      where: { id: reviewId },
    })

    return NextResponse.json({
      success: true,
      data: {
        message: '독후감이 성공적으로 삭제되었습니다.',
        deletedReview: {
          id: existingReview.id,
          title: existingReview.title,
        },
      },
    })
  } catch (error) {
    console.error('Delete review error:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          errorType: 'INTERNAL_ERROR',
          message: '독후감 삭제 중 오류가 발생했습니다.',
        },
      },
      { status: 500 }
    )
  }
}
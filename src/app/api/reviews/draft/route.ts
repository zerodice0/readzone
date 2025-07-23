import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { 
  reviewDraftSchema,
  type ReviewDraftInput 
} from '@/lib/validations'

/**
 * 독후감 임시저장 API 라우트
 * - POST: 새 임시저장 생성/업데이트
 * - GET: 사용자의 임시저장 목록 조회
 */

/**
 * POST /api/reviews/draft - 독후감 임시저장
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

    // 요청 데이터 파싱 및 검증
    const body = await request.json()
    const validationResult = reviewDraftSchema.safeParse(body)

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

    const data: ReviewDraftInput = validationResult.data

    // 도서 ID가 있는 경우 도서 존재 확인
    if (data.bookId) {
      const book = await db.book.findUnique({
        where: { id: data.bookId },
        select: { id: true },
      })

      if (!book) {
        return NextResponse.json(
          {
            success: false,
            error: {
              errorType: 'NOT_FOUND',
              message: '존재하지 않는 도서입니다.',
            },
          },
          { status: 404 }
        )
      }
    }

    // 기존 임시저장이 있는지 확인 (같은 도서에 대한 임시저장)
    const existingDraft = data.bookId 
      ? await db.reviewDraft.findFirst({
          where: {
            userId: session.user.id,
            bookId: data.bookId,
          },
        })
      : null

    let draft

    if (existingDraft) {
      // 기존 임시저장 업데이트
      draft = await db.reviewDraft.update({
        where: { id: existingDraft.id },
        data: {
          content: data.content,
          title: data.title,
          metadata: JSON.stringify(data.metadata),
          updatedAt: new Date(),
        },
        include: {
          book: {
            select: {
              id: true,
              title: true,
              authors: true,
              thumbnail: true,
            },
          },
        },
      })
    } else {
      // 새 임시저장 생성
      draft = await db.reviewDraft.create({
        data: {
          userId: session.user.id,
          bookId: data.bookId,
          content: data.content,
          title: data.title,
          metadata: JSON.stringify(data.metadata),
        },
        include: {
          book: data.bookId ? {
            select: {
              id: true,
              title: true,
              authors: true,
              thumbnail: true,
            },
          } : undefined,
        },
      })
    }

    // 응답 데이터 포맷팅
    const formattedDraft = {
      ...draft,
      metadata: JSON.parse(draft.metadata || '{}'),
      book: draft.book ? {
        ...draft.book,
        authors: JSON.parse(draft.book.authors || '[]'),
      } : null,
    }

    return NextResponse.json({
      success: true,
      data: {
        draft: formattedDraft,
        message: existingDraft ? '임시저장이 업데이트되었습니다.' : '임시저장이 생성되었습니다.',
      },
    })
  } catch (error) {
    console.error('Save draft error:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          errorType: 'INTERNAL_ERROR',
          message: '임시저장 중 오류가 발생했습니다.',
        },
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/reviews/draft - 사용자의 임시저장 목록 조회
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
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

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)

    // 사용자의 임시저장 목록 조회
    const [drafts, totalCount] = await Promise.all([
      db.reviewDraft.findMany({
        where: {
          userId: session.user.id,
        },
        include: {
          book: {
            select: {
              id: true,
              title: true,
              authors: true,
              thumbnail: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.reviewDraft.count({
        where: {
          userId: session.user.id,
        },
      }),
    ])

    // 응답 데이터 포맷팅
    const formattedDrafts = drafts.map(draft => ({
      ...draft,
      metadata: JSON.parse(draft.metadata || '{}'),
      book: draft.book ? {
        ...draft.book,
        authors: JSON.parse(draft.book.authors || '[]'),
      } : null,
      contentPreview: draft.content.slice(0, 200) + (draft.content.length > 200 ? '...' : ''),
    }))

    return NextResponse.json({
      success: true,
      data: {
        items: formattedDrafts,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNext: page * limit < totalCount,
          hasPrevious: page > 1,
        },
      },
    })
  } catch (error) {
    console.error('Get drafts error:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          errorType: 'INTERNAL_ERROR',
          message: '임시저장 목록 조회 중 오류가 발생했습니다.',
        },
      },
      { status: 500 }
    )
  }
}
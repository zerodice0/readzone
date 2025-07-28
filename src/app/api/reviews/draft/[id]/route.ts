import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

/**
 * 개별 독후감 임시저장 API 라우트
 * - GET: 특정 임시저장 조회
 * - DELETE: 임시저장 삭제
 */

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

/**
 * GET /api/reviews/draft/[id] - 특정 임시저장 조회
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id: draftId } = await params

    if (!draftId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'INVALID_PARAMS',
            message: '임시저장 ID가 필요합니다.',
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

    // 임시저장 조회
    const draft = await db.reviewDraft.findUnique({
      where: { id: draftId },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            authors: true,
            thumbnail: true,
            publisher: true,
          },
        },
      },
    })

    if (!draft) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'NOT_FOUND',
            message: '임시저장을 찾을 수 없습니다.',
          },
        },
        { status: 404 }
      )
    }

    // 권한 확인
    if (draft.userId !== session.user.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'FORBIDDEN',
            message: '본인의 임시저장만 조회할 수 있습니다.',
          },
        },
        { status: 403 }
      )
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
      },
    })
  } catch (error) {
    console.error('Get draft error:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          errorType: 'INTERNAL_ERROR',
          message: '임시저장 조회 중 오류가 발생했습니다.',
        },
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/reviews/draft/[id] - 임시저장 삭제
 */
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id: draftId } = await params

    if (!draftId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'INVALID_PARAMS',
            message: '임시저장 ID가 필요합니다.',
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

    // 기존 임시저장 조회 및 권한 확인
    const existingDraft = await db.reviewDraft.findUnique({
      where: { id: draftId },
      select: {
        id: true,
        userId: true,
        title: true,
      },
    })

    if (!existingDraft) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'NOT_FOUND',
            message: '임시저장을 찾을 수 없습니다.',
          },
        },
        { status: 404 }
      )
    }

    if (existingDraft.userId !== session.user.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'FORBIDDEN',
            message: '본인의 임시저장만 삭제할 수 있습니다.',
          },
        },
        { status: 403 }
      )
    }

    // 임시저장 삭제
    await db.reviewDraft.delete({
      where: { id: draftId },
    })

    return NextResponse.json({
      success: true,
      data: {
        message: '임시저장이 성공적으로 삭제되었습니다.',
        deletedDraft: {
          id: existingDraft.id,
          title: existingDraft.title,
        },
      },
    })
  } catch (error) {
    console.error('Delete draft error:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          errorType: 'INTERNAL_ERROR',
          message: '임시저장 삭제 중 오류가 발생했습니다.',
        },
      },
      { status: 500 }
    )
  }
}
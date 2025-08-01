import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { 
  reviewDraftInputSchema,
  validateDraftContent,
  DRAFT_DEFAULTS,
  type ReviewDraftInput
} from '@/lib/validations/draft'
import { 
  OptimizedJsonProcessor,
  formatDraftForResponse
} from '@/lib/performance/content-processor'
import { performanceMonitor } from '@/lib/monitoring/performance-monitor'

/**
 * 개별 독후감 임시저장 API 라우트 - 성능 최적화 버전
 * - GET: 특정 임시저장 조회 및 자동 도서 동기화
 * - PUT: 임시저장 업데이트 (낙관적 잠금)  
 * - DELETE: 임시저장 삭제 (soft/hard 옵션)
 */

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

/**
 * GET /api/reviews/draft/[id] - 특정 임시저장 조회 및 자동 도서 동기화
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  return performanceMonitor.measureOperation('draft_restore', async () => {
  try {
    const { id: draftId } = await params

    if (!draftId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'VALIDATION_ERROR',
            message: 'Draft ID가 필요합니다.',
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

    // Draft 조회 (최적화된 필드 선택 + 소유권 확인)
    const draft = await db.reviewDraft.findFirst({
      where: {
        id: draftId,
        userId: session.user.id, // 소유권 확인을 쿼리에 포함
      },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            authors: true,
            thumbnail: true,
            isbn13: true,
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
            message: '존재하지 않는 임시저장입니다.',
          },
        },
        { status: 404 }
      )
    }

    // 자동 도서 동기화 로직 (PRD 요구사항) - Enhanced
    let syncedDraft = draft
    let bookSynced = false

    if (draft.bookData && !draft.bookId) {
      // Use enhanced sync service for better performance and race condition prevention
      const { bookSyncService } = await import('@/lib/book-sync-service')
      const syncResult = await bookSyncService.syncDraftBook(draft.id, session.user.id)
      
      if (syncResult.success && syncResult.action === 'synced' && syncResult.bookId) {
        // Refetch draft with updated book information
        syncedDraft = await db.reviewDraft.findUnique({
          where: { id: draft.id },
          include: {
            book: {
              select: {
                id: true,
                title: true,
                authors: true,
                thumbnail: true,
                isbn13: true,
                publisher: true,
              },
            },
          },
        }) || draft

        bookSynced = true
      }
    }

    // lastAccessed 업데이트 (비동기, 성능 최적화)
    if (!bookSynced) {
      db.reviewDraft.update({
        where: { id: draft.id },
        data: { lastAccessed: new Date() },
      }).catch(console.error) // 실패해도 응답에 영향 없음
    }

    // 응답 데이터 포맷팅 (성능 최적화)
    const formattedDraft = formatDraftForResponse(syncedDraft)

    return NextResponse.json({
      success: true,
      data: {
        draft: formattedDraft,
        synced: bookSynced,
        message: bookSynced 
          ? '도서가 자동으로 동기화되었습니다.' 
          : '임시저장을 불러왔습니다.',
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
  })
}

/**
 * PUT /api/reviews/draft/[id] - Draft 업데이트 (낙관적 잠금)
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id: draftId } = await params

    if (!draftId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'VALIDATION_ERROR',
            message: 'Draft ID가 필요합니다.',
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
    const validationResult = reviewDraftInputSchema.safeParse(body)

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
    const expectedVersion = body.expectedVersion || 1

    // 콘텐츠 유효성 검증
    const contentValidation = validateDraftContent(data.content)
    if (!contentValidation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'VALIDATION_ERROR',
            message: contentValidation.textLength < 10 
              ? '내용을 10자 이상 입력해주세요.' 
              : '내용이 너무 깁니다 (최대 1MB)',
          },
        },
        { status: 400 }
      )
    }

    // 도서 존재 확인 (bookId가 있는 경우, 병렬 처리)
    const bookValidationPromise = data.bookId 
      ? db.book.findUnique({
          where: { id: data.bookId },
          select: { id: true },
        })
      : Promise.resolve(null)

    const [book] = await Promise.all([bookValidationPromise])

    if (data.bookId && !book) {
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

    // 낙관적 잠금으로 업데이트
    try {
      const now = new Date()
      const expiresAt = data.expiresAt || new Date(now.getTime() + DRAFT_DEFAULTS.EXPIRY_DAYS * 24 * 60 * 60 * 1000)

      const updatedDraft = await db.reviewDraft.update({
        where: {
          id: draftId,
          userId: session.user.id, // 소유권 확인
          version: expectedVersion, // 낙관적 잠금
        },
        data: {
          content: data.content,
          title: data.title,
          bookId: data.bookId,
          metadata: OptimizedJsonProcessor.stringify(data.metadata),
          bookData: data.bookData,
          status: data.status || 'DRAFT',
          version: { increment: 1 }, // 버전 증가
          expiresAt,
          lastAccessed: now,
          updatedAt: now,
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

      // 감사 로그 생성 (비동기로 성능 최적화)
      setImmediate(() => {
        db.reviewDraftAudit.create({
          data: {
            draftId: updatedDraft.id,
            userId: session.user.id,
            action: 'UPDATED',
            newData: JSON.stringify({
              content: data.content,
              title: data.title,
              version: updatedDraft.version,
            }),
          },
        }).catch(error => {
          console.error('Async audit log error (PUT):', error)
        })
      })

      // 응답 데이터 포맷팅 (성능 최적화)
      const formattedDraft = formatDraftForResponse(updatedDraft)

      return NextResponse.json({
        success: true,
        data: {
          draft: formattedDraft,
          message: '임시저장이 업데이트되었습니다.',
        },
      })
    } catch (error: any) {
      // 낙관적 잠금 충돌 감지
      if (error.code === 'P2025' || error.message?.includes('version')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              errorType: 'CONFLICT',
              message: '다른 곳에서 수정된 내용이 있습니다. 새로고침 후 다시 시도해주세요.',
            },
          },
          { status: 409 }
        )
      }
      throw error
    }
  } catch (error) {
    console.error('Update draft error:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          errorType: 'INTERNAL_ERROR',
          message: '임시저장 업데이트 중 오류가 발생했습니다.',
        },
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/reviews/draft/[id] - Draft 삭제 (soft/hard 옵션)
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id: draftId } = await params

    if (!draftId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'VALIDATION_ERROR',
            message: 'Draft ID가 필요합니다.',
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

    // 쿼리 파라미터로 삭제 타입 확인
    const { searchParams } = new URL(request.url)
    const deleteType = searchParams.get('type') || 'soft' // soft, hard
    const permanent = deleteType === 'hard'

    if (permanent) {
      // Hard delete: 완전 삭제
      const deletedDraft = await db.reviewDraft.delete({
        where: {
          id: draftId,
          userId: session.user.id, // 소유권 확인
        },
      })

      // 감사 로그 생성 (비동기로 성능 최적화)
      setImmediate(() => {
        db.reviewDraftAudit.create({
          data: {
            draftId: deletedDraft.id,
            userId: session.user.id,
            action: 'DELETED',
            oldData: JSON.stringify({
              title: deletedDraft.title,
              status: deletedDraft.status,
            }),
          },
        }).catch(error => {
          console.error('Async audit log error (DELETE-HARD):', error)
        })
      })

      return NextResponse.json({
        success: true,
        data: {
          message: '임시저장이 완전히 삭제되었습니다.',
          deleted: true,
          permanent: true,
        },
      })
    } else {
      // Soft delete: 상태만 변경
      const updatedDraft = await db.reviewDraft.update({
        where: {
          id: draftId,
          userId: session.user.id, // 소유권 확인
        },
        data: {
          status: 'ABANDONED',
          lastAccessed: new Date(),
        },
      })

      // 감사 로그 생성 (비동기로 성능 최적화)
      setImmediate(() => {
        db.reviewDraftAudit.create({
          data: {
            draftId: updatedDraft.id,
            userId: session.user.id,
            action: 'DELETED',
            oldData: JSON.stringify({ status: 'DRAFT' }),
            newData: JSON.stringify({ status: 'ABANDONED' }),
          },
        }).catch(error => {
          console.error('Async audit log error (DELETE-SOFT):', error)
        })
      })

      return NextResponse.json({
        success: true,
        data: {
          message: '임시저장이 삭제되었습니다.',
          deleted: true,
          permanent: false,
        },
      })
    }
  } catch (error: any) {
    // Draft가 존재하지 않는 경우
    if (error.code === 'P2025') {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'NOT_FOUND',
            message: '존재하지 않는 임시저장입니다.',
          },
        },
        { status: 404 }
      )
    }

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
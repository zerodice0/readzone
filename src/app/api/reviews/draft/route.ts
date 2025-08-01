import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { 
  reviewDraftInputSchema,
  draftQuerySchema,
  validateDraftContent,
  DRAFT_DEFAULTS,
  type ReviewDraftInput,
} from '@/lib/validations/draft'
import { 
  OptimizedJsonProcessor,
  formatDraftForResponse
} from '@/lib/performance/content-processor'
import { performanceMonitor } from '@/lib/monitoring/performance-monitor'

/**
 * 독후감 임시저장 API 라우트
 * - POST: 새 임시저장 생성/업데이트
 * - GET: 사용자의 임시저장 목록 조회
 */

/**
 * POST /api/reviews/draft - 독후감 임시저장
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  return performanceMonitor.measureOperation('draft_save', async () => {
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

    // 도서 ID가 있는 경우 도서 존재 확인 (병렬 처리 최적화)
    const bookValidationPromise = data.bookId 
      ? db.book.findUnique({
          where: { id: data.bookId },
          select: { id: true },
        })
      : Promise.resolve(null)

    // 기존 Draft 확인과 도서 검증을 병렬 처리
    const [book, existingDraft] = await Promise.all([
      bookValidationPromise,
      data.bookId 
        ? db.reviewDraft.findFirst({
            where: {
              userId: session.user.id,
              bookId: data.bookId,
              status: 'DRAFT', // 활성 Draft만 조회
            },
            select: { id: true, version: true }, // 필요한 필드만 선택
          })
        : null
    ])

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

    // 공통 데이터 준비
    const now = new Date()
    const expiresAt = data.expiresAt || new Date(now.getTime() + DRAFT_DEFAULTS.EXPIRY_DAYS * 24 * 60 * 60 * 1000)
    const expectedVersion = (data as any).expectedVersion || existingDraft?.version || 1
    
    let draft: any
    
    try {
      if (existingDraft) {
        // 기존 임시저장 업데이트 (낙관적 잠금 적용)
        draft = await db.reviewDraft.update({
          where: { 
            id: existingDraft.id,
            version: expectedVersion // 낙관적 잠금
          },
          data: {
            content: data.content,
            title: data.title,
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
              draftId: draft.id,
              userId: session.user.id,
              action: 'UPDATED',
              newData: JSON.stringify({
                content: data.content,
                title: data.title,
                version: draft.version
              })
            }
          }).catch(error => {
            console.error('Async audit log error (UPDATE):', error)
          })
        })
      } else {
        // 새 임시저장 생성
        draft = await db.reviewDraft.create({
          data: {
            userId: session.user.id,
            bookId: data.bookId,
            content: data.content,
            title: data.title,
            metadata: OptimizedJsonProcessor.stringify(data.metadata),
            bookData: data.bookData,
            status: 'DRAFT',
            version: 1,
            expiresAt,
            lastAccessed: now,
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
        
        // 감사 로그 생성 (비동기로 성능 최적화)
        setImmediate(() => {
          db.reviewDraftAudit.create({
            data: {
              draftId: draft.id,
              userId: session.user.id,
              action: 'CREATED',
              newData: JSON.stringify({
                bookId: data.bookId,
                title: data.title,
                contentLength: data.content.length
              })
            }
          }).catch(error => {
            console.error('Async audit log error (CREATE):', error)
          })
        })
      }
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

    // 응답 데이터 포맷팅 (성능 최적화)
    const formattedDraft = formatDraftForResponse(draft)

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
  })
}

/**
 * GET /api/reviews/draft - 사용자의 임시저장 목록 조회
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  return performanceMonitor.measureOperation('draft_list', async () => {
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

    // 쿼리 파라미터 검증
    const { searchParams } = new URL(request.url)
    const queryValidation = draftQuerySchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      status: searchParams.get('status'),
      includeExpired: searchParams.get('includeExpired')
    })
    
    if (!queryValidation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'VALIDATION_ERROR',
            message: '잘못된 쿼리 파라미터입니다.',
            details: queryValidation.error.errors,
          },
        },
        { status: 400 }
      )
    }
    
    const { page, limit, status, includeExpired } = queryValidation.data

    // 성능 최적화된 쿼리 조건
    const whereCondition: any = {
      userId: session.user.id,
    }
    
    // 상태 필터링
    if (status) {
      whereCondition.status = status
    } else if (!includeExpired) {
      // 기본적으로 만료된 Draft 제외
      whereCondition.OR = [
        { status: { not: 'EXPIRED' } },
        { expiresAt: { gt: new Date() } }
      ]
    }
    
    // 최적화된 병렬 쿼리 (인덱스 활용)
    const [drafts, totalCount] = await Promise.all([
      db.reviewDraft.findMany({
        where: whereCondition,
        select: {
          id: true,
          title: true,
          content: true,
          status: true,
          version: true,
          expiresAt: true,
          lastAccessed: true,
          createdAt: true,
          updatedAt: true,
          metadata: true,
          book: {
            select: {
              id: true,
              title: true,
              authors: true,
              thumbnail: true,
            },
          },
        },
        orderBy: [
          { updatedAt: 'desc' },
          { createdAt: 'desc' } // 보조 정렬
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.reviewDraft.count({
        where: whereCondition,
      }),
    ])

    // 응답 데이터 포맷팅 (고성능 처리)
    const formattedDrafts = drafts.map(draft => {
      const formattedDraft = formatDraftForResponse(draft)
      
      return {
        ...formattedDraft,
        // 만료 상태 계산
        isExpired: draft.expiresAt < new Date(),
        daysUntilExpiry: Math.ceil((draft.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      }
    })

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
        // 추가 메타데이터
        summary: {
          totalDrafts: totalCount,
          activeDrafts: formattedDrafts.filter(d => d.status === 'DRAFT').length,
          expiredDrafts: formattedDrafts.filter(d => d.isExpired).length,
        }
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
  })
}
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { 
  createReviewSchema, 
  listReviewsSchema,
  type CreateReviewInput,
  type ListReviewsQuery 
} from '@/lib/validations'

/**
 * 독후감 API 라우트
 * - POST: 새 독후감 생성
 * - GET: 독후감 목록 조회 (필터링, 정렬, 페이지네이션)
 */

/**
 * POST /api/reviews - 새 독후감 생성
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
    const validationResult = createReviewSchema.safeParse(body)

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

    const data: CreateReviewInput = validationResult.data

    // 임시 도서 ID 확인 (temp_로 시작하는 경우)
    const isTempBook = data.bookId.startsWith('temp_')
    
    // 트랜잭션으로 도서와 독후감 동시 처리
    const result = await db.$transaction(async (tx) => {
      let finalBookId = data.bookId
      
      if (isTempBook) {
        // 임시 도서인 경우: 카카오 데이터로 새 도서 생성
        const kakaoData = (data as any)._kakaoData
        if (!kakaoData) {
          throw new Error('임시 도서에 대한 카카오 데이터가 없습니다.')
        }

        // 중복 도서 확인 (제목 + 첫 번째 저자 조합)
        const existingBook = await tx.book.findFirst({
          where: {
            title: kakaoData.title.trim(),
            authors: {
              contains: kakaoData.authors[0]?.trim()
            }
          }
        })

        if (existingBook) {
          // 이미 존재하는 도서 사용
          finalBookId = existingBook.id
        } else {
          // 새 도서 생성
          const newBook = await tx.book.create({
            data: {
              title: kakaoData.title.trim(),
              authors: JSON.stringify(kakaoData.authors.map((author: string) => author.trim())),
              publisher: kakaoData.publisher?.trim() || null,
              genre: kakaoData.genre?.trim() || null,
              thumbnail: kakaoData.thumbnail || null,
              isbn: kakaoData.isbn || null,
              isManualEntry: false
            }
          })
          finalBookId = newBook.id
        }
      } else {
        // 기존 도서 존재 확인
        const book = await tx.book.findUnique({
          where: { id: data.bookId },
          select: { id: true, title: true },
        })

        if (!book) {
          throw new Error('존재하지 않는 도서입니다.')
        }
      }

      // 중복 독후감 확인
      const existingReview = await tx.bookReview.findFirst({
        where: {
          userId: session.user.id,
          bookId: finalBookId,
        },
        select: { id: true },
      })

      if (existingReview) {
        throw new Error('이미 해당 도서에 대한 독후감을 작성하셨습니다.')
      }

      // 독후감 생성
      return await tx.bookReview.create({
        data: {
          title: data.title,
          content: data.content,
          isRecommended: data.isRecommended,
          tags: JSON.stringify(data.tags), // SQLite에서는 JSON 문자열로 저장
          purchaseLink: data.purchaseLink || null,
          userId: session.user.id,
          bookId: finalBookId, // 트랜잭션에서 결정된 최종 도서 ID 사용
        },
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
    })

    // 응답 데이터 포맷팅
    const formattedReview = {
      ...result,
      tags: JSON.parse(result.tags || '[]'),
      book: {
        ...result.book,
        authors: JSON.parse(result.book.authors || '[]'),
      },
    }

    return NextResponse.json({
      success: true,
      data: {
        review: formattedReview,
        message: '독후감이 성공적으로 작성되었습니다.',
      },
    })
  } catch (error) {
    console.error('Create review error:', error)

    // 에러 타입에 따른 적절한 응답
    if (error instanceof Error) {
      if (error.message.includes('이미 해당 도서에 대한 독후감을 작성하셨습니다')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              errorType: 'DUPLICATE_ENTRY',
              message: error.message,
            },
          },
          { status: 409 }
        )
      }
      
      if (error.message.includes('존재하지 않는 도서입니다') || 
          error.message.includes('임시 도서에 대한 카카오 데이터가 없습니다')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              errorType: 'NOT_FOUND',
              message: error.message,
            },
          },
          { status: 404 }
        )
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          errorType: 'INTERNAL_ERROR',
          message: '독후감 작성 중 오류가 발생했습니다.',
        },
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/reviews - 독후감 목록 조회
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    
    // 쿼리 파라미터 파싱 및 검증
    const queryData = {
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      userId: searchParams.get('userId') || undefined,
      bookId: searchParams.get('bookId') || undefined,
      tags: searchParams.get('tags') || undefined,
      sort: searchParams.get('sort') || undefined,
      search: searchParams.get('search') || undefined,
    }

    const validationResult = listReviewsSchema.safeParse(queryData)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'VALIDATION_ERROR',
            message: '쿼리 파라미터가 올바르지 않습니다.',
            details: validationResult.error.errors,
          },
        },
        { status: 400 }
      )
    }

    const query: ListReviewsQuery = validationResult.data

    // 동적 WHERE 조건 구성
    const whereConditions: any = {}

    if (query.userId) {
      whereConditions.userId = query.userId
    }

    if (query.bookId) {
      whereConditions.bookId = query.bookId
    }

    if (query.search) {
      whereConditions.OR = [
        {
          title: {
            contains: query.search,
            mode: 'insensitive',
          },
        },
        {
          content: {
            contains: query.search,
            mode: 'insensitive',
          },
        },
      ]
    }

    if (query.tags) {
      const tagArray = query.tags.split(',').map(tag => tag.trim())
      // SQLite에서 JSON 검색 - 각 태그가 포함되어 있는지 확인
      whereConditions.AND = tagArray.map(tag => ({
        tags: {
          contains: tag,
        },
      }))
    }

    // 정렬 조건 설정
    let orderBy: any = { createdAt: 'desc' } // 기본값: 최신순

    switch (query.sort) {
      case 'popular':
        orderBy = [
          { likes: { _count: 'desc' } },
          { comments: { _count: 'desc' } },
          { createdAt: 'desc' },
        ]
        break
      case 'recommended':
        orderBy = [
          { isRecommended: 'desc' },
          { createdAt: 'desc' },
        ]
        break
      case 'latest':
      default:
        orderBy = { createdAt: 'desc' }
        break
    }

    // 독후감 목록과 총 개수 조회
    const [reviews, totalCount] = await Promise.all([
      db.bookReview.findMany({
        where: whereConditions,
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
        orderBy,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      db.bookReview.count({
        where: whereConditions,
      }),
    ])

    // 응답 데이터 포맷팅
    const formattedReviews = reviews.map(review => ({
      ...review,
      tags: JSON.parse(review.tags || '[]'),
      book: {
        ...review.book,
        authors: JSON.parse(review.book.authors || '[]'),
      },
    }))

    // 통계 정보 계산
    const recommendedCount = reviews.filter(r => r.isRecommended).length
    const stats = {
      total: totalCount,
      recommendedCount,
      notRecommendedCount: reviews.length - recommendedCount,
      recommendationRate: reviews.length > 0 ? (recommendedCount / reviews.length) * 100 : 0,
    }

    return NextResponse.json({
      success: true,
      data: {
        items: formattedReviews,
        pagination: {
          page: query.page,
          limit: query.limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / query.limit),
          hasNext: query.page * query.limit < totalCount,
          hasPrevious: query.page > 1,
        },
        stats,
        filters: {
          userId: query.userId,
          bookId: query.bookId,
          tags: query.tags?.split(',').map(tag => tag.trim()) || [],
          sort: query.sort,
          search: query.search,
        },
      },
    })
  } catch (error) {
    console.error('List reviews error:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          errorType: 'INTERNAL_ERROR',
          message: '독후감 목록 조회 중 오류가 발생했습니다.',
        },
      },
      { status: 500 }
    )
  }
}
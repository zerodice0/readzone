import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * 도서별 독후감 목록 조회 API
 * GET /api/books/[id]/reviews?page=1&limit=10
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const bookId = params.id
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    // 도서 존재 확인
    const book = await db.book.findUnique({
      where: { id: bookId }
    })

    if (!book) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'NOT_FOUND',
            message: '도서를 찾을 수 없습니다.'
          }
        },
        { status: 404 }
      )
    }

    // 독후감 목록 조회
    const [reviews, total] = await Promise.all([
      db.bookReview.findMany({
        where: { bookId },
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              image: true
            }
          },
          _count: {
            select: {
              likes: true,
              comments: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: (page - 1) * limit,
        take: limit
      }),
      db.bookReview.count({
        where: { bookId }
      })
    ])

    // 추천/비추천 통계
    const recommendCount = reviews.filter(r => r.isRecommended).length
    const recommendationRate = reviews.length > 0 
      ? (recommendCount / reviews.length) * 100 
      : 0

    return NextResponse.json({
      success: true,
      data: {
        items: reviews,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        stats: {
          total,
          recommendCount,
          notRecommendCount: reviews.length - recommendCount,
          recommendationRate
        }
      }
    })

  } catch (error) {
    console.error('Book reviews list error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: {
          errorType: 'INTERNAL_ERROR',
          message: '독후감 목록 조회 중 오류가 발생했습니다.'
        }
      },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { dbModelToBookData } from '@/lib/book-utils'

/**
 * 도서 상세 정보 조회 API
 * GET /api/books/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'INVALID_PARAMS',
            message: '도서 ID가 필요합니다.'
          }
        },
        { status: 400 }
      )
    }

    // 도서 상세 정보 조회 (관련 리뷰, 의견 포함)
    const book = await db.book.findUnique({
      where: { id },
      include: {
        reviews: {
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
          take: 20 // 최신 20개만
        },
        opinions: {
          include: {
            user: {
              select: {
                id: true,
                nickname: true,
                image: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 50 // 최신 50개만
        },
        _count: {
          select: {
            reviews: true,
            opinions: true
          }
        }
      }
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

    // 통계 계산
    const recommendationCount = book.opinions.filter(opinion => opinion.isRecommended).length
    const recommendationRate = book.opinions.length > 0 
      ? (recommendationCount / book.opinions.length) * 100 
      : 0

    // 최근 활동
    const recentActivity = book.reviews.length > 0 || book.opinions.length > 0
      ? new Date(Math.max(
          ...book.reviews.map(r => r.createdAt.getTime()),
          ...book.opinions.map(o => o.createdAt.getTime())
        ))
      : book.createdAt

    // 태그 추출 (리뷰에서)
    const allTags: string[] = []
    book.reviews.forEach(review => {
      try {
        const tags = JSON.parse(review.tags || '[]')
        allTags.push(...tags)
      } catch {
        // tags가 JSON이 아닌 경우 무시
      }
    })

    // 인기 태그 (상위 10개)
    const tagCounts = allTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const topTags = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([tag]) => tag)

    // 응답 데이터 구성
    const bookData = dbModelToBookData(book)
    const response = {
      ...bookData,
      reviews: book.reviews,
      opinions: book.opinions,
      stats: {
        totalReviews: book._count.reviews,
        totalOpinions: book._count.opinions,
        recommendationRate,
        topTags,
        recentActivity
      }
    }

    return NextResponse.json({
      success: true,
      data: response
    })

  } catch (error) {
    console.error('Book detail API error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: {
          errorType: 'INTERNAL_ERROR',
          message: '도서 정보 조회 중 오류가 발생했습니다.'
        }
      },
      { status: 500 }
    )
  }
}
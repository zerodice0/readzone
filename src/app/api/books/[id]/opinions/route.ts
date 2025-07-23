import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

/**
 * 도서 의견 작성 API
 * POST /api/books/[id]/opinions
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // 인증 확인
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'UNAUTHORIZED',
            message: '로그인이 필요합니다.'
          }
        },
        { status: 401 }
      )
    }

    const { id: bookId } = await params
    const body = await request.json()
    const { content, isRecommended } = body

    // 입력 검증
    if (!content?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'INVALID_PARAMS',
            message: '의견 내용이 필요합니다.'
          }
        },
        { status: 400 }
      )
    }

    if (content.length > 280) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'INVALID_PARAMS',
            message: '의견은 280자 이내로 작성해주세요.'
          }
        },
        { status: 400 }
      )
    }

    if (typeof isRecommended !== 'boolean') {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'INVALID_PARAMS',
            message: '추천/비추천을 선택해주세요.'
          }
        },
        { status: 400 }
      )
    }

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

    // 기존 의견 확인 (한 사용자당 한 도서에 하나의 의견만)
    const existingOpinion = await db.bookOpinion.findUnique({
      where: {
        userId_bookId: {
          userId: session.user.id,
          bookId
        }
      }
    })

    let opinion
    if (existingOpinion) {
      // 기존 의견 업데이트
      opinion = await db.bookOpinion.update({
        where: { id: existingOpinion.id },
        data: {
          content: content.trim(),
          isRecommended
        },
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              image: true
            }
          }
        }
      })
    } else {
      // 새 의견 작성
      opinion = await db.bookOpinion.create({
        data: {
          content: content.trim(),
          isRecommended,
          userId: session.user.id,
          bookId
        },
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              image: true
            }
          }
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: opinion,
      message: existingOpinion ? '의견이 수정되었습니다.' : '의견이 작성되었습니다.'
    })

  } catch (error) {
    console.error('Opinion create error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: {
          errorType: 'INTERNAL_ERROR',
          message: '의견 작성 중 오류가 발생했습니다.'
        }
      },
      { status: 500 }
    )
  }
}

/**
 * 도서 의견 목록 조회 API
 * GET /api/books/[id]/opinions?page=1&limit=20
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: bookId } = await params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

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

    // 의견 목록 조회
    const [opinions, total] = await Promise.all([
      db.bookOpinion.findMany({
        where: { bookId },
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
        skip: (page - 1) * limit,
        take: limit
      }),
      db.bookOpinion.count({
        where: { bookId }
      })
    ])

    // 추천/비추천 통계
    const recommendCount = opinions.filter(o => o.isRecommended).length
    const recommendationRate = opinions.length > 0 
      ? (recommendCount / opinions.length) * 100 
      : 0

    return NextResponse.json({
      success: true,
      data: {
        items: opinions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        stats: {
          total,
          recommendCount,
          notRecommendCount: opinions.length - recommendCount,
          recommendationRate
        }
      }
    })

  } catch (error) {
    console.error('Opinions list error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: {
          errorType: 'INTERNAL_ERROR',
          message: '의견 목록 조회 중 오류가 발생했습니다.'
        }
      },
      { status: 500 }
    )
  }
}
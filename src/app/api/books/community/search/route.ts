import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * 커뮤니티 도서 검색 API 엔드포인트
 * GET /api/books/community/search?q=검색어&page=1&limit=10
 * 
 * 다른 사용자들이 등록한 도서들을 검색합니다.
 * 선택 횟수가 많은 도서를 우선 표시합니다.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    
    // 검색 파라미터 추출
    const query = searchParams.get('q')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    // 필수 파라미터 검증
    if (!query) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'INVALID_PARAMS',
            message: '검색어가 필요합니다. (q 파라미터 사용)'
          }
        },
        { status: 400 }
      )
    }

    // 파라미터 범위 검증
    if (page < 1 || page > 50) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'INVALID_PARAMS',
            message: '페이지 번호는 1-50 사이여야 합니다.'
          }
        },
        { status: 400 }
      )
    }

    if (limit < 1 || limit > 50) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'INVALID_PARAMS',
            message: '페이지 크기는 1-50 사이여야 합니다.'
          }
        },
        { status: 400 }
      )
    }

    // 검색 조건 설정 (제목, 저자 검색)
    const whereCondition = {
      OR: [
        {
          title: {
            contains: query.trim(),
            mode: 'insensitive' as const
          }
        },
        {
          authors: {
            contains: query.trim(),
            mode: 'insensitive' as const
          }
        }
      ]
    }
    
    // 전체 개수 조회 (페이지네이션을 위해)
    const totalCount = await prisma.book.count({
      where: whereCondition
    })
    
    // 도서 조회 (선택 횟수 기준 정렬)
    const books = await prisma.book.findMany({
      where: whereCondition,
      include: {
        _count: {
          select: {
            reviews: true // 리뷰 수로 인기도 측정
          }
        }
      },
      take: limit,
      skip: (page - 1) * limit,
      orderBy: [
        {
          reviews: {
            _count: 'desc' // 리뷰가 많은 도서 우선
          }
        },
        {
          createdAt: 'desc' // 최신순
        }
      ]
    })

    // 응답 데이터 포맷팅
    const formattedBooks = books.map(book => ({
      id: book.id,
      title: book.title,
      authors: JSON.parse(book.authors),
      publisher: book.publisher,
      genre: book.genre,
      thumbnail: book.thumbnail,
      isbn: book.isbn,
      isManualEntry: book.isManualEntry,
      selectionCount: book._count.reviews, // 선택 횟수 정보 추가
      communityBook: true // 커뮤니티 도서임을 명시
    }))

    return NextResponse.json({
      success: true,
      data: formattedBooks,
      pagination: {
        currentPage: page,
        pageSize: limit,
        totalCount,
        isEnd: books.length < limit || (page * limit) >= totalCount
      }
    })

  } catch (error) {
    console.error('Community book search error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: {
          errorType: 'INTERNAL_ERROR',
          message: '커뮤니티 도서 검색 중 오류가 발생했습니다.'
        }
      },
      { status: 500 }
    )
  }
}
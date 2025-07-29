import { NextRequest, NextResponse } from 'next/server'
import { getBookAPI } from '@/lib/book-api'
import type { KakaoBookSearchParams } from '@/types/kakao'

/**
 * 도서 검색 API 엔드포인트
 * GET /api/books/search?query=검색어&page=1&size=10&sort=accuracy
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    
    // 검색 파라미터 추출 (q 또는 query 파라미터 지원)
    const query = searchParams.get('query') || searchParams.get('q')
    const page = parseInt(searchParams.get('page') || '1')
    const size = parseInt(searchParams.get('size') || searchParams.get('limit') || '10')
    const sort = searchParams.get('sort') as 'accuracy' | 'latest' || 'accuracy'
    const source = searchParams.get('source') // kakao 소스 지원

    // 필수 파라미터 검증
    if (!query) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'INVALID_PARAMS',
            message: '검색어가 필요합니다. (q 또는 query 파라미터 사용)'
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

    if (size < 1 || size > 50) {
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

    // 검색 실행 (소스에 따른 분기)
    let result: { success: boolean; data?: any; error?: any; usage?: any; meta?: { totalCount: number; isEnd: boolean } }

    if (source === 'kakao') {
      // 카카오 API 검색
      const bookAPI = getBookAPI()
      const bookSearchParams: KakaoBookSearchParams = {
        query: query.trim(),
        page,
        size,
        sort
      }
      result = await bookAPI.searchBooks(bookSearchParams)
    } else {
      // DB 검색 (기본값)
      try {
        const { prisma } = await import('@/lib/db')
        
        // 검색 조건 설정
        const whereCondition = {
          OR: [
            {
              title: {
                contains: query.trim()
              }
            },
            {
              authors: {
                contains: query.trim()
              }
            }
          ]
        }
        
        // 전체 개수 조회 (페이지네이션을 위해)
        const totalCount = await prisma.book.count({
          where: whereCondition
        })
        
        // 도서 조회
        const books = await prisma.book.findMany({
          where: whereCondition,
          take: size,
          skip: (page - 1) * size,
          orderBy: {
            createdAt: 'desc'
          }
        })

        const formattedBooks = books.map(book => ({
          id: book.id,
          title: book.title,
          authors: JSON.parse(book.authors),
          publisher: book.publisher,
          genre: book.genre,
          thumbnail: book.thumbnail,
          isbn: book.isbn,
          isManualEntry: book.isManualEntry
        }))

        result = {
          success: true,
          data: formattedBooks,
          meta: {
            totalCount,
            isEnd: books.length < size || (page * size) >= totalCount
          }
        }
      } catch (error) {
        console.error('DB search error:', error)
        return NextResponse.json(
          {
            success: false,
            error: {
              errorType: 'DB_ERROR',
              message: 'DB 검색 중 오류가 발생했습니다.'
            }
          },
          { status: 500 }
        )
      }
    }

    // API 응답 처리
    if (!result.success) {
      const statusCode = getErrorStatusCode(result.error?.errorType)
      
      return NextResponse.json(
        {
          success: false,
          error: result.error
        },
        { status: statusCode }
      )
    }

    // 성공 응답 (정규화된 구조)
    if (source === 'kakao') {
      const books = result.data?.documents || []
      return NextResponse.json({
        success: true,
        data: books, // documents 배열을 직접 반환
        usage: result.usage,
        pagination: {
          currentPage: page,
          pageSize: size,
          totalCount: result.data?.meta.total_count || 0,
          isEnd: result.data?.meta.is_end || true
        }
      })
    } else {
      // DB 검색 응답
      return NextResponse.json({
        success: true,
        data: result.data,
        pagination: {
          currentPage: page,
          pageSize: size,
          totalCount: result.meta?.totalCount || result.data.length,
          isEnd: result.meta?.isEnd || result.data.length < size
        }
      })
    }

  } catch (error) {
    console.error('Book search API error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: {
          errorType: 'INTERNAL_ERROR',
          message: '서버 내부 오류가 발생했습니다.'
        }
      },
      { status: 500 }
    )
  }
}

/**
 * 에러 타입에 따른 HTTP 상태 코드 매핑
 */
function getErrorStatusCode(errorType?: string): number {
  switch (errorType) {
    case 'INVALID_PARAMS':
    case 'INVALID_ISBN':
      return 400
    
    case 'UNAUTHORIZED':
      return 401
    
    case 'FORBIDDEN':
      return 403
    
    case 'QUOTA_EXCEEDED':
    case 'RATE_LIMIT_EXCEEDED':
      return 429
    
    case 'SERVER_ERROR':
      return 502
    
    case 'TIMEOUT':
      return 504
    
    case 'NETWORK_ERROR':
    case 'UNKNOWN_ERROR':
    case 'UNEXPECTED_ERROR':
    default:
      return 500
  }
}
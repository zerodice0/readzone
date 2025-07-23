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
    
    // 검색 파라미터 추출
    const query = searchParams.get('query')
    const page = parseInt(searchParams.get('page') || '1')
    const size = parseInt(searchParams.get('size') || '10')
    const sort = searchParams.get('sort') as 'accuracy' | 'latest' || 'accuracy'

    // 필수 파라미터 검증
    if (!query) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'INVALID_PARAMS',
            message: '검색어가 필요합니다.'
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

    // 검색 실행
    const bookAPI = getBookAPI()
    const bookSearchParams: KakaoBookSearchParams = {
      query: query.trim(),
      page,
      size,
      sort
    }

    const result = await bookAPI.searchBooks(bookSearchParams)

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

    // 성공 응답
    return NextResponse.json({
      success: true,
      data: result.data,
      usage: result.usage,
      pagination: {
        currentPage: page,
        pageSize: size,
        totalCount: result.data?.meta.total_count || 0,
        isEnd: result.data?.meta.is_end || true
      }
    })

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
import { NextRequest, NextResponse } from 'next/server'
import { getBookAPI } from '@/lib/book-api'
import type { KakaoBookSearchParams } from '@/types/kakao'

/**
 * 카카오 도서 검색 API 엔드포인트
 * GET /api/books/kakao/search?q=검색어&page=1&limit=10&sort=accuracy
 * 
 * 카카오 도서 API를 통해 새로운 도서를 검색합니다.
 * 선택 시 커뮤니티 DB에 저장됩니다.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    
    // 검색 파라미터 추출
    const query = searchParams.get('q')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const sort = searchParams.get('sort') as 'accuracy' | 'latest' || 'accuracy'

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

    // 카카오 API 검색 실행
    const bookAPI = getBookAPI()
    const bookSearchParams: KakaoBookSearchParams = {
      query: query.trim(),
      page,
      size: limit,
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

    // 성공 응답 (카카오 API 데이터 형식 정규화)
    const books = result.data?.documents || []
    
    // 카카오 API 결과에 새 도서 표시를 위한 플래그 추가
    const formattedBooks = books.map((book: any) => ({
      ...book,
      newBook: true, // 새 도서임을 명시
      kakaoBook: true // 카카오 검색 결과임을 명시
    }))

    return NextResponse.json({
      success: true,
      data: formattedBooks,
      pagination: {
        currentPage: page,
        pageSize: limit,
        totalCount: result.data?.meta.total_count || 0,
        isEnd: result.data?.meta.is_end || true
      },
      usage: result.usage // API 사용량 정보 포함
    })

  } catch (error) {
    console.error('Kakao book search error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: {
          errorType: 'INTERNAL_ERROR',
          message: '카카오 도서 검색 중 오류가 발생했습니다.'
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
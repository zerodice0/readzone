import { NextRequest, NextResponse } from 'next/server'
import { getBookAPI } from '@/lib/book-api'

/**
 * 인기 도서 조회 API 엔드포인트
 * GET /api/books/popular
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // 인기 도서 검색 실행
    const bookAPI = getBookAPI()
    const result = await bookAPI.getPopularBooks()

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
      categories: {
        fiction: result.data?.fiction?.length || 0,
        nonFiction: result.data?.nonFiction?.length || 0,
        recent: result.data?.recent?.length || 0
      }
    })

  } catch (error) {
    console.error('Popular books API error:', error)
    
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
import { NextRequest, NextResponse } from 'next/server'
import { getBookAPI } from '@/lib/book-api'

/**
 * ISBN으로 도서 검색 API 엔드포인트
 * GET /api/books/isbn/[isbn]
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ isbn: string }> }
): Promise<NextResponse> {
  try {
    const { isbn } = await params

    // ISBN 파라미터 검증
    if (!isbn) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'INVALID_PARAMS',
            message: 'ISBN이 필요합니다.'
          }
        },
        { status: 400 }
      )
    }

    // ISBN 기본 형식 검증
    const cleanISBN = isbn.replace(/[-\s]/g, '')
    if (!/^\d{10}$|^\d{13}$/.test(cleanISBN)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'INVALID_ISBN',
            message: '유효하지 않은 ISBN 형식입니다. 10자리 또는 13자리 숫자여야 합니다.'
          }
        },
        { status: 400 }
      )
    }

    // 도서 검색 실행
    const bookAPI = getBookAPI()
    const result = await bookAPI.getBookByISBN(isbn)

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
      found: result.data !== null
    })

  } catch (error) {
    console.error('ISBN search API error:', error)
    
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
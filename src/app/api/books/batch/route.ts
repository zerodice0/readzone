import { NextRequest, NextResponse } from 'next/server'
import { getBookAPI } from '@/lib/book-api'

/**
 * 다중 도서 검색 API 엔드포인트 (배치 처리)
 * POST /api/books/batch
 * 
 * Request Body:
 * {
 *   "queries": ["도서1", "도서2", "도서3"],
 *   "maxResults": 5
 * }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { queries, maxResults = 5 } = body

    // 입력 데이터 검증
    if (!Array.isArray(queries)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'INVALID_PARAMS',
            message: 'queries 배열이 필요합니다.'
          }
        },
        { status: 400 }
      )
    }

    if (queries.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'INVALID_PARAMS',
            message: '최소 1개의 검색어가 필요합니다.'
          }
        },
        { status: 400 }
      )
    }

    if (queries.length > 10) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'INVALID_PARAMS',
            message: '한 번에 최대 10개의 검색어만 처리할 수 있습니다.'
          }
        },
        { status: 400 }
      )
    }

    // 검색어 유효성 검증
    const validQueries = queries.filter(query => 
      typeof query === 'string' && query.trim().length > 0
    )

    if (validQueries.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'INVALID_PARAMS',
            message: '유효한 검색어가 없습니다.'
          }
        },
        { status: 400 }
      )
    }

    // 배치 검색 실행
    const bookAPI = getBookAPI()
    const result = await bookAPI.searchMultipleBooks(validQueries)

    // 성공 응답
    return NextResponse.json({
      success: true,
      data: {
        results: result.results,
        summary: result.summary,
        processedQueries: validQueries.length,
        skippedQueries: queries.length - validQueries.length
      }
    })

  } catch (error) {
    console.error('Batch search API error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: {
          errorType: 'INTERNAL_ERROR',
          message: '배치 검색 중 오류가 발생했습니다.'
        }
      },
      { status: 500 }
    )
  }
}
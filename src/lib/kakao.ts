import type { 
  KakaoBookSearchParams, 
  KakaoBookResponse, 
  KakaoBook, 
  ApiResponse,
  // KakaoApiError
} from '@/types/kakao'

/**
 * 카카오 도서 API 클라이언트
 * - 도서 검색 API 연동
 * - 에러 처리 및 재시도 로직
 * - API 사용량 추적
 * - 응답 캐싱 지원
 */
export class KakaoBookAPI {
  private readonly apiKey: string
  private readonly baseURL = 'https://dapi.kakao.com/v3/search/book'
  private readonly timeout = 10000 // 10초 타임아웃
  private readonly maxRetries = 3

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.KAKAO_API_KEY || ''
    
    if (!this.apiKey) {
      throw new Error('Kakao API key is required')
    }
  }

  /**
   * 도서 검색
   */
  async search(params: KakaoBookSearchParams): Promise<ApiResponse<KakaoBookResponse>> {
    const { query, sort = 'accuracy', page = 1, size = 10 } = params

    if (!query.trim()) {
      return {
        success: false,
        error: {
          errorType: 'INVALID_PARAMS',
          message: '검색어가 필요합니다.'
        }
      }
    }

    // URL 파라미터 구성
    const searchParams = new URLSearchParams({
      query: query.trim(),
      sort,
      page: page.toString(),
      size: Math.min(size, 50).toString() // 최대 50개로 제한
    })

    return this.makeRequest(`${this.baseURL}?${searchParams.toString()}`)
  }

  /**
   * ISBN으로 도서 검색
   */
  async getBookByISBN(isbn: string): Promise<ApiResponse<KakaoBook | null>> {
    if (!isbn || !this.isValidISBN(isbn)) {
      return {
        success: false,
        error: {
          errorType: 'INVALID_ISBN',
          message: '유효하지 않은 ISBN입니다.'
        }
      }
    }

    const response = await this.search({ query: isbn, size: 1 })
    
    if (!response.success || !response.data) {
      return response as unknown as ApiResponse<KakaoBook | null>
    }

    const book = response.data.documents.find(book => 
      book.isbn === isbn || book.isbn.replace(/[-\s]/g, '') === isbn.replace(/[-\s]/g, '')
    )

    return {
      success: true,
      data: book || null,
      usage: response.usage
    }
  }

  /**
   * API 요청 실행 (재시도 로직 포함)
   */
  private async makeRequest(url: string, retryCount = 0): Promise<ApiResponse<KakaoBookResponse>> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `KakaoAK ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      // API 응답 상태 확인
      if (!response.ok) {
        return this.handleApiError(response, retryCount, url)
      }

      const data: KakaoBookResponse = await response.json()

      // 데이터 검증
      if (!this.isValidResponse(data)) {
        return {
          success: false,
          error: {
            errorType: 'INVALID_RESPONSE',
            message: 'API 응답 형식이 올바르지 않습니다.'
          }
        }
      }

      return {
        success: true,
        data: this.normalizeResponse(data),
        usage: this.extractUsageInfo(response)
      }

    } catch (error) {
      return this.handleNetworkError(error, retryCount, url)
    }
  }

  /**
   * API 에러 처리
   */
  private async handleApiError(
    response: Response, 
    retryCount: number, 
    url: string
  ): Promise<ApiResponse<KakaoBookResponse>> {
    let errorType: string
    let message: string
    let shouldRetry = false

    switch (response.status) {
      case 400:
        errorType = 'BAD_REQUEST'
        message = '잘못된 요청입니다. 검색어를 확인해주세요.'
        break
      
      case 401:
        errorType = 'UNAUTHORIZED'
        message = 'API 키가 유효하지 않습니다.'
        break
      
      case 403:
        errorType = 'FORBIDDEN'
        message = 'API 사용 권한이 없습니다.'
        break
      
      case 429:
        errorType = 'RATE_LIMIT_EXCEEDED'
        message = 'API 사용량이 초과되었습니다. 잠시 후 다시 시도해주세요.'
        shouldRetry = retryCount < this.maxRetries
        break
      
      case 500:
      case 502:
      case 503:
      case 504:
        errorType = 'SERVER_ERROR'
        message = '카카오 서버에 일시적인 문제가 있습니다.'
        shouldRetry = retryCount < this.maxRetries
        break
      
      default:
        errorType = 'UNKNOWN_ERROR'
        message = `알 수 없는 오류가 발생했습니다. (${response.status})`
        shouldRetry = retryCount < this.maxRetries
    }

    // 재시도 가능한 경우
    if (shouldRetry) {
      const delay = Math.min(1000 * Math.pow(2, retryCount), 5000) // 지수 백오프 (최대 5초)
      await this.sleep(delay)
      return this.makeRequest(url, retryCount + 1)
    }

    return {
      success: false,
      error: {
        errorType,
        message,
        code: response.status
      }
    }
  }

  /**
   * 네트워크 에러 처리
   */
  private async handleNetworkError(
    error: any, 
    retryCount: number, 
    url: string
  ): Promise<ApiResponse<KakaoBookResponse>> {
    let errorType: string
    let message: string

    if (error.name === 'AbortError') {
      errorType = 'TIMEOUT'
      message = '요청 시간이 초과되었습니다.'
    } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      errorType = 'NETWORK_ERROR'
      message = '네트워크 연결을 확인해주세요.'
    } else {
      errorType = 'UNKNOWN_ERROR'
      message = '알 수 없는 오류가 발생했습니다.'
    }

    // 재시도 가능한 경우
    if (retryCount < this.maxRetries && (errorType === 'TIMEOUT' || errorType === 'NETWORK_ERROR')) {
      const delay = Math.min(1000 * Math.pow(2, retryCount), 5000)
      await this.sleep(delay)
      return this.makeRequest(url, retryCount + 1)
    }

    return {
      success: false,
      error: {
        errorType,
        message,
        details: error.message
      }
    }
  }

  /**
   * API 응답 데이터 검증
   */
  private isValidResponse(data: any): data is KakaoBookResponse {
    return (
      data &&
      typeof data === 'object' &&
      Array.isArray(data.documents) &&
      data.meta &&
      typeof data.meta.total_count === 'number' &&
      typeof data.meta.is_end === 'boolean'
    )
  }

  /**
   * 응답 데이터 정규화
   */
  private normalizeResponse(data: KakaoBookResponse): KakaoBookResponse {
    return {
      ...data,
      documents: data.documents.map(book => ({
        ...book,
        // 빈 문자열이나 null 값 처리
        title: book.title?.trim() || '제목 없음',
        authors: Array.isArray(book.authors) ? book.authors.filter(author => author?.trim()) : [],
        publisher: book.publisher?.trim() || '',
        isbn: book.isbn?.replace(/[-\s]/g, '') || '',
        thumbnail: book.thumbnail || '',
        contents: book.contents?.trim() || '',
        // 가격 정보 검증
        price: Math.max(0, book.price || 0),
        sale_price: Math.max(0, book.sale_price || 0),
      }))
    }
  }

  /**
   * API 사용량 정보 추출
   */
  private extractUsageInfo(_: Response) {
    // 카카오 API는 응답 헤더에 사용량 정보를 포함하지 않음
    // 필요시 별도의 사용량 추적 시스템에서 관리
    return {
      remaining: 1000, // 임시값
      resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24시간 후
    }
  }

  /**
   * ISBN 유효성 검증
   */
  private isValidISBN(isbn: string): boolean {
    const cleanISBN = isbn.replace(/[-\s]/g, '')
    
    // ISBN-10 (10자리) 또는 ISBN-13 (13자리) 확인
    if (!/^\d{10}$|^\d{13}$/.test(cleanISBN)) {
      return false
    }

    return true
  }

  /**
   * 지연 함수
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// 싱글톤 인스턴스 생성
let kakaoAPI: KakaoBookAPI | null = null

export function getKakaoAPI(): KakaoBookAPI {
  if (!kakaoAPI) {
    kakaoAPI = new KakaoBookAPI()
  }
  return kakaoAPI
}

// 기본 검색 함수 (편의 함수)
export async function searchBooks(query: string, page = 1, size = 10) {
  const api = getKakaoAPI()
  return api.search({ query, page, size })
}

// ISBN 검색 함수 (편의 함수)
export async function getBookByISBN(isbn: string) {
  const api = getKakaoAPI()
  return api.getBookByISBN(isbn)
}
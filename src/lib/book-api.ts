import { getKakaoAPI } from './kakao'
import { getUsageTracker, trackApiUsage, canMakeApiRequest } from './api-usage-tracker'
import { getCacheManager, BookCacheManager } from './cache-manager'
import { logApiUsage } from './usage-logger'
import type { 
  KakaoBookSearchParams, 
  KakaoBookResponse, 
  KakaoBook, 
  ApiResponse 
} from '@/types/kakao'

/**
 * 통합 도서 API 클라이언트
 * - 카카오 API 연동
 * - 사용량 추적
 * - 에러 처리
 * - 캐싱 지원 (향후 확장)
 */
export class BookAPI {
  private readonly kakaoAPI = getKakaoAPI()
  private readonly usageTracker = getUsageTracker()
  private readonly cacheManager = getCacheManager()

  /**
   * 도서 검색 (캐싱 및 사용량 추적 포함)
   */
  async searchBooks(params: KakaoBookSearchParams): Promise<ApiResponse<KakaoBookResponse>> {
    const startTime = Date.now()
    const cacheKey = BookCacheManager.createKey('search', params)

    try {
      // 1. 캐시에서 조회 시도
      const cachedResult = await this.cacheManager.get<KakaoBookResponse>(cacheKey)
      if (cachedResult) {
        await logApiUsage({
          endpoint: '/api/books/search',
          method: 'GET',
          success: true,
          responseTime: Date.now() - startTime
        })

        return {
          success: true,
          data: cachedResult,
        }
      }

      // 2. 사용량 확인
      const canRequest = await canMakeApiRequest()
      if (!canRequest) {
        await logApiUsage({
          endpoint: '/api/books/search',
          method: 'GET',
          success: false,
          responseTime: Date.now() - startTime,
          errorType: 'QUOTA_EXCEEDED'
        })

        return {
          success: false,
          error: {
            errorType: 'QUOTA_EXCEEDED',
            message: '일일 API 사용량이 초과되었습니다. 내일 다시 시도해주세요.'
          }
        }
      }

      // 3. API 호출
      const response = await this.kakaoAPI.search(params)

      // 4. 성공 시 캐싱 및 사용량 추적
      if (response.success && response.data) {
        await Promise.all([
          this.cacheManager.set(cacheKey, response.data),
          trackApiUsage(),
          logApiUsage({
            endpoint: '/api/books/search',
            method: 'GET',
            success: true,
            responseTime: Date.now() - startTime
          })
        ])
      } else {
        await logApiUsage({
          endpoint: '/api/books/search',
          method: 'GET',
          success: false,
          responseTime: Date.now() - startTime,
          errorType: response.error?.errorType
        })
      }

      return response

    } catch (error) {
      console.error('Book search error:', error)
      
      await logApiUsage({
        endpoint: '/api/books/search',
        method: 'GET',
        success: false,
        responseTime: Date.now() - startTime,
        errorType: 'UNEXPECTED_ERROR'
      })

      return {
        success: false,
        error: {
          errorType: 'UNEXPECTED_ERROR',
          message: '도서 검색 중 예상치 못한 오류가 발생했습니다.'
        }
      }
    }
  }

  /**
   * ISBN으로 도서 검색 (캐싱 및 사용량 추적 포함)
   */
  async getBookByISBN(isbn: string): Promise<ApiResponse<KakaoBook | null>> {
    const startTime = Date.now()
    const cacheKey = BookCacheManager.createKey('isbn', { isbn })

    try {
      // 1. 캐시에서 조회 시도
      const cachedResult = await this.cacheManager.get<KakaoBook | null>(cacheKey)
      if (cachedResult !== null) {
        await logApiUsage({
          endpoint: '/api/books/isbn',
          method: 'GET',
          success: true,
          responseTime: Date.now() - startTime
        })

        return {
          success: true,
          data: cachedResult
        }
      }

      // 2. 사용량 확인
      const canRequest = await canMakeApiRequest()
      if (!canRequest) {
        await logApiUsage({
          endpoint: '/api/books/isbn',
          method: 'GET',
          success: false,
          responseTime: Date.now() - startTime,
          errorType: 'QUOTA_EXCEEDED'
        })

        return {
          success: false,
          error: {
            errorType: 'QUOTA_EXCEEDED',
            message: '일일 API 사용량이 초과되었습니다.'
          }
        }
      }

      // 3. API 호출
      const response = await this.kakaoAPI.getBookByISBN(isbn)

      // 4. 성공 시 캐싱 및 사용량 추적
      if (response.success) {
        await Promise.all([
          this.cacheManager.set(cacheKey, response.data),
          trackApiUsage(),
          logApiUsage({
            endpoint: '/api/books/isbn',
            method: 'GET',
            success: true,
            responseTime: Date.now() - startTime
          })
        ])
      } else {
        await logApiUsage({
          endpoint: '/api/books/isbn',
          method: 'GET',
          success: false,
          responseTime: Date.now() - startTime,
          errorType: response.error?.errorType
        })
      }

      return response

    } catch (error) {
      console.error('ISBN search error:', error)
      
      await logApiUsage({
        endpoint: '/api/books/isbn',
        method: 'GET',
        success: false,
        responseTime: Date.now() - startTime,
        errorType: 'UNEXPECTED_ERROR'
      })

      return {
        success: false,
        error: {
          errorType: 'UNEXPECTED_ERROR',
          message: 'ISBN 검색 중 예상치 못한 오류가 발생했습니다.'
        }
      }
    }
  }

  /**
   * API 사용량 상태 조회
   */
  async getUsageStatus() {
    return this.usageTracker.getUsageStats()
  }

  /**
   * 남은 할당량 조회
   */
  async getRemainingQuota(): Promise<number> {
    return this.usageTracker.getRemainingQuota()
  }

  /**
   * 사용량 히스토리 조회
   */
  async getUsageHistory() {
    return this.usageTracker.getHistoricalUsage()
  }

  /**
   * 다중 도서 검색 (배치 처리)
   */
  async searchMultipleBooks(queries: string[]): Promise<{
    results: Array<{
      query: string
      response: ApiResponse<KakaoBookResponse>
    }>
    summary: {
      total: number
      successful: number
      failed: number
      quotaExceeded: boolean
    }
  }> {
    const results: Array<{
      query: string
      response: ApiResponse<KakaoBookResponse>
    }> = []

    let successful = 0
    let failed = 0
    let quotaExceeded = false

    for (const query of queries) {
      const response = await this.searchBooks({ query, size: 5 })
      
      results.push({
        query,
        response
      })

      if (response.success) {
        successful++
      } else {
        failed++
        if (response.error?.errorType === 'QUOTA_EXCEEDED') {
          quotaExceeded = true
          break // 할당량 초과 시 중단
        }
      }

      // 요청 간 간격 (API 부하 방지)
      if (queries.indexOf(query) < queries.length - 1) {
        await this.sleep(100) // 100ms 간격
      }
    }

    return {
      results,
      summary: {
        total: queries.length,
        successful,
        failed,
        quotaExceeded
      }
    }
  }

  /**
   * 인기 도서 검색 (미리 정의된 키워드)
   */
  async getPopularBooks(): Promise<ApiResponse<{
    fiction: KakaoBook[]
    nonFiction: KakaoBook[]
    recent: KakaoBook[]
  }>> {
    try {
      const popularQueries = [
        { key: 'fiction', query: '소설 베스트셀러' },
        { key: 'nonFiction', query: '자기계발 베스트셀러' },
        { key: 'recent', query: '신간 도서' }
      ]

      const results: any = {
        fiction: [],
        nonFiction: [],
        recent: []
      }

      for (const { key, query } of popularQueries) {
        const response = await this.searchBooks({ 
          query, 
          sort: 'latest', 
          size: 10 
        })

        if (response.success && response.data) {
          results[key] = response.data.documents
        }

        // 요청 간 간격
        await this.sleep(200)
      }

      return {
        success: true,
        data: results
      }

    } catch (error) {
      console.error('Popular books error:', error)
      return {
        success: false,
        error: {
          errorType: 'UNEXPECTED_ERROR',
          message: '인기 도서 조회 중 오류가 발생했습니다.'
        }
      }
    }
  }

  /**
   * 도서 정보 검증 및 정리
   */
  validateAndCleanBookData(book: KakaoBook): KakaoBook {
    return {
      ...book,
      title: book.title?.trim() || '제목 없음',
      authors: Array.isArray(book.authors) 
        ? book.authors.filter(author => author?.trim())
        : [],
      publisher: book.publisher?.trim() || '',
      isbn: book.isbn?.replace(/[-\s]/g, '') || '',
      thumbnail: this.validateImageUrl(book.thumbnail),
      contents: book.contents?.trim() || '',
      price: Math.max(0, book.price || 0),
      sale_price: Math.max(0, book.sale_price || 0),
      url: this.validateUrl(book.url) || '',
      datetime: book.datetime || new Date().toISOString(),
      translators: Array.isArray(book.translators) 
        ? book.translators.filter(translator => translator?.trim())
        : [],
      status: book.status || 'unknown'
    }
  }

  /**
   * 이미지 URL 검증
   */
  private validateImageUrl(url?: string): string {
    if (!url || !url.trim()) return ''
    
    try {
      new URL(url)
      return url
    } catch {
      return ''
    }
  }

  /**
   * URL 검증
   */
  private validateUrl(url?: string): string | null {
    if (!url || !url.trim()) return null
    
    try {
      new URL(url)
      return url
    } catch {
      return null
    }
  }

  /**
   * 지연 함수
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// 싱글톤 인스턴스
let bookAPI: BookAPI | null = null

export function getBookAPI(): BookAPI {
  if (!bookAPI) {
    bookAPI = new BookAPI()
  }
  return bookAPI
}

// 편의 함수들
export async function searchBooks(query: string, page = 1, size = 10): Promise<ApiResponse<KakaoBookResponse>> {
  const api = getBookAPI()
  return api.searchBooks({ query, page, size })
}

export async function getBookByISBN(isbn: string): Promise<ApiResponse<KakaoBook | null>> {
  const api = getBookAPI()
  return api.getBookByISBN(isbn)
}

export async function getPopularBooks() {
  const api = getBookAPI()
  return api.getPopularBooks()
}

export async function getApiUsageStatus() {
  const api = getBookAPI()
  return api.getUsageStatus()
}
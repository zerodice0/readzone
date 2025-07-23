/**
 * 클라이언트 사이드 API 호출 유틸리티
 * - 도서 검색 API 클라이언트
 * - 에러 처리 및 타입 안전성
 * - React Query와 함께 사용
 */

import type { 
  KakaoBookResponse, 
  KakaoBook, 
  ApiResponse 
} from '@/types/kakao'

// API 기본 설정
const API_BASE_URL = '/api/books'
const DEFAULT_TIMEOUT = 10000

/**
 * API 클라이언트 기본 클래스
 */
class ApiClient {
  private baseURL: string
  private timeout: number

  constructor(baseURL: string = API_BASE_URL, timeout: number = DEFAULT_TIMEOUT) {
    this.baseURL = baseURL
    this.timeout = timeout
  }

  /**
   * HTTP 요청 실행
   */
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          error: errorData.error || {
            errorType: 'HTTP_ERROR',
            message: `HTTP ${response.status}: ${response.statusText}`
          }
        }
      }

      const data = await response.json()
      return data

    } catch (error: any) {
      clearTimeout(timeoutId)
      
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: {
            errorType: 'TIMEOUT',
            message: '요청 시간이 초과되었습니다.'
          }
        }
      }

      return {
        success: false,
        error: {
          errorType: 'NETWORK_ERROR',
          message: '네트워크 오류가 발생했습니다.'
        }
      }
    }
  }

  /**
   * GET 요청
   */
  async get<T>(endpoint: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
    const url = params ? `${endpoint}?${new URLSearchParams(params)}` : endpoint
    return this.request<T>(url, { method: 'GET' })
  }

  /**
   * POST 요청
   */
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }
}

/**
 * 도서 API 클라이언트
 */
export class BookApiClient extends ApiClient {
  /**
   * 도서 검색
   */
  async searchBooks(params: {
    query: string
    page?: number
    size?: number
    sort?: 'accuracy' | 'latest'
  }): Promise<ApiResponse<{
    data: KakaoBookResponse
    pagination: {
      currentPage: number
      pageSize: number
      totalCount: number
      isEnd: boolean
    }
  }>> {
    const searchParams = {
      query: params.query,
      page: (params.page || 1).toString(),
      size: (params.size || 10).toString(),
      sort: params.sort || 'accuracy'
    }

    return this.get('/search', searchParams)
  }

  /**
   * ISBN으로 도서 검색
   */
  async getBookByISBN(isbn: string): Promise<ApiResponse<{
    data: KakaoBook | null
    found: boolean
  }>> {
    return this.get(`/isbn/${encodeURIComponent(isbn)}`)
  }

  /**
   * 인기 도서 조회
   */
  async getPopularBooks(): Promise<ApiResponse<{
    data: {
      fiction: KakaoBook[]
      nonFiction: KakaoBook[]
      recent: KakaoBook[]
    }
    categories: {
      fiction: number
      nonFiction: number
      recent: number
    }
  }>> {
    return this.get('/popular')
  }

  /**
   * API 사용량 조회
   */
  async getUsageStatus(): Promise<ApiResponse<{
    status: {
      today: {
        searchCount: number
        remaining: number
        resetTime: string
      }
      usagePercentage: number
      isNearLimit: boolean
      isLimitExceeded: boolean
      timeUntilReset: number
    }
    remainingQuota: number
    history: Array<{
      date: string
      searchCount: number
      remaining: number
    }>
    limits: {
      dailyLimit: number
      warningThreshold: number
      resetTime: string
    }
  }>> {
    return this.get('/usage')
  }

  /**
   * 다중 도서 검색 (배치)
   */
  async searchMultipleBooks(queries: string[], maxResults: number = 5): Promise<ApiResponse<{
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
    processedQueries: number
    skippedQueries: number
  }>> {
    return this.post('/batch', { queries, maxResults })
  }
}

// 싱글톤 인스턴스
let bookApiClient: BookApiClient | null = null

export function getBookApiClient(): BookApiClient {
  if (!bookApiClient) {
    bookApiClient = new BookApiClient()
  }
  return bookApiClient
}

// 편의 함수들
export async function searchBooks(
  query: string, 
  page = 1, 
  size = 10, 
  sort: 'accuracy' | 'latest' = 'accuracy'
) {
  const client = getBookApiClient()
  return client.searchBooks({ query, page, size, sort })
}

export async function getBookByISBN(isbn: string) {
  const client = getBookApiClient()
  return client.getBookByISBN(isbn)
}

export async function getPopularBooks() {
  const client = getBookApiClient()
  return client.getPopularBooks()
}

export async function getApiUsageStatus() {
  const client = getBookApiClient()
  return client.getUsageStatus()
}

export async function searchMultipleBooks(queries: string[], maxResults = 5) {
  const client = getBookApiClient()
  return client.searchMultipleBooks(queries, maxResults)
}
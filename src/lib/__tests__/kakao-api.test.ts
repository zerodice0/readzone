import { KakaoBookAPI } from '../kakao'
import { getBookAPI } from '../book-api'
import type { KakaoBookSearchParams } from '@/types/kakao'

// Mock 환경 변수
process.env.KAKAO_API_KEY = 'test-api-key'

describe('KakaoBookAPI', () => {
  let api: KakaoBookAPI

  beforeEach(() => {
    api = new KakaoBookAPI('test-api-key')
    // fetch mock 설정
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('생성자', () => {
    it('API 키가 제공되면 정상 생성', () => {
      expect(() => new KakaoBookAPI('valid-key')).not.toThrow()
    })

    it('API 키가 없으면 에러 발생', () => {
      expect(() => new KakaoBookAPI('')).toThrow('Kakao API key is required')
    })
  })

  describe('search', () => {
    const mockSuccessResponse = {
      documents: [
        {
          title: '테스트 도서',
          authors: ['테스트 저자'],
          publisher: '테스트 출판사',
          isbn: '9788936433598',
          thumbnail: 'https://example.com/image.jpg',
          contents: '테스트 내용',
          url: 'https://example.com',
          datetime: '2024-01-01T00:00:00.000+09:00',
          translators: [],
          price: 15000,
          sale_price: 13500,
          status: 'normal'
        }
      ],
      meta: {
        total_count: 1,
        pageable_count: 1,
        is_end: true
      }
    }

    it('정상적인 검색 요청 처리', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSuccessResponse),
        headers: new Headers()
      })

      const result = await api.search({ query: '테스트' })

      expect(result.success).toBe(true)
      expect(result.data?.documents).toHaveLength(1)
      expect(result.data?.documents[0].title).toBe('테스트 도서')
    })

    it('빈 검색어 처리', async () => {
      const result = await api.search({ query: '' })

      expect(result.success).toBe(false)
      expect(result.error?.errorType).toBe('INVALID_PARAMS')
    })

    it('API 에러 응답 처리', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ message: 'Bad Request' })
      })

      const result = await api.search({ query: '테스트' })

      expect(result.success).toBe(false)
      expect(result.error?.errorType).toBe('BAD_REQUEST')
    })

    it('네트워크 에러 처리', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Failed to fetch')
      )

      const result = await api.search({ query: '테스트' })

      expect(result.success).toBe(false)
      expect(result.error?.errorType).toBe('NETWORK_ERROR')
    })

    it('검색 파라미터 검증', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSuccessResponse),
        headers: new Headers()
      })

      await api.search({ 
        query: '테스트', 
        page: 2, 
        size: 20, 
        sort: 'latest' 
      })

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const url = fetchCall[0]
      
      expect(url).toContain('query=%ED%85%8C%EC%8A%A4%ED%8A%B8') // URL 인코딩된 '테스트'
      expect(url).toContain('page=2')
      expect(url).toContain('size=20')
      expect(url).toContain('sort=latest')
    })
  })

  describe('getBookByISBN', () => {
    it('유효한 ISBN으로 도서 검색', async () => {
      const mockResponse = {
        documents: [
          {
            title: 'ISBN 테스트 도서',
            isbn: '9788936433598',
            authors: ['저자'],
            publisher: '출판사',
            thumbnail: '',
            contents: '',
            url: '',
            datetime: '2024-01-01T00:00:00.000+09:00',
            translators: [],
            price: 0,
            sale_price: 0,
            status: 'normal'
          }
        ],
        meta: {
          total_count: 1,
          pageable_count: 1,
          is_end: true
        }
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        headers: new Headers()
      })

      const result = await api.getBookByISBN('9788936433598')

      expect(result.success).toBe(true)
      expect(result.data?.isbn).toBe('9788936433598')
    })

    it('잘못된 ISBN 처리', async () => {
      const result = await api.getBookByISBN('invalid-isbn')

      expect(result.success).toBe(false)
      expect(result.error?.errorType).toBe('INVALID_ISBN')
    })
  })
})

describe('BookAPI 통합', () => {
  let bookAPI: ReturnType<typeof getBookAPI>

  beforeEach(() => {
    bookAPI = getBookAPI()
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('사용량 추적과 함께 검색 실행', async () => {
    const mockResponse = {
      documents: [],
      meta: {
        total_count: 0,
        pageable_count: 0,
        is_end: true
      }
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
      headers: new Headers()
    })

    const result = await bookAPI.searchBooks({ query: '테스트' })

    expect(result.success).toBe(true)
    
    // 사용량 통계 확인
    const usage = await bookAPI.getUsageStatus()
    expect(usage.today.searchCount).toBeGreaterThan(0)
  })

  it('할당량 초과 시 검색 차단', async () => {
    // 할당량을 인위적으로 초과시킴
    const tracker = bookAPI['usageTracker']
    const today = new Date().toISOString().split('T')[0]
    
    // private 메서드 접근을 위한 타입 캐스팅
    ;(tracker as any).usage.set(today, {
      id: `usage-${today}`,
      date: today,
      searchCount: 300000, // 최대 허용량
      remaining: 0,
      resetTime: new Date(),
      lastUpdated: new Date()
    })

    const result = await bookAPI.searchBooks({ query: '테스트' })

    expect(result.success).toBe(false)
    expect(result.error?.errorType).toBe('QUOTA_EXCEEDED')
  })
})

// 테스트 유틸리티 함수들
export const testUtils = {
  /**
   * Mock 카카오 API 응답 생성
   */
  createMockKakaoResponse: (books: Partial<any>[] = []) => ({
    documents: books.map(book => ({
      title: book.title || '테스트 도서',
      authors: book.authors || ['테스트 저자'],
      publisher: book.publisher || '테스트 출판사',
      isbn: book.isbn || '9788936433598',
      thumbnail: book.thumbnail || '',
      contents: book.contents || '',
      url: book.url || '',
      datetime: book.datetime || '2024-01-01T00:00:00.000+09:00',
      translators: book.translators || [],
      price: book.price || 0,
      sale_price: book.sale_price || 0,
      status: book.status || 'normal'
    })),
    meta: {
      total_count: books.length,
      pageable_count: books.length,
      is_end: true
    }
  }),

  /**
   * Fetch Mock 설정
   */
  mockFetchSuccess: (response: any) => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(response),
      headers: new Headers()
    })
  },

  /**
   * Fetch Error Mock 설정
   */
  mockFetchError: (status: number, message = 'Error') => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status,
      json: () => Promise.resolve({ message })
    })
  }
}
// 카카오 도서 API 타입 정의

export interface KakaoBookSearchParams {
  query: string
  sort?: 'accuracy' | 'latest'
  page?: number
  size?: number
}

export interface KakaoBookResponse {
  documents: KakaoBook[]
  meta: {
    total_count: number
    pageable_count: number
    is_end: boolean
  }
}

export interface KakaoBook {
  title: string
  contents: string
  url: string
  isbn: string
  datetime: string
  authors: string[]
  publisher: string
  translators: string[]
  price: number
  sale_price: number
  thumbnail: string
  status: string
}

export interface ApiUsage {
  id: string
  date: string
  searchCount: number
  remaining: number
  resetTime: Date
  lastUpdated: Date
}

export interface KakaoApiError {
  errorType: string
  message: string
  code?: number
  details?: any
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: KakaoApiError
  usage?: {
    remaining: number
    resetTime: Date
  }
}
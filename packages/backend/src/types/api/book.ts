/**
 * 도서 검색 및 관리 API 요청/응답 타입
 * - 3단계 도서 검색 (DB → 카카오 API → 수동 입력)
 * - 도서 상세 정보 조회
 */

/** 도서 검색 요청 */
export interface SearchBooksRequest {
  query: string
  page?: number
  limit?: number
  source?: 'all' | 'database' | 'kakao'  // 검색 소스 제한
}

/** 도서 검색 응답 */
export interface SearchBooksResponse {
  books: BookSearchResult[]
  total: number
  source: 'database' | 'kakao'           // 실제 검색된 소스
  hasMore: boolean
}

/** 도서 검색 결과 아이템 */
export interface BookSearchResult {
  id?: string                            // DB에 있는 경우만
  title: string
  author: string
  publisher?: string
  thumbnail?: string
  isbn?: string
  source: 'database' | 'kakao'
  externalId?: string                    // 카카오 API ID
}

/** 수동 도서 등록 요청 */
export interface CreateBookRequest {
  title: string
  author: string
  publisher?: string
  publishedAt?: string                   // YYYY-MM-DD 형식
  description?: string
  thumbnail?: string                     // 이미지 URL
  category?: string
  pages?: number
  isbn?: string
}

/** 도서 상세 조회 응답 */
export interface BookDetailResponse {
  id: string
  title: string
  author: string
  publisher?: string
  publishedAt?: string
  description?: string
  thumbnail?: string
  category?: string
  pages?: number
  isbn?: string
  source: string
  reviews: {
    total: number
    recent: ReviewPreview[]              // 최근 독후감 3개
  }
}

/** 독후감 미리보기 (도서 상세에서 사용) */
export interface ReviewPreview {
  id: string
  title: string
  content: string                        // 100자 미리보기
  isRecommended: boolean
  rating?: number
  createdAt: string
  author: {
    id: string
    nickname: string
    profileImage?: string
  }
  stats: {
    likes: number
    comments: number
  }
}
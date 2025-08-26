/**
 * 도서 관련 데이터베이스 엔티티 타입
 * - 카카오 API, 수동 입력으로 등록된 도서 정보
 * - 도서 상세 페이지, 검색 결과에 사용
 */

import type { User } from './user'
import type { Review } from './review'

/** 도서 기본 엔티티 (Prisma Book 모델) */
export interface Book {
  id: string
  isbn?: string | null
  title: string
  author: string
  publisher?: string | null
  publishedAt?: string | null
  description?: string | null
  thumbnail?: string | null
  category?: string | null
  pages?: number | null
  source: string                // BookSource enum 값
  externalId?: string | null    // 카카오 API ID 등
  createdAt: Date
  updatedAt: Date
}

/** 도서 상세 페이지용 - 관련 독후감 포함 */
export interface BookWithReviews extends Book {
  reviews: (Review & {
    user: User                  // 독후감 작성자 정보
  })[]
  _count: {
    reviews: number             // 총 독후감 수
  }
}

/** 도서 검색 결과용 - 최소 정보만 포함 */
export interface BookSearchResult {
  id: string
  title: string
  author: string
  thumbnail?: string | null
  source: string
}
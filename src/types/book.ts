// 도서 관련 타입 정의

import type { Book, BookReview, BookOpinion, User } from '@prisma/client'

// 도서 데이터 타입 (DB + 카카오 API 통합)
export interface BookData extends Omit<Book, 'authors' | 'translators'> {
  authors: string[]
  translators: string[]
}

// 도서 검증 타입
export interface BookValidation {
  isValid: boolean
  errors: {
    field: string
    message: string
  }[]
}

// 수동 도서 입력 폼
export interface ManualBookInput {
  title: string
  authors: string[]
  publisher?: string
  translators?: string[]
  genre?: string
  pageCount?: number
  thumbnail?: string
  description?: string
  isbn?: string
  isbn13?: string
  datetime?: string
  price?: number
  salePrice?: number
}

// 도서 검색 필터
export interface BookSearchFilters {
  query: string
  genre?: string
  minPrice?: number
  maxPrice?: number
  publisher?: string
  startDate?: string
  endDate?: string
  isManualEntry?: boolean
  hasReviews?: boolean
}

// 도서 통계
export interface BookStats {
  totalReviews: number
  totalOpinions: number
  recommendationRate: number
  averageRating?: number
  topTags: string[]
  recentActivity: Date
}

// 도서 상세 정보 (관계 포함)
export interface BookDetail extends BookData {
  reviews: (BookReview & {
    user: Pick<User, 'id' | 'nickname' | 'image'>
    _count: {
      likes: number
      comments: number
    }
  })[]
  opinions: (BookOpinion & {
    user: Pick<User, 'id' | 'nickname' | 'image'>
  })[]
  stats: BookStats
}

// 도서 목록 아이템
export interface BookListItem extends BookData {
  _count: {
    reviews: number
    opinions: number
  }
  latestReview?: {
    id: string
    title?: string
    content: string
    createdAt: Date
    user: {
      nickname: string
    }
  }
}

// API 캐시 설정
export interface CacheConfig {
  enabled: boolean
  ttl: number // Time to live in seconds
  maxSize: number // Maximum cache entries
  strategy: 'LRU' | 'FIFO' | 'LFU'
}

// 도서 동기화 상태
export interface BookSyncStatus {
  bookId: string
  lastSyncedAt: Date | null
  syncStatus: 'synced' | 'pending' | 'failed' | 'never'
  errorMessage?: string
}

// 도서 추천 데이터
export interface BookRecommendation {
  book: BookData
  reason: string
  score: number
  basedOn: 'genre' | 'author' | 'reviews' | 'popularity'
}
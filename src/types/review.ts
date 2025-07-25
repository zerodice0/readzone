// 독후감 관련 타입 정의

export interface Review {
  id: string
  title: string | null
  content: string
  isRecommended: boolean
  tags: string[]
  purchaseLink: string | null
  linkClicks: number
  createdAt: Date | string
  updatedAt: Date | string
  userId: string
  bookId: string
  user: {
    id: string
    nickname: string
    image: string | null
  }
  book: {
    id: string
    title: string
    authors: string[]
    thumbnail: string | null
    publisher?: string | null
  }
  _count: {
    likes: number
    comments: number
  }
  // 클라이언트 사이드 플래그
  isLiked?: boolean
}

export interface ReviewListResponse {
  items: Review[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrevious: boolean
  }
  stats: {
    total: number
    recommendedCount: number
    notRecommendedCount: number
    recommendationRate: number
  }
  filters: {
    userId?: string
    bookId?: string
    tags: string[]
    sort: string
    search?: string
  }
}

export interface CreateReviewInput {
  bookId: string
  title?: string
  content: string
  isRecommended: boolean
  tags: string[]
  purchaseLink?: string
}

export interface UpdateReviewInput {
  title?: string
  content?: string
  isRecommended?: boolean
  tags?: string[]
  purchaseLink?: string
}
// 데이터베이스 모델 타입 정의
export interface User {
  id: string
  email: string
  nickname: string
  name?: string
  bio?: string
  image?: string
  password: string
  emailVerified?: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface Book {
  id: string
  isbn?: string
  title: string
  authors: string
  publisher?: string
  genre?: string
  pageCount?: number
  thumbnail?: string
  description?: string
  isManualEntry: boolean
  createdAt: Date
  updatedAt: Date
}

export interface BookReview {
  id: string
  title?: string
  content: string
  isRecommended: boolean
  tags: string
  purchaseLink?: string
  linkClicks: number
  createdAt: Date
  updatedAt: Date
  userId: string
  bookId: string
  
  // 관계
  user?: User
  book?: Book
  likes?: ReviewLike[]
  comments?: Comment[]
}

export interface BookOpinion {
  id: string
  content: string
  isRecommended: boolean
  createdAt: Date
  userId: string
  bookId: string
  
  // 관계
  user?: User
  book?: Book
}

export interface ReviewLike {
  id: string
  userId: string
  reviewId: string
  
  // 관계
  user?: User
  review?: BookReview
}

export interface Comment {
  id: string
  content: string
  createdAt: Date
  updatedAt: Date
  userId: string
  reviewId: string
  
  // 관계
  user?: User
  review?: BookReview
}

// API 응답 타입
export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  error?: string
}

export interface ApiPaginatedResponse<T = any> extends ApiResponse<T> {
  pagination?: PaginationInfo
}

// 무한 스크롤용 응답 타입
export interface InfiniteResponse<T = any> {
  data: T[]
  nextCursor?: string
  hasMore: boolean
}

// 통계 타입
export interface UserStats {
  reviewsCount: number
  opinionsCount: number
  likesReceived: number
  booksRead: number
  joinDate: Date
  lastActive: Date
}

export interface BookStats {
  reviewsCount: number
  opinionsCount: number
  recommendationRate: number
  averageRating?: number
}
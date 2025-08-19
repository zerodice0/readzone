// 타입 문제 해결을 위한 기본 인터페이스 정의
interface PrismaUser {
  id: string
  email: string
  nickname: string
  password: string
  bio?: string | null
  profileImage?: string | null
  isVerified: boolean
  verificationToken?: string | null
  resetToken?: string | null
  resetTokenExpires?: Date | null
  createdAt: Date
  updatedAt: Date
}

interface PrismaBook {
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
  source: string
  externalId?: string | null
  createdAt: Date
  updatedAt: Date
}

interface PrismaReview {
  id: string
  title: string
  content: string
  isRecommended: boolean
  rating?: number | null
  tags?: string | null
  isPublic: boolean
  status: string
  createdAt: Date
  updatedAt: Date
  userId: string
  bookId: string
}

interface PrismaLike {
  id: string
  userId: string
  reviewId: string
  createdAt: Date
}

interface PrismaComment {
  id: string
  content: string
  parentId?: string | null
  createdAt: Date
  updatedAt: Date
  userId: string
  reviewId: string
}

interface PrismaFollow {
  id: string
  followerId: string
  followingId: string
  createdAt: Date
}

interface PrismaNotification {
  id: string
  type: string
  message: string
  isRead: boolean
  data?: string | null
  createdAt: Date
  userId: string
  senderId?: string | null
  reviewId?: string | null
  commentId?: string | null
}

// Re-export Prisma types with original names
export type User = PrismaUser
export type Book = PrismaBook  
export type Review = PrismaReview
export type Like = PrismaLike
export type Comment = PrismaComment
export type Follow = PrismaFollow
export type Notification = PrismaNotification

// Define enum-like types as string literals (SQLite doesn't support enums)
export type BookSource = 'KAKAO_API' | 'DATABASE' | 'MANUAL'
export type ReviewStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
export type NotificationType = 'LIKE' | 'COMMENT' | 'REPLY' | 'FOLLOW' | 'SYSTEM'

// Extended types with relations
export type UserWithCounts = User & {
  _count: {
    reviews: number
    likes: number
    following: number
    followers: number
  }
}

export type ReviewWithDetails = Review & {
  user: User
  book: Book
  likes: Like[]
  comments: (Comment & { user: User })[]
  _count: {
    likes: number
    comments: number
  }
}

export type BookWithReviews = Book & {
  reviews: (Review & {
    user: User
  })[]
  _count: {
    reviews: number
  }
}

export type CommentWithUser = Comment & {
  user: User
  replies?: CommentWithUser[]
}

export type NotificationWithSender = Notification & {
  sender?: User
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  hasNext: boolean
  hasPrev: boolean
}

// JWT payload
export interface JWTPayload {
  userId: string
  email: string
  nickname: string
  iat?: number
  exp?: number
}

// Request body types
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  nickname: string
  password: string
}

export interface CreateReviewRequest {
  title: string
  content: string
  bookId: string
  isRecommended: boolean
  rating?: number
  tags?: string[]
  isPublic?: boolean
}

export interface UpdateReviewRequest {
  title?: string
  content?: string
  isRecommended?: boolean
  rating?: number
  tags?: string[]
  isPublic?: boolean
}

export interface CreateCommentRequest {
  content: string
  parentId?: string
}

export interface SearchBooksRequest {
  query: string
  page?: number
  limit?: number
}

// Kakao API types
export interface KakaoBookSearchResponse {
  documents: KakaoBookDocument[]
  meta: {
    total_count: number
    pageable_count: number
    is_end: boolean
  }
}

export interface KakaoBookDocument {
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

// Error types
export class AppError extends Error {
  constructor(
    public override message: string,
    public statusCode = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR')
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR')
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Authorization failed') {
    super(message, 403, 'AUTHORIZATION_ERROR')
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND_ERROR')
    this.name = 'NotFoundError'
  }
}
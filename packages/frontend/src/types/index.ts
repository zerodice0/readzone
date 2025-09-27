// Base types
export interface User {
  id: string
  email: string
  nickname: string
  bio?: string
  profileImage?: string
  isVerified: boolean
  createdAt: string
  updatedAt: string
}

export interface Book {
  id: string
  isbn?: string
  title: string
  author: string
  publisher?: string
  publishedAt?: string
  description?: string
  thumbnail?: string
  category?: string
  pages?: number
  source: BookSource
  externalId?: string
  createdAt: string
  updatedAt: string
}

export interface Review {
  id: string
  title: string
  content: string
  isRecommended: boolean
  rating?: number
  tags?: string[]
  isPublic: boolean
  status: ReviewStatus
  createdAt: string
  updatedAt: string
  userId: string
  bookId: string
  user: User
  book: Book
  likes: Like[]
  comments: Comment[]
  _count?: {
    likes: number
    comments: number
  }
}

export interface Like {
  id: string
  userId: string
  reviewId: string
  createdAt: string
  user: User
}

export interface Comment {
  id: string
  content: string
  parentId?: string
  createdAt: string
  updatedAt: string
  userId: string
  reviewId: string
  user: User
  replies?: Comment[]
}

export interface Follow {
  id: string
  followerId: string
  followingId: string
  createdAt: string
  follower: User
  following: User
}

export interface Notification {
  id: string
  type: NotificationType
  message: string
  isRead: boolean
  data?: string
  createdAt: string
  userId: string
  senderId?: string
  reviewId?: string
  commentId?: string
  user: User
  sender?: User
}

// Enums
export enum BookSource {
  KAKAO_API = 'KAKAO_API',
  DATABASE = 'DATABASE',
  MANUAL = 'MANUAL'
}

export enum ReviewStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED'
}

export enum NotificationType {
  LIKE = 'LIKE',
  COMMENT = 'COMMENT', 
  REPLY = 'REPLY',
  FOLLOW = 'FOLLOW',
  SYSTEM = 'SYSTEM'
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

// Form types
export interface LoginFormData {
  email: string
  password: string
}

export interface RegisterFormData {
  email: string
  nickname: string
  password: string
  confirmPassword: string
}

export interface ReviewFormData {
  title: string
  content: string
  bookId: string
  isRecommended: boolean
  rating?: number
  tags: string[]
  isPublic: boolean
}

export interface SearchBookParams {
  query: string
  page?: number
  limit?: number
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

// Unified Search Types
export type SearchType = 'all' | 'books' | 'reviews' | 'users'

export interface SearchFilters {
  // Book filters
  publishYear?: {
    from?: number
    to?: number
  }
  genre?: string[]
  publisher?: string[]

  // Review filters
  rating?: 'recommend' | 'not_recommend'
  dateRange?: {
    from?: string
    to?: string
  }
  minLikes?: number

  // User filters
  hasAvatar?: boolean
  minFollowers?: number
}

export interface SearchPagination {
  nextCursor?: string
  hasMore: boolean
  total: number
}

export interface BookSearchResult {
  id?: string
  title: string
  author: string
  publisher?: string
  publishedDate?: string
  isbn?: string
  coverImage?: string
  description?: string
  genre?: string[]

  // Statistics (for existing books)
  stats?: {
    reviewCount: number
    averageRating?: number
    recentReviews: number
  }

  source: 'db' | 'api'
  isExisting: boolean
}

export interface ReviewSearchResult {
  id: string
  content: string // Highlighted summary (150 chars)
  rating: 'recommend' | 'not_recommend'
  tags: string[]
  createdAt: string

  author: {
    id: string
    username: string
    profileImage?: string
  }

  book: {
    id: string
    title: string
    author: string
    coverImage?: string
  }

  stats: {
    likes: number
    comments: number
  }

  highlights?: {
    content?: string[]
    tags?: string[]
  }
}

export interface UserSearchResult {
  id: string
  username: string
  bio?: string
  profileImage?: string

  stats: {
    reviewCount: number
    followerCount: number
    followingCount: number
    likesReceived: number
  }

  recentActivity: {
    lastReviewAt?: string
    lastActiveAt: string
  }

  isFollowing?: boolean

  highlights?: {
    username?: string
    bio?: string
  }
}

export interface UnifiedSearchResponse {
  results: {
    books: BookSearchResult[]
    reviews: ReviewSearchResult[]
    users: UserSearchResult[]
  }
  pagination: SearchPagination
  suggestions?: string[]
}

export interface SearchSuggestion {
  text: string
  type: 'book' | 'review' | 'user' | 'tag'
  count?: number
}

export interface SearchSuggestionsResponse {
  suggestions: SearchSuggestion[]
  popular: string[]
  recent: string[]
}

export interface ManualBookRequest {
  title: string
  author: string
  publisher?: string
  publishedDate?: string
  isbn?: string
  coverImage?: string
  description?: string
  genre?: string[]
}

export interface SearchState {
  // Search parameters
  query: string
  type: SearchType
  filters: SearchFilters
  sort: string

  // Results
  results: {
    books: BookSearchResult[]
    reviews: ReviewSearchResult[]
    users: UserSearchResult[]
  }

  // Pagination
  pagination: {
    hasMore: boolean
    isLoading: boolean
    nextCursor?: string
  }

  // Metadata
  suggestions: string[]
  recentSearches: string[]
  facets?: {
    ratings: { recommend: number; not_recommend: number }
    authors: { username: string; count: number }[]
    books: { title: string; count: number }[]
  }
}

// Export settings types
export * from './settings'
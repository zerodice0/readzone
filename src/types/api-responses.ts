/**
 * API 응답 타입 정의
 * 
 * 백엔드와 프론트엔드 간의 계약을 명확히 하고,
 * 타입 안전성을 보장하기 위한 API 응답 타입 정의
 */

// 기본 API 응답 구조
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    errorType: string;
    message: string;
    details?: unknown;
  };
}

// 도서 타입
export interface Book {
  id: string;
  isbn: string;
  title: string;
  authors: string[];
  publisher?: string;
  publishedDate?: string;
  description?: string;
  thumbnail?: string;
  price?: number;
  url?: string;
  genre?: string;
  createdAt: string;
  updatedAt: string;
}

// 사용자 타입
export interface User {
  id: string;
  nickname: string;
  image?: string;
}

// 독후감 타입
export interface BookReview {
  id: string;
  title?: string;
  content: string;
  isRecommended: boolean;
  tags: string[];
  purchaseLink?: string;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  userId: string;
  bookId: string;
  user: User;
  book: Book;
  _count?: {
    likes: number;
    comments: number;
  };
}

// 독후감 생성 응답
export interface CreateReviewResponse {
  review: BookReview;
  message: string;
}

// 독후감 목록 응답
export interface ListReviewsResponse {
  reviews: BookReview[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// 독후감 상세 응답
export interface GetReviewResponse {
  review: BookReview;
}

// 도서 검색 응답
export interface SearchBooksResponse {
  books: Book[];
  source: 'db' | 'kakao';
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// 도서 생성 응답  
export interface CreateBookResponse {
  book: Book;
  message: string;
}

// 좋아요 토글 응답
export interface ToggleLikeResponse {
  isLiked: boolean;
  likeCount: number;
}

// 댓글 타입
export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  reviewId: string;
  user: User;
}

// 댓글 생성 응답
export interface CreateCommentResponse {
  comment: Comment;
  message: string;
}

// 댓글 목록 응답
export interface ListCommentsResponse {
  comments: Comment[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// 임시저장 응답
export interface SaveDraftResponse {
  id: string;
  message: string;
}

// 타입 가드 함수들
export function isApiResponse<T>(value: unknown): value is ApiResponse<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    typeof (value as ApiResponse<T>).success === 'boolean'
  );
}

export function isSuccessResponse<T>(response: ApiResponse<T>): response is ApiResponse<T> & { data: T } {
  return response.success === true && response.data !== undefined;
}

export function isErrorResponse(response: ApiResponse<unknown>): response is ApiResponse<unknown> & { error: NonNullable<ApiResponse['error']> } {
  return response.success === false && response.error !== undefined;
}
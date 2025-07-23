import { QueryClient } from '@tanstack/react-query'

// QueryClient 설정
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 5분간 캐시 유지
      staleTime: 5 * 60 * 1000,
      // 10분간 가비지 컬렉션 방지
      gcTime: 10 * 60 * 1000,
      // 네트워크 에러 시 자동 재시도 (3회)
      retry: (failureCount, error: any) => {
        // 401, 403, 404는 재시도하지 않음
        if (error?.status === 401 || error?.status === 403 || error?.status === 404) {
          return false
        }
        return failureCount < 3
      },
      // 재시도 간격 (exponential backoff)
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // 브라우저 포커스 시 리프레시 비활성화 (성능 최적화)
      refetchOnWindowFocus: false,
      // 네트워크 재연결 시 리프레시
      refetchOnReconnect: true,
    },
    mutations: {
      // 뮤테이션 에러 시 자동 재시도 (1회만)
      retry: 1,
      // 뮤테이션 재시도 간격
      retryDelay: 1000,
    },
  },
})

// Query Keys 관리
export const queryKeys = {
  // 인증 관련
  auth: {
    session: ['auth', 'session'] as const,
    user: (userId: string) => ['auth', 'user', userId] as const,
  },
  // 독후감 관련
  reviews: {
    all: ['reviews'] as const,
    infinite: (filters?: Record<string, any>) => ['reviews', 'infinite', filters] as const,
    detail: (id: string) => ['reviews', 'detail', id] as const,
    byUser: (userId: string) => ['reviews', 'byUser', userId] as const,
  },
  // 도서 관련
  books: {
    all: ['books'] as const,
    search: (query: string) => ['books', 'search', query] as const,
    detail: (id: string) => ['books', 'detail', id] as const,
    opinions: (bookId: string) => ['books', 'opinions', bookId] as const,
  },
  // 댓글 관련
  comments: {
    byReview: (reviewId: string) => ['comments', 'byReview', reviewId] as const,
  },
  // 좋아요 관련
  likes: {
    byUser: (userId: string) => ['likes', 'byUser', userId] as const,
  },
} as const

// 쿼리 무효화 헬퍼 함수들
export const invalidateQueries = {
  // 인증 관련 쿼리 무효화
  auth: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.auth.session })
  },
  
  // 독후감 관련 쿼리 무효화
  reviews: {
    all: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews.all })
    },
    byId: (reviewId: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews.detail(reviewId) })
    },
    byUser: (userId: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews.byUser(userId) })
    },
  },

  // 도서 관련 쿼리 무효화
  books: {
    opinions: (bookId: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.books.opinions(bookId) })
    },
  },

  // 댓글 관련 쿼리 무효화
  comments: {
    byReview: (reviewId: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.byReview(reviewId) })
    },
  },
}

// 에러 처리 헬퍼
export const handleQueryError = (error: unknown): string => {
  if (error && typeof error === 'object' && 'message' in error) {
    return error.message as string
  }
  if (typeof error === 'string') {
    return error
  }
  return '알 수 없는 오류가 발생했습니다.'
}
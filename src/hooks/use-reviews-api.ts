'use client'

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { queryKeys, handleQueryError, invalidateQueries } from '@/lib/query-client'

// 독후감 관련 타입 정의
export interface BookReview {
  id: string
  title?: string
  content: string
  isRecommended: boolean
  tags: string[]
  purchaseLink?: string
  linkClicks: number
  createdAt: Date
  updatedAt: Date
  
  user: {
    id: string
    nickname: string
    image?: string
  }
  
  book: {
    id: string
    title: string
    authors: string
    thumbnail?: string
    genre?: string
  }
  
  _count: {
    likes: number
    comments: number
  }
  
  isLiked?: boolean
}

export interface ReviewsResponse {
  reviews: BookReview[]
  nextCursor?: string
  hasMore: boolean
}

export interface CreateReviewRequest {
  title?: string
  content: string
  isRecommended: boolean
  tags: string[]
  purchaseLink?: string
  bookId: string
  kakaoData?: {
    title: string
    authors: string[]
    publisher?: string
    genre?: string
    thumbnail?: string
    isbn?: string
    url?: string
  }
}

// API 호출 함수들
const reviewsApi = {
  // 독후감 목록 조회 (무한 스크롤)
  getReviews: async ({ 
    pageParam, 
    limit = 10 
  }: { 
    pageParam?: string; 
    limit?: number 
  }): Promise<ReviewsResponse> => {
    const params = new URLSearchParams({
      limit: limit.toString(),
      ...(pageParam && { cursor: pageParam }),
    })

    const response = await fetch(`/api/reviews?${params}`)
    
    if (!response.ok) {
      throw new Error('독후감 목록을 불러오는데 실패했습니다.')
    }
    
    return response.json()
  },

  // 독후감 상세 조회
  getReview: async (id: string): Promise<BookReview> => {
    const response = await fetch(`/api/reviews/${id}`)
    
    if (!response.ok) {
      throw new Error('독후감을 불러오는데 실패했습니다.')
    }
    
    return response.json()
  },

  // 독후감 생성
  createReview: async (data: CreateReviewRequest): Promise<BookReview> => {
    const response = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.message || '독후감 작성에 실패했습니다.')
    }
    
    return result
  },

  // 독후감 수정
  updateReview: async ({ 
    id, 
    data 
  }: { 
    id: string; 
    data: Partial<CreateReviewRequest> 
  }): Promise<BookReview> => {
    const response = await fetch(`/api/reviews/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.message || '독후감 수정에 실패했습니다.')
    }
    
    return result
  },

  // 독후감 삭제
  deleteReview: async (id: string): Promise<void> => {
    const response = await fetch(`/api/reviews/${id}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      const result = await response.json()
      throw new Error(result.message || '독후감 삭제에 실패했습니다.')
    }
  },

  // 독후감 좋아요 토글
  toggleLike: async (reviewId: string): Promise<{ isLiked: boolean; likesCount: number }> => {
    const response = await fetch(`/api/reviews/${reviewId}/like`, {
      method: 'POST',
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.message || '좋아요 처리에 실패했습니다.')
    }
    
    return result
  },
}

// 독후감 무한 스크롤 조회 훅
export function useReviewsInfinite(limit: number = 10) {
  return useInfiniteQuery({
    queryKey: queryKeys.reviews.infinite({ limit }),
    queryFn: ({ pageParam }) => reviewsApi.getReviews({ pageParam, limit }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  })
}

// 독후감 상세 조회 훅
export function useReview(id: string) {
  return useQuery({
    queryKey: queryKeys.reviews.detail(id),
    queryFn: () => reviewsApi.getReview(id),
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  })
}

// 독후감 생성 훅
export function useCreateReview() {
  return useMutation({
    mutationFn: reviewsApi.createReview,
    onSuccess: (newReview) => {
      toast.success('독후감이 성공적으로 작성되었습니다.')
      
      // 독후감 목록 쿼리 무효화
      invalidateQueries.reviews.all()
      
      // 사용자별 독후감 목록 무효화
      invalidateQueries.reviews.byUser(newReview.user.id)
    },
    onError: (error) => {
      const message = handleQueryError(error)
      toast.error(message)
    },
  })
}

// 독후감 수정 훅
export function useUpdateReview() {
  return useMutation({
    mutationFn: reviewsApi.updateReview,
    onSuccess: () => {
      toast.success('독후감이 성공적으로 수정되었습니다.')
      
      // 독후감 목록 쿼리 무효화
      invalidateQueries.reviews.all()
    },
    onError: (error) => {
      const message = handleQueryError(error)
      toast.error(message)
    },
  })
}

// 독후감 삭제 훅
export function useDeleteReview() {
  return useMutation({
    mutationFn: reviewsApi.deleteReview,
    onSuccess: () => {
      toast.success('독후감이 성공적으로 삭제되었습니다.')
      
      // 독후감 목록 쿼리 무효화
      invalidateQueries.reviews.all()
    },
    onError: (error) => {
      const message = handleQueryError(error)
      toast.error(message)
    },
  })
}

// 독후감 좋아요 훅
export function useToggleLike() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: reviewsApi.toggleLike,
    onMutate: async (reviewId) => {
      // 낙관적 업데이트를 위해 이전 쿼리 취소
      await queryClient.cancelQueries({ queryKey: queryKeys.reviews.detail(reviewId) })
      
      // 이전 데이터 스냅샷
      const previousReview = queryClient.getQueryData<BookReview>(
        queryKeys.reviews.detail(reviewId)
      )
      
      // 낙관적 업데이트
      if (previousReview) {
        const newLikesCount = previousReview.isLiked 
          ? previousReview._count.likes - 1 
          : previousReview._count.likes + 1
          
        queryClient.setQueryData<BookReview>(
          queryKeys.reviews.detail(reviewId),
          {
            ...previousReview,
            isLiked: !previousReview.isLiked,
            _count: {
              ...previousReview._count,
              likes: newLikesCount,
            },
          }
        )
      }
      
      return { previousReview }
    },
    onError: (error, reviewId, context) => {
      // 에러 발생 시 이전 상태로 롤백
      if (context?.previousReview) {
        queryClient.setQueryData(
          queryKeys.reviews.detail(reviewId),
          context.previousReview
        )
      }
      
      const message = handleQueryError(error)
      toast.error(message)
    },
    onSettled: (_, __, reviewId) => {
      // 성공/실패 관계없이 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews.detail(reviewId) })
    },
  })
}
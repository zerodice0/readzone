import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import type { ReviewListResponse } from '@/types/review'

interface UseReviewsOptions {
  userId?: string
  bookId?: string
  tags?: string
  sort?: 'latest' | 'popular' | 'recommended'
  search?: string
  limit?: number
}

export function useReviews(options: UseReviewsOptions = {}) {
  const searchParams = useSearchParams()
  
  // URL 쿼리 파라미터와 옵션 병합
  const queryOptions = {
    userId: options.userId || searchParams.get('userId') || undefined,
    bookId: options.bookId || searchParams.get('bookId') || undefined,
    tags: options.tags || searchParams.get('tags') || undefined,
    sort: (options.sort || searchParams.get('sort') || 'latest') as 'latest' | 'popular' | 'recommended',
    search: options.search || searchParams.get('search') || undefined,
    limit: options.limit || 10,
  }

  return useInfiniteQuery<ReviewListResponse>({
    queryKey: ['reviews', queryOptions],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams()
      
      // 페이지네이션 파라미터
      params.append('page', String(pageParam))
      params.append('limit', String(queryOptions.limit))
      
      // 필터 파라미터
      if (queryOptions.userId) params.append('userId', queryOptions.userId)
      if (queryOptions.bookId) params.append('bookId', queryOptions.bookId)
      if (queryOptions.tags) params.append('tags', queryOptions.tags)
      if (queryOptions.sort) params.append('sort', queryOptions.sort)
      if (queryOptions.search) params.append('search', queryOptions.search)
      
      const response = await fetch(`/api/reviews?${params.toString()}`)
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || '독후감 목록을 불러오는데 실패했습니다.')
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error?.message || '독후감 목록을 불러오는데 실패했습니다.')
      }
      
      return result.data
    },
    getNextPageParam: (lastPage) => {
      // 다음 페이지가 있으면 다음 페이지 번호 반환
      if (lastPage.pagination.hasNext) {
        return lastPage.pagination.page + 1
      }
      return undefined
    },
    initialPageParam: 1,
    staleTime: 1000 * 60 * 5, // 5분
    gcTime: 1000 * 60 * 10, // 10분 (이전 cacheTime)
  })
}

// 독후감 좋아요 토글 mutation
export function useToggleReviewLike() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (reviewId: string) => {
      const response = await fetch(`/api/reviews/${reviewId}/like`, {
        method: 'POST',
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || '좋아요 처리에 실패했습니다.')
      }
      
      return response.json()
    },
    onSuccess: (data, reviewId) => {
      // 관련된 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
      queryClient.invalidateQueries({ queryKey: ['review', reviewId] })
    },
  })
}
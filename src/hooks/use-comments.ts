'use client'

import { useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { CommentDetail, CommentTree, CreateCommentInput, UpdateCommentInput } from '@/types/comment'

interface UseCommentsOptions {
  reviewId: string
  sort?: 'latest' | 'oldest' | 'most_liked'
  limit?: number
}

interface CommentResponse {
  success: boolean
  data: {
    comments: CommentTree[]
    pagination: {
      page: number
      limit: number
      total: number
      hasMore: boolean
      nextCursor?: string
    }
    meta: {
      sort: string
      parentId: string | null
      isAuthenticated: boolean
    }
  }
}

interface CommentMutationResponse {
  success: boolean
  data: {
    comment: CommentDetail
    message: string
  }
}

export function useComments({ reviewId, sort = 'latest', limit = 20 }: UseCommentsOptions) {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)

  // 댓글 목록 조회
  const {
    data: commentsData,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['comments', reviewId, sort, page, limit],
    queryFn: async (): Promise<CommentResponse> => {
      const params = new URLSearchParams({
        sort,
        page: page.toString(),
        limit: limit.toString(),
      })

      const response = await fetch(`/api/reviews/${reviewId}/comments?${params}`)
      
      if (!response.ok) {
        throw new Error('댓글을 불러오는데 실패했습니다.')
      }

      return response.json()
    },
    enabled: !!reviewId,
    staleTime: 30 * 1000, // 30초
    gcTime: 5 * 60 * 1000, // 5분
  })

  // 댓글 작성
  const createCommentMutation = useMutation({
    mutationFn: async (input: CreateCommentInput): Promise<CommentMutationResponse> => {
      const response = await fetch(`/api/reviews/${reviewId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || '댓글 작성에 실패했습니다.')
      }

      return result
    },
    onSuccess: (data) => {
      // 댓글 목록 새로고침
      queryClient.invalidateQueries({ queryKey: ['comments', reviewId] })
      toast.success(data.data.message)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  // 댓글 수정
  const updateCommentMutation = useMutation({
    mutationFn: async ({ commentId, input }: { commentId: string; input: UpdateCommentInput }): Promise<CommentMutationResponse> => {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || '댓글 수정에 실패했습니다.')
      }

      return result
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['comments', reviewId] })
      toast.success(data.data.message)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  // 댓글 삭제
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string): Promise<{ success: boolean; data: { message: string } }> => {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || '댓글 삭제에 실패했습니다.')
      }

      return result
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['comments', reviewId] })
      toast.success(data.data.message)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  // 댓글 좋아요 토글
  const toggleLikeMutation = useMutation({
    mutationFn: async (commentId: string): Promise<{ success: boolean; data: { isLiked: boolean; likeCount: number; message: string } }> => {
      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: 'POST',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || '좋아요 처리에 실패했습니다.')
      }

      return result
    },
    onSuccess: (data) => {
      // 캐시 업데이트 (옵티미스틱 업데이트 대신 간단한 재조회)
      queryClient.invalidateQueries({ queryKey: ['comments', reviewId] })
      toast.success(data.data.message)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  // 댓글 작성 함수
  const createComment = useCallback(
    (content: string, parentId?: string) => {
      if (!session) {
        toast.error('로그인이 필요합니다.')
        return
      }

      createCommentMutation.mutate({ content, parentId })
    },
    [session, createCommentMutation]
  )

  // 댓글 수정 함수
  const updateComment = useCallback(
    (commentId: string, content: string) => {
      if (!session) {
        toast.error('로그인이 필요합니다.')
        return
      }

      updateCommentMutation.mutate({ commentId, input: { content } })
    },
    [session, updateCommentMutation]
  )

  // 댓글 삭제 함수
  const deleteComment = useCallback(
    (commentId: string) => {
      if (!session) {
        toast.error('로그인이 필요합니다.')
        return
      }

      if (confirm('정말로 댓글을 삭제하시겠습니까?')) {
        deleteCommentMutation.mutate(commentId)
      }
    },
    [session, deleteCommentMutation]
  )

  // 댓글 좋아요 토글 함수
  const toggleLike = useCallback(
    (commentId: string) => {
      if (!session) {
        toast.error('로그인이 필요합니다.')
        return
      }

      toggleLikeMutation.mutate(commentId)
    },
    [session, toggleLikeMutation]
  )

  // 더 보기 (페이지네이션)
  const loadMore = useCallback(() => {
    if (commentsData?.data.pagination.hasMore) {
      setPage(prev => prev + 1)
    }
  }, [commentsData?.data.pagination.hasMore])

  // 정렬 변경
  const changeSort = useCallback((newSort: 'latest' | 'oldest' | 'most_liked') => {
    setPage(1)
    queryClient.invalidateQueries({ queryKey: ['comments', reviewId] })
  }, [queryClient, reviewId])

  return {
    // 데이터
    comments: commentsData?.data.comments || [],
    pagination: commentsData?.data.pagination,
    meta: commentsData?.data.meta,
    
    // 상태
    isLoading,
    isError,
    error,
    
    // 뮤테이션 상태
    isCreating: createCommentMutation.isPending,
    isUpdating: updateCommentMutation.isPending,
    isDeleting: deleteCommentMutation.isPending,
    isTogglingLike: toggleLikeMutation.isPending,
    
    // 액션
    createComment,
    updateComment,
    deleteComment,
    toggleLike,
    loadMore,
    changeSort,
    refetch,
  }
}

// 개별 댓글 상세 정보 조회 훅
export function useComment(commentId: string) {
  const { data: session } = useSession()

  return useQuery({
    queryKey: ['comment', commentId],
    queryFn: async (): Promise<{ success: boolean; data: { comment: CommentDetail } }> => {
      const response = await fetch(`/api/comments/${commentId}`)
      
      if (!response.ok) {
        throw new Error('댓글 정보를 불러오는데 실패했습니다.')
      }

      return response.json()
    },
    enabled: !!commentId,
    staleTime: 30 * 1000, // 30초
  })
}
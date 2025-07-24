'use client'

import { useState, useCallback, useEffect } from 'react'
import { AnimatedLikeButton, useLikeState } from '@/components/ui/animated-like-button'
import { useBatchedLike } from '@/lib/like-batch-manager'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface LikeButtonProps {
  /**
   * 독후감 또는 댓글 ID
   */
  reviewId?: string
  commentId?: string
  /**
   * 초기 좋아요 상태
   */
  isLiked: boolean
  /**
   * 초기 좋아요 수
   */
  likeCount: number
  /**
   * 버튼 비활성화 여부
   */
  disabled?: boolean
  /**
   * 버튼 크기
   */
  size?: 'sm' | 'md' | 'lg'
  /**
   * 좋아요 수 표시 여부
   */
  showCount?: boolean
  /**
   * 폭발 애니메이션 표시 여부
   */
  showExplosion?: boolean
  /**
   * 버튼 스타일 변형
   */
  variant?: 'default' | 'minimal' | 'floating'
  /**
   * 추가 CSS 클래스
   */
  className?: string
  /**
   * 좋아요 상태 변경 시 호출될 콜백 (선택사항)
   */
  onToggle?: (isLiked: boolean, likeCount: number) => void
}

/**
 * 향상된 좋아요 버튼 컴포넌트
 * 
 * Features:
 * - 고성능 애니메이션 (60fps)
 * - 낙관적 업데이트 (Optimistic Updates)
 * - 오프라인 상태 처리
 * - 에러 복구 시스템
 * - 접근성 최적화
 * 
 * @example
 * ```tsx
 * // 독후감 좋아요
 * <LikeButton
 *   reviewId="review-123"
 *   isLiked={review.isLiked}
 *   likeCount={review.likeCount}
 *   variant="default"
 *   showExplosion={true}
 * />
 * 
 * // 댓글 좋아요 (미니멀)
 * <LikeButton
 *   commentId="comment-456"
 *   isLiked={comment.isLiked}
 *   likeCount={comment.likeCount}
 *   variant="minimal"
 *   size="sm"
 *   showExplosion={false}
 * />
 * ```
 */
export function LikeButton({
  reviewId,
  commentId,
  isLiked: initialLiked,
  likeCount: initialCount,
  disabled = false,
  size = 'md',
  showCount = true,
  showExplosion = true,
  variant = 'default',
  className,
  onToggle
}: LikeButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [useBatchMode, setUseBatchMode] = useState(true)
  
  // 배치 모드 좋아요 훅
  const { toggleLike: batchToggleLike, getQueueStatus } = useBatchedLike()
  
  // 낙관적 업데이트를 위한 상태 관리
  const { isLiked, likeCount, isOptimistic, isOffline, toggleLike } = useLikeState(initialLiked, initialCount)

  // 배치 처리 상태 모니터링 (개발 환경)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const interval = setInterval(() => {
        const status = getQueueStatus()
        if (status.queueSize > 0) {
          console.debug('Like queue status:', status)
        }
      }, 5000)
      
      return () => clearInterval(interval)
    }
  }, [getQueueStatus])

  // 배치 API 호출 함수
  const callBatchLikeAPI = useCallback(async (): Promise<{ isLiked: boolean; likeCount: number }> => {
    if (!reviewId && !commentId) {
      throw new Error('ID가 필요합니다.')
    }

    const id = reviewId || commentId!
    const type = reviewId ? 'review' : 'comment'
    
    return await batchToggleLike(id, type, isLiked)
  }, [reviewId, commentId, isLiked, batchToggleLike])

  // 단일 API 호출 함수 (폴백용)
  const callSingleLikeAPI = useCallback(async (): Promise<{ isLiked: boolean; likeCount: number }> => {
    const endpoint = reviewId 
      ? `/api/reviews/${reviewId}/like`
      : `/api/comments/${commentId}/like`

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      
      if (response.status === 401) {
        throw new Error('로그인이 필요합니다.')
      } else if (response.status === 404) {
        throw new Error('콘텐츠를 찾을 수 없습니다.')
      } else if (response.status >= 500) {
        throw new Error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
      } else {
        throw new Error(errorData.error?.message || '좋아요 처리에 실패했습니다.')
      }
    }

    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error?.message || '좋아요 처리에 실패했습니다.')
    }

    return {
      isLiked: data.data.isLiked,
      likeCount: data.data.likeCount
    }
  }, [reviewId, commentId])

  // 좋아요 토글 핸들러
  const handleToggle = useCallback(async () => {
    if (disabled || isProcessing) return
    if (!reviewId && !commentId) {
      console.error('reviewId 또는 commentId가 필요합니다.')
      return
    }

    setIsProcessing(true)

    try {
      // 배치 모드 또는 단일 모드 선택
      const apiCall = useBatchMode ? callBatchLikeAPI : callSingleLikeAPI
      const result = await toggleLike(apiCall)
      
      // 성공 피드백 (오프라인이 아닐 때만)
      if (!isOptimistic && !isOffline) {
        toast.success(
          result.isLiked 
            ? '좋아요를 추가했습니다!' 
            : '좋아요를 취소했습니다.'
        )
      } else if (isOffline) {
        toast.info('오프라인 상태입니다. 온라인 복귀 시 동기화됩니다.')
      }

      // 상위 컴포넌트에 상태 변경 알림
      onToggle?.(result.isLiked, result.likeCount)

    } catch (error) {
      console.error('Like toggle error:', error)
      
      // 배치 모드 실패 시 단일 모드로 재시도
      if (useBatchMode && error instanceof Error && error.message.includes('batch')) {
        console.log('Batch mode failed, falling back to single mode')
        setUseBatchMode(false)
        
        try {
          const result = await toggleLike(callSingleLikeAPI)
          onToggle?.(result.isLiked, result.likeCount)
          return
        } catch (fallbackError) {
          console.error('Fallback single mode also failed:', fallbackError)
        }
      }
      
      // 사용자 친화적 에러 메시지
      const errorMessage = error instanceof Error 
        ? error.message 
        : '좋아요 처리 중 오류가 발생했습니다.'
      
      if (!isOffline) {
        toast.error(errorMessage)
      }
      
      // 오프라인 상태 체크
      if (!navigator.onLine) {
        toast.info('인터넷 연결을 확인한 후 다시 시도해주세요.')
      }
    } finally {
      setIsProcessing(false)
    }
  }, [
    disabled, 
    isProcessing, 
    reviewId, 
    commentId, 
    toggleLike, 
    callBatchLikeAPI, 
    callSingleLikeAPI, 
    useBatchMode, 
    isOptimistic, 
    isOffline, 
    onToggle
  ])

  const ariaLabel = reviewId 
    ? `독후감 ${isLiked ? '좋아요 취소' : '좋아요'} (${likeCount}개)`
    : `댓글 ${isLiked ? '좋아요 취소' : '좋아요'} (${likeCount}개)`

  return (
    <AnimatedLikeButton
      isLiked={isLiked}
      likeCount={likeCount}
      onToggle={handleToggle}
      disabled={disabled || isProcessing}
      size={size}
      showCount={showCount}
      showExplosion={showExplosion}
      variant={variant}
      className={cn(
        // 낙관적 업데이트 중일 때 시각적 피드백
        isOptimistic && 'opacity-80',
        // 오프라인 상태 표시
        isOffline && 'ring-2 ring-orange-300 ring-opacity-50',
        // 처리 중일 때 포인터 이벤트 비활성화
        isProcessing && 'pointer-events-none',
        className
      )}
      aria-label={ariaLabel}
    />
  )
}

// 좋아요 버튼 기본 내보내기 (하위 호환성)
export default LikeButton
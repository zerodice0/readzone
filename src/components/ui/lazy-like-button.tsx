'use client'

import { memo, useMemo } from 'react'
import { AnimatedLikeButton, type AnimatedLikeButtonProps } from '@/components/ui/animated-like-button'
import { useLazyLoad } from '@/hooks/use-intersection-observer'
import { cn } from '@/lib/utils'

interface LazyLikeButtonProps extends Omit<AnimatedLikeButtonProps, 'showExplosion'> {
  /**
   * 애니메이션을 비활성화할 거리 (뷰포트로부터)
   */
  rootMargin?: string
  /**
   * 가시성 임계값
   */
  threshold?: number
  /**
   * 폭발 애니메이션을 항상 표시할지 여부
   */
  forceExplosion?: boolean
  /**
   * 성능 최적화 수준
   */
  optimizationLevel?: 'low' | 'medium' | 'high'
}

/**
 * 성능 최적화된 지연 로딩 좋아요 버튼
 * 
 * Features:
 * - Intersection Observer를 사용한 가시성 기반 애니메이션 활성화
 * - 뷰포트 밖의 버튼들은 애니메이션 비활성화로 성능 최적화
 * - 메모이제이션을 통한 불필요한 리렌더링 방지
 * - 3단계 최적화 수준 제공
 * 
 * @example
 * ```tsx
 * <LazyLikeButton
 *   reviewId="review-123"
 *   isLiked={false}
 *   likeCount={42}
 *   optimizationLevel="high"
 *   rootMargin="100px"
 * />
 * ```
 */
export const LazyLikeButton = memo<LazyLikeButtonProps>(function LazyLikeButton({
  rootMargin = '200px',
  threshold = 0.1,
  forceExplosion = false,
  optimizationLevel = 'medium',
  className,
  ...props
}) {
  // 가시성 기반 지연 로딩
  const { ref, isVisible, shouldRender } = useLazyLoad<HTMLDivElement>({
    threshold,
    rootMargin,
    once: false // 스크롤 시 다시 감지
  })

  // 최적화 레벨별 설정
  const optimizationConfig = useMemo(() => {
    switch (optimizationLevel) {
      case 'low':
        return {
          showExplosion: forceExplosion || isVisible,
          enableHaptic: isVisible,
          enableParticles: forceExplosion || isVisible,
          animationQuality: 'high' as const
        }
      case 'medium':
        return {
          showExplosion: forceExplosion || isVisible,
          enableHaptic: isVisible,
          enableParticles: forceExplosion || isVisible,
          animationQuality: isVisible ? 'high' : 'medium' as const
        }
      case 'high':
        return {
          showExplosion: forceExplosion || (isVisible && shouldRender),
          enableHaptic: isVisible && shouldRender,
          enableParticles: forceExplosion || (isVisible && shouldRender),
          animationQuality: (isVisible && shouldRender) ? 'high' : 'low' as const
        }
      default:
        return {
          showExplosion: forceExplosion || isVisible,
          enableHaptic: isVisible,
          enableParticles: forceExplosion || isVisible,
          animationQuality: 'medium' as const
        }
    }
  }, [optimizationLevel, isVisible, shouldRender, forceExplosion])

  // 성능 최적화를 위한 조건부 렌더링
  if (optimizationLevel === 'high' && !shouldRender) {
    return (
      <div 
        ref={ref}
        className={cn('inline-block h-10 w-16', className)}
        aria-hidden="true"
      >
        {/* 플레이스홀더 - 레이아웃 유지 */}
        <div className="h-full w-full bg-gray-100 animate-pulse rounded" />
      </div>
    )
  }

  return (
    <div ref={ref} className={cn('inline-block', className)}>
      <AnimatedLikeButton
        {...props}
        showExplosion={optimizationConfig.showExplosion}
        className={cn(
          // 성능 최적화를 위한 조건부 스타일
          !isVisible && optimizationLevel === 'high' && 'transform-gpu',
          !optimizationConfig.enableParticles && 'pointer-events-auto'
        )}
      />
    </div>
  )
})

/**
 * 대량의 좋아요 버튼을 위한 배치 최적화 컨테이너
 * 무한 스크롤 피드에서 성능 최적화를 위해 사용
 */
interface LikeBatchContainerProps {
  children: React.ReactNode
  /**
   * 동시에 활성화할 최대 애니메이션 수
   */
  maxActiveAnimations?: number
  /**
   * 성능 모니터링 활성화
   */
  enablePerformanceMonitoring?: boolean
  className?: string
}

export const LikeBatchContainer = memo<LikeBatchContainerProps>(function LikeBatchContainer({
  children,
  className
}) {
  return (
    <div 
      className={cn(
        'like-batch-container',
        // GPU 가속 활성화
        'transform-gpu will-change-transform',
        className
      )}
      style={{
        // CSS 컨테인먼트를 사용한 성능 최적화
        contain: 'layout style paint',
        // 하드웨어 가속 힌트
        backfaceVisibility: 'hidden',
        perspective: 1000
      }}
    >
      {children}
    </div>
  )
})

/**
 * 성능 메트릭을 수집하는 좋아요 버튼 훅
 * 개발 환경에서 성능 분석용
 */
export function useLikeButtonPerformance() {
  const startMeasure = (id: string) => {
    if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') return

    performance.mark(`like-start-${id}`)
  }

  const endMeasure = (id: string) => {
    if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') return

    try {
      performance.mark(`like-end-${id}`)
      performance.measure(
        `like-animation-${id}`,
        `like-start-${id}`,
        `like-end-${id}`
      )
    } catch (error) {
      console.warn('Performance measurement failed:', error)
    }
  }

  const getMetrics = () => {
    if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') return []

    return performance.getEntriesByType('measure')
      .filter(entry => entry.name.includes('like-animation'))
      .map(entry => ({
        id: entry.name.replace('like-animation-', ''),
        duration: entry.duration,
        startTime: entry.startTime
      }))
  }

  const clearMetrics = () => {
    if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') return

    performance.clearMeasures()
    performance.clearMarks()
  }

  return {
    startMeasure,
    endMeasure,
    getMetrics,
    clearMetrics
  }
}
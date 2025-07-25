'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Heart, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AnimatedLikeButtonProps {
  isLiked: boolean
  likeCount: number
  onToggle: () => Promise<void> | void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  showCount?: boolean
  showExplosion?: boolean
  variant?: 'default' | 'minimal' | 'floating'
  className?: string
  'aria-label'?: string
}

interface ParticleConfig {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
}

/**
 * 고성능 애니메이션 좋아요 버튼 컴포넌트
 * 
 * Features:
 * - 60fps 부드러운 애니메이션
 * - 하트 폭발 파티클 효과
 * - 멀티 디바이스 햅틱 피드백
 * - 접근성 최적화 (screen reader, 키보드)
 * - 성능 최적화 (requestAnimationFrame, 메모화)
 * - 오프라인 상태 처리
 */
export function AnimatedLikeButton({
  isLiked,
  likeCount,
  onToggle,
  disabled = false,
  size = 'md',
  showCount = true,
  showExplosion = true,
  variant = 'default',
  className,
  'aria-label': ariaLabel
}: AnimatedLikeButtonProps) {
  // Animation state
  const [isAnimating, setIsAnimating] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showParticles, setShowParticles] = useState(false)
  const [particles, setParticles] = useState<ParticleConfig[]>([])
  
  // Performance refs
  const animationFrameRef = useRef<number>()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const particleCanvasRef = useRef<HTMLDivElement>(null)
  const lastAnimationTime = useRef<number>(0)
  const touchStartTime = useRef<number>(0)
  const debounceTimeoutRef = useRef<NodeJS.Timeout>()

  // Debounced toggle to prevent spam clicks
  const debouncedToggle = useCallback(async () => {
    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    // Set new timeout
    debounceTimeoutRef.current = setTimeout(async () => {
      if (disabled || isLoading) return

      try {
        setIsLoading(true)
        await onToggle()
      } catch (error) {
        console.error('Like toggle error:', error)
      } finally {
        setIsLoading(false)
      }
    }, 300)
  }, [onToggle, disabled, isLoading])

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [])

  // Generate heart explosion particles
  const generateParticles = useCallback((centerX: number, centerY: number) => {
    const particleCount = 12
    const newParticles: ParticleConfig[] = []

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2
      const velocity = 2 + Math.random() * 3
      const life = 800 + Math.random() * 400

      newParticles.push({
        id: i,
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        life,
        maxLife: life,
        color: `hsl(${340 + Math.random() * 40}, 90%, ${60 + Math.random() * 20}%)`,
        size: 3 + Math.random() * 4
      })
    }

    return newParticles
  }, [])

  // Animate particles with RAF
  const animateParticles = useCallback((timestamp: number) => {
    if (timestamp - lastAnimationTime.current < 16) {
      // Cap at 60fps
      animationFrameRef.current = requestAnimationFrame(animateParticles)
      return
    }

    lastAnimationTime.current = timestamp

    setParticles(currentParticles => {
      const updatedParticles = currentParticles
        .map(particle => ({
          ...particle,
          x: particle.x + particle.vx,
          y: particle.y + particle.vy,
          vy: particle.vy + 0.1, // gravity
          life: particle.life - 16,
          size: particle.size * 0.98 // shrink over time
        }))
        .filter(particle => particle.life > 0)

      if (updatedParticles.length > 0) {
        animationFrameRef.current = requestAnimationFrame(animateParticles)
      } else {
        setShowParticles(false)
      }

      return updatedParticles
    })
  }, [])

  // Trigger haptic feedback on supported devices
  const triggerHaptic = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate(50) // 50ms vibration
    }
    
    // iOS haptic feedback
    if ('Taptic' in window || 'webkit' in window) {
      try {
        // @ts-ignore - iOS specific API
        const impact = new window.UIImpactFeedbackGenerator()
        impact?.impactOccurred?.()
      } catch (e) {
        // Silently fail for non-iOS devices
      }
    }
  }, [])

  // Handle button click with all animations
  const handleClick = useCallback(async () => {
    if (disabled || isLoading) return

    // Set immediate animation state
    setIsAnimating(true)
    
    // Trigger haptic feedback
    triggerHaptic()

    // Generate particle explosion for like action
    if (!isLiked && showExplosion && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      
      const newParticles = generateParticles(centerX, centerY)
      setParticles(newParticles)
      setShowParticles(true)
      
      // Start particle animation
      animationFrameRef.current = requestAnimationFrame(animateParticles)
    }

    // Execute the toggle action
    await debouncedToggle()

    // End button animation after delay
    setTimeout(() => setIsAnimating(false), 400)
  }, [disabled, isLoading, isLiked, showExplosion, triggerHaptic, generateParticles, animateParticles, debouncedToggle])

  // Touch handling for better mobile experience
  const handleTouchStart = useCallback(() => {
    touchStartTime.current = Date.now()
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const touchDuration = Date.now() - touchStartTime.current
    if (touchDuration < 500) { // Quick tap
      e.preventDefault()
      handleClick()
    }
  }, [handleClick])

  // Cleanup animation frames
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  // Size configurations
  const sizeConfig = {
    sm: {
      button: 'h-8 px-3 text-xs',
      icon: 'h-3.5 w-3.5',
      gap: 'gap-1.5',
      text: 'text-xs'
    },
    md: {
      button: 'h-10 px-4 text-sm',
      icon: 'h-4 w-4',
      gap: 'gap-2',
      text: 'text-sm'
    },
    lg: {
      button: 'h-12 px-6 text-base',
      icon: 'h-5 w-5',
      gap: 'gap-2.5',
      text: 'text-base'
    }
  }

  // Variant configurations
  const variantConfig = {
    default: {
      base: 'transition-all duration-300 ease-out',
      liked: 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25',
      unliked: 'bg-white hover:bg-red-50 text-gray-600 hover:text-red-500 border border-gray-200 hover:border-red-200',
      disabled: 'opacity-50 cursor-not-allowed'
    },
    minimal: {
      base: 'transition-all duration-300 ease-out bg-transparent border-none shadow-none',
      liked: 'text-red-500 hover:text-red-600',
      unliked: 'text-gray-400 hover:text-red-400',
      disabled: 'opacity-50 cursor-not-allowed'
    },
    floating: {
      base: 'transition-all duration-300 ease-out rounded-full shadow-lg hover:shadow-xl',
      liked: 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/25',
      unliked: 'bg-white hover:bg-red-50 text-gray-600 hover:text-red-500 border border-gray-200',
      disabled: 'opacity-50 cursor-not-allowed'
    }
  }

  const config = sizeConfig[size]
  const vConfig = variantConfig[variant]

  return (
    <div className="relative inline-block">
      <Button
        ref={buttonRef}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        disabled={disabled || isLoading}
        className={cn(
          vConfig.base,
          config.button,
          config.gap,
          isLiked ? vConfig.liked : vConfig.unliked,
          disabled && vConfig.disabled,
          isAnimating && 'scale-110 transform',
          isLoading && 'pointer-events-none',
          className
        )}
        aria-label={ariaLabel || `${isLiked ? '좋아요 취소' : '좋아요'} (${likeCount}개)`}
        aria-pressed={isLiked}
        data-testid="animated-like-button"
      >
        {/* Loading spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Heart icon with enhanced animations */}
        <Heart 
          className={cn(
            config.icon,
            'transition-all duration-300 ease-out',
            isLiked ? 'fill-current scale-110' : 'scale-100',
            isAnimating && !isLoading && 'animate-bounce scale-125',
            isLoading && 'opacity-0'
          )}
          style={{
            filter: isLiked ? 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.6))' : 'none'
          }}
        />

        {/* Like count with smooth transitions */}
        {showCount && (
          <span className={cn(
            config.text,
            'font-medium transition-all duration-300 ease-out',
            isAnimating && !isLoading && 'scale-110',
            isLoading && 'opacity-0'
          )}>
            {likeCount.toLocaleString()}
          </span>
        )}

        {/* Sparkle effect for special moments */}
        {isLiked && !isLoading && (
          <Sparkles className={cn(
            'absolute -top-1 -right-1 w-3 h-3 text-yellow-400',
            'animate-pulse opacity-75'
          )} />
        )}
      </Button>

      {/* Particle explosion container */}
      {showExplosion && showParticles && (
        <div 
          ref={particleCanvasRef}
          className="absolute inset-0 pointer-events-none overflow-hidden"
          aria-hidden="true"
        >
          {particles.map(particle => (
            <div
              key={particle.id}
              className="absolute w-1 h-1 rounded-full pointer-events-none"
              style={{
                left: `${particle.x}px`,
                top: `${particle.y}px`,
                backgroundColor: particle.color,
                transform: `scale(${particle.size / 4})`,
                opacity: particle.life / particle.maxLife,
                filter: 'blur(0.5px)'
              }}
            />
          ))}
        </div>
      )}

      {/* Ripple effect on click */}
      {isAnimating && (
        <div className={cn(
          'absolute inset-0 rounded-full',
          'animate-ping bg-red-400 opacity-20 pointer-events-none',
          variant === 'floating' && 'rounded-full'
        )} />
      )}
    </div>
  )
}

// Hook for managing like state with optimistic updates and offline support
export function useLikeState(initialLiked: boolean, initialCount: number) {
  const [isLiked, setIsLiked] = useState(initialLiked)
  const [likeCount, setLikeCount] = useState(initialCount)
  const [isOptimistic, setIsOptimistic] = useState(false)
  const [isOffline, setIsOffline] = useState(false)

  // 온라인/오프라인 상태 감지
  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)
    
    setIsOffline(!navigator.onLine)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Service Worker 메시지 리스너
  useEffect(() => {
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data.type === 'LIKES_SYNCED') {
        // 오프라인 좋아요가 동기화되었을 때 상태 업데이트
        console.log('Likes synced from service worker')
        setIsOptimistic(false)
      }
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage)
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage)
      }
    }
  }, [])

  const toggleLike = useCallback(async (apiCall: () => Promise<{ isLiked: boolean; likeCount: number }>) => {
    // Optimistic update
    const newLiked = !isLiked
    const newCount = isLiked ? likeCount - 1 : likeCount + 1
    
    setIsLiked(newLiked)
    setLikeCount(newCount)
    setIsOptimistic(true)

    try {
      if (isOffline) {
        // 오프라인 상태에서는 Service Worker에 저장
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready
          registration.active?.postMessage({
            type: 'SAVE_OFFLINE_LIKE',
            data: {
              type: 'review', // API 호출에서 타입을 추출해야 함
              action: newLiked ? 'like' : 'unlike',
              targetId: 'temp-id', // API 호출에서 ID를 추출해야 함
              optimisticState: { isLiked: newLiked, likeCount: newCount }
            }
          })
        }
        
        // 오프라인에서는 낙관적 업데이트만 유지
        return { isLiked: newLiked, likeCount: newCount }
      }

      // 온라인 상태에서는 정상 API 호출
      const result = await apiCall()
      
      // Update with server response
      setIsLiked(result.isLiked)
      setLikeCount(result.likeCount)
      
      return result
    } catch (error) {
      // Revert optimistic update on error
      setIsLiked(isLiked)
      setLikeCount(likeCount)
      throw error
    } finally {
      if (!isOffline) {
        setIsOptimistic(false)
      }
      // 오프라인에서는 동기화될 때까지 optimistic 상태 유지
    }
  }, [isLiked, likeCount, isOffline])

  return {
    isLiked,
    likeCount,
    isOptimistic,
    isOffline,
    toggleLike
  }
}
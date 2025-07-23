'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LikeButtonProps {
  isLiked: boolean
  likeCount: number
  onToggle: () => Promise<void> | void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  showCount?: boolean
  className?: string
}

export function LikeButton({
  isLiked,
  likeCount,
  onToggle,
  disabled = false,
  size = 'md',
  showCount = true,
  className = ''
}: LikeButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    if (disabled || isLoading) return

    try {
      setIsLoading(true)
      setIsAnimating(true)
      
      await onToggle()
      
      // 애니메이션 효과를 위한 지연
      setTimeout(() => {
        setIsAnimating(false)
      }, 300)
    } catch (error) {
      console.error('좋아요 처리 실패:', error)
      setIsAnimating(false)
    } finally {
      setIsLoading(false)
    }
  }

  const sizeConfig = {
    sm: {
      button: 'h-8 px-2 text-xs',
      icon: 'h-3 w-3',
      gap: 'gap-1'
    },
    md: {
      button: 'h-9 px-3 text-sm',
      icon: 'h-4 w-4',
      gap: 'gap-1.5'
    },
    lg: {
      button: 'h-10 px-4 text-base',
      icon: 'h-5 w-5',
      gap: 'gap-2'
    }
  }

  const config = sizeConfig[size]

  return (
    <Button
      variant={isLiked ? "default" : "ghost"}
      size="sm"
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={cn(
        'transition-all duration-200',
        config.button,
        config.gap,
        isLiked ? 
          'bg-red-500 hover:bg-red-600 text-white' : 
          'text-gray-600 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400',
        disabled && 'opacity-50 cursor-not-allowed',
        isAnimating && 'scale-110',
        className
      )}
    >
      <Heart 
        className={cn(
          config.icon,
          'transition-all duration-200',
          isLiked ? 'fill-current' : '',
          isAnimating && 'animate-pulse scale-125'
        )}
      />
      {showCount && (
        <span className={cn(
          'font-medium transition-all duration-200',
          isAnimating && 'scale-110'
        )}>
          {likeCount.toLocaleString()}
        </span>
      )}
    </Button>
  )
}

// 좋아요 애니메이션을 위한 하트 폭발 효과 컴포넌트
export function LikeExplosion({ isVisible }: { isVisible: boolean }) {
  if (!isVisible) return null

  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="relative w-full h-full">
        {/* 하트 파티클들 */}
        {Array.from({ length: 6 }).map((_, i) => (
          <Heart
            key={i}
            className={cn(
              'absolute h-3 w-3 fill-red-500 text-red-500',
              'animate-ping opacity-75',
              // 각각 다른 위치와 지연으로 애니메이션
              i === 0 && 'top-0 left-1/2 -translate-x-1/2 animation-delay-0',
              i === 1 && 'top-1/4 right-0 animation-delay-75',
              i === 2 && 'bottom-1/4 right-0 animation-delay-150',
              i === 3 && 'bottom-0 left-1/2 -translate-x-1/2 animation-delay-225',
              i === 4 && 'bottom-1/4 left-0 animation-delay-300',
              i === 5 && 'top-1/4 left-0 animation-delay-375'
            )}
            style={{
              animationDuration: '600ms',
              animationFillMode: 'forwards'
            }}
          />
        ))}
      </div>
    </div>
  )
}
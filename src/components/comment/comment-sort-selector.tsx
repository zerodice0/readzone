'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Clock, Heart, ArrowUpDown } from 'lucide-react'

interface CommentSortSelectorProps {
  currentSort: 'latest' | 'oldest' | 'most_liked'
  onSortChange: (sort: 'latest' | 'oldest' | 'most_liked') => void
  commentCount: number
  className?: string
}

export function CommentSortSelector({
  currentSort,
  onSortChange,
  commentCount,
  className
}: CommentSortSelectorProps) {
  const sortOptions = [
    {
      value: 'latest' as const,
      label: '최신순',
      icon: Clock,
      description: '최근에 작성된 댓글부터'
    },
    {
      value: 'oldest' as const,
      label: '오래된순',
      icon: ArrowUpDown,
      description: '오래전에 작성된 댓글부터'
    },
    {
      value: 'most_liked' as const,
      label: '인기순',
      icon: Heart,
      description: '좋아요가 많은 댓글부터'
    }
  ]

  return (
    <div className={cn('flex items-center space-x-1', className)}>
      <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">
        정렬:
      </span>
      
      {sortOptions.map((option) => {
        const Icon = option.icon
        const isActive = currentSort === option.value
        
        return (
          <Button
            key={option.value}
            variant={isActive ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onSortChange(option.value)}
            className={cn(
              'h-8 px-3 text-xs transition-all',
              isActive 
                ? 'bg-primary-500 text-white hover:bg-primary-600' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-700'
            )}
            title={option.description}
          >
            <Icon className="w-3 h-3 mr-1" />
            {option.label}
          </Button>
        )
      })}
      
      {commentCount > 0 && (
        <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">
          총 {commentCount.toLocaleString()}개
        </span>
      )}
    </div>
  )
}
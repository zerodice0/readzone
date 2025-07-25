'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  Filter,
  X,
  ChevronDown,
  CheckCircle,
  Star,
  TrendingUp,
  Clock,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react'

export type QuickFilterOption = 
  | 'all'
  | 'recommend'
  | 'not-recommend'
  | 'recent'
  | 'helpful'

interface QuickFilterConfig {
  id: QuickFilterOption
  label: string
  icon: React.ReactNode
  description: string
  color: string
  shortcut?: string
}

interface BookOpinionQuickFilterProps {
  currentFilter: QuickFilterOption
  onFilterChange: (filter: QuickFilterOption) => void
  counts: {
    total: number
    recommend: number
    notRecommend: number
    recent: number
    helpful: number
  }
  className?: string
}

const quickFilters: QuickFilterConfig[] = [
  {
    id: 'all',
    label: '전체',
    icon: <Filter className="w-4 h-4" />,
    description: '모든 의견 보기',
    color: 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300',
    shortcut: '1'
  },
  {
    id: 'recommend',
    label: '추천',
    icon: <ThumbsUp className="w-4 h-4" />,
    description: '추천 의견만 보기',
    color: 'bg-green-100 text-green-700 hover:bg-green-200 border-green-300',
    shortcut: '2'
  },
  {
    id: 'not-recommend',
    label: '비추천',
    icon: <ThumbsDown className="w-4 h-4" />,
    description: '비추천 의견만 보기',
    color: 'bg-red-100 text-red-700 hover:bg-red-200 border-red-300',
    shortcut: '3'
  },
  {
    id: 'recent',
    label: '최신',
    icon: <Clock className="w-4 h-4" />,
    description: '최근 24시간 내 의견',
    color: 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-300',
    shortcut: '4'
  },
  {
    id: 'helpful',
    label: '도움됨',
    icon: <Star className="w-4 h-4" />,
    description: '가장 도움이 된 의견',
    color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-300',
    shortcut: '5'
  }
]

export function BookOpinionQuickFilter({
  currentFilter,
  onFilterChange,
  counts,
  className
}: BookOpinionQuickFilterProps) {
  const [showAllFilters, setShowAllFilters] = useState(false)

  const getCount = (filterId: QuickFilterOption): number => {
    switch (filterId) {
      case 'all': return counts.total
      case 'recommend': return counts.recommend
      case 'not-recommend': return counts.notRecommend
      case 'recent': return counts.recent
      case 'helpful': return counts.helpful
      default: return 0
    }
  }

  const activeFilter = quickFilters.find(f => f.id === currentFilter) || quickFilters[0]
  const visibleFilters = showAllFilters ? quickFilters : quickFilters.slice(0, 3)

  // 키보드 단축키 핸들러
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    const num = parseInt(event.key)
    if (num >= 1 && num <= quickFilters.length) {
      const filter = quickFilters[num - 1]
      if (filter) {
        onFilterChange(filter.id)
      }
    }
  }, [onFilterChange])

  // 키보드 이벤트 리스너 등록
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Alt 키와 함께 숫자 키를 눌렀을 때만 동작
      if (event.altKey && !event.ctrlKey && !event.metaKey) {
        handleKeyPress(event)
        event.preventDefault()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyPress])

  const clearFilter = () => {
    onFilterChange('all')
  }

  const hasActiveFilter = currentFilter !== 'all'

  return (
    <div className={cn('space-y-4', className)}>
      {/* 메인 필터 버튼들 */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 text-sm text-gray-600 mr-2">
          <Filter className="w-4 h-4" />
          <span className="font-medium">빠른 필터:</span>
        </div>

        {visibleFilters.map((filter) => {
          const count = getCount(filter.id)
          const isActive = currentFilter === filter.id

          return (
            <Button
              key={filter.id}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => onFilterChange(filter.id)}
              className={cn(
                'flex items-center gap-2 h-8 px-3 text-xs font-medium transition-all duration-200',
                'hover:shadow-sm focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20',
                !isActive && filter.color,
                isActive && 'shadow-sm'
              )}
              aria-pressed={isActive}
              aria-label={`${filter.label} ${count}개`}
              title={`${filter.description} (Alt+${filter.shortcut})`}
            >
              {filter.icon}
              <span>{filter.label}</span>
              <Badge 
                variant={isActive ? "secondary" : "outline"}
                className="text-xs h-5 px-1.5 min-w-[20px] justify-center"
              >
                {count}
              </Badge>
            </Button>
          )
        })}

        {/* 더 보기/간략히 버튼 */}
        {quickFilters.length > 3 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAllFilters(!showAllFilters)}
            className="h-8 px-2 text-xs text-gray-600 hover:text-gray-900"
            aria-expanded={showAllFilters}
          >
            <ChevronDown className={cn(
              'w-4 h-4 transition-transform',
              showAllFilters && 'rotate-180'
            )} />
            <span className="sr-only">
              {showAllFilters ? '간략히 보기' : '더 많은 필터 보기'}
            </span>
          </Button>
        )}

        {/* 필터 초기화 */}
        {hasActiveFilter && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilter}
            className="h-8 px-2 text-xs text-gray-600 hover:text-gray-900 ml-2"
            aria-label="필터 초기화"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline ml-1">초기화</span>
          </Button>
        )}
      </div>

      {/* 활성 필터 상태 표시 */}
      {hasActiveFilter && (
        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span>
            <strong className="text-gray-900">{activeFilter.label}</strong> 필터가 적용되었습니다
            ({getCount(currentFilter)}개 결과)
          </span>
        </div>
      )}

      {/* 키보드 단축키 힌트 (작은 화면에서는 숨김) */}
      <div className="hidden lg:flex items-center gap-2 text-xs text-gray-500">
        <TrendingUp className="w-3 h-3" />
        <span>빠른 전환: Alt + 1-{quickFilters.length} 키</span>
      </div>
    </div>
  )
}
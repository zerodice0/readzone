'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  ArrowUpDown,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Shuffle,
  Filter,
  X,
  Check,
} from 'lucide-react'

export type SortOption = 
  | 'newest'      // 최신 순
  | 'oldest'      // 오래된 순
  | 'recommend'   // 추천만
  | 'not-recommend' // 비추천만
  | 'popular'     // 인기 순 (향후 좋아요 기능 추가 시)
  | 'random'      // 랜덤

export type FilterOption = 'all' | 'recommend' | 'not-recommend'

interface BookOpinionSortProps {
  currentSort: SortOption
  currentFilter: FilterOption
  totalCount: number
  recommendCount: number
  notRecommendCount: number
  onSortChange: (sort: SortOption) => void
  onFilterChange: (filter: FilterOption) => void
  className?: string
}

interface SortButtonConfig {
  id: SortOption
  label: string
  icon: React.ReactNode
  description: string
}

interface FilterButtonConfig {
  id: FilterOption
  label: string
  icon: React.ReactNode
  count: number
  color: string
}

const sortOptions: SortButtonConfig[] = [
  {
    id: 'newest',
    label: '최신순',
    icon: <Clock className="w-4 h-4" />,
    description: '최근에 작성된 의견부터'
  },
  {
    id: 'oldest', 
    label: '오래된순',
    icon: <Clock className="w-4 h-4 scale-y-[-1]" />,
    description: '오래전에 작성된 의견부터'
  },
  {
    id: 'random',
    label: '랜덤',
    icon: <Shuffle className="w-4 h-4" />,
    description: '무작위 순서로 섞어서'
  }
]

export function BookOpinionSort({
  currentSort,
  currentFilter,
  totalCount,
  recommendCount,
  notRecommendCount,
  onSortChange,
  onFilterChange,
  className
}: BookOpinionSortProps) {
  const [showSortDropdown, setShowSortDropdown] = useState(false)

  const filterOptions: FilterButtonConfig[] = [
    {
      id: 'all',
      label: '전체',
      icon: <ArrowUpDown className="w-4 h-4" />,
      count: totalCount,
      color: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    },
    {
      id: 'recommend',
      label: '추천만',
      icon: <ThumbsUp className="w-4 h-4" />,
      count: recommendCount,
      color: 'bg-green-100 text-green-700 hover:bg-green-200'
    },
    {
      id: 'not-recommend',
      label: '비추천만',
      icon: <ThumbsDown className="w-4 h-4" />,
      count: notRecommendCount,
      color: 'bg-red-100 text-red-700 hover:bg-red-200'
    }
  ]

  const currentSortOption = sortOptions.find(option => option.id === currentSort) || sortOptions[0]
  const currentFilterOption = filterOptions.find(option => option.id === currentFilter) || filterOptions[0]

  const handleSortChange = (sort: SortOption) => {
    onSortChange(sort)
    setShowSortDropdown(false)
  }

  const clearFilters = () => {
    onSortChange('newest')
    onFilterChange('all')
  }

  const hasActiveFilters = currentSort !== 'newest' || currentFilter !== 'all'

  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center gap-4', className)}>
      {/* 정렬 & 필터 제목 */}
      <div className="flex items-center gap-2">
        <Filter className="w-5 h-5 text-gray-600" aria-hidden="true" />
        <h3 className="font-medium text-gray-900">정렬 및 필터</h3>
        {hasActiveFilters && (
          <Badge variant="secondary" className="text-xs">
            적용됨
          </Badge>
        )}
      </div>

      {/* 정렬 옵션 */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600 hidden sm:block">정렬:</span>
        
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSortDropdown(!showSortDropdown)}
            className="flex items-center gap-2 min-w-[120px] justify-start"
            aria-expanded={showSortDropdown}
            aria-haspopup="listbox"
            aria-label={`현재 정렬: ${currentSortOption.label}`}
          >
            {currentSortOption.icon}
            <span>{currentSortOption.label}</span>
            <ArrowUpDown className={cn(
              'w-3 h-3 ml-auto transition-transform',
              showSortDropdown && 'rotate-180'
            )} />
          </Button>

          {showSortDropdown && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <div className="p-2 space-y-1" role="listbox">
                {sortOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleSortChange(option.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 text-left rounded-md text-sm transition-colors',
                      'hover:bg-gray-50 focus:bg-gray-50 focus:outline-none',
                      currentSort === option.id && 'bg-primary-50 text-primary-700'
                    )}
                    role="option"
                    aria-selected={currentSort === option.id}
                  >
                    {option.icon}
                    <div className="flex-1">
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-gray-500">{option.description}</div>
                    </div>
                    {currentSort === option.id && (
                      <Check className="w-4 h-4 text-primary-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 필터 옵션 */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600 hidden sm:block">필터:</span>
        
        <div className="flex gap-2">
          {filterOptions.map((option) => (
            <Button
              key={option.id}
              variant={currentFilter === option.id ? "default" : "outline"}
              size="sm"
              onClick={() => onFilterChange(option.id)}
              className={cn(
                'flex items-center gap-2 min-w-[80px]',
                currentFilter !== option.id && option.color
              )}
              aria-pressed={currentFilter === option.id}
              aria-label={`${option.label} ${option.count}개`}
            >
              {option.icon}
              <span>{option.label}</span>
              <Badge 
                variant={currentFilter === option.id ? "secondary" : "outline"}
                className="text-xs"
              >
                {option.count}
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      {/* 필터 초기화 */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          aria-label="정렬 및 필터 초기화"
        >
          <X className="w-4 h-4" />
          <span className="hidden sm:inline">초기화</span>
        </Button>
      )}

      {/* 결과 요약 (모바일에서는 숨김) */}
      <div className="hidden lg:flex items-center gap-2 ml-auto text-sm text-gray-600">
        <span>총 {currentFilterOption.count}개의 의견</span>
        {currentFilter !== 'all' && (
          <span className="text-xs">({currentFilterOption.label})</span>
        )}
      </div>

      {/* Click outside to close dropdown */}
      {showSortDropdown && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setShowSortDropdown(false)}
          aria-hidden="true"
        />
      )}
    </div>
  )
}
'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { 
  ThumbsUp, 
  ThumbsDown, 
  User,
  MessageSquare,
  Clock,
  Star,
  TrendingUp
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingSkeleton } from './shared/loading-skeleton'
import { ErrorDisplay } from './shared/error-display'
import { StatsSummary } from './shared/stats-summary'
import { PaginationControls } from './shared/pagination-controls'
import { BookOpinionSort, type SortOption, type FilterOption } from './book-opinion-sort'
import { usePaginatedList } from '@/hooks/use-paginated-list'
import { UI_LABELS, ARIA_LABELS, EMPTY_STATE_MESSAGES } from '@/lib/constants/book'
import { cn } from '@/lib/utils'
import type { BookOpinion } from '@/types/book'

interface BookOpinionListProps {
  bookId: string
  limit?: number
  onOpinionSubmit?: () => void
}

interface OpinionWithUser extends BookOpinion {
  user: {
    id: string
    nickname: string
    image?: string
  }
}

interface OpinionListData {
  items: OpinionWithUser[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  stats: {
    total: number
    recommendCount: number
    notRecommendCount: number
    recommendationRate: number
  }
}

export function BookOpinionList({ 
  bookId, 
  limit = 20, 
  onOpinionSubmit 
}: BookOpinionListProps) {
  const [sortOption, setSortOption] = useState<SortOption>('newest')
  const [filterOption, setFilterOption] = useState<FilterOption>('all')
  const [expandedOpinions, setExpandedOpinions] = useState<Set<string>>(new Set())

  const {
    data,
    isLoading,
    error,
    currentPage,
    totalPages,
    goToPage,
    refresh
  } = usePaginatedList<OpinionWithUser>(`/api/books/${bookId}/opinions`, {
    initialLimit: limit,
    additionalParams: {
      sort: sortOption,
      filter: filterOption
    }
  })

  // 정렬 및 필터링된 데이터 처리
  const processedData = useMemo(() => {
    if (!data?.items) return data

    let filteredItems = [...data.items]

    // 필터 적용
    if (filterOption === 'recommend') {
      filteredItems = filteredItems.filter(item => item.isRecommended)
    } else if (filterOption === 'not-recommend') {
      filteredItems = filteredItems.filter(item => !item.isRecommended)
    }

    // 정렬 적용
    switch (sortOption) {
      case 'oldest':
        filteredItems.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        break
      case 'random':
        filteredItems = filteredItems.sort(() => Math.random() - 0.5)
        break
      case 'newest':
      default:
        filteredItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
    }

    return {
      ...data,
      items: filteredItems,
      stats: {
        ...data.stats,
        total: filteredItems.length,
        recommendCount: filteredItems.filter(item => item.isRecommended).length,
        notRecommendCount: filteredItems.filter(item => !item.isRecommended).length
      }
    }
  }, [data, sortOption, filterOption])

  const toggleExpanded = (opinionId: string) => {
    setExpandedOpinions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(opinionId)) {
        newSet.delete(opinionId)
      } else {
        newSet.add(opinionId)
      }
      return newSet
    })
  }

  if (isLoading) {
    return <LoadingSkeleton type="opinion-list" />
  }

  if (error || !data) {
    return (
      <ErrorDisplay
        type="network"
        message={error || EMPTY_STATE_MESSAGES.NO_OPINIONS}
        onRetry={refresh}
      />
    )
  }

  const displayData = processedData || data

  if (data.items.length === 0) {
    return (
      <Card className="p-8 text-center">
        <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-400" aria-hidden="true" />
        <h3 className="text-lg font-semibold mb-2">{EMPTY_STATE_MESSAGES.NO_OPINIONS}</h3>
        <p className="text-gray-600 mb-4">
          {EMPTY_STATE_MESSAGES.FIRST_OPINION}
        </p>
      </Card>
    )
  }

  if (displayData.items.length === 0 && (filterOption !== 'all' || sortOption !== 'newest')) {
    return (
      <div className="space-y-6">
        {/* 정렬 및 필터 컨트롤 */}
        <BookOpinionSort
          currentSort={sortOption}
          currentFilter={filterOption}
          totalCount={data.stats.total}
          recommendCount={data.stats.recommendCount}
          notRecommendCount={data.stats.notRecommendCount}
          onSortChange={setSortOption}
          onFilterChange={setFilterOption}
        />

        <Card className="p-8 text-center">
          <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-400" aria-hidden="true" />
          <h3 className="text-lg font-semibold mb-2">선택한 조건에 맞는 의견이 없습니다</h3>
          <p className="text-gray-600 mb-4">
            다른 필터나 정렬 옵션을 시도해보세요.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSortOption('newest')
              setFilterOption('all')
            }}
          >
            필터 초기화
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 통계 요약 */}
      <StatsSummary
        total={data.stats.total}
        recommendCount={data.stats.recommendCount}
        notRecommendCount={data.stats.notRecommendCount}
        recommendationRate={data.stats.recommendationRate}
        totalLabel={UI_LABELS.TOTAL_OPINIONS}
        recommendLabel={UI_LABELS.RECOMMEND}
        notRecommendLabel={UI_LABELS.NOT_RECOMMEND}
      />

      {/* 정렬 및 필터 컨트롤 */}
      <BookOpinionSort
        currentSort={sortOption}
        currentFilter={filterOption}
        totalCount={data.stats.total}
        recommendCount={data.stats.recommendCount}
        notRecommendCount={data.stats.notRecommendCount}
        onSortChange={setSortOption}
        onFilterChange={setFilterOption}
      />

      {/* 의견 목록 */}
      <div className="space-y-4">
        {displayData.items.map((opinion) => {
          const isLongContent = opinion.content.length > 200
          const isExpanded = expandedOpinions.has(opinion.id)
          const displayContent = isLongContent && !isExpanded 
            ? opinion.content.substring(0, 200) + '...'
            : opinion.content

          return (
            <Card 
              key={opinion.id} 
              className={cn(
                'p-4 transition-all duration-200',
                'hover:shadow-md hover:border-primary-200',
                'focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-opacity-20'
              )}
            >
              <div className="flex items-start gap-3">
                {/* 사용자 아바타 */}
                <div className="flex-shrink-0">
                  {opinion.user.image ? (
                    <Image
                      src={opinion.user.image}
                      alt={ARIA_LABELS.USER_AVATAR}
                      width={40}
                      height={40}
                      className="rounded-full ring-2 ring-gray-100"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-primary-600" aria-hidden="true" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  {/* 사용자 정보 및 추천 상태 */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-semibold text-gray-900">
                      {opinion.user.nickname}
                    </span>
                    
                    <Badge
                      variant={opinion.isRecommended ? "default" : "destructive"}
                      className={cn(
                        'text-xs font-medium',
                        opinion.isRecommended 
                          ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      )}
                      aria-label={ARIA_LABELS.RECOMMENDATION_BADGE}
                    >
                      {opinion.isRecommended ? (
                        <>
                          <ThumbsUp className="h-3 w-3 mr-1" aria-hidden="true" />
                          {UI_LABELS.RECOMMEND}
                        </>
                      ) : (
                        <>
                          <ThumbsDown className="h-3 w-3 mr-1" aria-hidden="true" />
                          {UI_LABELS.NOT_RECOMMEND}
                        </>
                      )}
                    </Badge>
                    
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      <time dateTime={opinion.createdAt}>
                        {formatDistanceToNow(new Date(opinion.createdAt), { 
                          addSuffix: true,
                          locale: ko
                        })}
                      </time>
                    </div>
                  </div>

                  {/* 의견 내용 */}
                  <div className="space-y-2">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {displayContent}
                    </p>
                    
                    {isLongContent && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => toggleExpanded(opinion.id)}
                        className="h-auto p-0 text-primary-600 hover:text-primary-700"
                        aria-expanded={isExpanded}
                        aria-controls={`opinion-content-${opinion.id}`}
                      >
                        {isExpanded ? '간략히 보기' : '더 보기'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* 결과 요약 */}
      {(filterOption !== 'all' || sortOption !== 'newest') && (
        <div className="flex items-center justify-center py-4 text-sm text-gray-600 bg-gray-50 rounded-lg">
          <TrendingUp className="w-4 h-4 mr-2" />
          {displayData.items.length}개의 의견이 표시되고 있습니다
          {filterOption !== 'all' && (
            <span className="ml-1">
              ({filterOption === 'recommend' ? '추천' : '비추천'}만)
            </span>
          )}
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={goToPage}
        />
      )}
    </div>
  )
}
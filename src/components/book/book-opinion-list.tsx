'use client'

import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { 
  ThumbsUp, 
  ThumbsDown, 
  User,
  MessageSquare,
  Clock
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingSkeleton } from './shared/loading-skeleton'
import { ErrorDisplay } from './shared/error-display'
import { StatsSummary } from './shared/stats-summary'
import { PaginationControls } from './shared/pagination-controls'
import { usePaginatedList } from '@/hooks/use-paginated-list'
import { UI_LABELS, ARIA_LABELS, EMPTY_STATE_MESSAGES } from '@/lib/constants/book'
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
  const {
    data,
    isLoading,
    error,
    currentPage,
    totalPages,
    goToPage,
    refresh
  } = usePaginatedList<OpinionWithUser>(`/api/books/${bookId}/opinions`, {
    initialLimit: limit
  })

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

      {/* 의견 목록 */}
      <div className="space-y-4">
        {data.items.map((opinion) => (
          <Card key={opinion.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              {/* 사용자 아바타 */}
              <div className="flex-shrink-0">
                {opinion.user.image ? (
                  <Image
                    src={opinion.user.image}
                    alt={ARIA_LABELS.USER_AVATAR}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-gray-500" aria-hidden="true" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                {/* 사용자 정보 및 추천 상태 */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-gray-900">
                    {opinion.user.nickname}
                  </span>
                  
                  <Badge
                    variant={opinion.isRecommended ? "default" : "destructive"}
                    className="text-xs"
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
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {opinion.content}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* 페이지네이션 */}
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={goToPage}
      />
    </div>
  )
}
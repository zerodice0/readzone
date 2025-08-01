'use client'

import Image from 'next/image'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { 
  ThumbsUp, 
  ThumbsDown, 
  User,
  MessageSquare,
  Heart,
  ExternalLink,
  Tag,
  Calendar
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingSkeleton } from './shared/loading-skeleton'
import { ErrorDisplay } from './shared/error-display'
import { StatsSummary } from './shared/stats-summary'
import { PaginationControls } from './shared/pagination-controls'
import { SafeHtmlRenderer } from '@/components/review/safe-html-renderer'
import { usePaginatedList } from '@/hooks/use-paginated-list'
import { UI_LABELS, ARIA_LABELS, EMPTY_STATE_MESSAGES } from '@/lib/constants/book'
import type { BookReview } from '@prisma/client'

interface BookReviewListProps {
  bookId: string
  limit?: number
}

interface ReviewWithUser extends Omit<BookReview, 'createdAt' | 'updatedAt'> {
  // API 응답에서 Date 객체가 ISO 문자열로 직렬화되므로 실제 타입 반영
  createdAt: string
  updatedAt: string
  user: {
    id: string
    nickname: string
    image?: string
  }
  _count: {
    likes: number
    comments: number
  }
}

export interface ReviewListData {
  items: ReviewWithUser[]
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

export function BookReviewList({ bookId, limit = 10 }: BookReviewListProps) {
  const {
    data,
    isLoading,
    error,
    currentPage,
    totalPages,
    goToPage,
    refresh
  } = usePaginatedList<ReviewWithUser>(`/api/books/${bookId}/reviews`, {
    initialLimit: limit
  })

  const parseTags = (tagsString: string): string[] => {
    try {
      return JSON.parse(tagsString || '[]')
    } catch {
      return []
    }
  }

  if (isLoading) {
    return <LoadingSkeleton type="review-list" />
  }

  if (error || !data) {
    return (
      <ErrorDisplay
        type="network"
        message={error || EMPTY_STATE_MESSAGES.NO_REVIEWS}
        onRetry={refresh}
      />
    )
  }

  if (data.items.length === 0) {
    return (
      <Card className="p-8 text-center">
        <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-400" aria-hidden="true" />
        <h3 className="text-lg font-semibold mb-2">{EMPTY_STATE_MESSAGES.NO_REVIEWS}</h3>
        <p className="text-gray-600 mb-4">
          {EMPTY_STATE_MESSAGES.FIRST_REVIEW}
        </p>
        <Button asChild>
          <Link href="/write">
            독후감 작성하기
          </Link>
        </Button>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 통계 요약 */}
      <StatsSummary
        total={data.stats?.total || 0}
        recommendCount={data.stats?.recommendCount || 0}
        notRecommendCount={data.stats?.notRecommendCount || 0}
        recommendationRate={data.stats?.recommendationRate || 0}
        totalLabel={UI_LABELS.TOTAL_REVIEWS}
        recommendLabel={UI_LABELS.RECOMMEND}
        notRecommendLabel={UI_LABELS.NOT_RECOMMEND}
      />

      {/* 독후감 목록 */}
      <div className="space-y-6">
        {data.items.map((review: ReviewWithUser) => {
          const tags = parseTags(review.tags)
          
          return (
            <Card key={review.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="space-y-4">
                {/* 헤더: 사용자 정보 및 추천 상태 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* 사용자 아바타 */}
                    {review.user.image ? (
                      <Image
                        src={review.user.image}
                        alt={ARIA_LABELS.USER_AVATAR}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-500" aria-hidden="true" />
                      </div>
                    )}
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {review.user.nickname}
                        </span>
                        
                        <Badge
                          variant={review.isRecommended ? "default" : "destructive"}
                          className="text-xs"
                          aria-label={ARIA_LABELS.RECOMMENDATION_BADGE}
                        >
                          {review.isRecommended ? (
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
                      </div>
                      
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" aria-hidden="true" />
                        <time dateTime={review.createdAt}>
                          {formatDistanceToNow(new Date(review.createdAt), { 
                            addSuffix: true,
                            locale: ko
                          })}
                        </time>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 독후감 제목 */}
                {review.title && (
                  <h3 className="text-lg font-semibold leading-tight">
                    <Link 
                      href={`/review/${review.id}`}
                      className="hover:text-primary-600 transition-colors"
                    >
                      {review.title}
                    </Link>
                  </h3>
                )}

                {/* 독후감 내용 미리보기 */}
                <div className="text-gray-700 leading-relaxed">
                  <div className="review-preview">
                    <SafeHtmlRenderer 
                      content={review.content}
                      maxLength={200}
                      className="prose prose-sm max-w-none dark:prose-invert"
                      strictMode={true}
                      showCopyButton={false}
                      showSecurityInfo={false}
                      allowImages={false}
                      allowLinks={true}
                      lazyRender={true}
                    />
                  </div>
                  <Link 
                    href={`/review/${review.id}`}
                    className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 text-sm font-medium mt-2"
                  >
                    더보기
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>

                {/* 태그 */}
                {tags.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Tag className="h-4 w-4 text-gray-400" aria-hidden="true" />
                    {tags.slice(0, 5).map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                    {tags.length > 5 && (
                      <span className="text-xs text-gray-500">
                        +{tags.length - 5}개 더
                      </span>
                    )}
                  </div>
                )}

                {/* 인터랙션 정보 */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Heart className="h-4 w-4" aria-hidden="true" />
                      <span>좋아요 {review._count.likes}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" aria-hidden="true" />
                      <span>댓글 {review._count.comments}</span>
                    </div>
                  </div>

                  {/* 구매 링크 */}
                  {review.purchaseLink && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(review.purchaseLink!, '_blank', 'noopener,noreferrer')}
                      className="flex items-center gap-1"
                      aria-label="구매 링크 열기 (새 창)"
                    >
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      구매하기
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
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
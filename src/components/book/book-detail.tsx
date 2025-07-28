'use client'

import { useState } from 'react'
import Image from 'next/image'
import { 
  Book, 
  Calendar, 
  Users, 
  ThumbsUp, 
  MessageSquare, 
  ExternalLink,
  Tag
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookOpinionForm } from './book-opinion-form'
import { BookOpinionList } from './book-opinion-list'
import { BookReviewList } from './book-review-list'
import { LoadingSkeleton } from './shared/loading-skeleton'
import { ErrorDisplay } from './shared/error-display'
import { useBookData } from '@/hooks/use-book-data'
import { formatAuthors, formatPrice, formatBookDate } from '@/lib/book-utils'
import { UI_LABELS, ARIA_LABELS } from '@/lib/constants/book'

interface BookDetailProps {
  bookId: string
}

interface TabType {
  id: 'reviews' | 'opinions'
  label: string
  count: number
}

export function BookDetail({ bookId }: BookDetailProps) {
  const { book, isLoading, error, refresh } = useBookData(bookId)
  const [activeTab, setActiveTab] = useState<'reviews' | 'opinions'>('reviews')
  const [showOpinionForm, setShowOpinionForm] = useState(false)

  const handleOpinionSubmit = () => {
    setShowOpinionForm(false)
    // 도서 정보 새로고침 (window.location.reload() 대신 사용)
    refresh()
  }

  if (isLoading) {
    return <LoadingSkeleton type="book-detail" />
  }

  if (error || !book) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-6">
        <ErrorDisplay
          type="not-found"
          message={error || '도서 정보를 찾을 수 없습니다.'}
          onRetry={refresh}
          showNavigation
        />
      </div>
    )
  }

  const tabs: TabType[] = [
    {
      id: 'reviews',
      label: '독후감',
      count: book.stats.totalReviews
    },
    {
      id: 'opinions',
      label: '의견',
      count: book.stats.totalOpinions
    }
  ]

  return (
    <div className="container max-w-6xl mx-auto px-4 py-6 space-y-8">
      {/* 도서 기본 정보 */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* 도서 표지 */}
          <div className="flex-shrink-0">
            {book.thumbnail ? (
              <Image
                src={book.thumbnail}
                alt={ARIA_LABELS.BOOK_IMAGE}
                width={192}
                height={256}
                className="rounded-lg shadow-lg object-cover mx-auto lg:mx-0"
                unoptimized
              />
            ) : (
              <div className="w-48 h-64 bg-gray-200 rounded-lg flex items-center justify-center mx-auto lg:mx-0">
                <Book className="h-16 w-16 text-gray-400" aria-hidden="true" />
              </div>
            )}
          </div>

          {/* 도서 정보 */}
          <div className="flex-1 space-y-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold leading-tight mb-3">
                {book.title}
              </h1>
              
              <div className="space-y-2 text-gray-700">
                <p className="text-lg">
                  <span className="font-medium">저자:</span> {formatAuthors(book.authors)}
                </p>
                
                {book.translators && book.translators.length > 0 && (
                  <p>
                    <span className="font-medium">번역:</span> {formatAuthors(book.translators)}
                  </p>
                )}
                
                {book.publisher && (
                  <p>
                    <span className="font-medium">출판사:</span> {book.publisher}
                  </p>
                )}
              </div>
            </div>

            {/* 메타 정보 */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              {book.datetime && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatBookDate(book.datetime)}</span>
                </div>
              )}
              
              {book.pageCount && (
                <div className="flex items-center gap-1">
                  <Book className="h-4 w-4" />
                  <span>{book.pageCount}쪽</span>
                </div>
              )}
              
              {book.isbn && (
                <div className="text-xs">
                  ISBN: {book.isbn}
                </div>
              )}
            </div>

            {/* 가격 정보 */}
            {(book.price || book.salePrice) && (
              <div className="flex items-center gap-3">
                {book.salePrice && book.salePrice !== book.price ? (
                  <>
                    <span className="text-2xl font-bold text-red-600">
                      {formatPrice(book.salePrice)}
                    </span>
                    <span className="text-lg text-gray-400 line-through">
                      {formatPrice(book.price)}
                    </span>
                  </>
                ) : (
                  <span className="text-2xl font-bold">
                    {formatPrice(book.price || book.salePrice)}
                  </span>
                )}
              </div>
            )}

            {/* 통계 정보 */}
            <div className="flex flex-wrap gap-4">
              <div 
                className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full"
                aria-label={ARIA_LABELS.ITEM_COUNT(book.stats.totalReviews, UI_LABELS.TOTAL_REVIEWS)}
              >
                <MessageSquare className="h-4 w-4 text-blue-600" aria-hidden="true" />
                <span className="text-sm font-medium text-blue-700">
                  독후감 {book.stats.totalReviews}개
                </span>
              </div>
              
              <div 
                className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full"
                aria-label={ARIA_LABELS.ITEM_COUNT(book.stats.totalOpinions, UI_LABELS.TOTAL_OPINIONS)}
              >
                <Users className="h-4 w-4 text-green-600" aria-hidden="true" />
                <span className="text-sm font-medium text-green-700">
                  의견 {book.stats.totalOpinions}개
                </span>
              </div>
              
              {book.stats.recommendationRate > 0 && (
                <div 
                  className="flex items-center gap-2 px-3 py-1 bg-yellow-50 rounded-full"
                  aria-label={ARIA_LABELS.RECOMMENDATION_RATE(Math.round(book.stats.recommendationRate))}
                >
                  <ThumbsUp className="h-4 w-4 text-yellow-600" aria-hidden="true" />
                  <span className="text-sm font-medium text-yellow-700">
                    추천 {Math.round(book.stats.recommendationRate)}%
                  </span>
                </div>
              )}
            </div>

            {/* 액션 버튼 */}
            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                onClick={() => setShowOpinionForm(true)}
                className="flex items-center gap-2"
                aria-label="이 도서에 대한 의견 작성하기"
              >
                <MessageSquare className="h-4 w-4" aria-hidden="true" />
                의견 작성하기
              </Button>
              
              {book.url && (
                <Button
                  variant="outline"
                  onClick={book.url ? () => window.open(book.url!, '_blank', 'noopener,noreferrer') : undefined}
                  className="flex items-center gap-2"
                  aria-label="카카오북스에서 이 도서 보기 (새 창)"
                >
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  카카오북스에서 보기
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* 도서 소개 */}
        {(book.description || book.contents) && (
          <div className="mt-6 pt-6 border-t">
            <h3 className="text-lg font-semibold mb-3">도서 소개</h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {book.description || book.contents}
            </p>
          </div>
        )}

        {/* 인기 태그 */}
        {book.stats.topTags && book.stats.topTags.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Tag className="h-5 w-5" aria-hidden="true" />
              인기 태그
            </h3>
            <div className="flex flex-wrap gap-2">
              {book.stats.topTags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-sm">
                  #{tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* 의견 작성 폼 */}
      {showOpinionForm && (
        <BookOpinionForm
          bookId={bookId}
          onSubmit={handleOpinionSubmit}
          onCancel={() => setShowOpinionForm(false)}
        />
      )}

      {/* 탭 네비게이션 */}
      <div className="border-b">
        <nav className="flex space-x-8" role="tablist" aria-label="도서 콘텐츠 탭">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`tabpanel-${tab.id}`}
              id={`tab-${tab.id}`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span 
                  className="ml-2 px-2 py-0.5 text-xs bg-gray-100 rounded-full"
                  aria-label={`${tab.count}개`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="min-h-[400px]">
        <div
          role="tabpanel"
          id="tabpanel-reviews"
          aria-labelledby="tab-reviews"
          hidden={activeTab !== 'reviews'}
        >
          {activeTab === 'reviews' && (
            <BookReviewList bookId={bookId} />
          )}
        </div>
        
        <div
          role="tabpanel"
          id="tabpanel-opinions"
          aria-labelledby="tab-opinions"
          hidden={activeTab !== 'opinions'}
        >
          {activeTab === 'opinions' && (
            <BookOpinionList bookId={bookId} onOpinionSubmit={refresh} />
          )}
        </div>
      </div>
    </div>
  )
}
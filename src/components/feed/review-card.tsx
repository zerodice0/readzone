'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button, Card, CardContent } from '@/components/ui'
import { LikeButton } from '@/components/review/like-button'
import { SafeHtmlRenderer } from '@/components/review/safe-html-renderer'
import { cn } from '@/lib/utils'

interface ReviewCardProps {
  review: {
    id: string
    title: string
    content: string
    book: {
      title: string
      authors: string[]
      thumbnail?: string
    }
    user: {
      nickname: string
      profileImage?: string | null
    }
    isRecommended: boolean
    createdAt: Date
    likeCount: number
    commentCount: number
    isLiked: boolean
  }
  showActions?: boolean
  onLoginRequired?: () => void
}

export function ReviewCard({ review, showActions = true, onLoginRequired }: ReviewCardProps): JSX.Element {
  const [isExpanded, setIsExpanded] = useState(false)

  // HTML 콘텐츠 미리보기 (200자) - HTML 태그 제거
  const getTextContent = (html: string) => {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  }
  
  const textContent = getTextContent(review.content)
  const previewContent = textContent.length > 200 
    ? textContent.slice(0, 200) + '...'
    : textContent

  const handleLikeToggle = (newIsLiked: boolean, newLikeCount: number): void => {
    // 상위 컴포넌트에서 상태 동기화가 필요한 경우 여기서 처리
    console.log('Like toggled:', { newIsLiked, newLikeCount })
  }

  const handleLoginRequired = (): void => {
    onLoginRequired?.()
  }

  const handleComment = (): void => {
    if (!showActions) {
      onLoginRequired?.()
      return
    }
    // 댓글 기능 (추후 구현)
  }

  const handleShare = (): void => {
    // 공유 기능
    if (navigator.share) {
      navigator.share({
        title: review.title,
        text: `"${review.book.title}" 독후감: ${review.title}`,
        url: window.location.origin + `/review/${review.id}`,
      })
    } else {
      // 폴백: 클립보드에 복사
      navigator.clipboard.writeText(window.location.origin + `/review/${review.id}`)
    }
  }

  const formatDate = (date: Date): string => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor(diff / (1000 * 60))

    if (days > 0) return `${days}일 전`
    if (hours > 0) return `${hours}시간 전`
    if (minutes > 0) return `${minutes}분 전`
    return '방금 전'
  }

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        {/* 사용자 정보 및 시간 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
              {review.user.profileImage ? (
                <Image
                  src={review.user.profileImage}
                  alt={review.user.nickname}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              ) : (
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {review.user.nickname[0]}
                </span>
              )}
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {review.user.nickname}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {formatDate(review.createdAt)}
              </div>
            </div>
          </div>
          
          {/* 추천/비추천 표시 */}
          <div className={cn(
            'flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium',
            review.isRecommended 
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          )}>
            <span>
              {review.isRecommended ? '👍' : '👎'}
            </span>
            <span>
              {review.isRecommended ? '추천' : '비추천'}
            </span>
          </div>
        </div>

        {/* 도서 정보 */}
        <div className="flex space-x-4 mb-4">
          {review.book.thumbnail && (
            <div className="flex-shrink-0">
              <Image
                src={review.book.thumbnail}
                alt={review.book.title}
                width={60}
                height={80}
                className="rounded-md shadow-sm"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
              {review.book.title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {review.book.authors.join(', ')}
            </p>
          </div>
        </div>

        {/* 독후감 제목 */}
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
          {review.title}
        </h2>

        {/* 독후감 내용 */}
        <div className="text-gray-700 dark:text-gray-300 mb-4">
          <div className="prose prose-sm max-w-none">
            {isExpanded ? (
              <SafeHtmlRenderer 
                content={review.content}
                className="prose prose-sm max-w-none"
                strictMode={true}
                showCopyButton={false}
                showSecurityInfo={false}
                allowImages={true}
                allowLinks={true}
                allowStyles={false}
                lazyRender={false}
                fallbackContent="콘텐츠를 안전하게 표시할 수 없습니다."
              />
            ) : (
              <p className="whitespace-pre-wrap">{previewContent}</p>
            )}
          </div>
          {textContent.length > 200 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium mt-2"
            >
              {isExpanded ? '접기' : '더보기'}
            </button>
          )}
        </div>

        {/* 액션 버튼들 */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-6">
            {/* 좋아요 - 향상된 애니메이션 버튼 */}
            {showActions ? (
              <LikeButton
                reviewId={review.id}
                isLiked={review.isLiked}
                likeCount={review.likeCount}
                size="md"
                variant="minimal"
                showExplosion={true}
                onToggle={handleLikeToggle}
                className="hover:scale-105 transition-transform"
              />
            ) : (
              <button
                onClick={handleLoginRequired}
                className="flex items-center space-x-1 text-sm text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
              >
                <svg 
                  className="w-5 h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
                  />
                </svg>
                <span>{review.likeCount}</span>
              </button>
            )}

            {/* 댓글 */}
            <button
              onClick={handleComment}
              className="flex items-center space-x-1 text-sm text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>{review.commentCount}</span>
            </button>

            {/* 공유 */}
            <button
              onClick={handleShare}
              className="flex items-center space-x-1 text-sm text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              <span>공유</span>
            </button>
          </div>

          {/* 전체 보기 링크 */}
          <Link
            href={`/review/${review.id}`}
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            전체 보기
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
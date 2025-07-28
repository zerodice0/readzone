'use client'

import { useState } from 'react'
import { CommentList } from './comment-list'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { MessageCircle, ChevronDown, ChevronUp } from 'lucide-react'

interface CommentSectionProps {
  reviewId: string
  initialCommentsCount?: number
  defaultSort?: 'latest' | 'oldest' | 'most_liked'
  defaultExpanded?: boolean
  showToggle?: boolean
  className?: string
}

export function CommentSection({
  reviewId,
  initialCommentsCount = 0,
  defaultSort = 'latest',
  defaultExpanded = true,
  showToggle = false,
  className
}: CommentSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  
  const handleToggle = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <div className={cn('w-full', className)}>
      {/* 댓글 섹션 토글 버튼 (선택적) */}
      {showToggle && (
        <div className="mb-4">
          <Button
            variant="ghost"
            onClick={handleToggle}
            className="flex items-center space-x-2 p-0 h-auto text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="font-medium">
              댓글 {initialCommentsCount > 0 && `(${initialCommentsCount.toLocaleString()})`}
            </span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>
      )}

      {/* 댓글 목록 */}
      {isExpanded && (
        <div className="space-y-6">
          <CommentList
            reviewId={reviewId}
            initialSort={defaultSort}
          />
          
          {/* 추가 정보나 안내사항 */}
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center space-y-1">
            <p>
              건전한 댓글 문화를 위해 서로를 존중하는 댓글을 작성해주세요.
            </p>
            <p>
              부적절한 댓글은 관리자에 의해 삭제될 수 있습니다.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// 독후감 상세 페이지에서 사용할 수 있는 전체 댓글 섹션 컴포넌트
export function ReviewCommentSection({
  reviewId,
  reviewTitle,
  className
}: {
  reviewId: string
  reviewTitle?: string
  className?: string
}) {
  return (
    <section 
      className={cn('mt-8', className)}
      aria-labelledby="comments-heading"
    >
      {/* 섹션 제목 */}
      <div className="mb-6">
        <h2 
          id="comments-heading" 
          className="text-2xl font-bold text-gray-900 dark:text-gray-100"
        >
          댓글
        </h2>
        {reviewTitle && (
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            &ldquo;{reviewTitle}&rdquo;에 대한 댓글
          </p>
        )}
      </div>

      {/* 댓글 시스템 */}
      <CommentSection
        reviewId={reviewId}
        defaultExpanded={true}
        showToggle={false}
      />
    </section>
  )
}

// 피드 카드에서 사용할 수 있는 간단한 댓글 미리보기 컴포넌트
export function CommentPreview({
  reviewId,
  commentCount,
  onShowComments,
  className
}: {
  reviewId: string
  commentCount: number
  onShowComments?: () => void
  className?: string
}) {
  const handleClick = () => {
    if (onShowComments) {
      onShowComments()
    } else {
      // 기본 동작: 독후감 상세 페이지로 이동
      window.location.href = `/review/${reviewId}#comments`
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className={cn(
        'flex items-center space-x-1 text-sm text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors',
        className
      )}
    >
      <MessageCircle className="w-4 h-4" />
      <span>{commentCount.toLocaleString()}</span>
    </Button>
  )
}
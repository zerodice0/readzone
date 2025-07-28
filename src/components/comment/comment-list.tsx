'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { CommentItem } from './comment-item'
import { CommentForm } from './comment-form'
import { CommentSortSelector } from './comment-sort-selector'
import { useComments } from '@/hooks/use-comments'
import { cn } from '@/lib/utils'
import { MessageCircle, Plus, RefreshCw } from 'lucide-react'

interface CommentListProps {
  reviewId: string
  initialSort?: 'latest' | 'oldest' | 'most_liked'
  className?: string
}

export function CommentList({ 
  reviewId, 
  initialSort = 'latest',
  className 
}: CommentListProps) {
  const { data: session } = useSession()
  const [sort, setSort] = useState<'latest' | 'oldest' | 'most_liked'>(initialSort)
  const [showCommentForm, setShowCommentForm] = useState(false)

  const {
    comments,
    pagination,
    isLoading,
    isError,
    error,
    isCreating,
    isUpdating,
    isDeleting,
    isTogglingLike,
    createComment,
    updateComment,
    deleteComment,
    toggleLike,
    loadMore,
    refetch,
  } = useComments({ 
    reviewId, 
    sort,
    limit: 20 
  })

  const handleSortChange = (newSort: 'latest' | 'oldest' | 'most_liked') => {
    setSort(newSort)
  }

  const handleCommentSubmit = (content: string) => {
    createComment(content)
    setShowCommentForm(false)
  }

  const handleReply = (parentId: string, content: string) => {
    createComment(content, parentId)
  }

  const handleEdit = (commentId: string, content: string) => {
    updateComment(commentId, content)
  }

  const handleDelete = (commentId: string) => {
    deleteComment(commentId)
  }

  const handleLike = (commentId: string) => {
    toggleLike(commentId)
  }

  const handleReport = (commentId: string) => {
    // TODO: 신고 기능 구현
    console.log('Report comment:', commentId)
  }

  const isAnyMutationLoading = isCreating || isUpdating || isDeleting || isTogglingLike

  if (isError) {
    return (
      <div className={cn('bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6', className)}>
        <div className="text-center">
          <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            댓글을 불러올 수 없습니다
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'}
          </p>
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            className="mx-auto"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            다시 시도
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700', className)}>
      {/* 헤더 */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              댓글
            </h3>
            {pagination && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ({pagination.total.toLocaleString()}개)
              </span>
            )}
          </div>
          
          {/* 새 댓글 작성 버튼 */}
          {session && !showCommentForm && (
            <Button
              onClick={() => setShowCommentForm(true)}
              size="sm"
              className="bg-primary-500 hover:bg-primary-600 text-white"
            >
              <Plus className="w-4 h-4 mr-1" />
              댓글 작성
            </Button>
          )}
        </div>

        {/* 정렬 옵션 */}
        {comments.length > 0 && (
          <CommentSortSelector
            currentSort={sort}
            onSortChange={handleSortChange}
            commentCount={pagination?.total || 0}
          />
        )}

        {/* 새 댓글 작성 폼 */}
        {showCommentForm && session && (
          <div className="mt-4">
            <CommentForm
              onSubmit={handleCommentSubmit}
              onCancel={() => setShowCommentForm(false)}
              placeholder="이 독후감에 대한 댓글을 작성해주세요..."
              isLoading={isCreating}
              submitText="댓글 작성"
              showCancel={true}
              autoFocus={true}
            />
          </div>
        )}

        {/* 로그인 필요 안내 */}
        {!session && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              댓글을 작성하려면{' '}
              <a 
                href="/login" 
                className="text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
              >
                로그인
              </a>
              이 필요합니다.
            </p>
          </div>
        )}
      </div>

      {/* 댓글 목록 */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {isLoading ? (
          /* 로딩 스켈레톤 */
          <div className="p-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex space-x-3 py-4">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/4" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2" />
                  <div className="flex space-x-2 mt-2">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16" />
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-12" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          /* 빈 상태 */
          <div className="p-12 text-center">
            <MessageCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              아직 댓글이 없습니다
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              이 독후감에 첫 번째 댓글을 남겨보세요!
            </p>
            {session && !showCommentForm && (
              <Button
                onClick={() => setShowCommentForm(true)}
                size="sm"
                className="bg-primary-500 hover:bg-primary-600 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                첫 댓글 작성하기
              </Button>
            )}
          </div>
        ) : (
          /* 댓글 목록 */
          <div>
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onReply={handleReply}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onLike={handleLike}
                onReport={handleReport}
                isLoading={isAnyMutationLoading}
                currentUserId={session?.user?.id}
                level={0}
                maxLevel={1}
                className="px-6"
              />
            ))}
          </div>
        )}
      </div>

      {/* 더 보기 버튼 */}
      {pagination && pagination.hasMore && (
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            onClick={loadMore}
            variant="outline"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                로딩 중...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                댓글 더 보기 ({pagination.total - comments.length}개 남음)
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
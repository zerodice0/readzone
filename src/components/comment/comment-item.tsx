'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { LikeButton } from '@/components/review/like-button'
import { CommentForm } from './comment-form'
import { EditCommentForm } from './edit-comment-form'
import { cn } from '@/lib/utils'
import { MoreHorizontal, Reply, Edit, Trash2, Flag } from 'lucide-react'
import type { CommentDetail } from '@/types/comment'

interface CommentItemProps {
  comment: CommentDetail
  onReply?: (parentId: string, content: string) => void
  onEdit?: (commentId: string, content: string) => void
  onDelete?: (commentId: string) => void
  onLike?: (commentId: string) => void
  onReport?: (commentId: string) => void
  isLoading?: boolean
  currentUserId?: string
  level?: number
  maxLevel?: number
  className?: string
}

export function CommentItem({
  comment,
  onReply,
  onEdit,
  onDelete,
  onLike,
  onReport,
  isLoading = false,
  currentUserId,
  level = 0,
  maxLevel = 1,
  className
}: CommentItemProps) {
  const [isReplying, setIsReplying] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)
  const actionMenuRef = useRef<HTMLDivElement>(null)

  // 액션 메뉴 외부 클릭 처리
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (actionMenuRef.current && event.target instanceof Node && !actionMenuRef.current.contains(event.target)) {
        setShowActions(false)
      }
    }

    if (showActions) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showActions])

  // 삭제된 댓글 처리
  if (comment.isDeleted) {
    return (
      <div className={cn(
        'flex space-x-3 py-4',
        level > 0 && 'ml-8 pl-4 border-l-2 border-gray-100 dark:border-gray-800',
        className
      )}>
        <div className="flex-1">
          <div className="text-sm text-gray-500 dark:text-gray-400 italic">
            삭제된 댓글입니다.
          </div>
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-2 space-y-2">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onLike={onLike}
                  onReport={onReport}
                  isLoading={isLoading}
                  currentUserId={currentUserId}
                  level={level + 1}
                  maxLevel={maxLevel}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  const formatDate = (date: Date) => {
    return formatDistanceToNow(new Date(date), { 
      addSuffix: true, 
      locale: ko 
    })
  }

  const handleLike = () => {
    if (onLike) {
      onLike(comment.id)
    }
  }

  const handleReply = (content: string) => {
    if (onReply) {
      onReply(comment.id, content)
      setIsReplying(false)
    }
  }

  const handleEdit = (content: string) => {
    if (onEdit) {
      onEdit(comment.id, content)
      setIsEditing(false)
    }
  }

  const handleDelete = () => {
    if (onDelete && confirm('정말로 이 댓글을 삭제하시겠습니까?')) {
      onDelete(comment.id)
    }
  }

  const handleReport = () => {
    if (onReport) {
      onReport(comment.id)
    }
  }

  const canReply = level < maxLevel && currentUserId
  const canEdit = comment.canEdit && currentUserId === comment.userId
  const canDelete = comment.canDelete && (currentUserId === comment.userId || currentUserId)
  const canReport = currentUserId && currentUserId !== comment.userId

  return (
    <div className={cn(
      'group relative',
      level > 0 && 'ml-8 pl-4 border-l-2 border-gray-100 dark:border-gray-800',
      className
    )}>
      <div className="flex space-x-3 py-4">
        {/* 프로필 이미지 */}
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
            {comment.user.image ? (
              <Image
                src={comment.user.image}
                alt={comment.user.nickname}
                width={32}
                height={32}
                className="rounded-full"
              />
            ) : (
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                {comment.user.nickname[0].toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* 댓글 내용 */}
        <div className="flex-1 min-w-0">
          {/* 사용자 정보 및 시간 */}
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {comment.user.nickname}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatDate(comment.createdAt)}
            </span>
            {comment.updatedAt > comment.createdAt && (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                (편집됨)
              </span>
            )}
          </div>

          {/* 댓글 내용 또는 편집 폼 */}
          {isEditing ? (
            <EditCommentForm
              initialContent={comment.content}
              onSubmit={handleEdit}
              onCancel={() => setIsEditing(false)}
              isLoading={isLoading}
            />
          ) : (
            <div className="text-sm text-gray-700 dark:text-gray-300 mb-2 whitespace-pre-wrap">
              {comment.content}
            </div>
          )}

          {/* 액션 버튼들 */}
          {!isEditing && (
            <div className="flex items-center space-x-1">
              {/* 좋아요 버튼 */}
              <LikeButton
                isLiked={comment.isLiked || false}
                likeCount={comment._count.likes}
                onToggle={handleLike}
                disabled={isLoading || !currentUserId}
                size="sm"
                showCount={true}
              />

              {/* 답글 버튼 */}
              {canReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsReplying(!isReplying)}
                  disabled={isLoading}
                  className="h-7 px-2 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <Reply className="w-3 h-3 mr-1" />
                  답글
                </Button>
              )}

              {/* 더보기 메뉴 */}
              {(canEdit || canDelete || canReport) && (
                <div className="relative" ref={actionMenuRef}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowActions(!showActions)}
                    className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal className="w-3 h-3" />
                  </Button>

                  {showActions && (
                    <div className="absolute right-0 top-8 z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg py-1 min-w-[120px]">
                      {canEdit && (
                        <button
                          onClick={() => {
                            setIsEditing(true)
                            setShowActions(false)
                          }}
                          className="flex items-center w-full px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <Edit className="w-3 h-3 mr-2" />
                          수정
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => {
                            handleDelete()
                            setShowActions(false)
                          }}
                          className="flex items-center w-full px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-3 h-3 mr-2" />
                          삭제
                        </button>
                      )}
                      {canReport && (
                        <button
                          onClick={() => {
                            handleReport()
                            setShowActions(false)
                          }}
                          className="flex items-center w-full px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <Flag className="w-3 h-3 mr-2" />
                          신고
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 답글 작성 폼 */}
          {isReplying && canReply && (
            <div className="mt-3">
              <CommentForm
                onSubmit={handleReply}
                onCancel={() => setIsReplying(false)}
                placeholder="답글을 작성해주세요..."
                isLoading={isLoading}
                submitText="답글 작성"
                maxLength={1000}
              />
            </div>
          )}
        </div>
      </div>

      {/* 대댓글 목록 */}
      {comment.replies && comment.replies.length > 0 && isExpanded && (
        <div className="space-y-0">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onLike={onLike}
              onReport={onReport}
              isLoading={isLoading}
              currentUserId={currentUserId}
              level={level + 1}
              maxLevel={maxLevel}
            />
          ))}
        </div>
      )}

      {/* 대댓글 접기/펼치기 (대댓글이 있을 때만) */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2 ml-11">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            {isExpanded ? '답글 숨기기' : `답글 ${comment.replies.length}개 보기`}
          </Button>
        </div>
      )}
    </div>
  )
}
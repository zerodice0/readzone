'use client'

import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  Eye, 
  Heart, 
  MessageCircle, 
  Clock,
  Edit3,
  Hash,
  User,
  BookOpen
} from 'lucide-react'
import { formatDistance } from 'date-fns'
import { ko } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface ReviewMetadataProps {
  createdAt: string
  updatedAt: string
  likeCount: number
  commentCount: number
  viewCount?: number
  tags: string[]
  isRecommended: boolean
  author: {
    nickname: string
    image?: string
  }
  book: {
    title: string
    authors: string[]
  }
  className?: string
  compact?: boolean
}

export function ReviewMetadata({
  createdAt,
  updatedAt,
  likeCount,
  commentCount,
  viewCount,
  tags,
  isRecommended,
  author,
  book,
  className = '',
  compact = false
}: ReviewMetadataProps) {
  const wasEdited = createdAt !== updatedAt
  const createdDate = new Date(createdAt)
  const updatedDate = new Date(updatedAt)

  if (compact) {
    return (
      <div className={cn('flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400', className)}>
        <span className="flex items-center gap-1">
          <User className="h-3 w-3" />
          {author.nickname}
        </span>
        
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {formatDistance(createdDate, new Date(), { addSuffix: true, locale: ko })}
        </span>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1">
            <Heart className="h-3 w-3" />
            {likeCount}
          </span>
          
          <span className="flex items-center gap-1">
            <MessageCircle className="h-3 w-3" />
            {commentCount}
          </span>
        </div>

        <Badge 
          variant={isRecommended ? "default" : "destructive"}
          className="text-xs"
        >
          {isRecommended ? '추천' : '비추천'}
        </Badge>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* 작성자 정보 */}
      <div className="flex items-center gap-3">
        {author.image ? (
          <img 
            src={author.image} 
            alt={author.nickname}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-gray-400" />
          </div>
        )}
        
        <div>
          <p className="font-medium text-gray-900 dark:text-gray-100">
            {author.nickname}
          </p>
          <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDistance(createdDate, new Date(), { addSuffix: true, locale: ko })}
            </span>
            
            {wasEdited && (
              <span className="flex items-center gap-1" title={`마지막 수정: ${updatedDate.toLocaleString()}`}>
                <Edit3 className="h-3 w-3" />
                수정됨
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 도서 정보 */}
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <BookOpen className="h-4 w-4" />
        <span>
          "{book.title}" by {book.authors.join(', ')}
        </span>
      </div>

      {/* 통계 정보 */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
            <Heart className="h-4 w-4" />
            {likeCount.toLocaleString()}
          </span>
          
          <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
            <MessageCircle className="h-4 w-4" />
            {commentCount.toLocaleString()}
          </span>

          {viewCount !== undefined && (
            <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
              <Eye className="h-4 w-4" />
              {viewCount.toLocaleString()}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Badge 
            variant={isRecommended ? "default" : "destructive"}
            className="flex items-center gap-1"
          >
            <Heart className={`h-3 w-3 ${isRecommended ? 'fill-current' : ''}`} />
            {isRecommended ? '추천' : '비추천'}
          </Badge>
        </div>
      </div>

      {/* 태그 */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag, index) => (
            <Badge 
              key={index} 
              variant="outline" 
              className="text-xs flex items-center gap-1"
            >
              <Hash className="h-2 w-2" />
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* 시간 상세 정보 */}
      <div className="text-xs text-gray-400 dark:text-gray-500 space-y-1">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          작성일: {createdDate.toLocaleString()}
        </div>
        {wasEdited && (
          <div className="flex items-center gap-1">
            <Edit3 className="h-3 w-3" />
            수정일: {updatedDate.toLocaleString()}
          </div>
        )}
      </div>
    </div>
  )
}

// 메타데이터만 표시하는 간단한 컴포넌트
export function SimpleMetadata({
  likeCount,
  commentCount,
  createdAt,
  isRecommended,
  className = ''
}: Pick<ReviewMetadataProps, 'likeCount' | 'commentCount' | 'createdAt' | 'isRecommended' | 'className'>) {
  return (
    <div className={cn('flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400', className)}>
      <span className="flex items-center gap-1">
        <Heart className="h-3 w-3" />
        {likeCount}
      </span>
      
      <span className="flex items-center gap-1">
        <MessageCircle className="h-3 w-3" />
        {commentCount}
      </span>

      <span className="flex items-center gap-1">
        <Calendar className="h-3 w-3" />
        {formatDistance(new Date(createdAt), new Date(), { addSuffix: true, locale: ko })}
      </span>

      <Badge 
        variant={isRecommended ? "default" : "destructive"}
        className="text-xs"
      >
        {isRecommended ? '추천' : '비추천'}
      </Badge>
    </div>
  )
}
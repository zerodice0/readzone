'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import {
  BookOpen,
  MessageCircle,
  Heart,
  Eye,
  ExternalLink,
  MoreHorizontal,
  Calendar,
  Star,
  Bookmark,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react'
import Link from 'next/link'

interface UserContentTabsProps {
  userId: string
  activeTab: 'reviews' | 'opinions' | 'comments'
  onTabChange: (tab: 'reviews' | 'opinions' | 'comments') => void
  className?: string
}

interface BookReview {
  id: string
  title: string
  content: string
  isRecommended: boolean
  tags: string[]
  purchaseLink: string | null
  linkClicks: number
  createdAt: string
  updatedAt: string
  book: {
    id: string
    title: string
    authors: string[]
    thumbnail: string | null
    genre: string | null
  }
  _count: {
    likes: number
    comments: number
  }
}

interface BookOpinion {
  id: string
  content: string
  isRecommended: boolean
  createdAt: string
  book: {
    id: string
    title: string
    authors: string[]
    thumbnail: string | null
    genre: string | null
  }
}

interface Comment {
  id: string
  content: string
  createdAt: string
  updatedAt: string
  review: {
    id: string
    title: string
    book: {
      id: string
      title: string
      authors: string[]
    }
  }
}

interface UserContentResponse {
  success: boolean
  data: {
    reviews?: BookReview[]
    opinions?: BookOpinion[]
    comments?: Comment[]
    pagination: {
      page: number
      limit: number
      total: number
      hasNext: boolean
      hasPrev: boolean
    }
  }
}

export function UserContentTabs({
  userId,
  activeTab,
  onTabChange,
  className
}: UserContentTabsProps) {
  const [page, setPage] = useState(1)
  const limit = 10

  const { data, isLoading, isError } = useQuery({
    queryKey: ['userContent', userId, activeTab, page, limit],
    queryFn: async (): Promise<UserContentResponse> => {
      const params = new URLSearchParams({
        type: activeTab,
        page: page.toString(),
        limit: limit.toString()
      })

      const response = await fetch(`/api/users/${userId}/content?${params}`)
      
      if (!response.ok) {
        throw new Error('콘텐츠 정보를 불러오는데 실패했습니다.')
      }

      return response.json()
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2분
  })

  const formatDate = (date: string) => {
    return formatDistanceToNow(new Date(date), { 
      addSuffix: true, 
      locale: ko 
    })
  }

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content
    return content.slice(0, maxLength) + '...'
  }

  const renderReviews = (reviews: BookReview[]) => {
    if (reviews.length === 0) {
      return (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">작성한 독후감이 없습니다.</p>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {reviews.map((review) => (
          <Card key={review.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                {/* 도서 이미지 */}
                <div className="flex-shrink-0">
                  {review.book.thumbnail ? (
                    <Image
                      src={review.book.thumbnail}
                      alt={review.book.title}
                      width={64}
                      height={80}
                      className="w-16 h-20 object-cover rounded-md border"
                    />
                  ) : (
                    <div className="w-16 h-20 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* 독후감 내용 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <Link 
                        href={`/review/${review.id}`}
                        className="text-lg font-semibold text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                      >
                        {review.title || '제목 없음'}
                      </Link>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {review.book.title} · {review.book.authors.join(', ')}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge variant={review.isRecommended ? 'default' : 'secondary'}>
                        {review.isRecommended ? (
                          <>
                            <ThumbsUp className="w-3 h-3 mr-1" />
                            추천
                          </>
                        ) : (
                          <>
                            <ThumbsDown className="w-3 h-3 mr-1" />
                            비추천
                          </>
                        )}
                      </Badge>
                      {review.book.genre && (
                        <Badge variant="outline" className="text-xs">
                          {review.book.genre}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-3">
                    {truncateContent(review.content)}
                  </p>

                  {/* 태그 */}
                  {review.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {review.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                      {review.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{review.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* 메타 정보 */}
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center space-x-1">
                        <Heart className="w-4 h-4" />
                        <span>{review._count.likes.toLocaleString()}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <MessageCircle className="w-4 h-4" />
                        <span>{review._count.comments.toLocaleString()}</span>
                      </span>
                      {review.purchaseLink && (
                        <span className="flex items-center space-x-1">
                          <ExternalLink className="w-4 h-4" />
                          <span>{review.linkClicks.toLocaleString()} 클릭</span>
                        </span>
                      )}
                    </div>
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(review.createdAt)}</span>
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const renderOpinions = (opinions: BookOpinion[]) => {
    if (opinions.length === 0) {
      return (
        <div className="text-center py-12">
          <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">작성한 도서 의견이 없습니다.</p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {opinions.map((opinion) => (
          <Card key={opinion.id} className="hover:shadow-sm transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                {/* 도서 이미지 */}
                <div className="flex-shrink-0">
                  {opinion.book.thumbnail ? (
                    <Image
                      src={opinion.book.thumbnail}
                      alt={opinion.book.title}
                      width={48}
                      height={60}
                      className="w-12 h-15 object-cover rounded border"
                    />
                  ) : (
                    <div className="w-12 h-15 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* 의견 내용 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <Link 
                      href={`/books/${opinion.book.id}`}
                      className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                      {opinion.book.title}
                    </Link>
                    <Badge variant={opinion.isRecommended ? 'default' : 'secondary'} className="ml-2">
                      {opinion.isRecommended ? (
                        <>
                          <ThumbsUp className="w-3 h-3 mr-1" />
                          추천
                        </>
                      ) : (
                        <>
                          <ThumbsDown className="w-3 h-3 mr-1" />
                          비추천
                        </>
                      )}
                    </Badge>
                  </div>
                  
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {opinion.book.authors.join(', ')}
                  </p>

                  <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-2">
                    {opinion.content}
                  </p>

                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(opinion.createdAt)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const renderComments = (comments: Comment[]) => {
    if (comments.length === 0) {
      return (
        <div className="text-center py-12">
          <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">작성한 댓글이 없습니다.</p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {comments.map((comment) => (
          <Card key={comment.id} className="hover:shadow-sm transition-shadow">
            <CardContent className="p-4">
              <div className="mb-2">
                <Link 
                  href={`/review/${comment.review.id}`}
                  className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  {comment.review.title || '제목 없음'}
                </Link>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {comment.review.book.title} · {comment.review.book.authors.join(', ')}
                </p>
              </div>

              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-2">
                {comment.content}
              </p>

              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>{formatDate(comment.createdAt)}</span>
                {comment.updatedAt !== comment.createdAt && (
                  <span>수정됨</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <Skeleton className="w-16 h-20 rounded-md" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )
    }

    if (isError || !data?.success) {
      return (
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">
            <MoreHorizontal className="w-12 h-12 mx-auto" />
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            콘텐츠를 불러오는데 실패했습니다.
          </p>
        </div>
      )
    }

    const { data: contentData } = data

    switch (activeTab) {
      case 'reviews':
        return renderReviews(contentData.reviews || [])
      case 'opinions':
        return renderOpinions(contentData.opinions || [])
      case 'comments':
        return renderComments(contentData.comments || [])
      default:
        return null
    }
  }

  const renderPagination = () => {
    if (!data?.data.pagination || data.data.pagination.total <= limit) {
      return null
    }

    const { pagination } = data.data

    return (
      <div className="flex items-center justify-between mt-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          총 {pagination.total.toLocaleString()}개 중 {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)}개
        </p>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page - 1)}
            disabled={!pagination.hasPrev}
          >
            이전
          </Button>
          
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {pagination.page} / {Math.ceil(pagination.total / pagination.limit)}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page + 1)}
            disabled={!pagination.hasNext}
          >
            다음
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {renderContent()}
      {renderPagination()}
    </div>
  )
}
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SafeHtmlRenderer } from '@/components/review/safe-html-renderer'
import { ShareMenu } from '@/components/share/share-menu'
import { LikeButton } from '@/components/review/like-button'
import { 
  BookOpen, 
  Edit3, 
  Trash2, 
  ArrowLeft, 
  Calendar,
  User,
  Heart,
  MessageCircle,
  ExternalLink,
  Hash,
  Clock,
  Eye,
  Loader2,
} from 'lucide-react'
import { formatDistance } from 'date-fns'
import { ko } from 'date-fns/locale'
import toast from 'react-hot-toast'

interface Book {
  id: string
  title: string
  authors: string[]
  thumbnail?: string
  publisher?: string
  genre?: string
  pageCount?: number
  isbn?: string
}

interface User {
  id: string
  nickname: string
  image?: string
  bio?: string
}

interface Review {
  id: string
  title?: string
  content: string
  isRecommended: boolean
  tags: string[]
  purchaseLink?: string
  linkClicks: number
  createdAt: string
  updatedAt: string
  userId: string
  bookId: string
  user: User
  book: Book
  _count: {
    likes: number
    comments: number
  }
  isLiked: boolean
  canEdit: boolean
}

interface ReviewDetailProps {
  reviewId: string
  initialData: Review
  currentUserId?: string
}

export default function ReviewDetail({ 
  reviewId, 
  initialData, 
  currentUserId 
}: ReviewDetailProps) {
  const router = useRouter()
  const [review, setReview] = useState<Review>(initialData)
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // 독후감 데이터 새로고침
  const refreshReview = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/reviews/${reviewId}`)
      const result = await response.json()

      if (result.success) {
        setReview(result.data.review)
      } else {
        throw new Error(result.error?.message || '독후감을 불러올 수 없습니다.')
      }
    } catch (error) {
      console.error('독후감 새로고침 실패:', error)
      toast.error('독후감을 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 좋아요 토글 핸들러
  const handleLikeToggle = async () => {
    if (!currentUserId) {
      toast.error('로그인이 필요합니다.')
      return
    }

    try {
      const response = await fetch(`/api/reviews/${reviewId}/like`, {
        method: 'POST'
      })

      const result = await response.json()

      if (result.success) {
        setReview(prev => ({
          ...prev,
          isLiked: !prev.isLiked,
          _count: {
            ...prev._count,
            likes: prev.isLiked 
              ? prev._count.likes - 1 
              : prev._count.likes + 1
          }
        }))
      } else {
        throw new Error(result.error?.message || '좋아요 처리에 실패했습니다.')
      }
    } catch (error) {
      console.error('좋아요 처리 실패:', error)
      toast.error('좋아요 처리에 실패했습니다.')
    }
  }

  // 구매 링크 클릭 처리
  const handlePurchaseLinkClick = async () => {
    try {
      // 클릭 추적
      await fetch(`/api/reviews/${reviewId}/track-click`, {
        method: 'POST'
      })

      setReview(prev => ({
        ...prev,
        linkClicks: prev.linkClicks + 1
      }))
    } catch (error) {
      console.error('클릭 추적 실패:', error)
      // 클릭 추적 실패는 사용자에게 알리지 않음
    }
  }

  // 독후감 삭제
  const handleDelete = async () => {
    if (!confirm('정말로 이 독후감을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return
    }

    try {
      setIsDeleting(true)
      
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        toast.success('독후감이 삭제되었습니다.')
        router.push('/')
      } else {
        throw new Error(result.error?.message || '삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('독후감 삭제 실패:', error)
      toast.error('독후감 삭제에 실패했습니다.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* 뒤로 가기 버튼 */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        >
          <ArrowLeft className="h-4 w-4" />
          뒤로 가기
        </Button>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="space-y-8">
        {/* 도서 정보 */}
        <Card className="p-6">
          <div className="flex items-start gap-4">
            {review.book.thumbnail ? (
              <Image 
                src={review.book.thumbnail} 
                alt={review.book.title}
                width={80}
                height={112}
                className="w-20 h-28 object-cover rounded-md shadow-sm flex-shrink-0"
              />
            ) : (
              <div className="w-20 h-28 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center flex-shrink-0">
                <BookOpen className="h-8 w-8 text-gray-400" />
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold mb-2 line-clamp-2">
                {review.book.title}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                {review.book.authors.join(', ')}
                {review.book.publisher && ` | ${review.book.publisher}`}
              </p>
              
              <div className="flex items-center gap-3 flex-wrap">
                {review.book.genre && (
                  <Badge variant="secondary">
                    {review.book.genre}
                  </Badge>
                )}
                {review.book.pageCount && (
                  <span className="text-sm text-gray-500">
                    {review.book.pageCount}쪽
                  </span>
                )}
                {review.book.isbn && (
                  <span className="text-xs text-gray-400">
                    ISBN: {review.book.isbn}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* 독후감 헤더 */}
        <Card className="p-6">
          <div className="space-y-4">
            {/* 제목 및 추천/비추천 */}
            <div className="space-y-3">
              {review.title && (
                <h2 className="text-2xl font-bold">
                  {review.title}
                </h2>
              )}
              
              <div className="flex items-center gap-3">
                <Badge 
                  variant={review.isRecommended ? "default" : "destructive"}
                  className="flex items-center gap-1"
                >
                  <Heart className={`h-3 w-3 ${review.isRecommended ? 'fill-current' : ''}`} />
                  {review.isRecommended ? '추천' : '비추천'}
                </Badge>
                
                {review.tags.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap">
                    {review.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        <Hash className="h-2 w-2 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 작성자 및 메타 정보 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {review.user.image ? (
                  <Image 
                    src={review.user.image} 
                    alt={review.user.nickname}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                )}
                
                <div>
                  <p className="font-medium">
                    {review.user.nickname}
                  </p>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDistance(new Date(review.createdAt), new Date(), { 
                        addSuffix: true, 
                        locale: ko 
                      })}
                    </span>
                    {review.createdAt !== review.updatedAt && (
                      <span className="flex items-center gap-1">
                        <Edit3 className="h-3 w-3" />
                        수정됨
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 액션 버튼들 */}
              <div className="flex items-center gap-2">
                <LikeButton
                  isLiked={review.isLiked}
                  likeCount={review._count.likes}
                  onToggle={handleLikeToggle}
                  disabled={!currentUserId}
                />
                
                <Button variant="ghost" size="sm" className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  {review._count.comments}
                </Button>

                <ShareMenu 
                  url={`${window.location.origin}/review/${reviewId}`}
                  title={review.title || review.book.title}
                  description={`${review.user.nickname}님의 "${review.book.title}" 독후감`}
                />

                {review.canEdit && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/review/${reviewId}/edit`)}
                      className="flex items-center gap-1"
                    >
                      <Edit3 className="h-3 w-3" />
                      수정
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="flex items-center gap-1 text-red-600 hover:text-red-700"
                    >
                      {isDeleting ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                      삭제
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* 독후감 내용 */}
        <Card className="p-6">
          <SafeHtmlRenderer 
            content={review.content}
            className="prose prose-gray dark:prose-invert max-w-none"
            showCopyButton={true}
            strictMode={true}
            showSecurityInfo={false}
            allowImages={true}
            allowLinks={true}
            allowStyles={false}
            lazyRender={false}
            fallbackContent="독후감 내용을 안전하게 표시할 수 없습니다."
            onSecurityWarning={(warnings) => {
              console.warn('독후감 보안 경고:', warnings)
            }}
          />
        </Card>

        {/* 구매 링크 (있는 경우) */}
        {review.purchaseLink && (
          <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  이 책 구매하기
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {review.user.nickname}님이 추천하는 구매처입니다.
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right text-sm text-blue-600 dark:text-blue-400">
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    클릭 {review.linkClicks}회
                  </div>
                </div>
                
                <Button 
                  asChild
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={handlePurchaseLinkClick}
                >
                  <a 
                    href={review.purchaseLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    구매하기
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* 작성자 정보 */}
        {review.user.bio && (
          <Card className="p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <User className="h-4 w-4" />
              작성자 소개
            </h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              {review.user.bio}
            </p>
          </Card>
        )}

        {/* 관련 도서 정보 */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            이 도서에 대한 다른 의견
          </h3>
          
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              다른 독자들의 의견을 확인해보세요.
            </p>
            <Button 
              variant="outline" 
              className="mt-2"
              onClick={() => router.push(`/books/${review.bookId}`)}
            >
              도서 상세 페이지로 이동
            </Button>
          </div>
        </Card>
      </div>

      {/* 새로고침 버튼 (개발/디버깅용) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshReview}
            disabled={isLoading}
            className="bg-white dark:bg-gray-800 shadow-lg"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Clock className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
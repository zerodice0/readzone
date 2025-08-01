'use client'

import { memo, useCallback, useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { BookOpen, Users, Sparkles, Edit, Clock, CheckCircle, Eye } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { CommunityBook, KakaoBook, SelectedBook } from '@/types/book-selector'

type BookItemType = CommunityBook | KakaoBook | SelectedBook

interface BookItemProps {
  book: BookItemType
  onSelect: (book: BookItemType) => void
  variant?: 'community' | 'kakao' | 'recent'
  showReviewStatus?: boolean // 독후감 상태 표시 여부
}

interface ExistingReviewCheck {
  hasReview: boolean
  reviewId?: string
  isChecking: boolean
}

export const BookItem = memo(function BookItem({ 
  book, 
  onSelect, 
  variant = 'community',
  showReviewStatus = false
}: BookItemProps) {
  const { data: session } = useSession()
  const [reviewStatus, setReviewStatus] = useState<ExistingReviewCheck>({
    hasReview: false,
    isChecking: false
  })

  // 디바운스된 독후감 상태 확인
  useEffect(() => {
    if (!showReviewStatus || !session?.user?.id || !book.id) {
      return
    }

    const checkReviewExists = async () => {
      setReviewStatus(prev => ({ ...prev, isChecking: true }))
      
      try {
        const response = await fetch(
          `/api/reviews?userId=${session.user.id}&bookId=${book.id}&limit=1`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(3000)
          }
        )

        if (response.ok) {
          const data = await response.json()
          const hasExistingReview = data.success && data.data.items.length > 0
          
          setReviewStatus({
            hasReview: hasExistingReview,
            reviewId: hasExistingReview ? data.data.items[0].id : undefined,
            isChecking: false
          })
        } else {
          setReviewStatus(prev => ({ ...prev, isChecking: false }))
        }
      } catch (error) {
        // Silent failure - 표시하지 않음
        setReviewStatus(prev => ({ ...prev, isChecking: false }))
      }
    }

    // 300ms 디바운스
    const timeoutId = setTimeout(checkReviewExists, 300)
    return () => clearTimeout(timeoutId)
  }, [showReviewStatus, session?.user?.id, book.id])

  const handleClick = useCallback(() => {
    onSelect(book)
  }, [book, onSelect])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect(book)
    }
  }, [book, onSelect])

  // 변형에 따른 아이콘과 배지 설정
  const getVariantIcon = () => {
    switch (variant) {
      case 'community':
        return <Users className="h-3 w-3" />
      case 'kakao':
        return <Sparkles className="h-3 w-3" />
      case 'recent':
        return <Clock className="h-3 w-3" />
      default:
        return null
    }
  }

  const getVariantBadge = () => {
    switch (variant) {
      case 'community':
        const communityBook = book as CommunityBook
        return communityBook.selectionCount ? (
          <Badge variant="secondary" className="text-xs flex items-center gap-1">
            <Users className="h-2 w-2" />
            {communityBook.selectionCount}명 선택
          </Badge>
        ) : (
          <Badge variant="secondary" className="text-xs flex items-center gap-1">
            <Users className="h-2 w-2" />
            커뮤니티
          </Badge>
        )
      case 'kakao':
        const kakaoBook = book as KakaoBook
        // 커뮤니티에 이미 존재하는 도서인지 확인
        if (kakaoBook.communityExists) {
          return (
            <Badge variant="secondary" className="text-xs flex items-center gap-1">
              <Users className="h-2 w-2" />
              커뮤니티 도서
            </Badge>
          )
        } else {
          return (
            <Badge variant="outline" className="text-xs flex items-center gap-1 border-green-300 text-green-700 dark:border-green-600 dark:text-green-400">
              <Sparkles className="h-2 w-2" />
              새 도서
            </Badge>
          )
        }
      case 'recent':
        return (
          <Badge variant="outline" className="text-xs flex items-center gap-1">
            <Clock className="h-2 w-2" />
            최근
          </Badge>
        )
      default:
        return null
    }
  }

  const getSelectButtonText = () => {
    // 독후감 상태가 활성화되고 기존 독후감이 있는 경우
    if (showReviewStatus && reviewStatus.hasReview) {
      return '독후감 보기'
    }
    
    switch (variant) {
      case 'kakao':
        const kakaoBook = book as KakaoBook
        // 커뮤니티에 이미 존재하는 도서인지 확인하여 버튼 텍스트 결정
        return kakaoBook.communityExists ? '선택하기' : '선택 후 추가'
      default:
        return reviewStatus.isChecking ? '확인 중...' : '독후감 작성'
    }
  }

  const getSelectButtonIcon = () => {
    // 독후감 상태가 활성화되고 기존 독후감이 있는 경우
    if (showReviewStatus && reviewStatus.hasReview) {
      return <Eye className="h-3 w-3" />
    }
    
    if (reviewStatus.isChecking) {
      return <Clock className="h-3 w-3 animate-pulse" />
    }
    
    return getVariantIcon()
  }

  return (
    <Card 
      className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`${book.title} 도서 선택, 저자: ${book.authors.join(', ')}${book.publisher ? `, 출판사: ${book.publisher}` : ''}${variant === 'recent' ? ' (최근 선택)' : ''}`}
    >
      <div className="flex items-start gap-3">
        {/* 도서 썸네일 */}
        {book.thumbnail ? (
          <Image 
            src={book.thumbnail} 
            alt={book.title}
            width={48}
            height={64}
            className="w-12 h-16 object-cover rounded flex-shrink-0"
          />
        ) : (
          <div className="w-12 h-16 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center flex-shrink-0">
            <BookOpen className="h-6 w-6 text-gray-400" />
          </div>
        )}
        
        {/* 도서 정보 */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm line-clamp-2 mb-1">
            {book.title}
          </h4>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            {book.authors.join(', ')}
            {book.publisher && ` | ${book.publisher}`}
          </p>
          
          {/* 배지들 */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* 독후감 상태 배지 (우선순위 최고) */}
            {showReviewStatus && reviewStatus.hasReview && (
              <Badge 
                variant="default" 
                className="text-xs flex items-center gap-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-300 dark:border-green-700"
              >
                <CheckCircle className="h-2 w-2" />
                작성 완료
              </Badge>
            )}
            
            {/* 변형별 기본 배지 */}
            {getVariantBadge()}
            
            {/* 장르 배지 */}
            {book.genre && (
              <Badge variant="secondary" className="text-xs">
                {book.genre}
              </Badge>
            )}
            
            {/* 수동 입력 배지 */}
            {book.isManualEntry && (
              <Badge variant="outline" className="text-xs flex items-center gap-1">
                <Edit className="h-2 w-2" />
                직접 입력
              </Badge>
            )}
          </div>
        </div>
        
        {/* 선택 버튼 */}
        <div className="flex flex-col items-end gap-1">
          <Button 
            variant={showReviewStatus && reviewStatus.hasReview ? "outline" : "ghost"} 
            size="sm" 
            className={`flex-shrink-0 text-xs ${reviewStatus.isChecking ? 'opacity-75' : ''}`}
            disabled={reviewStatus.isChecking}
          >
            {getSelectButtonIcon()}
            <span className="ml-1">{getSelectButtonText()}</span>
          </Button>
          
          {/* 상태별 안내 텍스트 */}
          {variant === 'kakao' && !reviewStatus.hasReview && (
            <p className="text-xs text-gray-500 text-right">
              선택 시 추가됩니다
            </p>
          )}
          
          {showReviewStatus && reviewStatus.hasReview && (
            <p className="text-xs text-green-600 dark:text-green-400 text-right">
              기존 독후감 보기
            </p>
          )}
          
          {showReviewStatus && reviewStatus.isChecking && (
            <p className="text-xs text-blue-500 text-right">
              상태 확인 중...
            </p>
          )}
        </div>
      </div>
    </Card>
  )
})
'use client'

import { memo, useCallback } from 'react'
import Image from 'next/image'
import { BookOpen, Users, Sparkles, Edit, Clock } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { CommunityBook, KakaoBook, SelectedBook } from '@/types/book-selector'

type BookItemType = CommunityBook | KakaoBook | SelectedBook

interface BookItemProps {
  book: BookItemType
  onSelect: (book: BookItemType) => void
  variant?: 'community' | 'kakao' | 'recent'
}

export const BookItem = memo(function BookItem({ 
  book, 
  onSelect, 
  variant = 'community' 
}: BookItemProps) {
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
        return (
          <Badge variant="outline" className="text-xs flex items-center gap-1 border-green-300 text-green-700 dark:border-green-600 dark:text-green-400">
            <Sparkles className="h-2 w-2" />
            새 도서
          </Badge>
        )
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
    switch (variant) {
      case 'kakao':
        return '커뮤니티에 추가'
      default:
        return '선택'
    }
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
          <Button variant="ghost" size="sm" className="flex-shrink-0 text-xs">
            {getVariantIcon()}
            <span className="ml-1">{getSelectButtonText()}</span>
          </Button>
          
          {/* 카카오 도서 안내 */}
          {variant === 'kakao' && (
            <p className="text-xs text-gray-500 text-right">
              선택 시 추가됩니다
            </p>
          )}
        </div>
      </div>
    </Card>
  )
})
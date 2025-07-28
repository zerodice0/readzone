'use client'

import Image from 'next/image'
import { Book, Calendar, ExternalLink } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatAuthors, formatPrice, formatBookDate } from '@/lib/book-utils'
import type { KakaoBook } from '@/types/kakao'

interface BookCardProps {
  book: KakaoBook
  compact?: boolean
  showDetails?: boolean
  onSelect?: () => void
  onViewDetails?: () => void
}

export function BookCard({ 
  book, 
  compact = false, 
  showDetails = false,
  onSelect,
  onViewDetails 
}: BookCardProps) {
  const handleClick = () => {
    if (onSelect) {
      onSelect()
    } else if (onViewDetails) {
      onViewDetails()
    }
  }

  if (compact) {
    return (
      <div 
        className="p-3 flex gap-3 hover:bg-gray-50 transition-colors cursor-pointer"
        onClick={handleClick}
      >
        {/* 도서 썸네일 */}
        <div className="flex-shrink-0">
          {book.thumbnail ? (
            <Image
              src={book.thumbnail}
              alt={book.title}
              width={48}
              height={64}
              className="rounded object-cover"
              unoptimized
            />
          ) : (
            <div className="w-12 h-16 bg-gray-200 rounded flex items-center justify-center">
              <Book className="h-6 w-6 text-gray-400" />
            </div>
          )}
        </div>

        {/* 도서 정보 */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm line-clamp-1 mb-1">
            {book.title}
          </h3>
          <p className="text-xs text-gray-600 line-clamp-1 mb-1">
            {formatAuthors(book.authors)}
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {book.publisher && (
              <span>{book.publisher}</span>
            )}
            {book.datetime && (
              <>
                <span>•</span>
                <span>{formatBookDate(book.datetime)}</span>
              </>
            )}
          </div>
        </div>

        {/* 가격 정보 */}
        {(book.price || book.sale_price) && (
          <div className="flex-shrink-0 text-right">
            {book.sale_price && book.sale_price !== book.price ? (
              <div>
                <p className="text-xs text-gray-400 line-through">
                  {formatPrice(book.price)}
                </p>
                <p className="text-sm font-medium text-red-600">
                  {formatPrice(book.sale_price)}
                </p>
              </div>
            ) : (
              <p className="text-sm font-medium">
                {formatPrice(book.price || book.sale_price)}
              </p>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <Card 
      className={`p-4 hover:shadow-md transition-shadow ${onSelect ? 'cursor-pointer' : ''}`}
      onClick={onSelect ? handleClick : undefined}
    >
      <div className="flex gap-4">
        {/* 도서 썸네일 */}
        <div className="flex-shrink-0">
          {book.thumbnail ? (
            <Image
              src={book.thumbnail}
              alt={book.title}
              width={120}
              height={160}
              className="rounded-lg object-cover shadow-sm"
              unoptimized
            />
          ) : (
            <div className="w-30 h-40 bg-gray-200 rounded-lg flex items-center justify-center">
              <Book className="h-12 w-12 text-gray-400" />
            </div>
          )}
        </div>

        {/* 도서 정보 */}
        <div className="flex-1 min-w-0">
          <div className="mb-3">
            <h2 className="text-lg font-semibold line-clamp-2 mb-2">
              {book.title}
            </h2>
            <p className="text-gray-700 mb-1">
              {formatAuthors(book.authors)}
            </p>
            {book.translators && book.translators.length > 0 && (
              <p className="text-sm text-gray-600">
                번역: {formatAuthors(book.translators)}
              </p>
            )}
          </div>

          {/* 출판 정보 */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
            {book.publisher && (
              <div className="flex items-center gap-1">
                <span>{book.publisher}</span>
              </div>
            )}
            {book.datetime && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{formatBookDate(book.datetime)}</span>
              </div>
            )}
            {book.isbn && (
              <div className="text-xs">
                ISBN: {book.isbn}
              </div>
            )}
          </div>

          {/* 도서 소개 */}
          {book.contents && (
            <p className="text-sm text-gray-700 line-clamp-3 mb-3">
              {book.contents}
            </p>
          )}

          {/* 가격 및 액션 */}
          <div className="flex items-center justify-between">
            <div>
              {book.sale_price && book.sale_price !== book.price ? (
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-red-600">
                    {formatPrice(book.sale_price)}
                  </span>
                  <span className="text-sm text-gray-400 line-through">
                    {formatPrice(book.price)}
                  </span>
                </div>
              ) : book.price ? (
                <span className="text-lg font-bold">
                  {formatPrice(book.price)}
                </span>
              ) : (
                <span className="text-sm text-gray-500">가격 정보 없음</span>
              )}
            </div>

            {/* 액션 버튼 */}
            <div className="flex items-center gap-2">
              {book.url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    window.open(book.url, '_blank', 'noopener,noreferrer')
                  }}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  상세보기
                </Button>
              )}
              
              {showDetails && onViewDetails && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onViewDetails()
                  }}
                >
                  리뷰 보기
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
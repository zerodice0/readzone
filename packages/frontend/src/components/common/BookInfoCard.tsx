import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { BookSummary } from '@/store/writeStore';

interface Props {
  book: BookSummary;
  className?: string;
}

export function BookInfoCard({ book, className = '' }: Props) {
  const [showFullDescription, setShowFullDescription] = useState(false);
  
  // 설명 텍스트가 길면 잘라서 표시
  const maxDescriptionLength = 120;
  const shouldTruncateDescription = book.description && book.description.length > maxDescriptionLength;
  const displayDescription = shouldTruncateDescription && !showFullDescription
    ? `${book.description?.slice(0, maxDescriptionLength)}...`
    : book.description;

  return (
    <div className={`border rounded-lg bg-white shadow-sm ${className}`}>
      <div className="p-4">
        <div className="flex gap-4">
          {/* 도서 표지 */}
          <div className="w-16 h-20 rounded-md bg-gray-50 border overflow-hidden shadow-sm shrink-0">
            {book.thumbnail ? (
              <img
                src={book.thumbnail}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs text-center px-1">
                표지 없음
              </div>
            )}
          </div>

          {/* 도서 정보 */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* 제목과 저자 */}
            <div>
              <h3 className="font-semibold leading-tight text-gray-900 line-clamp-2">
                {book.title}
              </h3>
              <p className="text-gray-600 text-sm mt-1">{book.author}</p>
            </div>

            {/* 출판 정보 */}
            {(book.publisher ?? book.publishedAt) && (
              <div className="text-sm text-gray-500">
                {book.publisher && <span>{book.publisher}</span>}
                {book.publisher && book.publishedAt && <span> · </span>}
                {book.publishedAt && (
                  <span>{book.publishedAt.slice(0, 4)}년</span>
                )}
              </div>
            )}

            {/* 통계 정보 */}
            {book.isExisting && book.stats && (
              <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-md inline-block">
                독후감 {book.stats.reviewCount}개
                {typeof book.stats.averageRating === 'number' &&
                  ` · 추천율 ${Math.round(book.stats.averageRating * 100)}%`}
              </div>
            )}

            {/* 책 설명 */}
            {book.description && (
              <div className="text-sm text-gray-600 leading-relaxed">
                {displayDescription}
                {shouldTruncateDescription && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    className="ml-2 p-0 h-auto text-xs text-blue-600 hover:text-blue-800"
                  >
                    {showFullDescription ? '접기' : '더보기'}
                  </Button>
                )}
              </div>
            )}

            {/* ISBN (작게 표시) */}
            {book.isbn && (
              <div className="text-xs text-gray-400 font-mono">
                ISBN: {book.isbn}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
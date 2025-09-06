import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BookSummary } from '@/store/writeStore';

interface Props {
  book: BookSummary;
  className?: string;
}

export function BookInfoAccordion({ book, className = '' }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`border rounded bg-muted/30 ${className}`}>
      {/* 기본 정보 + 토글 버튼 */}
      <div className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="font-medium">선택된 도서</div>
            <div className="text-sm text-muted-foreground">
              {book.title} · {book.author}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-2 shrink-0"
          >
            {isExpanded ? (
              <>
                <span className="text-xs mr-1">접기</span>
                <ChevronUpIcon className="h-3 w-3" />
              </>
            ) : (
              <>
                <span className="text-xs mr-1">자세히</span>
                <ChevronDownIcon className="h-3 w-3" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 확장된 상세 정보 */}
      {isExpanded && (
        <div className="border-t bg-white/50">
          <div className="p-4">
          휴
              {/* 도서 표지 */}
              <div className="w-12 h-16 rounded-md bg-white border overflow-hidden shadow-sm shrink-0">
                {book.thumbnail ? (
                  <img
                    src={book.thumbnail}
                    alt=""
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                    표지 없음
                  </div>
                )}
              </div>

              {/* 도서 상세 정보 */}
              <div className="flex-1 min-w-0 space-y-2">
                <div>
                  <h3 className="font-semibold leading-tight text-slate-900">
                    {book.title}
                  </h3>
                  <p className="text-slate-600 text-sm">{book.author}</p>
                </div>

                {(Boolean(book.publisher) || Boolean(book.publishedAt)) && (
                  <div className="text-sm text-slate-500">
                    {book.publisher && <span>{book.publisher}</span>}
                    {book.publisher && book.publishedAt && <span> · </span>}
                    {book.publishedAt && (
                      <span>{book.publishedAt.slice(0, 10)}</span>
                    )}
                  </div>
                )}

                {book.isbn && (
                  <div className="text-xs text-slate-500 font-mono">
                    ISBN: {book.isbn}
                  </div>
                )}

                {book.description && (
                  <div className="text-sm text-slate-600 leading-relaxed">
                    {book.description}
                  </div>
                )}

                {book.isExisting && book.stats && (
                  <div className="text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded inline-block">
                    독후감 {book.stats.reviewCount}개
                    {typeof book.stats.averageRating === 'number' &&
                      ` · 추천율 ${Math.round(book.stats.averageRating * 100)}%`}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

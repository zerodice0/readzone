import { Book, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import type { AladinBook } from '../../hooks/useBookSearch';

interface AladinBookResultProps {
  book: AladinBook;
  onSelect: () => void;
  isLoading?: boolean;
}

/**
 * 알라딘 검색 결과 표시 컴포넌트
 * 파란색 테마로 로컬 결과와 시각적으로 구분
 */
export function AladinBookResult({
  book,
  onSelect,
  isLoading = false,
}: AladinBookResultProps) {
  const publishYear = book.publishedDate
    ? new Date(book.publishedDate).getFullYear()
    : null;

  return (
    <div className="flex gap-4 p-4 rounded-lg border border-blue-200 bg-blue-50/50 hover:border-blue-400 hover:shadow-md transition-all">
      {/* Book cover */}
      <div className="flex-shrink-0 w-16 h-24 bg-white rounded overflow-hidden shadow-sm">
        {book.coverImageUrl ? (
          <img
            src={book.coverImageUrl}
            alt={`${book.title} 표지`}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-stone-100">
            <Book className="w-8 h-8 text-stone-400" />
          </div>
        )}
      </div>

      {/* Book info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-1.5 mb-1">
          <h3 className="font-serif font-semibold text-stone-900 truncate">
            {book.title}
          </h3>
          <ExternalLink className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
        </div>
        <p className="text-sm text-stone-600 mb-1">{book.author}</p>
        {book.publisher && (
          <p className="text-xs text-stone-500">
            {book.publisher}
            {publishYear && ` · ${publishYear}`}
          </p>
        )}
        <p className="text-xs text-blue-600 font-medium mt-1.5">알라딘</p>
      </div>

      {/* Select button */}
      <div className="flex-shrink-0 flex items-center">
        <Button
          variant="default"
          size="sm"
          onClick={onSelect}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              저장 중
            </>
          ) : (
            '선택'
          )}
        </Button>
      </div>
    </div>
  );
}

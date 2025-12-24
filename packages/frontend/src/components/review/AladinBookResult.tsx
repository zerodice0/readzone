import { Book, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import type { AladinBook } from '../../hooks/useBookSearch';
import { extractMiddleCategory } from '../../utils/category';

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
  const categoryDisplay = extractMiddleCategory(book.category);

  return (
    <div className="group flex gap-4 p-4 rounded-xl border border-blue-100 bg-blue-50/20 hover:border-blue-300 hover:shadow-md hover:bg-blue-50/40 transition-all">
      {/* Book cover */}
      <div className="flex-shrink-0 w-16 h-24 bg-white rounded-lg overflow-hidden shadow-sm group-hover:shadow transition-shadow">
        {book.coverImageUrl ? (
          <img
            src={book.coverImageUrl}
            alt={`${book.title} 표지`}
            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
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
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-serif font-bold text-lg text-stone-900 truncate">
            {book.title}
          </h3>
          <ExternalLink className="w-3 h-3 text-blue-400 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        <p className="text-sm text-stone-600 font-medium mb-1">{book.author}</p>

        <div className="flex items-center gap-2 mt-auto flex-wrap">
          <p className="text-xs text-stone-500 flex items-center gap-1">
            {book.publisher}
            {publishYear && ` • ${publishYear}`}
          </p>
          {categoryDisplay && (
            <Badge
              variant="secondary"
              className="bg-violet-50 text-violet-700 text-xs"
            >
              {categoryDisplay}
            </Badge>
          )}
        </div>
      </div>

      {/* Select button */}
      <div className="flex-shrink-0 flex items-center">
        <Button
          variant="default"
          size="sm"
          onClick={onSelect}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow active:scale-95 transition-all"
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

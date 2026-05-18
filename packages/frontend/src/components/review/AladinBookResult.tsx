import { Book, Loader2 } from 'lucide-react';
import type { AladinBook } from '../../hooks/useBookSearch';
import { extractMiddleCategory } from '../../utils/category';

interface AladinBookResultProps {
  book: AladinBook;
  onSelect: () => void;
  isLoading?: boolean;
}

/**
 * 알라딘 검색 결과 표시 컴포넌트
 * 외부 검색 결과를 카드 전체 선택 대상으로 표시
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
  const metadata = [book.publisher, publishYear ? `${publishYear}` : null]
    .filter(Boolean)
    .join(' • ');

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={isLoading}
      aria-busy={isLoading}
      aria-label={`${book.title} 선택`}
      className="group flex min-w-0 w-full touch-manipulation items-stretch gap-4 rounded-xl border border-paper-200/80 bg-white/75 p-4 text-left shadow-sm transition-[background-color,border-color,box-shadow,transform] hover:border-primary-200 hover:bg-primary-50/35 hover:shadow-md active:scale-[0.99] disabled:cursor-wait disabled:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:active:scale-100"
    >
      {/* Book cover */}
      <span className="book-paper-frame flex h-24 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-white shadow-sm transition-shadow group-hover:shadow motion-reduce:transition-none">
        {book.coverImageUrl ? (
          <img
            src={book.coverImageUrl}
            alt={`${book.title} 표지`}
            width={64}
            height={96}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-stone-100">
            <Book className="h-8 w-8 text-stone-400" aria-hidden="true" />
          </span>
        )}
      </span>

      {/* Book info */}
      <span className="flex min-w-0 flex-1 flex-col justify-center">
        <span className="flex items-start justify-between gap-3">
          <span className="min-w-0">
            <span className="block truncate font-serif text-lg font-bold text-stone-900 transition-colors group-hover:text-primary-800">
              {book.title}
            </span>
            <span className="mt-1 block truncate text-sm font-medium text-stone-600">
              {book.author}
            </span>
          </span>

          <span
            className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-primary-200 bg-primary-50 text-primary-700 transition-colors group-hover:border-primary-300 group-hover:bg-primary-100 motion-reduce:transition-none"
            aria-hidden="true"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
            ) : (
              <span className="h-2.5 w-2.5 rounded-full border-2 border-primary-500 bg-white" />
            )}
          </span>
        </span>

        <span className="mt-3 flex flex-wrap items-center gap-2">
          {metadata && (
            <span className="text-xs text-stone-500">{metadata}</span>
          )}
          <span className="inline-flex items-center rounded-md border border-paper-200 bg-white/70 px-2 py-0.5 text-xs font-semibold text-stone-600">
            알라딘
          </span>
          {categoryDisplay && (
            <span className="inline-flex items-center rounded-md border border-paper-200 bg-white/70 px-2 py-0.5 text-xs font-semibold text-stone-600">
              {categoryDisplay}
            </span>
          )}
        </span>

        <span
          className="mt-3 text-xs font-bold text-primary-700"
          aria-live="polite"
        >
          {isLoading ? '저장 중…' : '탭해서 이 책 선택'}
        </span>
      </span>
    </button>
  );
}

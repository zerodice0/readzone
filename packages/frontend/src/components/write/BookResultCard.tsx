import { Button } from '@/components/ui/button';
import { Highlight } from './Highlight';
import type { BookSummary } from '@/store/writeStore';

interface Props {
  book: BookSummary;
  onSelect: (book: BookSummary) => void;
  query: string;
}

export function BookResultCard({ book, onSelect, query }: Props) {
  const badge = book.isExisting
    ? 'DB'
    : book.source === 'api'
      ? 'API'
      : book.source === 'manual'
        ? '수동'
        : undefined;

  return (
    <div
      role="option"
      className="group relative flex gap-4 p-4 rounded-xl border bg-white/70 transition border-slate-200 hover:shadow-md cursor-pointer"
      onClick={() => onSelect(book)}
    >
      <div className="w-12 h-16 rounded-md bg-slate-100 overflow-hidden shadow-sm">
        {book.thumbnail ? (
          <img
            src={book.thumbnail}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : null}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <h3 className="font-semibold text-slate-900 line-clamp-2">
            <Highlight text={book.title} query={query} />
          </h3>
          {badge && (
            <span className="shrink-0 px-1.5 py-0.5 text-[11px] rounded bg-slate-100 text-slate-600">
              {badge}
            </span>
          )}
        </div>
        <p className="text-sm text-slate-600 mt-0.5 truncate">
          {book.author} {book.publisher ? `· ${book.publisher}` : ''}{' '}
          {book.publishedAt ? `· ${book.publishedAt?.slice(0, 10)}` : ''}
        </p>
        <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
          <span className="font-mono truncate">{book.isbn}</span>
          {book.isExisting && book.stats ? (
            <span>
              독후감 {book.stats.reviewCount}
              {typeof book.stats.averageRating === 'number'
                ? ` · 추천 ${Math.round(book.stats.averageRating * 100)}%`
                : ''}
            </span>
          ) : null}
        </div>
      </div>
      <div className="self-start">
        <Button
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(book);
          }}
        >
          도서 선택
        </Button>
      </div>
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Book, Check } from 'lucide-react';
import { Button } from '../ui/button';
import type { Id } from 'convex/_generated/dataModel';

interface BookData {
  _id: Id<'books'>;
  title: string;
  author: string;
  publisher?: string;
  publishedDate?: number;
  coverImageUrl?: string;
  description?: string;
}

interface BookSearchResultProps {
  book: BookData;
  isSelected?: boolean;
  onSelect: (book: BookData) => void;
}

export function BookSearchResult({
  book,
  isSelected = false,
  onSelect,
}: BookSearchResultProps) {
  const publishYear = book.publishedDate
    ? new Date(book.publishedDate).getFullYear()
    : null;

  return (
    <div
      className={`flex gap-4 p-4 rounded-lg border transition-all hover:shadow-md cursor-pointer ${
        isSelected
          ? 'border-primary-500 bg-primary-50'
          : 'border-stone-200 hover:border-primary-300'
      }`}
      onClick={() => onSelect(book)}
    >
      {/* Book cover */}
      <div className="flex-shrink-0 w-16 h-24 bg-stone-100 rounded overflow-hidden">
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
          <div className="w-full h-full flex items-center justify-center">
            <Book className="w-8 h-8 text-stone-400" />
          </div>
        )}
      </div>

      {/* Book info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-stone-900 mb-1 truncate">
          {book.title}
        </h3>
        <p className="text-sm text-stone-600 mb-1">{book.author}</p>
        {book.publisher && (
          <p className="text-xs text-stone-500">
            {book.publisher}
            {publishYear && ` · ${publishYear}`}
          </p>
        )}
      </div>

      {/* Select button */}
      <div className="flex-shrink-0 flex items-center">
        {isSelected ? (
          <div className="flex items-center gap-2 text-primary-600">
            <Check className="w-5 h-5" />
            <span className="text-sm font-medium">선택됨</span>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(book);
            }}
          >
            선택
          </Button>
        )}
      </div>
    </div>
  );
}

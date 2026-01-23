import { Book, Check } from 'lucide-react';
import { Button } from '../ui/button';
import type { BookData } from '../../types/book';

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
      className={`group flex gap-4 p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
        isSelected
          ? 'border-primary-500 bg-primary-50/50 shadow-sm'
          : 'border-stone-100 bg-white hover:border-primary-200 hover:shadow-md'
      }`}
      onClick={() => onSelect(book)}
    >
      {/* Selection Indicator (Background Flash) */}
      {isSelected && (
        <div className="absolute inset-y-0 left-0 w-1 bg-primary-500 rounded-l-xl" />
      )}

      {/* Book cover */}
      <div className="flex-shrink-0 w-16 h-24 bg-stone-100 rounded-lg overflow-hidden shadow-sm group-hover:shadow transition-shadow">
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
          <div className="w-full h-full flex items-center justify-center">
            <Book className="w-8 h-8 text-stone-300" />
          </div>
        )}
      </div>

      {/* Book info */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <h3
          className={`font-serif font-bold text-lg mb-1 truncate ${isSelected ? 'text-primary-900' : 'text-stone-900'}`}
        >
          {book.title}
        </h3>
        <p className="text-sm text-stone-600 font-medium mb-1">{book.author}</p>

        <div className="flex items-center gap-2 text-xs text-stone-400 mt-auto">
          {book.publisher && <span>{book.publisher}</span>}
          {book.publisher && publishYear && <span>•</span>}
          {publishYear && <span>{publishYear}</span>}
        </div>
      </div>

      {/* Select button */}
      <div className="flex-shrink-0 flex items-center">
        {isSelected ? (
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-100 text-primary-600">
            <Check className="w-5 h-5" />
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(book);
            }}
            className="text-stone-400 group-hover:text-primary-600 group-hover:bg-primary-50 transition-colors"
          >
            선택
          </Button>
        )}
      </div>
    </div>
  );
}

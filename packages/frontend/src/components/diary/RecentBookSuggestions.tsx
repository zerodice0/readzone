import { useQuery } from 'convex/react';
import { Book, Clock } from 'lucide-react';
import { api } from 'convex/_generated/api';
import type { BookData } from '../../types/book';

interface RecentBookSuggestionsProps {
  onSelectBook: (book: BookData) => void;
}

export function RecentBookSuggestions({
  onSelectBook,
}: RecentBookSuggestionsProps) {
  const suggestions = useQuery(api.readingDiaries.getRecentBooks, {
    limit: 10,
  });

  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <Clock className="w-4 h-4 text-primary-500" />
        <h4 className="text-sm font-bold text-stone-700">최근 읽고 있는 책</h4>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {suggestions.map(({ book, diaryCount }) => (
          <button
            key={book._id}
            onClick={() => onSelectBook(book)}
            className="flex-shrink-0 w-28 group text-left"
          >
            <div className="w-28 h-40 bg-stone-100 rounded-lg overflow-hidden shadow-sm ring-1 ring-stone-900/5 group-hover:shadow-md group-hover:ring-primary-300 transition-all">
              {book.coverImageUrl ? (
                <img
                  src={book.coverImageUrl}
                  alt={`${book.title} 표지`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Book className="w-8 h-8 text-stone-300" />
                </div>
              )}
            </div>
            <p className="mt-2 text-sm font-medium text-stone-900 truncate group-hover:text-primary-700 transition-colors">
              {book.title}
            </p>
            <p className="text-xs text-stone-500">일기 {diaryCount}건</p>
          </button>
        ))}
      </div>
    </div>
  );
}

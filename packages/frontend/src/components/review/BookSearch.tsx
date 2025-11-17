import { useState } from 'react';
import { Search, Loader2, BookPlus, X } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from 'convex/_generated/api';
import { Button } from '../ui/button';
import { BookSearchResult } from './BookSearchResult';
import { useDebounce } from '../../hooks/useDebounce';
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

interface BookSearchProps {
  onSelectBook: (book: BookData) => void;
  selectedBook?: BookData | null;
}

export function BookSearch({ onSelectBook, selectedBook }: BookSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddBookModal, setShowAddBookModal] = useState(false);

  // Debounce search query
  const debouncedQuery = useDebounce(searchQuery, 500);

  // Search books using Convex query
  const searchResults = useQuery(
    api.books.search,
    debouncedQuery.trim().length >= 2
      ? { query: debouncedQuery.trim(), limit: 10 }
      : 'skip'
  ) as BookData[] | undefined;

  const isSearching =
    searchQuery.trim().length >= 2 && searchResults === undefined;
  const hasResults = Array.isArray(searchResults) && searchResults.length > 0;
  const showNoResults =
    debouncedQuery.trim().length >= 2 &&
    Array.isArray(searchResults) &&
    searchResults.length === 0;

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
        <input
          type="text"
          placeholder="책 제목 또는 저자로 검색..."
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSearchQuery(e.target.value)
          }
          className="w-full pl-10 pr-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Loading state */}
      {isSearching && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary-500 mr-2" />
          <span className="text-stone-600">검색 중...</span>
        </div>
      )}

      {/* Search results */}
      {hasResults && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {searchResults.map((book) => (
            <BookSearchResult
              key={book._id}
              book={book}
              isSelected={selectedBook?._id === book._id}
              onSelect={onSelectBook}
            />
          ))}
        </div>
      )}

      {/* No results */}
      {showNoResults && (
        <div className="text-center py-8">
          <p className="text-stone-600 mb-4">
            &quot;{debouncedQuery}&quot;에 대한 검색 결과가 없습니다
          </p>
          <Button
            variant="outline"
            onClick={() => setShowAddBookModal(true)}
            className="gap-2"
          >
            <BookPlus className="w-4 h-4" />책 직접 추가하기
          </Button>
        </div>
      )}

      {/* Initial state hint */}
      {!searchQuery && !selectedBook && (
        <div className="text-center py-8 text-stone-500">
          <p className="mb-2">독후감을 작성할 책을 검색해주세요</p>
          <p className="text-sm">
            책 제목 또는 저자명을 입력하면 검색 결과가 표시됩니다
          </p>
        </div>
      )}

      {/* Selected book display */}
      {selectedBook && !searchQuery && (
        <div className="border-2 border-primary-500 rounded-lg p-4 bg-primary-50">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-20 h-28 bg-white rounded overflow-hidden shadow-sm">
              {selectedBook.coverImageUrl ? (
                <img
                  src={selectedBook.coverImageUrl}
                  alt={`${selectedBook.title} 표지`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <BookPlus className="w-8 h-8 text-stone-400" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-stone-900 mb-1">
                    {selectedBook.title}
                  </h3>
                  <p className="text-sm text-stone-700">
                    {selectedBook.author}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onSelectBook(null as unknown as BookData);
                    setSearchQuery('');
                  }}
                  className="text-stone-600 hover:text-stone-900"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              {selectedBook.description && (
                <p className="text-sm text-stone-600 line-clamp-2">
                  {selectedBook.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add book modal - to be implemented */}
      {showAddBookModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">책 추가하기</h3>
            <p className="text-stone-600 mb-4">
              책 직접 추가 기능은 곧 구현될 예정입니다.
            </p>
            <Button
              onClick={() => setShowAddBookModal(false)}
              className="w-full"
            >
              닫기
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

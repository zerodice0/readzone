import { useState, useEffect } from 'react';
import { Search, Loader2, BookPlus, X, Globe, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { BookSearchResult } from './BookSearchResult';
import { AladinBookResult } from './AladinBookResult';
import {
  useBookSearch,
  type LocalBook,
  type AladinBook,
} from '../../hooks/useBookSearch';
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
  const [savingBookId, setSavingBookId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const {
    isSearchingLocal,
    isSearchingAladin,
    localResults,
    aladinResults,
    aladinError,
    triggerAladinSearch,
    selectAladinBook,
    clearAladinResults,
    hasLocalResults,
    hasAladinResults,
    hasSearched,
  } = useBookSearch(searchQuery);

  // 검색어 변경 시 알라딘 결과 초기화
  useEffect(() => {
    clearAladinResults();
  }, [searchQuery, clearAladinResults]);

  const showNoLocalResults =
    searchQuery.trim().length >= 2 && !isSearchingLocal && !hasLocalResults;

  const canSearchAladin = searchQuery.trim().length >= 2;

  // 알라딘 책 선택 핸들러
  const handleSelectAladinBook = async (book: AladinBook) => {
    setSavingBookId(book.externalId);
    setSaveError(null);
    try {
      const bookId = await selectAladinBook(book);

      // 저장된 책을 BookData 형태로 변환하여 전달
      const savedBook: BookData = {
        _id: bookId,
        title: book.title,
        author: book.author,
        publisher: book.publisher || undefined,
        publishedDate: book.publishedDate || undefined,
        coverImageUrl: book.coverImageUrl || undefined,
        description: book.description || undefined,
      };

      onSelectBook(savedBook);
      setSearchQuery('');
    } catch (error) {
      console.error('Failed to save book:', error);
      const message =
        error instanceof Error ? error.message : '책 저장에 실패했습니다';
      if (message.includes('Unauthorized') || message.includes('logged in')) {
        setSaveError('로그인이 필요합니다. 다시 로그인해주세요.');
      } else {
        setSaveError(message);
      }
    } finally {
      setSavingBookId(null);
    }
  };

  // 로컬 책 선택 핸들러
  const handleSelectLocalBook = (book: LocalBook) => {
    onSelectBook(book as BookData);
  };

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

      {/* Loading state - Local */}
      {isSearchingLocal && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary-500 mr-2" />
          <span className="text-stone-600">검색 중...</span>
        </div>
      )}

      {/* Local search results */}
      {hasLocalResults && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-stone-500 px-1">
            내 서재에서 찾음
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {localResults.map((book) => (
              <BookSearchResult
                key={book._id}
                book={book}
                isSelected={selectedBook?._id === book._id}
                onSelect={handleSelectLocalBook}
              />
            ))}
          </div>
        </div>
      )}

      {/* Aladin search button */}
      {canSearchAladin && !isSearchingLocal && (
        <div className="border-t border-stone-200 pt-4">
          {!hasSearched ? (
            <Button
              variant="outline"
              onClick={triggerAladinSearch}
              disabled={isSearchingAladin}
              className="w-full gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300"
            >
              {isSearchingAladin ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  알라딘에서 검색 중...
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4" />
                  알라딘에서 검색
                </>
              )}
            </Button>
          ) : isSearchingAladin ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500 mr-2" />
              <span className="text-stone-600">알라딘에서 검색 중...</span>
            </div>
          ) : null}
        </div>
      )}

      {/* Aladin error */}
      {aladinError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{aladinError}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={triggerAladinSearch}
            className="ml-auto text-red-700 hover:text-red-800 hover:bg-red-100"
          >
            다시 시도
          </Button>
        </div>
      )}

      {/* Save error */}
      {saveError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{saveError}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSaveError(null)}
            className="ml-auto text-red-700 hover:text-red-800 hover:bg-red-100"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Aladin search results */}
      {hasAladinResults && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-blue-600 px-1">
            알라딘 검색 결과
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {aladinResults.map((book) => (
              <AladinBookResult
                key={book.externalId}
                book={book}
                onSelect={() => handleSelectAladinBook(book)}
                isLoading={savingBookId === book.externalId}
              />
            ))}
          </div>
        </div>
      )}

      {/* No results at all */}
      {showNoLocalResults &&
        hasSearched &&
        !hasAladinResults &&
        !isSearchingAladin &&
        !aladinError && (
          <div className="text-center py-6">
            <p className="text-stone-600 mb-4">
              &quot;{searchQuery}&quot;에 대한 검색 결과가 없습니다
            </p>
            <Button
              variant="outline"
              onClick={triggerAladinSearch}
              className="gap-2"
            >
              <BookPlus className="w-4 h-4" />
              알라딘에서 다시 검색
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
    </div>
  );
}

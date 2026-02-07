import { useState, useEffect } from 'react';
import {
  Search,
  Loader2,
  BookPlus,
  X,
  Globe,
  AlertCircle,
  Check,
} from 'lucide-react';
import { Button } from '../ui/button';
import { BookSearchResult } from './BookSearchResult';
import { AladinBookResult } from './AladinBookResult';
import {
  useBookSearch,
  type LocalBook,
  type AladinBook,
} from '../../hooks/useBookSearch';
import { DiaryBookSuggestions } from './DiaryBookSuggestions';
import type { BookData } from '../../types/book';

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
    <div className="space-y-6">
      {/* Search input */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400 group-focus-within:text-primary-500 transition-colors" />
        <input
          type="text"
          placeholder="책 제목, 저자명으로 검색해보세요"
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSearchQuery(e.target.value)
          }
          className="w-full pl-12 pr-12 py-4 bg-white border border-stone-200 rounded-xl text-lg shadow-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Loading state - Local */}
      {isSearchingLocal && (
        <div className="flex flex-col items-center justify-center py-12 text-stone-500">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500 mb-3" />
          <span className="text-sm font-medium">
            내 서재를 검색하고 있습니다...
          </span>
        </div>
      )}

      {/* Local search results */}
      {hasLocalResults && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
            <h4 className="text-sm font-bold text-stone-700">검색 결과</h4>
          </div>
          <div className="grid gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
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
        <div className="border-t border-dashed border-stone-200 pt-6 mt-2">
          {!hasSearched ? (
            <Button
              variant="outline"
              onClick={triggerAladinSearch}
              disabled={isSearchingAladin}
              className="w-full h-12 gap-2 border-blue-100 bg-blue-50/50 text-blue-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all"
            >
              {isSearchingAladin ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  알라딘 데이터베이스 검색 중...
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4" />
                  알라딘에서 더 찾아보기
                </>
              )}
            </Button>
          ) : isSearchingAladin ? (
            <div className="flex flex-col items-center justify-center py-8 text-blue-600/80">
              <Loader2 className="w-6 h-6 animate-spin mb-2" />
              <span className="text-sm">알라딘에서 책을 찾고 있습니다...</span>
            </div>
          ) : null}
        </div>
      )}

      {/* Aladin error */}
      {aladinError && (
        <div className="flex items-center gap-3 p-4 bg-red-50/50 border border-red-100 rounded-xl text-red-600">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{aladinError}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={triggerAladinSearch}
            className="ml-auto text-red-600 hover:text-red-700 hover:bg-red-100"
          >
            다시 시도
          </Button>
        </div>
      )}

      {/* Save error */}
      {saveError && (
        <div className="flex items-center gap-3 p-4 bg-red-50/50 border border-red-100 rounded-xl text-red-600">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{saveError}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSaveError(null)}
            className="ml-auto text-red-600 hover:text-red-700 hover:bg-red-100"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Aladin search results */}
      {hasAladinResults && (
        <div className="space-y-3 mt-4">
          <div className="flex items-center gap-2 px-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <h4 className="text-sm font-bold text-blue-700">
              알라딘 검색 결과
            </h4>
          </div>
          <div className="grid gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
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
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mb-4 text-stone-400">
              <Search className="w-8 h-8" />
            </div>
            <p className="text-stone-900 font-medium mb-1">
              &quot;{searchQuery}&quot;에 대한 결과가 없습니다
            </p>
            <p className="text-stone-500 text-sm mb-6">
              검색어 스펠링을 확인하거나 다른 키워드로 시도해보세요.
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

      {/* Diary book suggestions + Initial state hint */}
      {!searchQuery && !selectedBook && (
        <>
          <DiaryBookSuggestions onSelectBook={onSelectBook} />
          <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-stone-200 rounded-2xl bg-stone-50/50">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 ring-1 ring-stone-900/5">
              <BookPlus className="w-8 h-8 text-primary-500" />
            </div>
            <h3 className="text-lg font-bold text-stone-900 mb-2">
              어떤 책을 기록할까요?
            </h3>
            <p className="text-stone-500 text-sm max-w-xs mx-auto">
              책 제목이나 저자 이름을 입력하여 독후감을 작성할 책을
              선택해주세요.
            </p>
          </div>
        </>
      )}

      {/* Selected book display */}
      {selectedBook && !searchQuery && (
        <div className="relative group overflow-hidden border border-primary-200 bg-primary-50/30 rounded-2xl p-6 transition-all hover:bg-primary-50/50 hover:border-primary-300">
          <div className="flex items-start gap-6">
            <div className="shrink-0 w-24 h-36 bg-white rounded-lg shadow-sm overflow-hidden ring-1 ring-stone-900/5">
              {selectedBook.coverImageUrl ? (
                <img
                  src={selectedBook.coverImageUrl}
                  alt={`${selectedBook.title} 표지`}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-stone-50">
                  <BookPlus className="w-8 h-8 text-stone-300" />
                </div>
              )}
            </div>

            <div className="flex-1 py-1">
              <div className="flex items-start justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-primary-100 text-primary-700 text-xs font-bold mb-3 shadow-sm">
                    <Check className="w-3 h-3" />
                    선택된 도서
                  </div>
                  <h3 className="font-serif font-bold text-xl text-stone-900 mb-2 leading-tight">
                    {selectedBook.title}
                  </h3>
                  <p className="text-stone-600 font-medium">
                    {selectedBook.author}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    onSelectBook(null as unknown as BookData);
                    setSearchQuery('');
                  }}
                  className="text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-full w-10 h-10 -mr-2 -mt-2"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {selectedBook.description && (
                <p className="text-sm text-stone-500 line-clamp-2 mt-4 leading-relaxed">
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

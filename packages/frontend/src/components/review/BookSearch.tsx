import { useId, useState, useEffect } from 'react';
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
import { RecentBookSuggestions } from '../diary/RecentBookSuggestions';
import { decodeHtmlEntities } from '../../utils/html';
import type { BookData } from '../../types/book';

interface BookSearchProps {
  onSelectBook: (book: BookData) => void;
  selectedBook?: BookData | null;
  context?: 'review' | 'diary';
  hideInitialHint?: boolean;
  compact?: boolean;
}

export function BookSearch({
  onSelectBook,
  selectedBook,
  context = 'review',
  hideInitialHint = false,
  compact = false,
}: BookSearchProps) {
  const searchInputId = useId();
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
  const selectedBookDescription = selectedBook?.description
    ? decodeHtmlEntities(selectedBook.description)
    : null;

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
    <div className={compact ? 'space-y-4' : 'space-y-6'}>
      {/* Search input */}
      <div className="relative group">
        <label htmlFor={searchInputId} className="sr-only">
          책 검색
        </label>
        <Search
          className={`absolute top-1/2 -translate-y-1/2 text-stone-400 transition-colors group-focus-within:text-primary-500 ${
            compact ? 'left-3 h-4 w-4' : 'left-4 h-5 w-5'
          }`}
        />
        <input
          id={searchInputId}
          name="book-search"
          type="text"
          placeholder={
            compact
              ? '책 제목, 저자명 검색'
              : '책 제목, 저자명으로 검색해보세요'
          }
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSearchQuery(e.target.value)
          }
          className={`paper-input w-full rounded-xl placeholder:text-stone-400 outline-none transition-all ${
            compact ? 'py-3 pl-10 pr-10 text-base' : 'py-4 pl-12 pr-12 text-lg'
          }`}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className={`absolute top-1/2 -translate-y-1/2 rounded-full p-1 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600 ${
              compact ? 'right-3' : 'right-4'
            }`}
          >
            <X className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
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
              className="h-12 w-full gap-2 border-primary-200 bg-primary-50/60 text-primary-700 transition-colors hover:border-primary-300 hover:bg-primary-100/70 hover:text-primary-800"
            >
              {isSearchingAladin ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  알라딘 데이터베이스 검색 중…
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4" />
                  알라딘에서 더 찾아보기
                </>
              )}
            </Button>
          ) : isSearchingAladin ? (
            <div className="flex flex-col items-center justify-center py-8 text-primary-700">
              <Loader2 className="w-6 h-6 animate-spin mb-2" />
              <span className="text-sm">알라딘에서 책을 찾고 있습니다…</span>
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
            <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
            <h4 className="text-sm font-bold text-stone-700">
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

      {/* Book suggestions + Initial state hint */}
      {!searchQuery && !selectedBook && (
        <>
          {context === 'diary' ? (
            <RecentBookSuggestions onSelectBook={onSelectBook} />
          ) : (
            <DiaryBookSuggestions onSelectBook={onSelectBook} />
          )}
          {!hideInitialHint && (
            <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-paper-200 rounded-2xl bg-paper-50/35">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 ring-1 ring-stone-900/5">
                <BookPlus className="w-8 h-8 text-primary-500" />
              </div>
              <h3 className="text-lg font-bold text-stone-900 mb-2">
                어떤 책을 기록할까요?
              </h3>
              <p className="text-stone-500 text-sm max-w-xs mx-auto">
                {context === 'diary'
                  ? '위에서 최근 읽은 책을 선택하거나, 검색하여 새로운 책을 찾아보세요.'
                  : '책 제목이나 저자 이름을 입력하여 독후감을 작성할 책을 선택해주세요.'}
              </p>
            </div>
          )}
        </>
      )}

      {/* Selected book display */}
      {selectedBook && !searchQuery && (
        <div
          className={`paper-panel relative group overflow-hidden rounded-2xl transition-all hover:border-paper-300 ${
            compact ? 'p-4' : 'p-5 sm:p-6'
          }`}
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="inline-flex items-center gap-1.5 rounded-md border border-primary-100 bg-white px-2.5 py-1 text-xs font-bold text-primary-700 shadow-sm">
              <Check className="h-3 w-3" />
              선택된 도서
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                onSelectBook(null as unknown as BookData);
                setSearchQuery('');
              }}
              className="-mr-2 -mt-2 h-10 w-10 rounded-full text-stone-400 hover:bg-red-50 hover:text-red-500"
              aria-label="선택한 도서 해제"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className={`flex items-start ${compact ? 'gap-4' : 'gap-5'}`}>
            <div
              className={`book-paper-frame shrink-0 overflow-hidden rounded-lg ${
                compact ? 'h-[7.5rem] w-20' : 'h-36 w-24'
              }`}
            >
              {selectedBook.coverImageUrl ? (
                <img
                  src={selectedBook.coverImageUrl}
                  alt={`${selectedBook.title} 표지`}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-stone-50">
                  <BookPlus className="h-8 w-8 text-stone-300" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1 py-1">
              <h3
                className={`break-words font-serif font-bold leading-tight text-stone-900 ${
                  compact ? 'text-lg' : 'text-xl'
                }`}
              >
                {selectedBook.title}
              </h3>
              <p className="mt-2 break-words font-medium text-stone-600">
                {selectedBook.author}
              </p>
            </div>
          </div>

          {selectedBookDescription && (
            <div
              className={`mt-4 overflow-y-auto pr-2 text-sm leading-relaxed text-stone-600 custom-scrollbar focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                compact ? 'max-h-28 sm:max-h-32' : 'max-h-36 sm:max-h-40'
              }`}
              tabIndex={0}
              aria-label={`${selectedBook.title} 도서 설명`}
            >
              {selectedBookDescription}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

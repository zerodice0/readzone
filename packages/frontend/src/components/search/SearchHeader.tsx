import { type ChangeEvent, type FC, type KeyboardEvent, useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import useSearchStore, { useSearchSuggestions } from '@/store/searchStore';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import type { SearchType } from '@/types/index';
import { cn } from '@/lib/utils';

interface SearchHeaderProps {
  className?: string;
}

const searchTypes: { key: SearchType; label: string; description: string }[] = [
  { key: 'all', label: '전체', description: '도서, 독후감, 사용자' },
  { key: 'books', label: '도서', description: '제목, 저자, ISBN' },
  { key: 'reviews', label: '독후감', description: '내용, 태그, 작성자' },
  { key: 'users', label: '사용자', description: '닉네임, 자기소개' },
];

export const SearchHeader: FC<SearchHeaderProps> = ({ className }) => {
  const {
    query,
    type,
    pagination,
    setQuery,
    setType,
    search,
    getSuggestions,
    addRecentSearch,
  } = useSearchStore();

  const { suggestions, recentSearches } = useSearchSuggestions();

  const [inputValue, setInputValue] = useState(query);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Debounce suggestions
  const debouncedInput = useDebouncedValue(inputValue, 300);

  // Get suggestions when input changes
  useEffect(() => {
    if (debouncedInput && debouncedInput !== query) {
      getSuggestions(debouncedInput);
    }
  }, [debouncedInput, query, getSuggestions]);

  // Update input when query changes externally
  useEffect(() => {
    setInputValue(query);
  }, [query]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    setInputValue(value);
    setShowSuggestions(true);
    setActiveIndex(-1);
  };

  const handleInputFocus = () => {
    setShowSuggestions(true);
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const handleSearch = (searchQuery?: string) => {
    const candidate = searchQuery?.trim();
    const finalQuery = candidate && candidate.length > 0
      ? candidate
      : inputValue.trim();

    if (!finalQuery) {
      return;
    }

    setQuery(finalQuery);
    addRecentSearch(finalQuery);
    setShowSuggestions(false);
    search();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) {
      return;
    }

    const allSuggestions = [
      ...suggestions,
      ...recentSearches.filter(r => !suggestions.includes(r)),
    ];

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev =>
          prev < allSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev =>
          prev > 0 ? prev - 1 : allSuggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && allSuggestions[activeIndex]) {
          handleSearch(allSuggestions[activeIndex]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setActiveIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSearch(suggestion);
  };

  const handleTypeChange = (newType: SearchType) => {
    setType(newType);
  };

  const allSuggestions = [
    ...suggestions,
    ...recentSearches.filter(r => !suggestions.includes(r)),
  ].slice(0, 8); // Limit to 8 suggestions

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search Type Tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {searchTypes.map((searchType) => (
          <Button
            key={searchType.key}
            variant={type === searchType.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleTypeChange(searchType.key)}
            className="shrink-0"
          >
            {searchType.label}
          </Button>
        ))}
      </div>

      {/* Search Input with Suggestions */}
      <div className="relative">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              onKeyDown={handleKeyDown}
              placeholder={
                type === 'all'
                  ? '도서, 독후감, 사용자 검색...'
                  : searchTypes.find(t => t.key === type)?.description ?? '검색어를 입력하세요...'
              }
              className="pr-10"
              disabled={pagination.isLoading}
            />

            {/* Search Suggestions Dropdown */}
            {showSuggestions && allSuggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
              >
                {suggestions.length > 0 && (
                  <div className="p-2 border-b border-gray-100">
                    <div className="text-xs font-medium text-gray-500 mb-1">검색 제안</div>
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={`suggestion-${index}`}
                        type="button"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className={cn(
                          'w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-50 focus:bg-gray-50 focus:outline-none',
                          activeIndex === index && 'bg-gray-50'
                        )}
                      >
                        <span className="text-gray-900">{suggestion}</span>
                      </button>
                    ))}
                  </div>
                )}

                {recentSearches.filter(r => !suggestions.includes(r)).length > 0 && (
                  <div className="p-2">
                    <div className="text-xs font-medium text-gray-500 mb-1">최근 검색</div>
                    {recentSearches
                      .filter(r => !suggestions.includes(r))
                      .slice(0, 5)
                      .map((recent, index) => {
                        const adjustedIndex = suggestions.length + index;

                        return (
                          <button
                            key={`recent-${index}`}
                            type="button"
                            onClick={() => handleSuggestionClick(recent)}
                            className={cn(
                              'w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-50 focus:bg-gray-50 focus:outline-none',
                              activeIndex === adjustedIndex && 'bg-gray-50'
                            )}
                          >
                            <span className="text-gray-600">{recent}</span>
                          </button>
                        );
                      })}
                  </div>
                )}
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={!inputValue.trim() || pagination.isLoading}
            className="shrink-0"
          >
            {pagination.isLoading ? '검색 중...' : '검색'}
          </Button>
        </form>

        {/* Current Search Type Description */}
        {type !== 'all' && (
          <div className="mt-2 text-xs text-gray-500">
            {searchTypes.find(t => t.key === type)?.description}에서 검색합니다
          </div>
        )}
      </div>

      {/* Search Status */}
      {query && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>'{query}'에 대한 검색 결과</span>
          {type !== 'all' && (
            <Badge variant="secondary" className="text-xs">
              {searchTypes.find(t => t.key === type)?.label}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

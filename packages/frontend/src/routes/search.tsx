import { createFileRoute } from '@tanstack/react-router';
import { useEffect } from 'react';
import { SearchHeader } from '@/components/search/SearchHeader';
import { SearchFilters } from '@/components/search/SearchFilters';
import { SearchResults } from '@/components/search/SearchResults';
import { ManualBookForm } from '@/components/search/ManualBookForm';
import useSearchStore from '@/store/searchStore';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

function SearchPage() {
  const {
    query,
    type,
    setQuery,
    setType,
    search,
    results,
    pagination,
    error,
    addRecentSearch,
  } = useSearchStore();

  // Get search params from URL
  const searchParams = new URLSearchParams(window.location.search);
  const urlQuery = searchParams.get('q') ?? '';
  const urlType = (searchParams.get('type') as 'all' | 'books' | 'reviews' | 'users' | null) ?? 'all';
  const mode = (searchParams.get('mode') as 'select' | 'view' | null) ?? 'view';
  const redirectTo = searchParams.get('redirect') ?? '/write';

  // Debounce search to avoid too many API calls
  const debouncedQuery = useDebouncedValue(query, 500);

  // Initialize from URL params
  useEffect(() => {
    if (urlQuery && urlQuery !== query) {
      setQuery(urlQuery);
    }
    if (urlType && urlType !== type) {
      setType(urlType);
    }
  }, [urlQuery, urlType, query, type, setQuery, setType]);

  // Perform search when debounced query changes
  useEffect(() => {
    if (debouncedQuery && debouncedQuery !== urlQuery) {
      // Update URL
      const newParams = new URLSearchParams(window.location.search);

      newParams.set('q', debouncedQuery);
      if (type !== 'all') {
        newParams.set('type', type);
      } else {
        newParams.delete('type');
      }

      const newUrl = `${window.location.pathname}?${newParams.toString()}`;

      window.history.replaceState(null, '', newUrl);

      // Perform search
      search();
      addRecentSearch(debouncedQuery);
    }
  }, [debouncedQuery, type, search, addRecentSearch, urlQuery]);

  // Perform initial search if query exists
  useEffect(() => {
    if (urlQuery && (!query || query === urlQuery)) {
      search();
    }
  }, [urlQuery, query, search]);

  const totalResults = results.books.length + results.reviews.length + results.users.length;
  const showManualForm = type === 'books' && query && totalResults === 0 && !pagination.isLoading && !error;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {mode === 'select' ? '도서 선택' : '통합 검색'}
          </h1>
          {mode === 'select' && (
            <p className="text-sm text-gray-600">
              독후감을 작성할 도서를 검색하고 선택하세요.
            </p>
          )}
        </div>

        {/* Search Header */}
        <SearchHeader className="mb-6" />

        {/* Search Filters */}
        {query && (
          <SearchFilters className="mb-6" />
        )}

        {/* Search Results */}
        {query && (
          <div className="space-y-6">
            <SearchResults />

            {/* Manual Book Form for Books Search */}
            {showManualForm && (
              <div className="border-t pt-6">
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    찾는 도서가 없나요?
                  </h3>
                  <p className="text-sm text-gray-600">
                    데이터베이스와 카카오 도서 검색에서 찾을 수 없는 도서는 직접 추가할 수 있습니다.
                  </p>
                </div>
                <ManualBookForm
                  mode={mode}
                  redirectTo={redirectTo}
                  className="inline"
                />
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!query && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              검색어를 입력하세요
            </h3>
            <p className="text-gray-600 mb-6">
              도서, 독후감, 사용자를 통합 검색할 수 있습니다.
            </p>

            {/* Search Tips */}
            <div className="max-w-md mx-auto text-left">
              <h4 className="text-sm font-medium text-gray-900 mb-3">검색 팁</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>도서명, 저자명, ISBN으로 도서를 찾을 수 있습니다</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  <span>독후감 내용, 태그, 작성자로 독후감을 찾을 수 있습니다</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 mt-0.5">•</span>
                  <span>닉네임, 자기소개로 사용자를 찾을 수 있습니다</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 mt-0.5">•</span>
                  <span>고급 필터를 사용하여 검색 결과를 세분화할 수 있습니다</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Popular Searches (if no query) */}
        {!query && (
          <div className="mt-8 max-w-md mx-auto">
            <h4 className="text-sm font-medium text-gray-900 mb-3 text-center">
              인기 검색어
            </h4>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                '해리포터', '미움받을 용기', '코스모스', '1984', '어린왕자',
                '데미안', '노인과 바다', '위대한 개츠비', '햄릿', '돈키호테'
              ].map((term) => (
                <button
                  key={term}
                  onClick={() => {
                    setQuery(term);
                    setType('all');
                  }}
                  className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export const Route = createFileRoute('/search')({
  component: SearchPage,
});

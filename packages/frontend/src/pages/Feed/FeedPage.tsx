/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { useCallback, useState } from 'react';
import { FileText, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePaginatedQuery, useQuery } from 'convex/react';
import { api } from 'convex/_generated/api';
import { useUser } from '@clerk/clerk-react';
import { ReviewCard } from '../../components/ReviewCard';
import { InfiniteScroll } from '../../components/InfiniteScroll';
import { Skeleton } from '../../components/ui/skeleton';
import { Button } from '../../components/ui/button';
import { LoginPrompt } from '../../components/LoginPrompt';
import { useDebounce } from '../../hooks/useDebounce';
import {
  FeedFilters,
  type SortOption,
  type RecommendFilter,
} from '../../components/feed/FeedFilters';

const ITEMS_PER_PAGE = 10;

export function FeedPage() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [recommendFilter, setRecommendFilter] =
    useState<RecommendFilter>('all');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Search results (when searching)
  const searchResults = useQuery(
    api.reviews.searchFeed,
    debouncedSearchQuery.trim()
      ? { searchQuery: debouncedSearchQuery, userId: user?.id }
      : 'skip'
  );

  // Regular feed (when not searching)
  const { results, status, loadMore } = usePaginatedQuery(
    api.reviews.getFeed,
    debouncedSearchQuery.trim()
      ? 'skip'
      : {
          userId: user?.id,
          sortBy,
          recommendFilter,
        },
    { initialNumItems: ITEMS_PER_PAGE }
  ) as {
    results: Array<{
      _id: string;
      [key: string]: unknown;
    }>;
    status: 'LoadingFirstPage' | 'CanLoadMore' | 'LoadingMore' | 'Exhausted';
    loadMore: (numItems: number) => void;
  };

  // Determine which results to show
  const isSearching = debouncedSearchQuery.trim().length > 0;
  const displayResults = isSearching ? (searchResults ?? []) : results;
  const isLoading = isSearching
    ? searchResults === undefined
    : status === 'LoadingFirstPage';

  const handleNavigateToNew = useCallback(() => {
    navigate('/reviews/new');
  }, [navigate]);

  const handleLoadMore = useCallback(() => {
    loadMore(ITEMS_PER_PAGE);
  }, [loadMore]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  return (
    <>
      {/* T104: Global login prompt modal */}
      <LoginPrompt />

      {/* Main content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-3xl">
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-stone-900">
            독후감 피드
          </h1>
          <p className="text-stone-600 text-base sm:text-lg">
            다양한 책에 대한 독자들의 생생한 후기를 만나보세요
          </p>
        </div>

        {/* Search bar */}
        <div className="mb-6">
          <label htmlFor="search-input" className="sr-only">
            독후감 검색
          </label>
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-stone-400"
              aria-hidden="true"
            />
            <input
              id="search-input"
              type="search"
              placeholder="제목, 책 이름, 저자로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-12 py-3 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              aria-label="독후감 검색"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-stone-400 hover:text-stone-600"
                aria-label="검색어 지우기"
                type="button"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            )}
          </div>
          {isSearching && (
            <p
              className="mt-2 text-sm text-stone-600"
              role="status"
              aria-live="polite"
            >
              "{debouncedSearchQuery}" 검색 결과: {displayResults.length}개
            </p>
          )}
        </div>

        {/* Filters (only show when not searching) */}
        {!isSearching && (
          <FeedFilters
            sortBy={sortBy}
            onSortChange={setSortBy}
            recommendFilter={recommendFilter}
            onRecommendFilterChange={setRecommendFilter}
          />
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-white border border-stone-200 rounded-xl p-6 space-y-4 shadow-sm"
              >
                <div className="flex gap-6">
                  <Skeleton className="w-24 h-32 sm:w-32 sm:h-44 rounded-lg" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-6 w-full max-w-md" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                </div>
                <Skeleton className="h-16 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {displayResults.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white border border-stone-200 rounded-xl">
            <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center mb-6">
              {isSearching ? (
                <Search className="w-10 h-10 text-stone-400" />
              ) : (
                <FileText className="w-10 h-10 text-stone-400" />
              )}
            </div>
            <h2 className="text-2xl font-bold mb-2 text-stone-900">
              {isSearching
                ? '검색 결과가 없습니다'
                : '아직 작성된 독후감이 없습니다'}
            </h2>
            <p className="text-stone-600 mb-8 text-lg">
              {isSearching
                ? '다른 검색어로 시도해보세요'
                : '첫 번째 독후감을 작성해 보세요!'}
            </p>
            {!isSearching && (
              <Button
                onClick={handleNavigateToNew}
                className="bg-primary-500 hover:bg-primary-600 transition-all duration-200 hover:scale-105 hover:shadow-lg"
              >
                독후감 작성하기
              </Button>
            )}
          </div>
        )}

        {/* Review list */}
        {displayResults.length > 0 && (
          <>
            <div className="space-y-6">
              {displayResults.map((review) => (
                <ReviewCard key={review._id} review={review} />
              ))}
            </div>

            {/* Infinite scroll (only for non-search mode) */}
            {!isSearching && (
              <nav aria-label="페이지네이션" className="mt-8">
                <InfiniteScroll
                  isLoading={status === 'LoadingMore'}
                  hasMore={status === 'CanLoadMore'}
                  onLoadMore={handleLoadMore}
                />
              </nav>
            )}
          </>
        )}
      </main>
    </>
  );
}

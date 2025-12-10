import React, { useCallback, useState } from 'react';
import { FileText, Search, X, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePaginatedQuery, useQuery } from 'convex/react';
import { api } from 'convex/_generated/api';
import { useUser } from '@clerk/clerk-react';
import { m } from 'framer-motion';
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
import {
  pageVariants,
  containerVariants,
  fadeInUpVariants,
} from '../../utils/animations';

const ITEMS_PER_PAGE = 12; // Increased for grid layout

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
  );

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
    <div className="min-h-screen bg-[#FAFAF9]">
      <LoginPrompt />

      <m.main
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-7xl"
      >
        {/* Header Section */}
        <div className="text-center mb-16 relative">
          <div className="hidden sm:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-gradient-to-r from-primary-100/40 via-purple-100/40 to-orange-100/40 blur-3xl rounded-[100%] z-0 pointer-events-none" />

          <div className="relative z-10">
            <m.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center justify-center p-3 bg-white rounded-2xl shadow-sm mb-6"
            >
              <BookOpen className="w-8 h-8 text-primary-600" />
            </m.div>

            <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-stone-900 font-serif tracking-tight">
              ReadZone
            </h1>
            <p className="text-stone-500 text-lg max-w-2xl mx-auto leading-relaxed">
              책을 사랑하는 사람들의 솔직한 이야기.
              <br className="hidden sm:block" />
              새로운 영감을 발견하고 당신의 생각도 나눠보세요.
            </p>
          </div>
        </div>

        {/* Search & Filter Section */}
        <div className="max-w-4xl mx-auto mb-12 space-y-6">
          {/* Search Bar */}
          <m.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="group relative"
          >
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search
                className={`w-5 h-5 transition-colors duration-300 ${isSearching ? 'text-primary-500' : 'text-stone-400 group-focus-within:text-primary-500'}`}
              />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="책 제목, 저자, 독후감 제목으로 검색..."
              className="w-full pl-12 pr-12 py-4 bg-white border border-stone-200 rounded-2xl shadow-sm text-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder:text-stone-400"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </m.div>

          {/* Filters */}
          {!isSearching && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <FeedFilters
                sortBy={sortBy}
                onSortChange={setSortBy}
                recommendFilter={recommendFilter}
                onRecommendFilterChange={setRecommendFilter}
              />
              <div className="hidden sm:block text-sm text-stone-400">
                {/* Optional: Add result count or other meta info here */}
              </div>
            </div>
          )}
        </div>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="bg-white border border-stone-200 rounded-xl p-6 space-y-4 shadow-sm h-full"
              >
                <div className="flex gap-4">
                  <Skeleton className="w-20 h-28 rounded-md shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
                <Skeleton className="h-16 w-full" />
                <div className="flex justify-between pt-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-8 w-20 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {displayResults.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-24 h-24 rounded-full bg-stone-100 flex items-center justify-center mb-6">
              {isSearching ? (
                <Search className="w-10 h-10 text-stone-400" />
              ) : (
                <FileText className="w-10 h-10 text-stone-400" />
              )}
            </div>
            <h2 className="text-2xl font-bold mb-3 text-stone-900">
              {isSearching
                ? '검색 결과가 없습니다'
                : '아직 작성된 독후감이 없습니다'}
            </h2>
            <p className="text-stone-500 mb-8 text-lg max-w-sm mx-auto">
              {isSearching
                ? '단어의 철자가 정확한지 확인하거나, 다른 검색어로 시도해보세요.'
                : '첫 번째 독후감을 작성하여 커뮤니티의 시작을 함께해주세요!'}
            </p>
            {!isSearching && (
              <Button
                onClick={handleNavigateToNew}
                size="lg"
                className="bg-primary-600 hover:bg-primary-700 font-medium px-8"
              >
                독후감 작성하기
              </Button>
            )}
          </div>
        )}

        {/* Review Grid */}
        {displayResults.length > 0 && (
          <>
            <m.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8"
            >
              {displayResults.map((review, index) => (
                <React.Fragment key={review._id}>
                  <ReviewCard review={review} />
                  {/* 쿠팡 파트너스 배너: 6번째 카드 뒤에 노출 (총 6개 이상일 때만) */}
                  {index === 5 && displayResults.length >= 6 && (
                    <m.a
                      variants={fadeInUpVariants}
                      href="https://link.coupang.com/a/dcL7bX"
                      target="_blank"
                      referrerPolicy="unsafe-url"
                      className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden hover:shadow-md hover:border-primary-200 hover:ring-1 hover:ring-primary-100 transition-all duration-300 flex flex-col group h-full"
                    >
                      {/* 상단: 이미지 배너 영역 */}
                      <div className="relative h-48 bg-stone-50 overflow-hidden border-b border-stone-100 flex items-center justify-center p-6">
                        <div className="absolute top-3 right-3 z-10">
                          <span className="text-[10px] font-bold text-stone-400 bg-white/80 backdrop-blur-sm px-2 py-0.5 rounded-full border border-stone-100">
                            AD
                          </span>
                        </div>
                        <img
                          src="https://ads-partners.coupang.com/banners/949275?subId=&traceId=V0-301-f5c692db558def48-I949275&w=600&h=900"
                          alt="쿠팡에서 도서 구매하기"
                          className="h-full w-auto object-contain drop-shadow-md transform group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>

                      {/* 하단: 텍스트 콘텐츠 */}
                      <div className="p-5 flex flex-col flex-1">
                        <h3 className="font-bold text-lg text-stone-900 mb-2 font-serif line-clamp-1 group-hover:text-primary-600 transition-colors">
                          원하는 책을 찾고 계신가요?
                        </h3>

                        <p className="text-sm text-stone-600 leading-relaxed mb-4 flex-1">
                          쿠팡에서 도서를 구매하시면{' '}
                          <span className="text-primary-600 font-medium bg-primary-50 px-1 rounded">
                            ReadZone
                          </span>{' '}
                          운영에 힘이 됩니다.
                        </p>

                        <div className="pt-3 border-t border-stone-100">
                          <p className="text-[10px] text-stone-400 leading-tight">
                            쿠팡 파트너스 활동의 일환으로, 일정액의 수수료를
                            제공받습니다.
                          </p>
                        </div>
                      </div>
                    </m.a>
                  )}
                </React.Fragment>
              ))}
            </m.div>

            {/* Infinite scroll (only for non-search mode) */}
            {!isSearching && (
              <div className="mt-16 flex justify-center">
                <InfiniteScroll
                  isLoading={status === 'LoadingMore'}
                  hasMore={status === 'CanLoadMore'}
                  onLoadMore={handleLoadMore}
                />
              </div>
            )}
          </>
        )}
      </m.main>
    </div>
  );
}

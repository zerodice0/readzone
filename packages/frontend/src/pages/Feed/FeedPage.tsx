import { useCallback, useState } from 'react';
import {
  FileText,
  Search,
  X,
  NotebookPen,
  PenSquare,
  Sparkles,
} from 'lucide-react';
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
import { BrandMark } from '../../components/brand/BrandMark';
import { useDebounce } from '../../hooks/useDebounce';
import { pageVariants, containerVariants } from '../../utils/animations';

const ITEMS_PER_PAGE = 12;

export function FeedPage() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
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
    void navigate('/reviews/new');
  }, [navigate]);

  const handleLoadMore = useCallback(() => {
    loadMore(ITEMS_PER_PAGE);
  }, [loadMore]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  return (
    <div className="min-h-screen">
      <LoginPrompt />

      <m.main
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,720px)_280px] lg:px-8"
      >
        <section className="min-w-0">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-stone-950">피드</h1>
              <p className="text-sm text-stone-500">
                독자들이 방금 남긴 책의 흔적
              </p>
            </div>
            <BrandMark className="sm:hidden" />
          </div>

          <div className="paper-surface mb-4 rounded-2xl p-4">
            <button
              type="button"
              onClick={handleNavigateToNew}
              className="group flex w-full gap-3 text-left"
            >
              {user?.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt=""
                  className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-paper-200"
                />
              ) : (
                <BrandMark className="h-10 w-10 rounded-full" />
              )}
              <span className="min-w-0 flex-1 border-b border-paper-200 pb-4">
                <span className="block text-base font-semibold text-stone-900 group-hover:text-primary-800">
                  어떤 책이 머릿속에 남았나요?
                </span>
                <span className="mt-1 block text-sm text-stone-500">
                  제목을 고르고 독후감을 바로 남겨보세요.
                </span>
              </span>
            </button>
            <div className="mt-3 flex items-center justify-end gap-2">
              <Button
                onClick={() => navigate('/reading-diary/new')}
                variant="ghost"
                size="sm"
                className="text-stone-600 hover:text-ink-green"
              >
                <NotebookPen className="w-4 h-4" />
                오늘 기록
              </Button>
              <Button onClick={handleNavigateToNew} variant="warm" size="sm">
                <PenSquare className="w-4 h-4" />
                독후감 쓰기
              </Button>
            </div>
          </div>

          <div className="sticky top-16 z-20 mb-4 bg-[#fbf7ee]/92 py-3 backdrop-blur-xl">
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
                className="paper-input h-12 w-full rounded-full pl-12 pr-12 text-base outline-none transition-all placeholder:text-stone-400"
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
          </div>

          {isLoading && (
            <div className="overflow-hidden rounded-2xl border border-paper-200/70 bg-[#fffdf8]/70">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex gap-4 border-b border-paper-200/60 p-4 last:border-b-0"
                >
                  <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-8 w-40 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {displayResults.length === 0 && !isLoading && (
            <div className="paper-surface flex flex-col items-center justify-center rounded-2xl px-6 py-16 text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-stone-100">
                {isSearching ? (
                  <Search className="w-8 h-8 text-stone-400" />
                ) : (
                  <FileText className="w-8 h-8 text-stone-400" />
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

          {displayResults.length > 0 && (
            <>
              <m.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="overflow-hidden rounded-2xl border border-paper-200/70 bg-[#fffdf8]/82"
              >
                {displayResults.map((review) => (
                  <ReviewCard key={review._id} review={review} />
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
        </section>

        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <div className="paper-surface rounded-2xl p-5">
              <div className="mb-4 flex items-center gap-3">
                <BrandMark />
                <div>
                  <h2 className="font-bold text-stone-950">글다락</h2>
                  <p className="text-xs text-stone-500">독후감 타임라인</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-stone-600">
                긴 소개보다 먼저 독자의 글을 보여줍니다. 읽고, 반응하고, 바로
                이어서 내 독후감을 남기는 흐름에 맞췄습니다.
              </p>
            </div>
            <div className="rounded-2xl border border-note-blue/15 bg-note-blue/5 p-5">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-note-blue">
                <Sparkles className="h-4 w-4" />
                논의할 점
              </div>
              <p className="text-sm leading-relaxed text-stone-600">
                다음 단계에서는 팔로잉 피드, 책별 토픽, 인용문 중심 작성 모드 중
                무엇을 우선할지 결정하면 됩니다.
              </p>
            </div>
          </div>
        </aside>
      </m.main>
    </div>
  );
}

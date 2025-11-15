import { useCallback } from 'react';
import { FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePaginatedQuery } from 'convex/react';
import { api } from 'convex/_generated/api';
import { useUser } from '@clerk/clerk-react';
import { ReviewCard } from '../../components/ReviewCard';
import { InfiniteScroll } from '../../components/InfiniteScroll';
import { Skeleton } from '../../components/ui/skeleton';
import { Button } from '../../components/ui/button';
import { LoginPrompt } from '../../components/LoginPrompt';

const ITEMS_PER_PAGE = 10;

export function FeedPage() {
  const navigate = useNavigate();
  const { user } = useUser();

  // Use Convex's usePaginatedQuery hook
  const { results, status, loadMore } = usePaginatedQuery(
    api.reviews.getFeed,
    { userId: user?.id },
    { initialNumItems: ITEMS_PER_PAGE }
  ) as {
    results: Array<{
      _id: string;
      [key: string]: unknown;
    }>;
    status: 'LoadingFirstPage' | 'CanLoadMore' | 'LoadingMore' | 'Exhausted';
    loadMore: (numItems: number) => void;
  };

  const handleNavigateToNew = useCallback(() => {
    navigate('/reviews/new');
  }, [navigate]);

  const handleLoadMore = useCallback(() => {
    loadMore(ITEMS_PER_PAGE);
  }, [loadMore]);

  return (
    <>
      {/* T104: Global login prompt modal */}
      <LoginPrompt />

      {/* T110: Add skip navigation link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-black focus:rounded focus:shadow-lg"
      >
        본문으로 건너뛰기
      </a>

      {/* T110: Use semantic main element */}
      <main
        id="main-content"
        role="main"
        className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-3xl"
      >
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-stone-900">
            독후감 피드
          </h1>
          <p className="text-stone-600 text-base sm:text-lg">
            다양한 책에 대한 독자들의 생생한 후기를 만나보세요
          </p>
        </div>

      {/* Loading skeleton */}
      {status === 'LoadingFirstPage' && (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white border border-stone-200 rounded-xl p-6 space-y-4 shadow-sm">
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
      {results.length === 0 && status !== 'LoadingFirstPage' && (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white border border-stone-200 rounded-xl">
          <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center mb-6">
            <FileText className="w-10 h-10 text-stone-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-stone-900">
            아직 작성된 독후감이 없습니다
          </h2>
          <p className="text-stone-600 mb-8 text-lg">
            첫 번째 독후감을 작성해 보세요!
          </p>
          <Button
            onClick={handleNavigateToNew}
            className="bg-primary-500 hover:bg-primary-600 transition-all duration-200 hover:scale-105 hover:shadow-lg"
          >
            독후감 작성하기
          </Button>
        </div>
      )}

      {/* Review list */}
      {results.length > 0 && (
        <>
          <div className="space-y-6">
            {results.map((review) => (
              <ReviewCard key={review._id} review={review} />
            ))}
          </div>

          {/* Infinite scroll */}
          {/* T110: Add navigation landmark for pagination */}
          <nav aria-label="페이지네이션" className="mt-8">
            <InfiniteScroll
              isLoading={status === 'LoadingMore'}
              hasMore={status === 'CanLoadMore'}
              onLoadMore={handleLoadMore}
            />
          </nav>
        </>
      )}
      </main>
    </>
  );
}

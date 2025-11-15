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
  );

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
        className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-4xl"
      >
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center sm:text-left">
          독후감 피드
        </h1>

      {/* Loading skeleton */}
      {status === 'LoadingFirstPage' && (
        <div className="space-y-4 sm:space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-6 space-y-4">
              <div className="flex gap-4">
                <Skeleton className="w-20 h-28 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-5 w-64" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
              <Skeleton className="h-20 w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {results.length === 0 && status !== 'LoadingFirstPage' && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            아직 작성된 독후감이 없습니다
          </h2>
          <p className="text-muted-foreground mb-6">
            첫 번째 독후감을 작성해 보세요!
          </p>
          <Button onClick={handleNavigateToNew}>
            독후감 작성하기
          </Button>
        </div>
      )}

      {/* Review list */}
      {results.length > 0 && (
        <>
          <div className="space-y-4 sm:space-y-6">
            {results.map((review) => (
              <ReviewCard key={review._id} review={review} />
            ))}
          </div>

          {/* Infinite scroll */}
          {/* T110: Add navigation landmark for pagination */}
          <nav aria-label="페이지네이션">
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

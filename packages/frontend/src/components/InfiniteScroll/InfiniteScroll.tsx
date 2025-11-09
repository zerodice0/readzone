import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface InfiniteScrollProps {
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  children?: React.ReactNode;
}

export function InfiniteScroll({
  isLoading,
  hasMore,
  onLoadMore,
  children,
}: InfiniteScrollProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // T075: Set up Intersection Observer
    const sentinel = sentinelRef.current;
    if (!sentinel) return undefined;

    // Don't observe if loading or no more items
    if (isLoading || !hasMore) return undefined;

    // T080: Browser compatibility check - use IntersectionObserver
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const observer = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) => {
        // If sentinel is visible, load more
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const entry = entries[0];
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (entry?.isIntersecting) {
          onLoadMore();
        }
      },
      {
        rootMargin: '800px', // T075: Trigger 800px before sentinel
        threshold: 0, // Trigger as soon as any part is visible
      }
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    observer.observe(sentinel);

    // T079: Cleanup - disconnect observer on unmount
    return (): void => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      observer.disconnect();
    };
  }, [isLoading, hasMore, onLoadMore]);

  return (
    <>
      {children}

      {/* T076: Sentinel element for Intersection Observer */}
      {hasMore && (
        <div ref={sentinelRef} className="h-1 w-full" aria-hidden="true" />
      )}

      {/* T077: Loading spinner */}
      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">
            독후감을 불러오는 중...
          </span>
        </div>
      )}

      {/* T078: End of feed message */}
      {!hasMore && !isLoading && (
        <div className="flex justify-center items-center py-8 text-center">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              모든 독후감을 확인했습니다
            </p>
            <p className="text-xs text-muted-foreground">
              새로운 독후감이 작성되면 여기에 표시됩니다
            </p>
          </div>
        </div>
      )}
    </>
  );
}

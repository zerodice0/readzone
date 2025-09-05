import { useEffect, useRef } from 'react';

interface UseInfiniteScrollOptions {
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => Promise<void>;
  threshold?: number;
}

export function useInfiniteScroll({
  hasMore,
  isLoading,
  onLoadMore,
  threshold = 1.0,
}: UseInfiniteScrollOptions) {
  const observerRef = useRef<IntersectionObserver | undefined>(undefined);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!triggerRef.current) {
      return;
    }

    // Clean up previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Create new observer
    observerRef.current = new IntersectionObserver(
      async (entries) => {
        const first = entries[0];

        if (first?.isIntersecting && hasMore && !isLoading) {
          await onLoadMore();
        }
      },
      {
        threshold,
        rootMargin: '100px', // Trigger 100px before the element comes into view
      }
    );

    observerRef.current.observe(triggerRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoading, onLoadMore, threshold]);

  return triggerRef;
}

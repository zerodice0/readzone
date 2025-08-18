import { type ReactNode, useEffect, useRef } from 'react';

interface InfiniteScrollProps {
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  children: ReactNode;
  threshold?: number; // 하단에서 몇 px 떨어진 곳에서 로딩을 트리거할지
  className?: string;
}

const InfiniteScroll = ({ 
  hasMore, 
  isLoading, 
  onLoadMore, 
  children, 
  threshold = 200,
  className = ''
}: InfiniteScrollProps) => {
  const loadingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadingElement = loadingRef.current;
    
    if (!loadingElement || isLoading || !hasMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        
        if (entry?.isIntersecting) {
          onLoadMore();
        }
      },
      {
        rootMargin: `${threshold}px`,
        threshold: 0.1
      }
    );

    observer.observe(loadingElement);

    return () => {
      if (loadingElement) {
        observer.unobserve(loadingElement);
      }
    };
  }, [hasMore, isLoading, onLoadMore, threshold]);

  return (
    <div className={`infinite-scroll ${className}`}>
      {children}
      
      {/* 로딩 트리거 및 상태 표시 */}
      <div ref={loadingRef} className="flex justify-center py-8">
        {isLoading && (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="text-muted-foreground">더 많은 독후감을 불러오는 중...</span>
          </div>
        )}
        
        {!hasMore && !isLoading && (
          <div className="text-center text-muted-foreground">
            <p className="text-sm">모든 독후감을 확인했습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InfiniteScroll;
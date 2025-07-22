'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { ReviewCard } from '@/components/feed/review-card';
import { FloatingWriteButton } from '@/components/feed/floating-write-button';
import { useSession } from '@/hooks/use-session';
import { useInView } from 'react-intersection-observer';
import { useEffect } from 'react';

interface Review {
  id: string;
  title?: string;
  content: string;
  isRecommended: boolean;
  createdAt: string;
  user: {
    id: string;
    nickname: string;
    image?: string;
  };
  book: {
    id: string;
    title: string;
    authors: string;
    thumbnail?: string;
    genre?: string;
  };
  _count: {
    likes: number;
    comments: number;
  };
}

async function fetchReviews({ pageParam = null }: { pageParam?: string | null }) {
  const params = new URLSearchParams();
  if (pageParam) params.append('cursor', pageParam);
  params.append('limit', '10');

  const response = await fetch(`/api/reviews?${params}`);
  if (!response.ok) throw new Error('Failed to fetch reviews');
  
  return response.json();
}

export function ReviewFeed() {
  const { data: session } = useSession();
  const { ref, inView } = useInView();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ['reviews'],
    queryFn: fetchReviews,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: null,
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 dark:bg-gray-800 rounded-lg h-48"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">독후감을 불러오는 중 오류가 발생했습니다.</p>
        </div>
      </div>
    );
  }

  const reviews = data?.pages.flatMap((page) => page.reviews) ?? [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="space-y-4">
        {reviews.map((review: Review) => (
          <ReviewCard key={review.id} review={review} isPreview />
        ))}
        
        {hasNextPage && (
          <div ref={ref} className="py-4 text-center">
            {isFetchingNextPage ? (
              <span className="text-sm text-gray-500 dark:text-gray-400">로딩 중...</span>
            ) : (
              <span className="text-sm text-gray-500 dark:text-gray-400">더 보기</span>
            )}
          </div>
        )}
        
        {!hasNextPage && reviews.length > 0 && (
          <div className="py-4 text-center">
            <span className="text-sm text-gray-500 dark:text-gray-400">모든 독후감을 확인했습니다.</span>
          </div>
        )}
        
        {reviews.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">아직 작성된 독후감이 없습니다.</p>
            {session && <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">첫 번째 독후감을 작성해보세요!</p>}
          </div>
        )}
      </div>
      
      {session && <FloatingWriteButton />}
    </div>
  );
}
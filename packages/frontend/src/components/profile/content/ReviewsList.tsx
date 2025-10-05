import React, { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { getUserReviewsQueryOptions } from '@/lib/api/user';
import ReviewCard from '@/components/feed/ReviewCard';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';

interface ReviewsListProps {
  userid: string;
  isOwner: boolean;
}

export const ReviewsList: React.FC<ReviewsListProps> = ({ userid, isOwner }) => {
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'popular'>('newest');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'public' | 'private'>('all');

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    ...getUserReviewsQueryOptions(userid, {
      sort: sortBy,
      ...(visibilityFilter !== 'all' && { visibility: visibilityFilter })
    }),
    getNextPageParam: (lastPage) => lastPage.pagination.nextCursor,
  });

  const loadMoreRef = useInfiniteScroll({
    hasMore: hasNextPage || false,
    isLoading: isFetchingNextPage,
    onLoadMore: async () => {
      await fetchNextPage();
    },
  });

  const allReviews = data?.pages.flatMap(page => page.reviews) ?? [];

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-48 w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <div className="mx-auto max-w-md">
            <p className="text-red-600 dark:text-red-400 text-base">
              독후감을 불러오는 중 오류가 발생했습니다.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (allReviews.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-16">
          <div className="mx-auto max-w-md">
            <p className="text-gray-500 dark:text-gray-400 text-base">
              아직 작성한 독후감이 없습니다.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* 필터 및 정렬 옵션 */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <label htmlFor="sort-select" className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
              정렬:
            </label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors min-w-[120px]"
            >
              <option value="newest">최신순</option>
              <option value="oldest">오래된순</option>
              <option value="popular">인기순</option>
            </select>
          </div>

          {isOwner && (
            <div className="flex items-center space-x-3">
              <label htmlFor="visibility-select" className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                공개범위:
              </label>
              <select
                id="visibility-select"
                value={visibilityFilter}
                onChange={(e) => setVisibilityFilter(e.target.value as typeof visibilityFilter)}
                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors min-w-[120px]"
              >
                <option value="all">전체</option>
                <option value="public">공개</option>
                <option value="private">비공개</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* 독후감 목록 */}
      <div className="space-y-6">
        {allReviews.map((review) => (
          <div key={review.id} className="w-full">
            <ReviewCard
              review={{
                id: review.id,
                content: review.content,
                createdAt: review.createdAt,
                author: review.author,
                book: {
                  id: review.book.id,
                  title: review.book.title,
                  author: review.book.author,
                  ...(review.book.thumbnail && { cover: review.book.thumbnail }),
                },
                stats: review.stats,
                userInteraction: null,
              }}
              onLike={() => { /* No-op for profile view */ }}
              onComment={() => { /* No-op for profile view */ }}
              onShare={() => { /* No-op for profile view */ }}
              onProfileClick={() => { /* No-op for profile view */ }}
              onBookClick={() => { /* No-op for profile view */ }}
              onReviewClick={() => { /* No-op for profile view */ }}
            />
          </div>
        ))}
      </div>

      {/* 무한 스크롤 센티넬 */}
      <div ref={loadMoreRef} className="mt-8 mb-6">
        <div className="h-16 flex items-center justify-center">
          {isFetchingNextPage && (
            <div className="flex items-center space-x-3 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-500"></div>
              <span className="text-sm font-medium">더 불러오는 중...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
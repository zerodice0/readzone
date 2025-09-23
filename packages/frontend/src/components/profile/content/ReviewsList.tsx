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
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-48"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400">
          독후감을 불러오는 중 오류가 발생했습니다.
        </p>
      </div>
    );
  }

  if (allReviews.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">
          아직 작성한 독후감이 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* 필터 및 정렬 옵션 */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex items-center space-x-2">
          <label htmlFor="sort-select" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            정렬:
          </label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="newest">최신순</option>
            <option value="oldest">오래된순</option>
            <option value="popular">인기순</option>
          </select>
        </div>

        {isOwner && (
          <div className="flex items-center space-x-2">
            <label htmlFor="visibility-select" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              공개범위:
            </label>
            <select
              id="visibility-select"
              value={visibilityFilter}
              onChange={(e) => setVisibilityFilter(e.target.value as typeof visibilityFilter)}
              className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">전체</option>
              <option value="public">공개</option>
              <option value="private">비공개</option>
            </select>
          </div>
        )}
      </div>

      {/* 독후감 목록 */}
      <div className="space-y-6">
        {allReviews.map((review) => (
          <ReviewCard
            key={review.id}
            review={{
              id: review.id,
              content: review.content,
              createdAt: review.createdAt,
              author: {
                id: userid,
                userid,
                username: userid,
              },
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
        ))}
      </div>

      {/* 무한 스크롤 센티넬 */}
      <div ref={loadMoreRef} className="h-10 flex items-center justify-center">
        {isFetchingNextPage && (
          <div className="flex items-center space-x-2 text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span className="text-sm">더 불러오는 중...</span>
          </div>
        )}
      </div>
    </div>
  );
};
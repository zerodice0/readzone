import type { FC } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { getUserLikesQueryOptions } from '@/lib/api/user';
import ReviewCard from '@/components/feed/ReviewCard';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';

interface LikedReviewsListProps {
  userid: string;
}

export const LikedReviewsList: FC<LikedReviewsListProps> = ({ userid }) => {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    ...getUserLikesQueryOptions(userid),
    getNextPageParam: (lastPage) => lastPage.pagination.nextCursor,
  });

  const loadMoreRef = useInfiniteScroll({
    hasMore: hasNextPage || false,
    isLoading: isFetchingNextPage,
    onLoadMore: async () => {
      await fetchNextPage();
    },
  });

  const allLikes = data?.pages.flatMap((page) => page.reviews) ?? [];

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
          좋아요한 독후감을 불러오는 중 오류가 발생했습니다.
        </p>
      </div>
    );
  }

  if (allLikes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">
          아직 좋아요한 독후감이 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* 좋아요한 독후감 목록 */}
      <div className="space-y-6">
        {allLikes.map((like) => (
          <div key={like.id} className="relative">
            <div className="absolute top-2 right-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-2 py-1 rounded-full text-xs">
              {new Date(like.likedAt).toLocaleDateString()}에 좋아요
            </div>
            <ReviewCard
              review={{
                id: like.review.id,
                content: like.review.content,
                createdAt: like.review.createdAt,
                author: {
                  id: userid,
                  userid,
                  nickname: userid,
                },
                book: {
                  id: like.review.book.id,
                  title: like.review.book.title,
                  author: like.review.book.author,
                  ...(like.review.book.thumbnail && {
                    cover: like.review.book.thumbnail,
                  }),
                },
                stats: like.review.stats,
                userInteraction: { isLiked: true, isBookmarked: false },
              }}
              onLike={() => {
                /* No-op for profile view */
              }}
              onComment={() => {
                /* No-op for profile view */
              }}
              onShare={() => {
                /* No-op for profile view */
              }}
              onProfileClick={() => {
                /* No-op for profile view */
              }}
              onBookClick={() => {
                /* No-op for profile view */
              }}
              onReviewClick={() => {
                /* No-op for profile view */
              }}
            />
          </div>
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

import type { FC } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { getUserFollowsQueryOptions } from '@/lib/api/user';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { FollowButton } from '../FollowButton';
import { useAuthStore } from '@/store/authStore';

interface FollowsListProps {
  userid: string;
  type: 'followers' | 'following';
}

export const FollowsList: FC<FollowsListProps> = ({ userid, type }) => {
  const { user: currentUser } = useAuthStore();
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    ...getUserFollowsQueryOptions(userid, { type }),
    getNextPageParam: (lastPage) => lastPage.pagination.nextCursor,
  });

  const loadMoreRef = useInfiniteScroll({
    hasMore: hasNextPage || false,
    isLoading: isFetchingNextPage,
    onLoadMore: async () => {
      await fetchNextPage();
    },
  });

  const allUsers = data?.pages.flatMap((page) => page.users) ?? [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="animate-pulse flex items-center space-x-4"
          >
            <div className="rounded-full bg-gray-200 dark:bg-gray-700 h-12 w-12"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400">
          {type === 'followers' ? '팔로워' : '팔로잉'} 목록을 불러오는 중 오류가
          발생했습니다.
        </p>
      </div>
    );
  }

  if (allUsers.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">
          {type === 'followers'
            ? '아직 팔로워가 없습니다.'
            : '아직 팔로잉하는 사용자가 없습니다.'}
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* 사용자 목록 */}
      <div className="space-y-4">
        {allUsers.map((follow) => (
          <div
            key={follow.id}
            className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center space-x-4">
              {/* 프로필 이미지 */}
              <div className="relative">
                {follow.user.profileImage ? (
                  <img
                    src={follow.user.profileImage}
                    alt={follow.user.nickname}
                    className="w-12 h-12 rounded-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">
                      {follow.user.nickname.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                {follow.user.isVerified && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-2.5 h-2.5 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* 사용자 정보 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {follow.user.nickname}
                  </h3>
                  {follow.user.isVerified && (
                    <span className="text-blue-500">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  @{follow.user.userid}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(follow.followedAt).toLocaleDateString()}에{' '}
                  {type === 'followers' ? '팔로우함' : '팔로우 시작'}
                </p>
              </div>
            </div>

            {/* 팔로우 버튼 */}
            <div className="flex-shrink-0">
              {currentUser && currentUser.userid !== follow.user.userid ? (
                <FollowButton
                  userid={follow.user.userid}
                  isFollowing={follow.relationship?.isFollowing ?? false}
                  followerCount={follow.stats?.followerCount ?? 0}
                  isMutualFollow={follow.relationship?.isMutualFollow ?? false}
                  size="sm"
                  showFollowerCount={false}
                />
              ) : currentUser?.userid === follow.user.userid ? (
                <span className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                  본인
                </span>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {/* 무한 스크롤 센티넬 */}
      <div
        ref={loadMoreRef}
        className="h-10 flex items-center justify-center mt-6"
      >
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

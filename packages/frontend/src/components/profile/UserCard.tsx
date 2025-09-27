import type { FC } from 'react';
import { Link } from '@tanstack/react-router';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { FollowButton } from './FollowButton';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useAuthStore } from '@/store/authStore';

interface User {
  id: string;
  userid: string;
  nickname: string;
  profileImage?: string | null;
  bio?: string | null;
  isVerified: boolean;
}

interface UserCardProps {
  user: User;
  followedAt?: string;
  stats?: {
    reviewCount: number;
    followerCount: number;
  };
  relationship?: {
    isFollowing: boolean;
    isFollowedBy: boolean;
    isMutualFollow: boolean;
  };
  showFollowButton?: boolean;
  showStats?: boolean;
  showFollowedDate?: boolean;
}

export const UserCard: FC<UserCardProps> = ({
  user,
  followedAt,
  stats,
  relationship,
  showFollowButton = true,
  showStats = true,
  showFollowedDate = true,
}) => {
  const { user: currentUser } = useAuthStore();

  const followedAtFormatted = followedAt
    ? formatDistanceToNow(new Date(followedAt), {
        addSuffix: true,
        locale: ko,
      })
    : null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <Link
            to="/profile/$userid"
            params={{ userid: user.userid }}
            className="flex-shrink-0"
          >
            <Avatar className="w-12 h-12">
              <AvatarImage
                src={user.profileImage ?? undefined}
                alt={`${user.nickname}의 프로필`}
              />
              <AvatarFallback className="text-lg font-medium">
                {user.nickname.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <Link
                to="/profile/$userid"
                params={{ userid: user.userid }}
                className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 truncate"
              >
                {user.nickname}
              </Link>

              {user.isVerified && (
                <span className="text-blue-500 flex-shrink-0">
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

              {relationship?.isMutualFollow && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 flex-shrink-0">
                  <svg
                    className="w-3 h-3 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  서로 팔로우
                </span>
              )}
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              @{user.userid}
            </p>

            {user.bio && (
              <p className="text-gray-600 dark:text-gray-300 text-sm mt-2 line-clamp-2">
                {user.bio}
              </p>
            )}

            {showStats && stats && (
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                <span>독후감 {stats.reviewCount}개</span>
                <span>팔로워 {stats.followerCount.toLocaleString()}명</span>
                {showFollowedDate && followedAtFormatted && (
                  <span>{followedAtFormatted}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {showFollowButton &&
          relationship &&
          currentUser &&
          currentUser.userid !== user.userid && (
            <div className="ml-4 flex-shrink-0">
              <FollowButton
                userid={user.userid}
                isFollowing={relationship.isFollowing}
                followerCount={stats?.followerCount ?? 0}
                isMutualFollow={relationship.isMutualFollow}
                size="sm"
                showFollowerCount={false}
              />
            </div>
          )}
      </div>
    </div>
  );
};

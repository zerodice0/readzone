import type { FC } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Settings } from 'lucide-react';
import type { UserProfileData } from '@/lib/api/auth';
import { FollowButton } from './FollowButton';
import { BlockButton } from '@/components/moderation';

interface ProfileHeaderProps {
  profile: UserProfileData
  onProfileUpdate?: (profile: UserProfileData) => void
  onEditProfile?: () => void
}

export const ProfileHeader: FC<ProfileHeaderProps> = ({
  profile,
  onProfileUpdate: _onProfileUpdate,
  onEditProfile,
}) => {
  const { user, isOwner } = profile

  const joinedDate = formatDistanceToNow(new Date(user.joinedAt), {
    addSuffix: true,
    locale: ko,
  })

  return (
    <section
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
      role="banner"
      aria-label={`${user.nickname}의 프로필 정보`}
    >
      <div className="flex flex-col md:flex-row gap-6">
        {/* 프로필 이미지 */}
        <div className="flex flex-col items-center md:items-start">
          <div
            className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden"
            role="img"
            aria-label={
              user.profileImage
                ? `${user.nickname}의 프로필 사진`
                : `${user.nickname}의 기본 프로필 아이콘`
            }
          >
            {user.profileImage ? (
              <img
                src={user.profileImage}
                alt={`${user.nickname}의 프로필 사진`}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <span
                className="text-2xl font-bold text-gray-500"
                aria-hidden="true"
              >
                {user.nickname[0]?.toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* 사용자 정보 */}
        <div className="flex-1">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {user.nickname}
                </h1>
                {user.isVerified && (
                  <span
                    className="text-blue-500 text-sm font-medium"
                    aria-label="인증된 사용자"
                    title="인증된 사용자"
                  >
                    ✓ 인증
                  </span>
                )}
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onEditProfile) {
                        onEditProfile()
                      }
                    }}
                    className="p-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    aria-label="프로필 설정"
                    title="프로필 설정"
                  >
                    <Settings className="h-5 w-5" />
                  </button>
                )}
              </div>

              <p
                className="text-gray-600 dark:text-gray-300 mb-1"
                aria-label={`사용자 ID: ${user.userid}`}
              >
                @{user.userid}
              </p>

              <p
                className="text-gray-600 dark:text-gray-300 text-sm"
                aria-label={`가입일: ${joinedDate}`}
              >
                <time dateTime={user.joinedAt}>{joinedDate} 가입</time>
              </p>

              {user.bio && (
                <p
                  className="text-gray-700 dark:text-gray-200 mt-3 whitespace-pre-wrap"
                  aria-label="사용자 소개"
                >
                  {user.bio}
                </p>
              )}
            </div>

            {/* 팔로우 버튼 & 차단 버튼 */}
            {!isOwner && profile.relationship && (
              <div
                className="flex flex-col sm:flex-row gap-2"
                role="group"
                aria-label="팔로우 및 차단 관련 기능"
              >
                <FollowButton
                  userid={user.userid}
                  isFollowing={profile.relationship.isFollowing}
                  followerCount={user.stats.followerCount}
                  isMutualFollow={profile.relationship.isMutualFollow}
                  size="default"
                  showFollowerCount={true}
                />
                <BlockButton
                  userId={user.id}
                  username={user.nickname}
                  variant="outline"
                  size="default"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

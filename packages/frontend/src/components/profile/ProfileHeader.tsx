import React from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { UserProfileData } from '@/lib/api/auth'
import { FollowButton } from './FollowButton'

interface ProfileHeaderProps {
  profile: UserProfileData
  onProfileUpdate?: (profile: UserProfileData) => void
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  onProfileUpdate: _onProfileUpdate
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
        {/* 프로필 이미지 및 기본 정보 */}
        <div className="flex flex-col items-center md:items-start">
          <div
            className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden"
            role="img"
            aria-label={user.profileImage ? `${user.nickname}의 프로필 사진` : `${user.nickname}의 기본 프로필 아이콘`}
          >
            {user.profileImage ? (
              <img
                src={user.profileImage}
                alt={`${user.nickname}의 프로필 사진`}
                className="w-full h-full object-cover"
                loading="lazy"
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

          {isOwner && (
            <button
              className="mt-3 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              onClick={() => {
                // 프로필 편집 - Phase 4에서 구현
              }}
              aria-label="프로필 정보 편집"
            >
              프로필 편집
            </button>
          )}
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
                <time dateTime={user.joinedAt}>
                  {joinedDate} 가입
                </time>
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

            {/* 팔로우 버튼 */}
            {!isOwner && profile.relationship && (
              <div role="group" aria-label="팔로우 관련 기능">
                <FollowButton
                  userid={user.userid}
                  isFollowing={profile.relationship.isFollowing}
                  followerCount={user.stats.followerCount}
                  isMutualFollow={profile.relationship.isMutualFollow}
                  size="default"
                  showFollowerCount={true}
                />
              </div>
            )}
          </div>

          {/* 소셜 링크 */}
          {user.socialLinks && (
            <nav
              className="flex gap-4 mt-4"
              role="navigation"
              aria-label="소셜 미디어 링크"
            >
              {user.socialLinks.blog && (
                <a
                  href={user.socialLinks.blog}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                  aria-label={`${user.nickname}의 블로그 방문 (새 창에서 열림)`}
                >
                  <span aria-hidden="true">🌐</span> 블로그
                </a>
              )}
              {user.socialLinks.twitter && (
                <a
                  href={user.socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                  aria-label={`${user.nickname}의 Twitter 방문 (새 창에서 열림)`}
                >
                  <span aria-hidden="true">🐦</span> Twitter
                </a>
              )}
              {user.socialLinks.instagram && (
                <a
                  href={user.socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                  aria-label={`${user.nickname}의 Instagram 방문 (새 창에서 열림)`}
                >
                  <span aria-hidden="true">📷</span> Instagram
                </a>
              )}
            </nav>
          )}
        </div>
      </div>
    </section>
  )
}
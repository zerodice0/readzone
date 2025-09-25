import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getUserProfile } from '@/lib/api/auth'
import { getUserBadges } from '@/lib/api/badges'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { ProfileStats } from '@/components/profile/ProfileStats'
import { ProfileTabs } from '@/components/profile/ProfileTabs'
import { ProfileContent } from '@/components/profile/ProfileContent'
import { useState } from 'react'

export const Route = createFileRoute('/profile/$userid')({
  component: ProfilePage,
})

function ProfilePage() {
  const { userid } = Route.useParams()
  const [activeTab, setActiveTab] = useState('reviews')

  const { data: profileData, isLoading, error, refetch } = useQuery({
    queryKey: ['user-profile', userid],
    queryFn: () => getUserProfile(userid),
    retry: false,
  })

  const { data: badgeData } = useQuery({
    queryKey: ['user-badges', userid],
    queryFn: () => getUserBadges(userid),
    retry: false,
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="animate-pulse">
              <div className="flex items-center space-x-6 mb-6">
                <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-48"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-32"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-center">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              프로필을 찾을 수 없습니다
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              사용자 @{userid}를 찾을 수 없습니다.
            </p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-center">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              프로필을 찾을 수 없습니다
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              사용자 @{userid}를 찾을 수 없습니다.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <ProfileHeader
          profile={profileData}
          onProfileUpdate={(_updatedProfile) => {
            // 프로필 업데이트 처리 (Phase 4에서 구현)
          }}
        />

        {/* 활동 통계 */}
        <ProfileStats stats={profileData.user.stats} className="mt-6" />

        {/* 프로필 탭 영역 */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <ProfileTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            counts={{
              reviews: profileData.user.stats.reviewCount,
              likes: 0, // TODO: Add likes count when available
              books: profileData.user.stats.booksRead,
              badges: badgeData?.stats?.earnedBadges ?? 0,
              followers: profileData.user.stats.followerCount,
              following: profileData.user.stats.followingCount,
            }}
            isOwner={profileData.isOwner}
          />
          <div className={`p-6 ${activeTab === 'reviews' ? 'pb-6 pt-4' : ''}`}>
            <ProfileContent
              activeTab={activeTab}
              userid={userid}
              isOwner={profileData.isOwner}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
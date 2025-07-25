'use client'

import { useState } from 'react'
import { useUserProfile } from '@/hooks/use-user-profile'
import { UserProfileHeader } from '@/components/profile/user-profile-header'
import { UserActivityStats } from '@/components/profile/user-activity-stats'
import { UserContentTabs } from '@/components/profile/user-content-tabs'
import { UserStatsCharts } from '@/components/profile/user-stats-charts'
import { EditProfileModal } from '@/components/profile/edit-profile-modal'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { 
  RefreshCw, 
  Settings, 
  BarChart3, 
  User,
  Calendar,
  MessageCircle,
  BookOpen,
  TrendingUp,
  Crown
} from 'lucide-react'

interface UserProfilePageProps {
  userId: string
  currentUserId?: string
  className?: string
}

export function UserProfilePage({ 
  userId, 
  className 
}: UserProfilePageProps) {
  const [showEditModal, setShowEditModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'reviews' | 'opinions' | 'comments'>('reviews')
  const [showCharts, setShowCharts] = useState(false)

  const {
    profile,
    stats,
    ranking,
    isOwnProfile,
    isLoading,
    isError,
    error,
    isUpdating,
    isRefreshing,
    updateProfile,
    refreshAll
  } = useUserProfile({ 
    userId, 
    includeRanking: true 
  })

  if (isLoading) {
    return <UserProfileSkeleton />
  }

  if (isError || !profile) {
    return (
      <div className={cn('container mx-auto px-4 py-8 max-w-4xl', className)}>
        <Card>
          <CardContent className="p-12 text-center">
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              프로필을 찾을 수 없습니다
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {error instanceof Error ? error.message : '사용자 정보를 불러올 수 없습니다.'}
            </p>
            <Button 
              onClick={() => window.history.back()}
              variant="outline"
            >
              이전 페이지로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleEditProfile = (data: { nickname?: string; bio?: string; image?: string }) => {
    updateProfile(data)
    setShowEditModal(false)
  }

  return (
    <div className={cn('container mx-auto px-4 py-8 max-w-6xl', className)}>
      {/* 프로필 헤더 */}
      <div className="mb-8">
        <UserProfileHeader
          profile={profile}
          stats={stats}
          ranking={ranking}
          isOwnProfile={isOwnProfile}
          onEditClick={() => setShowEditModal(true)}
          onRefreshClick={refreshAll}
          isRefreshing={isRefreshing}
        />
      </div>

      {/* 액션 버튼들 */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center space-x-2">
          <Button
            variant={showCharts ? 'default' : 'outline'}
            onClick={() => setShowCharts(!showCharts)}
            size="sm"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            {showCharts ? '차트 숨기기' : '차트 보기'}
          </Button>
          
          {isOwnProfile && (
            <Button
              variant="outline"
              onClick={() => setShowEditModal(true)}
              size="sm"
              disabled={isUpdating}
            >
              <Settings className="w-4 h-4 mr-2" />
              프로필 편집
            </Button>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            onClick={refreshAll}
            size="sm"
            disabled={isRefreshing}
          >
            <RefreshCw className={cn('w-4 h-4 mr-2', isRefreshing && 'animate-spin')} />
            새로고침
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 메인 콘텐츠 영역 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 통계 차트 */}
          {showCharts && stats && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  활동 통계 차트
                </CardTitle>
              </CardHeader>
              <CardContent>
                <UserStatsCharts stats={stats} />
              </CardContent>
            </Card>
          )}

          {/* 콘텐츠 탭 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <BookOpen className="w-5 h-5 mr-2" />
                  {profile.nickname}님의 활동
                </CardTitle>
                
                {/* 탭 네비게이션 */}
                <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                  <Button
                    variant={activeTab === 'reviews' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab('reviews')}
                    className="text-xs px-3 py-1 h-7"
                  >
                    독후감 {stats?.reviewCount || 0}개
                  </Button>
                  <Button
                    variant={activeTab === 'opinions' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab('opinions')}
                    className="text-xs px-3 py-1 h-7"
                  >
                    의견 {stats?.opinionCount || 0}개
                  </Button>
                  <Button
                    variant={activeTab === 'comments' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab('comments')}
                    className="text-xs px-3 py-1 h-7"
                  >
                    댓글 {stats?.commentCount || 0}개
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <UserContentTabs
                userId={userId}
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />
            </CardContent>
          </Card>
        </div>

        {/* 사이드바 */}
        <div className="space-y-6">
          {/* 활동 통계 요약 */}
          {stats && (
            <UserActivityStats 
              stats={stats}
              ranking={ranking}
              compact={true}
            />
          )}

          {/* 가입 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                가입 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">가입일</span>
                <span className="font-medium">
                  {new Date(profile.createdAt).toLocaleDateString('ko-KR')}
                </span>
              </div>
              {profile.emailVerified && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">이메일 인증</span>
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    인증 완료
                  </span>
                </div>
              )}
              {stats && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">총 활동 수</span>
                  <span className="font-medium">
                    {(stats.reviewCount + stats.opinionCount + stats.commentCount).toLocaleString()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 랭킹 정보 */}
          {ranking && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center">
                  <Crown className="w-4 h-4 mr-2" />
                  사용자 랭킹
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">독후감 순위</span>
                  <span className="font-medium">
                    {ranking.reviewRank.toLocaleString()}위 / {ranking.totalUsers.toLocaleString()}명
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">인기도 순위</span>
                  <span className="font-medium">
                    {ranking.likeRank.toLocaleString()}위 / {ranking.totalUsers.toLocaleString()}명
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 최근 활동 */}
          {stats?.recentActivity && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  최근 활동
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {stats.recentActivity.lastReviewDate && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">마지막 독후감</span>
                    <span className="font-medium">
                      {new Date(stats.recentActivity.lastReviewDate).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                )}
                {stats.recentActivity.lastOpinionDate && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">마지막 의견</span>
                    <span className="font-medium">
                      {new Date(stats.recentActivity.lastOpinionDate).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                )}
                {stats.recentActivity.lastCommentDate && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">마지막 댓글</span>
                    <span className="font-medium">
                      {new Date(stats.recentActivity.lastCommentDate).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* 프로필 편집 모달 */}
      {showEditModal && (
        <EditProfileModal
          profile={profile}
          onSave={handleEditProfile}
          onClose={() => setShowEditModal(false)}
          isLoading={isUpdating}
        />
      )}
    </div>
  )
}

// 로딩 스켈레톤 컴포넌트
function UserProfileSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* 헤더 스켈레톤 */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
            <div className="flex-1 space-y-3">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-48" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-64" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 통계 스켈레톤 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-full" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
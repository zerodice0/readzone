'use client'

import { useState } from 'react'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  User,
  Edit,
  RefreshCw,
  Calendar,
  Mail,
  CheckCircle,
  Crown,
  Heart,
  MessageCircle,
  BookOpen,
  Eye
} from 'lucide-react'
import type { UserProfile, UserActivityStats } from '@/lib/user-stats'

interface UserProfileHeaderProps {
  profile: UserProfile
  stats?: UserActivityStats | null
  ranking?: {
    reviewRank: number
    likeRank: number
    totalUsers: number
  } | null
  isOwnProfile: boolean
  onEditClick: () => void
  onRefreshClick: () => void
  isRefreshing: boolean
  className?: string
}

export function UserProfileHeader({
  profile,
  stats,
  ranking,
  isOwnProfile,
  onEditClick,
  onRefreshClick,
  isRefreshing,
  className
}: UserProfileHeaderProps) {
  const [imageError, setImageError] = useState(false)

  const formatJoinDate = (date: Date) => {
    return formatDistanceToNow(new Date(date), { 
      addSuffix: true, 
      locale: ko 
    })
  }

  const getRankBadge = (rank: number, total: number) => {
    const percentage = (rank / total) * 100
    if (percentage <= 1) return { text: 'TOP 1%', variant: 'destructive' as const }
    if (percentage <= 5) return { text: 'TOP 5%', variant: 'default' as const }
    if (percentage <= 10) return { text: 'TOP 10%', variant: 'secondary' as const }
    return null
  }

  const getActivityLevel = (stats: UserActivityStats) => {
    const totalActivity = stats.reviewCount + stats.opinionCount + stats.commentCount
    if (totalActivity >= 100) return { text: '활발한 활동', color: 'text-green-600' }
    if (totalActivity >= 50) return { text: '꾸준한 활동', color: 'text-blue-600' }
    if (totalActivity >= 20) return { text: '보통 활동', color: 'text-yellow-600' }
    if (totalActivity >= 5) return { text: '가벼운 활동', color: 'text-gray-600' }
    return { text: '새로운 멤버', color: 'text-gray-500' }
  }

  const reviewRankBadge = ranking ? getRankBadge(ranking.reviewRank, ranking.totalUsers) : null
  const likeRankBadge = ranking ? getRankBadge(ranking.likeRank, ranking.totalUsers) : null
  const activityLevel = stats ? getActivityLevel(stats) : null

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-0">
        {/* 배경 그라디언트 */}
        <div className="h-24 bg-gradient-to-r from-primary-500/20 via-purple-500/20 to-blue-500/20" />
        
        <div className="px-6 pb-6 -mt-12">
          <div className="flex flex-col md:flex-row items-start md:items-end space-y-4 md:space-y-0 md:space-x-6">
            {/* 프로필 이미지 */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-800 shadow-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                {profile.image && !imageError ? (
                  <Image
                    src={profile.image}
                    alt={profile.nickname}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-12 h-12 text-gray-400" />
                  </div>
                )}
              </div>
              
              {/* 온라인 상태 표시 (선택적) */}
              <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
            </div>

            {/* 프로필 정보 */}
            <div className="flex-1 space-y-2">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                    <span>{profile.nickname}</span>
                    {profile.emailVerified && (
                      <CheckCircle className="w-5 h-5 text-blue-500" />
                    )}
                  </h1>
                  
                  {/* 활동 레벨과 랭킹 배지 */}
                  <div className="flex items-center space-x-2 mt-1">
                    {activityLevel && (
                      <span className={cn('text-sm font-medium', activityLevel.color)}>
                        {activityLevel.text}
                      </span>
                    )}
                    
                    {reviewRankBadge && (
                      <Badge variant={reviewRankBadge.variant} className="text-xs">
                        <Crown className="w-3 h-3 mr-1" />
                        {reviewRankBadge.text}
                      </Badge>
                    )}
                    
                    {likeRankBadge && (
                      <Badge variant={likeRankBadge.variant} className="text-xs">
                        <Heart className="w-3 h-3 mr-1" />
                        {likeRankBadge.text}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* 액션 버튼 */}
                <div className="flex items-center space-x-2 mt-2 md:mt-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRefreshClick}
                    disabled={isRefreshing}
                    className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                  >
                    <RefreshCw className={cn('w-4 h-4 mr-1', isRefreshing && 'animate-spin')} />
                    새로고침
                  </Button>
                  
                  {isOwnProfile && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onEditClick}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      프로필 편집
                    </Button>
                  )}
                </div>
              </div>

              {/* 자기소개 */}
              {profile.bio && (
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed max-w-2xl">
                  {profile.bio}
                </p>
              )}

              {/* 기본 정보 */}
              <div className="flex flex-wrap items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatJoinDate(profile.createdAt)} 가입</span>
                </div>
                
                {isOwnProfile && profile.email && (
                  <div className="flex items-center space-x-1">
                    <Mail className="w-4 h-4" />
                    <span>{profile.email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 통계 요약 (컴팩트 버전) */}
          {stats && (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center justify-center space-x-1 text-blue-600 dark:text-blue-400 mb-1">
                  <BookOpen className="w-4 h-4" />
                  <span className="text-lg font-bold">{stats.reviewCount.toLocaleString()}</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">독후감</p>
              </div>

              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center justify-center space-x-1 text-green-600 dark:text-green-400 mb-1">
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-lg font-bold">{stats.opinionCount.toLocaleString()}</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">도서 의견</p>
              </div>

              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center justify-center space-x-1 text-red-600 dark:text-red-400 mb-1">
                  <Heart className="w-4 h-4" />
                  <span className="text-lg font-bold">{stats.receivedLikesCount.toLocaleString()}</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">받은 좋아요</p>
              </div>

              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center justify-center space-x-1 text-purple-600 dark:text-purple-400 mb-1">
                  <Eye className="w-4 h-4" />
                  <span className="text-lg font-bold">{stats.readBooksCount.toLocaleString()}</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">읽은 책</p>
              </div>
            </div>
          )}

          {/* 추천 비율 표시 */}
          {stats && stats.recommendations.recommendedCount + stats.recommendations.notRecommendedCount > 0 && (
            <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-red-50 dark:from-green-900/20 dark:to-red-900/20 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">추천 비율</span>
                <span className="font-medium">
                  {(stats.recommendations.recommendationRatio * 100).toFixed(1)}% 
                  <span className="text-gray-500 dark:text-gray-400 ml-1">
                    ({stats.recommendations.recommendedCount}/{stats.recommendations.recommendedCount + stats.recommendations.notRecommendedCount})
                  </span>
                </span>
              </div>
              <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${stats.recommendations.recommendationRatio * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
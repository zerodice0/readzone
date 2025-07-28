'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  BookOpen,
  MessageCircle,
  Heart,
  TrendingUp,
  Crown,
  Target,
  Award,
  BarChart3
} from 'lucide-react'
import type { UserActivityStats } from '@/lib/user-stats'

interface UserActivityStatsProps {
  stats: UserActivityStats
  ranking?: {
    reviewRank: number
    likeRank: number
    totalUsers: number
  } | null
  compact?: boolean
  className?: string
}

export function UserActivityStats({
  stats,
  ranking,
  compact = false,
  className
}: UserActivityStatsProps) {
  const totalActivity = stats.reviewCount + stats.opinionCount + stats.commentCount

  const getRankingText = (rank: number, total: number) => {
    const percentage = (rank / total) * 100
    if (percentage <= 1) return 'TOP 1%'
    if (percentage <= 5) return 'TOP 5%'
    if (percentage <= 10) return 'TOP 10%'
    return `${rank.toLocaleString()}위`
  }

  const getRankingColor = (rank: number, total: number) => {
    const percentage = (rank / total) * 100
    if (percentage <= 1) return 'text-yellow-600 dark:text-yellow-400'
    if (percentage <= 5) return 'text-orange-600 dark:text-orange-400'
    if (percentage <= 10) return 'text-blue-600 dark:text-blue-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  if (compact) {
    return (
      <div className={cn('space-y-4', className)}>
        {/* 기본 통계 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center">
              <BarChart3 className="w-4 h-4 mr-2" />
              활동 통계
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">총 활동</span>
              <span className="font-medium">{totalActivity.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">받은 좋아요</span>
              <span className="font-medium text-red-600 dark:text-red-400">
                {stats.receivedLikesCount.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">읽은 책</span>
              <span className="font-medium text-purple-600 dark:text-purple-400">
                {stats.readBooksCount.toLocaleString()}권
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 랭킹 정보 */}
        {ranking && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                <Crown className="w-4 h-4 mr-2" />
                랭킹
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">독후감 순위</span>
                <span className={cn('font-medium', getRankingColor(ranking.reviewRank, ranking.totalUsers))}>
                  {getRankingText(ranking.reviewRank, ranking.totalUsers)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">인기도 순위</span>
                <span className={cn('font-medium', getRankingColor(ranking.likeRank, ranking.totalUsers))}>
                  {getRankingText(ranking.likeRank, ranking.totalUsers)}
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* 주요 통계 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="text-center">
          <CardContent className="p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full mx-auto mb-3">
              <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              {stats.reviewCount.toLocaleString()}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">독후감</p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full mx-auto mb-3">
              <MessageCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              {stats.opinionCount.toLocaleString()}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">도서 의견</p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full mx-auto mb-3">
              <Heart className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              {stats.receivedLikesCount.toLocaleString()}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">받은 좋아요</p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full mx-auto mb-3">
              <Award className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              {stats.readBooksCount.toLocaleString()}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">읽은 책</p>
          </CardContent>
        </Card>
      </div>

      {/* 상세 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 활동 상세 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              활동 상세
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">총 댓글 수</span>
              <span className="font-medium">{stats.commentCount.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">준 좋아요</span>
              <span className="font-medium">{stats.givenLikesCount.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">총 활동 수</span>
              <span className="font-medium text-primary-600 dark:text-primary-400">
                {totalActivity.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 추천 통계 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="w-5 h-5 mr-2" />
              추천 통계
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">추천</span>
              <span className="font-medium text-green-600 dark:text-green-400">
                {stats.recommendations.recommendedCount.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">비추천</span>
              <span className="font-medium text-red-600 dark:text-red-400">
                {stats.recommendations.notRecommendedCount.toLocaleString()}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">추천 비율</span>
                <span className="font-medium">
                  {(stats.recommendations.recommendationRatio * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${stats.recommendations.recommendationRatio * 100}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 장르별 통계 */}
      {stats.genreStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              선호 장르 TOP 5
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.genreStats.slice(0, 5).map((genre, index) => (
                <div key={genre.genre} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">
                      {index + 1}
                    </Badge>
                    <span className="font-medium">{genre.genre}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {genre.count}권
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      ({(genre.percentage * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 랭킹 정보 */}
      {ranking && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Crown className="w-5 h-5 mr-2" />
              사용자 랭킹
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg">
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
                  {getRankingText(ranking.reviewRank, ranking.totalUsers)}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">독후감 순위</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  전체 {ranking.totalUsers.toLocaleString()}명 중
                </p>
              </div>

              <div className="text-center p-4 bg-gradient-to-r from-pink-50 to-red-50 dark:from-pink-900/20 dark:to-red-900/20 rounded-lg">
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
                  {getRankingText(ranking.likeRank, ranking.totalUsers)}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">인기도 순위</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  전체 {ranking.totalUsers.toLocaleString()}명 중
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
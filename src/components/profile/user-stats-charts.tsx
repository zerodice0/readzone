'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Activity,
  Target,
  Calendar,
  BookOpen,
  MessageCircle,
  Heart,
  Award
} from 'lucide-react'
import type { UserActivityStats } from '@/lib/user-stats'

interface UserStatsChartsProps {
  stats: UserActivityStats
  className?: string
}

interface ChartData {
  name: string
  value: number
  color: string
  icon: React.ReactNode
}

export function UserStatsCharts({ stats, className }: UserStatsChartsProps) {
  // 활동 유형별 데이터
  const activityData: ChartData[] = useMemo(() => [
    {
      name: '독후감',
      value: stats.reviewCount,
      color: 'bg-blue-500',
      icon: <BookOpen className="w-4 h-4" />
    },
    {
      name: '도서 의견',
      value: stats.opinionCount,
      color: 'bg-green-500',
      icon: <MessageCircle className="w-4 h-4" />
    },
    {
      name: '댓글',
      value: stats.commentCount,
      color: 'bg-yellow-500',
      icon: <MessageCircle className="w-4 h-4" />
    },
    {
      name: '받은 좋아요',
      value: stats.receivedLikesCount,
      color: 'bg-red-500',
      icon: <Heart className="w-4 h-4" />
    }
  ], [stats])

  // 추천 vs 비추천 데이터
  const recommendationData = useMemo(() => {
    const total = stats.recommendations.recommendedCount + stats.recommendations.notRecommendedCount
    if (total === 0) return null

    return [
      {
        name: '추천',
        value: stats.recommendations.recommendedCount,
        percentage: (stats.recommendations.recommendedCount / total) * 100,
        color: 'bg-green-500'
      },
      {
        name: '비추천',
        value: stats.recommendations.notRecommendedCount,
        percentage: (stats.recommendations.notRecommendedCount / total) * 100,
        color: 'bg-red-500'
      }
    ]
  }, [stats.recommendations])

  // 장르별 통계 (상위 8개)
  const genreData = useMemo(() => {
    return stats.genreStats.slice(0, 8).map((genre, index) => ({
      name: genre.genre,
      value: genre.count,
      percentage: genre.percentage * 100,
      color: `hsl(${(index * 45) % 360}, 70%, 50%)`
    }))
  }, [stats.genreStats])

  // 월별 활동 데이터 (가상 데이터 - 실제로는 DB에서 가져와야 함)
  const monthlyData = useMemo(() => {
    // 실제 구현에서는 API에서 월별 데이터를 가져와야 합니다
    const months = ['1월', '2월', '3월', '4월', '5월', '6월']
    return months.map((month) => ({
      name: month,
      reviews: Math.floor(Math.random() * 10),
      opinions: Math.floor(Math.random() * 15),
      comments: Math.floor(Math.random() * 20)
    }))
  }, [])

  // 최대값 계산 (차트 스케일링용)
  const maxActivityValue = Math.max(...activityData.map(d => d.value))
  const maxMonthlyValue = Math.max(
    ...monthlyData.flatMap(d => [d.reviews, d.opinions, d.comments])
  )

  return (
    <div className={cn('space-y-6', className)}>
      {/* 전체 활동 개요 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 활동 유형별 분포 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              활동 유형별 분포
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activityData.map((item) => (
                <div key={item.name} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="text-gray-600 dark:text-gray-400">
                        {item.icon}
                      </div>
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <span className="font-bold">{item.value.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={cn(item.color, 'h-2 rounded-full transition-all duration-500')}
                      style={{
                        width: maxActivityValue > 0 ? `${(item.value / maxActivityValue) * 100}%` : '0%'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 추천 비율 */}
        {recommendationData && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Target className="w-5 h-5 mr-2" />
                추천/비추천 비율
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                    {(stats.recommendations.recommendationRatio * 100).toFixed(1)}%
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">추천 비율</p>
                </div>
                
                <div className="space-y-3">
                  {recommendationData.map((item) => (
                    <div key={item.name} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{item.name}</span>
                        <span className="font-bold">
                          {item.value.toLocaleString()} ({item.percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={cn(item.color, 'h-2 rounded-full transition-all duration-500')}
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 장르별 선호도 */}
      {genreData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <PieChart className="w-5 h-5 mr-2" />
              선호 장르 분포 (상위 8개)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 장르 목록 */}
              <div className="space-y-3">
                {genreData.map((genre) => (
                  <div key={genre.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: genre.color }}
                      />
                      <span className="text-sm font-medium">{genre.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold">{genre.value}권</div>
                      <div className="text-xs text-gray-500">
                        {genre.percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 시각적 차트 (간단한 바 차트) */}
              <div className="space-y-2">
                {genreData.map((genre) => (
                  <div key={genre.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="truncate max-w-20">{genre.name}</span>
                      <span>{genre.value}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full transition-all duration-500"
                        style={{
                          backgroundColor: genre.color,
                          width: `${genre.percentage}%`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 월별 활동 트렌드 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            월별 활동 트렌드 (최근 6개월)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 범례 */}
            <div className="flex items-center justify-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                <span>독후감</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span>의견</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                <span>댓글</span>
              </div>
            </div>

            {/* 차트 */}
            <div className="grid grid-cols-6 gap-2 h-40">
              {monthlyData.map((month) => (
                <div key={month.name} className="flex flex-col items-center space-y-2">
                  <div className="flex-1 flex flex-col justify-end space-y-1">
                    {/* 독후감 */}
                    <div
                      className="w-6 bg-blue-500 rounded-t transition-all duration-500"
                      style={{
                        height: maxMonthlyValue > 0 ? `${(month.reviews / maxMonthlyValue) * 100}%` : '2px'
                      }}
                      title={`독후감 ${month.reviews}개`}
                    />
                    {/* 의견 */}
                    <div
                      className="w-6 bg-green-500 transition-all duration-500"
                      style={{
                        height: maxMonthlyValue > 0 ? `${(month.opinions / maxMonthlyValue) * 100}%` : '2px'
                      }}
                      title={`의견 ${month.opinions}개`}
                    />
                    {/* 댓글 */}
                    <div
                      className="w-6 bg-yellow-500 transition-all duration-500"
                      style={{
                        height: maxMonthlyValue > 0 ? `${(month.comments / maxMonthlyValue) * 100}%` : '2px'
                      }}
                      title={`댓글 ${month.comments}개`}
                    />
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {month.name}
                  </span>
                </div>
              ))}
            </div>

            {/* 주의사항 */}
            <div className="text-center">
              <Badge variant="outline" className="text-xs">
                <Calendar className="w-3 h-3 mr-1" />
                실제 데이터는 향후 구현 예정
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 활동 요약 통계 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            활동 요약
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
              <Award className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                {stats.readBooksCount}
              </div>
              <p className="text-sm text-blue-600 dark:text-blue-400">읽은 책</p>
            </div>

            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
              <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                {(stats.reviewCount + stats.opinionCount + stats.commentCount).toLocaleString()}
              </div>
              <p className="text-sm text-green-600 dark:text-green-400">총 활동</p>
            </div>

            <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg">
              <Heart className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-red-700 dark:text-red-400">
                {stats.receivedLikesCount.toLocaleString()}
              </div>
              <p className="text-sm text-red-600 dark:text-red-400">받은 좋아요</p>
            </div>

            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg">
              <Target className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                {(stats.recommendations.recommendationRatio * 100).toFixed(0)}%
              </div>
              <p className="text-sm text-purple-600 dark:text-purple-400">추천 비율</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
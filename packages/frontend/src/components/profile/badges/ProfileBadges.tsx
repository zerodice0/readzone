import React, { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getUserBadges } from '@/lib/api/badges'
import { type BadgeData, BadgeItem } from './BadgeItem'
import { BadgeProgressModal } from './BadgeProgressModal'

interface ProfileBadgesProps {
  userid: string
  isOwner?: boolean
  className?: string
}

type FilterType = 'all' | 'earned' | 'unearned' | 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND'

const filterOptions = [
  { value: 'all' as const, label: '전체', icon: '🏅' },
  { value: 'earned' as const, label: '획득', icon: '✅' },
  { value: 'unearned' as const, label: '미획득', icon: '⏳' },
  { value: 'BRONZE' as const, label: '브론즈', icon: '🥉' },
  { value: 'SILVER' as const, label: '실버', icon: '🥈' },
  { value: 'GOLD' as const, label: '골드', icon: '🥇' },
  { value: 'PLATINUM' as const, label: '플래티넘', icon: '💎' },
  { value: 'DIAMOND' as const, label: '다이아몬드', icon: '💍' }
]

export const ProfileBadges: React.FC<ProfileBadgesProps> = ({
  userid,
  isOwner = false,
  className = ''
}) => {
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all')
  const [selectedBadge, setSelectedBadge] = useState<BadgeData | null>(null)

  // 배지 데이터 조회
  const { data: badgeData, isLoading: loading, error } = useQuery({
    queryKey: ['user-badges', userid],
    queryFn: () => getUserBadges(userid),
    retry: false,
  })

  const badges = useMemo(() => badgeData?.badges ?? [], [badgeData?.badges])

  // 배지 통계 계산
  const stats = useMemo(() => {
    const earned = badges.filter(badge => badge.isEarned)
    const total = badges.length
    const completionRate = total > 0 ? Math.round((earned.length / total) * 100) : 0

    const tierCounts = badges.reduce((acc, badge) => {
      if (badge.isEarned) {
        acc[badge.tier] = (acc[badge.tier] ?? 0) + 1
      }

      return acc
    }, {} as Record<string, number>)

    return {
      earned: earned.length,
      total,
      completionRate,
      tierCounts,
      nextMilestone: badges.find(badge => !badge.isEarned && (badge.progress?.percentage ?? 0) > 0)
    }
  }, [badges])

  // 필터링된 배지 목록
  const filteredBadges = useMemo(() => {
    return badges.filter(badge => {
      switch (selectedFilter) {
        case 'earned':
          return badge.isEarned
        case 'unearned':
          return !badge.isEarned
        case 'BRONZE':
        case 'SILVER':
        case 'GOLD':
        case 'PLATINUM':
        case 'DIAMOND':
          return badge.tier === selectedFilter
        default:
          return true
      }
    }).sort((a, b) => {
      // 획득한 배지를 먼저 표시, 그 다음 진행률 순
      if (a.isEarned && !b.isEarned) {
        return -1
      }
      if (!a.isEarned && b.isEarned) {
        return 1
      }
      if (!a.isEarned && !b.isEarned) {
        const aProgress = a.progress?.percentage ?? 0
        const bProgress = b.progress?.percentage ?? 0

        return bProgress - aProgress
      }

      return 0
    })
  }, [badges, selectedFilter])

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        {/* 로딩 스켈레톤 */}
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="text-center py-12">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            배지 정보를 불러올 수 없습니다
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            잠시 후 다시 시도해주세요.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 배지 통계 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          🏆 배지 컬렉션
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.earned}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              획득한 배지
            </div>
          </div>

          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {stats.total}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              전체 배지
            </div>
          </div>

          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.completionRate}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              달성률
            </div>
          </div>

          <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {Object.values(stats.tierCounts).reduce((sum, count) => sum + count, 0)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              특별 배지
            </div>
          </div>
        </div>

        {/* 다음 목표 */}
        {isOwner && stats.nextMilestone && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="text-2xl">{stats.nextMilestone.icon}</div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  다음 목표: {stats.nextMilestone.name}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  {stats.nextMilestone.description}
                </div>
                {stats.nextMilestone.progress && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${stats.nextMilestone.progress.percentage}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {stats.nextMilestone.progress.percentage}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 필터 */}
      <div className="flex flex-wrap gap-2">
        {filterOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setSelectedFilter(option.value)}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
              flex items-center gap-2
              ${selectedFilter === option.value
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }
            `}
          >
            <span>{option.icon}</span>
            {option.label}
          </button>
        ))}
      </div>

      {/* 배지 그리드 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredBadges.map((badge) => (
          <div
            key={badge.id}
            className="animate-in fade-in slide-in-from-bottom-2 duration-300"
          >
            <BadgeItem
              badge={badge}
              onClick={() => setSelectedBadge(badge)}
              showProgress={isOwner && !badge.isEarned}
              size="medium"
            />
          </div>
        ))}
      </div>

      {/* 배지가 없는 경우 */}
      {filteredBadges.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🏅</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            {selectedFilter === 'earned' ? '아직 획득한 배지가 없습니다' : '해당하는 배지가 없습니다'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {selectedFilter === 'earned'
              ? '독후감을 작성하고 활동하여 배지를 획득해보세요!'
              : '다른 필터를 선택해보세요.'
            }
          </p>
        </div>
      )}

      {/* 배지 상세 모달 */}
      <BadgeProgressModal
        badge={selectedBadge}
        isOpen={!!selectedBadge}
        onClose={() => setSelectedBadge(null)}
      />
    </div>
  )
}
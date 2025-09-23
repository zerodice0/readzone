import React from 'react'
import type { UserStats } from '@/lib/api/auth'

interface ProfileStatsProps {
  stats: UserStats
  className?: string
}

export const ProfileStats: React.FC<ProfileStatsProps> = ({
  stats,
  className = ''
}) => {
  const statItems = [
    {
      label: '독후감',
      value: stats.reviewCount,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      label: '받은 좋아요',
      value: stats.likesReceived,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      label: '팔로워',
      value: stats.followerCount,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      label: '팔로잉',
      value: stats.followingCount,
      color: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-50 dark:bg-orange-900/20'
    },
    {
      label: '읽은 책',
      value: stats.booksRead,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-900/20'
    },
  ]

  return (
    <div className={`grid grid-cols-2 md:grid-cols-5 gap-4 ${className}`}>
      {statItems.map((item) => (
        <div key={item.label} className={`text-center p-4 rounded-lg ${item.bg} transition-colors`}>
          <div className={`text-2xl font-bold ${item.color}`}>
            {item.value.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {item.label}
          </div>
        </div>
      ))}
    </div>
  )
}
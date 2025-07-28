'use client'

import { useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { UserProfile, UserActivityStats } from '@/lib/user-stats'

interface UseUserProfileOptions {
  userId: string
  includeRanking?: boolean
}

interface UserProfileResponse {
  success: boolean
  data: {
    profile: UserProfile
    isOwnProfile: boolean
    meta: {
      timestamp: string
      version: string
    }
  }
}

interface UserStatsResponse {
  success: boolean
  data: {
    userId: string
    nickname: string
    stats: UserActivityStats
    ranking?: {
      reviewRank: number
      likeRank: number
      totalUsers: number
    }
    isOwnStats: boolean
    meta: {
      generatedAt: string
      dataFreshness: string
      version: string
    }
  }
}

interface UpdateProfileInput {
  nickname?: string
  bio?: string
  image?: string
}

interface UpdateProfileResponse {
  success: boolean
  data: {
    profile: {
      id: string
      nickname: string
      bio: string | null
      image: string | null
      updatedAt: Date
    }
    message: string
  }
}

export function useUserProfile({ userId, includeRanking = false }: UseUserProfileOptions) {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [isRefreshing, setIsRefreshing] = useState(false)

  // 프로필 정보 조회
  const {
    data: profileData,
    isLoading: isLoadingProfile,
    isError: isProfileError,
    error: profileError,
    refetch: refetchProfile
  } = useQuery({
    queryKey: ['userProfile', userId],
    queryFn: async (): Promise<UserProfileResponse> => {
      const response = await fetch(`/api/users/${userId}/profile`)
      
      if (!response.ok) {
        throw new Error('프로필 정보를 불러오는데 실패했습니다.')
      }

      return response.json()
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  })

  // 통계 정보 조회
  const {
    data: statsData,
    isLoading: isLoadingStats,
    isError: isStatsError,
    error: statsError,
    refetch: refetchStats
  } = useQuery({
    queryKey: ['userStats', userId, includeRanking],
    queryFn: async (): Promise<UserStatsResponse> => {
      const params = new URLSearchParams()
      if (includeRanking) {
        params.append('includeRanking', 'true')
      }

      const response = await fetch(`/api/users/${userId}/stats?${params}`)
      
      if (!response.ok) {
        throw new Error('사용자 통계를 불러오는데 실패했습니다.')
      }

      return response.json()
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2분 (통계는 더 자주 새로고침)
    gcTime: 5 * 60 * 1000, // 5분
  })

  // 프로필 업데이트
  const updateProfileMutation = useMutation({
    mutationFn: async (input: UpdateProfileInput): Promise<UpdateProfileResponse> => {
      const response = await fetch(`/api/users/${userId}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || '프로필 업데이트에 실패했습니다.')
      }

      return result
    },
    onSuccess: (data) => {
      // 프로필 캐시 업데이트
      queryClient.invalidateQueries({ queryKey: ['userProfile', userId] })
      toast.success(data.data.message)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  // 통계 새로고침
  const refreshStatsMutation = useMutation({
    mutationFn: async (): Promise<UserStatsResponse> => {
      const response = await fetch(`/api/users/${userId}/stats/refresh`, {
        method: 'POST',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || '통계 새로고침에 실패했습니다.')
      }

      return result
    },
    onSuccess: (_) => {
      // 통계 캐시 업데이트
      queryClient.invalidateQueries({ queryKey: ['userStats', userId] })
      toast.success('통계가 새로고침되었습니다.')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  // 프로필 업데이트 함수
  const updateProfile = useCallback(
    (input: UpdateProfileInput) => {
      if (!session) {
        toast.error('로그인이 필요합니다.')
        return
      }

      if (session.user.id !== userId) {
        toast.error('자신의 프로필만 수정할 수 있습니다.')
        return
      }

      updateProfileMutation.mutate(input)
    },
    [session, userId, updateProfileMutation]
  )

  // 통계 새로고침 함수
  const refreshStats = useCallback(
    async () => {
      if (!session) {
        toast.error('로그인이 필요합니다.')
        return
      }

      if (session.user.id !== userId) {
        toast.error('자신의 통계만 새로고침할 수 있습니다.')
        return
      }

      setIsRefreshing(true)
      try {
        await refreshStatsMutation.mutateAsync()
      } finally {
        setIsRefreshing(false)
      }
    },
    [session, userId, refreshStatsMutation]
  )

  // 전체 데이터 새로고침
  const refreshAll = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([
        refetchProfile(),
        refetchStats()
      ])
      toast.success('프로필 정보가 새로고침되었습니다.')
    } catch (error) {
      toast.error('새로고침 중 오류가 발생했습니다.')
    } finally {
      setIsRefreshing(false)
    }
  }, [refetchProfile, refetchStats])

  return {
    // 데이터
    profile: profileData?.data.profile,
    stats: statsData?.data.stats,
    ranking: statsData?.data.ranking,
    isOwnProfile: profileData?.data.isOwnProfile || false,
    isOwnStats: statsData?.data.isOwnStats || false,
    
    // 로딩 상태
    isLoading: isLoadingProfile || isLoadingStats,
    isLoadingProfile,
    isLoadingStats,
    isRefreshing,
    
    // 에러 상태
    isError: isProfileError || isStatsError,
    isProfileError,
    isStatsError,
    error: profileError || statsError,
    
    // 뮤테이션 상태
    isUpdating: updateProfileMutation.isPending,
    isRefreshingStats: refreshStatsMutation.isPending,
    
    // 액션
    updateProfile,
    refreshStats,
    refreshAll,
    refetchProfile,
    refetchStats,
  }
}

// 여러 사용자의 기본 정보를 조회하는 훅 (검색, 랭킹 등에서 사용)
export function useUsersBasicInfo(userIds: string[]) {
  return useQuery({
    queryKey: ['usersBasicInfo', userIds],
    queryFn: async () => {
      if (userIds.length === 0) return []

      const promises = userIds.map(async (userId) => {
        try {
          const response = await fetch(`/api/users/${userId}/profile`)
          if (response.ok) {
            const data = await response.json()
            return {
              id: data.data.profile.id,
              nickname: data.data.profile.nickname,
              image: data.data.profile.image,
              bio: data.data.profile.bio
            }
          }
          return null
        } catch {
          return null
        }
      })

      const results = await Promise.all(promises)
      return results.filter(Boolean)
    },
    enabled: userIds.length > 0,
    staleTime: 10 * 60 * 1000, // 10분 (기본 정보는 자주 변경되지 않음)
  })
}
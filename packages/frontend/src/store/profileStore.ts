import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { UserProfileData } from '@/lib/api/auth'

interface ProfileState {
  // 상태
  currentProfile: UserProfileData | null
  profileCache: Map<string, UserProfileData>
  isLoading: boolean
  error: string | null

  // 액션
  setCurrentProfile: (profile: UserProfileData) => void
  clearCurrentProfile: () => void
  updateProfileCache: (userId: string, profile: UserProfileData) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void

  // 캐시 관리
  getCachedProfile: (userId: string) => UserProfileData | undefined
  removeCachedProfile: (userId: string) => void
  clearProfileCache: () => void
}

export const useProfileStore = create<ProfileState>()(
  devtools(
    (set, get) => ({
      // 초기 상태
      currentProfile: null,
      profileCache: new Map(),
      isLoading: false,
      error: null,

      // 액션
      setCurrentProfile: (profile) =>
        set({ currentProfile: profile }, false, 'setCurrentProfile'),

      clearCurrentProfile: () =>
        set({ currentProfile: null }, false, 'clearCurrentProfile'),

      updateProfileCache: (userId, profile) =>
        set((state) => {
          const newCache = new Map(state.profileCache)

          newCache.set(userId, profile)

          return { profileCache: newCache }
        }, false, 'updateProfileCache'),

      setLoading: (loading) =>
        set({ isLoading: loading }, false, 'setLoading'),

      setError: (error) =>
        set({ error }, false, 'setError'),

      clearError: () =>
        set({ error: null }, false, 'clearError'),

      // 캐시 관리
      getCachedProfile: (userId) => {
        const { profileCache } = get()

        return profileCache.get(userId)
      },

      removeCachedProfile: (userId) =>
        set((state) => {
          const newCache = new Map(state.profileCache)

          newCache.delete(userId)

          return { profileCache: newCache }
        }, false, 'removeCachedProfile'),

      clearProfileCache: () =>
        set({ profileCache: new Map() }, false, 'clearProfileCache'),
    }),
    { name: 'profile-store' }
  )
)

// 편의 훅들
export const useCurrentProfile = () => useProfileStore(state => state.currentProfile)
export const useProfileLoading = () => useProfileStore(state => state.isLoading)
export const useProfileError = () => useProfileStore(state => state.error)

// 프로필 캐시 관리 훅
export const useProfileCache = () => {
  const getCachedProfile = useProfileStore(state => state.getCachedProfile)
  const updateProfileCache = useProfileStore(state => state.updateProfileCache)
  const removeCachedProfile = useProfileStore(state => state.removeCachedProfile)
  const clearProfileCache = useProfileStore(state => state.clearProfileCache)

  return {
    getCachedProfile,
    updateProfileCache,
    removeCachedProfile,
    clearProfileCache,
  }
}
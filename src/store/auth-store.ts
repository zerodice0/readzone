import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { logger } from '@/lib/logger'

// 사용자 타입 정의
export interface User {
  id: string
  email: string
  nickname: string
  name?: string
  image?: string
  bio?: string
  emailVerified?: Date | null
  createdAt: Date
  updatedAt: Date
}

// 인증 상태 인터페이스
interface AuthState {
  // 상태
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  isHydrated: boolean
  
  // 액션
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  login: (user: User) => void
  logout: () => Promise<void>
  updateUser: (updates: Partial<User>) => void
  
  // 유틸리티
  isOwner: (userId: string) => boolean
  hasVerifiedEmail: () => boolean
}

// Auth Store 생성
export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // 초기 상태
        user: null,
        isLoading: false,
        isAuthenticated: false,
        isHydrated: false,

        // 사용자 설정
        setUser: (user) => {
          set((state) => {
            state.user = user
            state.isAuthenticated = !!user
            state.isLoading = false
          })
        },

        // 로딩 상태 설정
        setLoading: (loading) => {
          set((state) => {
            state.isLoading = loading
          })
        },

        // 로그인 처리
        login: (user) => {
          set((state) => {
            state.user = user
            state.isAuthenticated = true
            state.isLoading = false
          })
        },

        // 로그아웃 처리
        logout: async () => {
          try {
            // NextAuth 로그아웃 API 호출
            await fetch('/api/auth/signout', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
            })
            
            set((state) => {
              state.user = null
              state.isAuthenticated = false
              state.isLoading = false
            })
          } catch (error) {
            logger.error('로그아웃 중 오류 발생', { error })
            // 에러가 발생해도 클라이언트 상태는 초기화
            set((state) => {
              state.user = null
              state.isAuthenticated = false
              state.isLoading = false
            })
          }
        },

        // 사용자 정보 업데이트
        updateUser: (updates) => {
          set((state) => {
            if (state.user) {
              Object.assign(state.user, updates)
            }
          })
        },

        // 소유자 권한 확인
        isOwner: (userId) => {
          const { user } = get()
          return user?.id === userId
        },

        // 이메일 인증 확인
        hasVerifiedEmail: () => {
          const { user } = get()
          return !!user?.emailVerified
        },
      })),
      {
        name: 'readzone-auth-store',
        // 민감하지 않은 정보만 localStorage에 저장
        partialize: (state) => ({
          user: state.user ? {
            id: state.user.id,
            email: state.user.email,
            nickname: state.user.nickname,
            name: state.user.name,
            image: state.user.image,
            bio: state.user.bio,
            emailVerified: state.user.emailVerified,
          } : null,
          isAuthenticated: state.isAuthenticated,
        }),
        // 스토리지에서 복원 시 로딩 상태 초기화
        onRehydrateStorage: () => (state) => {
          if (state) {
            state.isLoading = false
            state.isHydrated = true
          }
        },
      }
    ),
    {
      name: 'auth-store',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
)
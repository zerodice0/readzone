import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { AuthActions, AuthError, AuthState, LoginRequest, User } from '@/types/auth'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001'

// 토큰 저장소 관리 (localStorage vs sessionStorage)
const getStorage = (rememberMe: boolean) => {
  return rememberMe ? localStorage : sessionStorage
}

const getStoredTokens = () => {
  // localStorage와 sessionStorage 모두 확인
  const localTokens = {
    accessToken: localStorage.getItem('accessToken'),
    refreshToken: localStorage.getItem('refreshToken'),
    rememberMe: true
  }
  
  const sessionTokens = {
    accessToken: sessionStorage.getItem('accessToken'),
    refreshToken: sessionStorage.getItem('refreshToken'),
    rememberMe: false
  }
  
  // localStorage 토큰이 있으면 우선 사용
  if (localTokens.accessToken) {return localTokens}
  if (sessionTokens.accessToken) {return sessionTokens}
  
  return { accessToken: null, refreshToken: null, rememberMe: false }
}

const setTokens = (accessToken: string, refreshToken: string, rememberMe: boolean) => {
  const storage = getStorage(rememberMe)
  const otherStorage = rememberMe ? sessionStorage : localStorage
  
  // 현재 저장소에 토큰 저장
  storage.setItem('accessToken', accessToken)
  storage.setItem('refreshToken', refreshToken)
  
  // 다른 저장소에서 토큰 제거
  otherStorage.removeItem('accessToken')
  otherStorage.removeItem('refreshToken')
}

const clearTokens = () => {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  sessionStorage.removeItem('accessToken')
  sessionStorage.removeItem('refreshToken')
}

// API 호출 헬퍼
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  
  const response = await fetch(url, {
    ...options,
    headers: defaultHeaders,
  })
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))

    throw new Error(errorData.message ?? `HTTP ${response.status}`)
  }
  
  return response.json()
}

// 인증된 API 호출 헬퍼
const authenticatedApiCall = async (endpoint: string, options: RequestInit = {}) => {
  const tokens = getStoredTokens()
  
  if (!tokens.accessToken) {
    throw new Error('No access token available')
  }
  
  const headers = {
    ...options.headers,
    Authorization: `Bearer ${tokens.accessToken}`,
  }
  
  try {
    return await apiCall(endpoint, { ...options, headers })
  } catch (error) {
    // 401 에러 시 토큰 갱신 시도
    if (error instanceof Error && error.message.includes('401')) {
      const refreshed = await useAuthStore.getState().refreshTokens()

      if (refreshed) {
        const newTokens = getStoredTokens()
        const newHeaders = {
          ...options.headers,
          Authorization: `Bearer ${newTokens.accessToken}`,
        }

        return await apiCall(endpoint, { ...options, headers: newHeaders })
      }
    }
    throw error
  }
}

interface LoginRequiredModalState {
  isOpen: boolean;
  message?: {
    title: string;
    description: string;
  } | undefined;
  redirectTo?: string | undefined;
}

type AuthStore = AuthState & AuthActions & {
  loginRequiredModal: LoginRequiredModalState;
  setLoginRequiredModal: (modal: LoginRequiredModalState) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      rememberMe: false,

      // Login Required Modal State
      loginRequiredModal: {
        isOpen: false,
        message: undefined as { title: string; description: string; } | undefined,
        redirectTo: undefined as string | undefined
      },

      // Actions
      login: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await apiCall('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
          })
          
          const { user, accessToken, refreshToken } = response
          
          // 토큰 저장
          setTokens(accessToken, refreshToken, credentials.rememberMe)
          
          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            rememberMe: credentials.rememberMe,
          })
        } catch (error) {
          const authError: AuthError = {
            code: 'LOGIN_FAILED',
            message: error instanceof Error ? error.message : '로그인에 실패했습니다.',
          }
          
          set({
            isLoading: false,
            error: authError,
            isAuthenticated: false,
          })
          throw error
        }
      },

      logout: () => {
        clearTokens()
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          rememberMe: false,
        })
      },

      verifyToken: async () => {
        const tokens = getStoredTokens()
        
        if (!tokens.accessToken) {
          return false
        }
        
        try {
          await authenticatedApiCall('/api/auth/verify-token')
          
          set({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            rememberMe: tokens.rememberMe,
            isAuthenticated: true,
          })
          
          return true
        } catch {
          // 토큰이 유효하지 않으면 갱신 시도
          return await get().refreshTokens()
        }
      },

      refreshTokens: async () => {
        const tokens = getStoredTokens()
        
        if (!tokens.refreshToken) {
          get().logout()

          return false
        }
        
        try {
          const response = await apiCall('/api/auth/refresh', {
            method: 'POST',
            body: JSON.stringify({ refreshToken: tokens.refreshToken }),
          })
          
          const { accessToken, refreshToken } = response
          
          // 새 토큰 저장
          setTokens(accessToken, refreshToken, tokens.rememberMe)
          
          set({
            accessToken,
            refreshToken,
            isAuthenticated: true,
          })
          
          return true
        } catch {
          get().logout()

          return false
        }
      },

      getCurrentUser: async () => {
        try {
          const user: User = await authenticatedApiCall('/api/auth/me')

          set({ user })
        } catch (_error) {
          console.error('Failed to get current user:', _error)
        }
      },

      clearError: () => {
        set({ error: null })
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },

      // Login Required Modal Actions
      setLoginRequiredModal: (modal: LoginRequiredModalState) => {
        set({ loginRequiredModal: modal })
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        rememberMe: state.rememberMe,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // 앱 시작 시 토큰 확인
          const tokens = getStoredTokens()

          if (tokens.accessToken) {
            state.accessToken = tokens.accessToken
            state.refreshToken = tokens.refreshToken
            state.rememberMe = tokens.rememberMe
            state.verifyToken()
          }
        }
      },
    }
  )
)

// API 인터셉터 설정
export const setupApiInterceptors = () => {
  // fetch 요청을 가로채서 자동으로 토큰 추가 및 갱신
  const originalFetch = window.fetch
  
  window.fetch = async (...args) => {
    const [url, options = {}] = args
    
    // ReadZone API 호출인지 확인
    if (typeof url === 'string' && url.startsWith(API_BASE_URL)) {
      const tokens = getStoredTokens()
      
      if (tokens.accessToken) {
        const headers = new Headers(options.headers)

        if (!headers.has('Authorization')) {
          headers.set('Authorization', `Bearer ${tokens.accessToken}`)
        }
        options.headers = headers
      }
    }
    
    const response = await originalFetch(url, options)
    
    // 401 에러 시 자동 토큰 갱신
    if (response.status === 401 && typeof url === 'string' && url.startsWith(API_BASE_URL)) {
      const authStore = useAuthStore.getState()
      const refreshed = await authStore.refreshTokens()
      
      if (refreshed) {
        // 갱신된 토큰으로 재시도
        const newTokens = getStoredTokens()

        if (newTokens.accessToken) {
          const headers = new Headers(options.headers)

          headers.set('Authorization', `Bearer ${newTokens.accessToken}`)
          options.headers = headers

          return originalFetch(url, options)
        }
      }
    }
    
    return response
  }
}

export { authenticatedApiCall }
import { create } from 'zustand'
import type { AuthActions, AuthError, AuthState, LoginRequest, User } from '@/types/auth'
import { getTokenTimeUntilExpiration, isTokenExpired, logTokenInfo } from '@/lib/jwt'
import { useSettingsStore } from '@/store/settingsStore'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4001'

// Cookie 기반 API 호출 헬퍼
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  
  const response = await fetch(url, {
    ...options,
    headers: defaultHeaders,
    credentials: 'include', // Cookie 자동 포함
  })
  
  if (!response.ok) {
    try {
      const errorData = await response.json()
      
      // 백엔드의 새로운 에러 응답 구조에 맞춘 처리
      if (errorData.success === false && errorData.error) {
        const error = new Error(errorData.error.message)

        // @ts-expect-error - Adding code property to Error instance
        error.code = errorData.error.code
        throw error
      }
      
      // 기존 형식 (fallback)

      throw new Error(errorData.message ?? `HTTP ${response.status}`)
    } catch (parseError) {
      // JSON 파싱 실패 시 기본 에러 메시지
      if (parseError instanceof Error && parseError.message !== `HTTP ${response.status}`) {
        throw parseError
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
  }
  
  return response.json()
}

// 인증된 API 호출 헬퍼 (Cookie + AccessToken)
const authenticatedApiCall = async (endpoint: string, options: RequestInit = {}) => {
  const currentState = useAuthStore.getState()
  
  if (!currentState.accessToken) {
    throw new Error('No access token available')
  }
  
  const headers = {
    ...options.headers,
    Authorization: `Bearer ${currentState.accessToken}`,
  }
  
  try {
    return await apiCall(endpoint, { ...options, headers })
  } catch (error) {
    // 401 에러 시 토큰 갱신 시도
    if (error instanceof Error && error.message.includes('401')) {
      const refreshed = await useAuthStore.getState().refreshTokens()

      if (refreshed) {
        const newState = useAuthStore.getState()
        const newHeaders = {
          ...options.headers,
          Authorization: `Bearer ${newState.accessToken}`,
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

// Refresh Token Mutex - 동시성 제어를 위한 Promise 캐시
let refreshPromise: Promise<boolean> | null = null;

type AuthStore = Omit<AuthState, 'refreshToken'> & AuthActions & {
  loginRequiredModal: LoginRequiredModalState;
  setLoginRequiredModal: (modal: LoginRequiredModalState) => void;
  setAuthReady: (ready: boolean) => void;
  // 토큰 만료 체크 관련
  tokenExpirationCheckId: number | null;
  startTokenExpirationCheck: () => void;
  stopTokenExpirationCheck: () => void;
  // Role-based access
  isAdmin: () => boolean;
  isModerator: () => boolean;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
      // State (refreshToken 제거 - Cookie로 관리)
      user: null,
      accessToken: null, // 메모리에만 저장
      isAuthenticated: false,
      isAuthReady: false,
      isLoading: false,
      error: null,
      rememberMe: false,

      // Login Required Modal State
      loginRequiredModal: {
        isOpen: false,
        message: undefined as { title: string; description: string; } | undefined,
        redirectTo: undefined as string | undefined
      },

      // Token Expiration Check State
      tokenExpirationCheckId: null,

      // Actions
      login: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await apiCall('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
          })
          
          // Cookie 기반 응답 형식: { success: true, message, user, tokens: { accessToken } }
          if (!response.success) {
            const authError: AuthError = {
              code: 'LOGIN_FAILED',
              message: response.message ?? '로그인에 실패했습니다.',
            }
            
            set({
              isLoading: false,
              error: authError,
              isAuthenticated: false,
              isAuthReady: true,
            })

            return false // 성공 여부 반환
          }
          
          // RefreshToken은 Cookie로 자동 설정됨
          if (!response.user || !response.tokens?.accessToken) {
            const authError: AuthError = {
              code: 'LOGIN_FAILED',
              message: '로그인 응답 형식이 올바르지 않습니다.',
            }
            
            set({
              isLoading: false,
              error: authError,
              isAuthenticated: false,
              isAuthReady: true,
            })

            return false
          }
          
          const { user, tokens } = response
          const { accessToken } = tokens
          
          set({
            user,
            accessToken, // 메모리에만 저장
            isAuthenticated: true,
            isLoading: false,
            error: null,
            rememberMe: false,
            isAuthReady: true,
          })
          
          // 개발 모드에서 토큰 정보 로그
          if (import.meta.env.DEV) {
            logTokenInfo(accessToken, 'Access Token')
          }
          
          // 토큰 만료 체크 시작

          get().startTokenExpirationCheck()
          
          return true // 로그인 성공
        } catch (error) {
          const authError: AuthError = {
            code: (error as Record<string, unknown>)?.code as string ?? 'LOGIN_FAILED',
            message: error instanceof Error ? error.message : '로그인에 실패했습니다.',
          }
          
          set({
            isLoading: false,
            error: authError,
            isAuthenticated: false,
            isAuthReady: true,
          })

          return false // 로그인 실패
        }
      },

      logout: async () => {
        // 토큰 만료 체크 중지
        get().stopTokenExpirationCheck()
        
        try {
          // 서버에 로그아웃 요청 (Cookie 삭제)
          await apiCall('/api/auth/logout', {
            method: 'POST',
          })
        } catch {
          // 서버 에러가 있어도 클라이언트 상태는 초기화
        }
        
        // localStorage에서 auth 관련 데이터 모두 제거
        try {
          localStorage.removeItem('auth-storage')
          localStorage.removeItem('readzone-auth-store')
          localStorage.removeItem('settings-store')
          // Zustand persist 미들웨어가 생성했을 수 있는 모든 auth 관련 키 정리
          Object.keys(localStorage).forEach(key => {
            if (key.includes('auth') || key.includes('readzone')) {
              localStorage.removeItem(key)
            }
          })
        } catch (error) {
          // localStorage 접근 실패 시 무시 (private mode 등)
          console.warn('Failed to clear localStorage:', error)
        }
        
        useSettingsStore.getState().requireAuthentication()

        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          rememberMe: false,
          isAuthReady: true,
        })
      },

      verifyToken: async () => {
        const currentState = get()
        
        // 메모리에 accessToken이 있으면 검증
        if (currentState.accessToken) {
          try {
            await authenticatedApiCall('/api/auth/verify-token')

            return true
          } catch {
            // accessToken이 만료되었으면 갱신 시도
            return await get().refreshTokens()
          }
        }
        
        // accessToken이 없으면 refreshToken으로 갱신 시도
        return await get().refreshTokens()
      },

      refreshTokens: async () => {
        // ✅ Refresh Token Mutex: 이미 refresh 진행 중이면 기존 Promise 반환
        if (refreshPromise) {
          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.log('[Auth] Refresh already in progress, returning existing promise')
          }

          return refreshPromise
        }

        // 새로운 refresh Promise 생성 및 캐시
        refreshPromise = (async () => {
          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.log('[Auth] Starting refresh token request', {
              timestamp: new Date().toISOString(),
            })
          }

          try {
            const response = await apiCall('/api/auth/refresh', {
              method: 'POST',
              // RefreshToken은 Cookie에서 자동으로 전송됨
            })

            // 백엔드 응답 형식 확인
            if (!response.success || !response.data) {
              throw new Error(response.error?.message ?? '토큰 갱신에 실패했습니다.')
            }

            const { tokens, user } = response.data
            const { accessToken } = tokens

            set({
              user,
              accessToken, // 메모리에만 저장
              isAuthenticated: true,
              isAuthReady: true,
            })

            // 개발 모드에서 토큰 정보 로그
            if (import.meta.env.DEV) {
              logTokenInfo(accessToken, 'Refreshed Access Token')
              // eslint-disable-next-line no-console
              console.log('[Auth] Refresh successful')
            }

            // 토큰 만료 체크 시작 (기존 체크가 있다면 재시작)
            get().stopTokenExpirationCheck()
            get().startTokenExpirationCheck()

            return true
          } catch (_error) {
            if (import.meta.env.DEV) {
              console.error('[Auth] Refresh failed:', _error)
            }

            await get().logout()

            return false
          } finally {
            // ✅ Promise 캐시 초기화 - 다음 refresh 허용
            refreshPromise = null
          }
        })()

        return refreshPromise
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

      // Token Expiration Check Actions
      startTokenExpirationCheck: () => {
        const state = get()
        
        // 기존 체크가 있다면 정지
        if (state.tokenExpirationCheckId) {
          clearInterval(state.tokenExpirationCheckId)
        }
        
        // AccessToken이 없다면 체크하지 않음
        if (!state.accessToken) {
          return
        }
        
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.log('[Auth] Starting token expiration check')
        }
        
        // 10초마다 토큰 만료 체크
        const intervalId = window.setInterval(async () => {
          const currentState = get()
          
          if (!currentState.accessToken || !currentState.isAuthenticated) {
            // 토큰이 없거나 인증되지 않은 상태면 체크 중지
            get().stopTokenExpirationCheck()

            return
          }
          
          // 토큰이 만료되었는지 확인
          if (isTokenExpired(currentState.accessToken)) {
            if (import.meta.env.DEV) {
              // eslint-disable-next-line no-console
              console.log('[Auth] Access token expired, attempting refresh')
            }
            
            // RefreshToken으로 갱신 시도
            const refreshSuccess = await get().refreshTokens()
            
            if (!refreshSuccess) {
              if (import.meta.env.DEV) {
                // eslint-disable-next-line no-console
                console.log('[Auth] Refresh failed, logging out')
              }
              // RefreshToken도 만료되었거나 실패하면 로그아웃
              await get().logout()
            }
          } else {
            // 개발 모드에서 남은 시간 로그
            if (import.meta.env.DEV) {
              const timeUntil = getTokenTimeUntilExpiration(currentState.accessToken)

              if (timeUntil !== null && timeUntil <= 60) {
                // eslint-disable-next-line no-console
                console.log(`[Auth] Token expires in ${timeUntil}s`)
              }
            }
          }
        }, 10000) // 10초마다 체크
        
        set({ tokenExpirationCheckId: intervalId })
      },

      stopTokenExpirationCheck: () => {
        const state = get()
        
        if (state.tokenExpirationCheckId) {
          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.log('[Auth] Stopping token expiration check')
          }
          clearInterval(state.tokenExpirationCheckId)
          set({ tokenExpirationCheckId: null })
        }
      },

      setAuthReady: (ready: boolean) => {
        set({ isAuthReady: ready })
      },

      // Role-based access helpers
      isAdmin: () => {
        const { user } = get()

        return user?.role === 'ADMIN'
      },

      isModerator: () => {
        const { user } = get()

        return user?.role === 'MODERATOR' || user?.role === 'ADMIN'
      },

}))

// localStorage 정리 헬퍼
const cleanupOldAuthData = () => {
  try {
    // 기존에 남아있을 수 있는 auth 관련 localStorage 키들 정리
    const keysToRemove = [
      'auth-storage', 
      'readzone-auth-store',
      // Zustand persist가 생성했을 수 있는 다른 키들
      'auth-store',
      'readzone-auth',
      'zustand-auth'
    ]
    
    keysToRemove.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key)

        // eslint-disable-next-line no-console
        console.info(`Cleaned up legacy auth storage key: ${key}`)
      }
    })
    
    // 패턴 매칭으로 auth 관련 키들 추가 정리
    Object.keys(localStorage).forEach(key => {
      if ((key.includes('auth') || key.includes('readzone')) && 
          key !== 'readzone-settings' && // 설정 키는 보존
          key !== 'readzone-drafts') {   // 임시저장 키는 보존
        localStorage.removeItem(key)
        
        // eslint-disable-next-line no-console
        console.info(`Cleaned up auth-related storage key: ${key}`)
      }
    })
    
    // 불필요한 인증 쿠키 정리 (authjs.session-token 등)

    document.cookie.split(';').forEach(cookie => {
      const [name] = cookie.trim().split('=')

      if (name && (name.includes('authjs') || name.includes('next-auth') || name.includes('session-token'))) {
        // localhost용 쿠키 삭제
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
        // 도메인별 쿠키 삭제
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.localhost`
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=localhost`
        
        // eslint-disable-next-line no-console
        console.info(`Cleaned up external auth cookie: ${name}`)
      }
    })
  } catch (error) {
    // localStorage 접근 실패 시 무시 (private mode 등)
    console.warn('Failed to cleanup localStorage:', error)
  }
}

// 초기화 상태 플래그
let isInitialized = false

// Cookie 기반 API 인터셉터 설정 (간소화)
export const setupApiInterceptors = () => {
  // 중복 초기화 방지
  if (isInitialized) {
    // eslint-disable-next-line no-console
    console.info('setupApiInterceptors: Already initialized, skipping')

    return
  }
  isInitialized = true
  
  // eslint-disable-next-line no-console
  console.info('setupApiInterceptors: Initializing auth interceptors')
  
  // 초기화 시 불필요한 localStorage 데이터 정리
  cleanupOldAuthData()
  
  // 페이지 로드 시 토큰 갱신 시도
  const initAuth = async () => {
    try {
      // httpOnly 쿠키는 JavaScript로 읽을 수 없으므로 무조건 갱신 시도
      // refreshToken 쿠키가 없으면 refreshTokens()가 실패하고 자동으로 로그아웃됨
      const refreshSuccess = await useAuthStore.getState().refreshTokens()

      // 갱신 성공 시 토큰 만료 체크 시작
      if (refreshSuccess) {
        useAuthStore.getState().startTokenExpirationCheck()
      }
    } catch (error) {
      // 초기 인증 실패는 무시 (로그인하지 않은 상태이거나 서버 연결 실패)
      if (import.meta.env.DEV) {
        console.warn('[Auth] Initial auth check failed:', error)
      }
    } finally {
      useAuthStore.getState().setAuthReady(true)
    }
  }
  
  // 비동기로 실행하되 에러를 잡아서 앱 시작을 방해하지 않음
  void initAuth()
}

export { authenticatedApiCall }

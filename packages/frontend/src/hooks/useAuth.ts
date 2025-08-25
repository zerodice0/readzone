import { useAuthStore } from '@/store/authStore'
import { useCallback } from 'react'
import type { LoginRequest } from '@/types/auth'

/**
 * 인증 관련 훅
 */
export function useAuth() {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    verifyToken,
    refreshTokens,
    clearError,
    getCurrentUser,
  } = useAuthStore()

  // 로그인 래퍼
  const handleLogin = useCallback(
    async (credentials: LoginRequest) => {
      await login(credentials)
      // 로그인 성공 시 사용자 정보 가져오기
      await getCurrentUser()
    },
    [login, getCurrentUser]
  )

  // 로그아웃 래퍼
  const handleLogout = useCallback(() => {
    logout()
  }, [logout])

  // 토큰 검증 래퍼
  const handleVerifyToken = useCallback(async () => {
    const isValid = await verifyToken()

    if (isValid) {
      await getCurrentUser()
    }

    return isValid
  }, [verifyToken, getCurrentUser])

  // 현재 사용자가 인증되었는지 확인
  const isAuthenticatedUser = useCallback(() => {
    return isAuthenticated && !!user
  }, [isAuthenticated, user])

  // 특정 권한이 있는지 확인 (향후 확장 가능)
  const hasPermission = useCallback(
    (permission: string) => {
      if (!isAuthenticated || !user) {return false}
      
      // 현재는 모든 인증된 사용자가 동일한 권한을 가짐
      // 향후 role-based access control 구현 시 확장 가능
      const userPermissions = ['read', 'write', 'comment', 'like']

      return userPermissions.includes(permission)
    },
    [isAuthenticated, user]
  )

  // 에러 메시지 가져오기
  const getErrorMessage = useCallback(() => {
    if (!error) {return null}

    return error.message || '알 수 없는 오류가 발생했습니다.'
  }, [error])

  return {
    // 상태
    user,
    isAuthenticated,
    isLoading,
    error,
    
    // 액션
    login: handleLogin,
    logout: handleLogout,
    verifyToken: handleVerifyToken,
    refreshTokens,
    clearError,
    getCurrentUser,
    
    // 유틸리티
    isAuthenticatedUser,
    hasPermission,
    getErrorMessage,
  }
}

/**
 * 로그인이 필요한 액션을 수행하는 훅
 */
export function useRequireAuth() {
  const { isAuthenticated } = useAuth()
  
  return useCallback(
    (action: () => void | Promise<void>, redirectToLogin = true) => {
      if (isAuthenticated) {
        return action()
      } else if (redirectToLogin) {
        // 로그인 페이지로 리다이렉트하거나 로그인 모달 표시
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`
      } else {
        // 로그인 필요 알림만 표시
        console.warn('로그인이 필요한 기능입니다.')
      }
    },
    [isAuthenticated]
  )
}

/**
 * 사용자 정보 업데이트 훅
 */
export function useUserUpdate() {
  const { user, getCurrentUser } = useAuth()
  
  const updateUser = useCallback(
    async (updates: Partial<typeof user>) => {
      if (!user) {return null}
      
      try {
        // API 호출로 사용자 정보 업데이트
        const response = await fetch('/api/auth/me', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        })
        
        if (!response.ok) {
          throw new Error('사용자 정보 업데이트에 실패했습니다.')
        }
        
        // 업데이트된 사용자 정보 다시 가져오기
        await getCurrentUser()
        
        return await response.json()
      } catch (error) {
        console.error('User update error:', error)
        throw error
      }
    },
    [user, getCurrentUser]
  )
  
  return { updateUser }
}

/**
 * 로그인 상태 변화 감지 훅
 */
export function useAuthStateChange() {
  const { isAuthenticated, user } = useAuth()
  
  return {
    isAuthenticated,
    user,
    isLoggedIn: isAuthenticated && !!user,
    isLoggedOut: !isAuthenticated || !user,
  }
}
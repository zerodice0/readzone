import React, { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'

import { useAuthStore } from '@/store/authStore'

interface AuthRedirectProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
  fallback?: React.ReactNode
}

/**
 * 인증 상태에 따른 리다이렉트 컴포넌트
 * 
 * @param requireAuth - true면 로그인이 필요한 페이지, false면 로그인 시 리다이렉트할 페이지
 * @param redirectTo - 리다이렉트할 경로 (기본: requireAuth ? '/login' : '/')
 * @param fallback - 로딩 중 표시할 컴포넌트
 */
export function AuthRedirect({ 
  children, 
  requireAuth = false, 
  redirectTo,
  fallback 
}: AuthRedirectProps) {
  const { isAuthenticated, isLoading } = useAuthStore()
  const navigate = useNavigate()

  // 초기 토큰 검증은 setupApiInterceptors에서 이미 수행되므로 중복 제거
  // useEffect(() => {
  //   if (!isAuthenticated && !isLoading) {
  //     verifyToken()
  //   }
  // }, [isAuthenticated, isLoading, verifyToken])

  useEffect(() => {
    if (!isLoading) {
      if (requireAuth && !isAuthenticated) {
        // 로그인이 필요한 페이지인데 로그인하지 않음
        navigate({ 
          to: redirectTo ?? '/login',
          search: { redirect: window.location.pathname }
        })
      } else if (!requireAuth && isAuthenticated) {
        // 로그인하지 않아야 하는 페이지인데 로그인함 (예: 로그인 페이지)
        navigate({ to: redirectTo ?? '/' })
      }
    }
  }, [isAuthenticated, isLoading, requireAuth, redirectTo, navigate])

  // 로딩 중이거나 리다이렉트 대상인 경우
  if (isLoading) {
    return fallback ?? (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-muted-foreground">로딩 중...</span>
        </div>
      </div>
    )
  }

  // 조건에 맞지 않으면 아무것도 렌더링하지 않음 (리다이렉트 대기)
  if (requireAuth && !isAuthenticated) {
    return null
  }

  if (!requireAuth && isAuthenticated) {
    return null
  }

  return <>{children}</>
}

/**
 * 로그인이 필요한 페이지를 감싸는 컴포넌트
 */
export function ProtectedRoute({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <AuthRedirect requireAuth={true} fallback={fallback}>
      {children}
    </AuthRedirect>
  )
}

/**
 * 로그인하지 않은 상태에서만 접근 가능한 페이지를 감싸는 컴포넌트 (로그인, 회원가입 등)
 */
export function GuestOnlyRoute({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <AuthRedirect requireAuth={false} fallback={fallback}>
      {children}
    </AuthRedirect>
  )
}
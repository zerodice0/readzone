import type { ReactNode } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '@/store/authStore'

interface AuthGuardProps {
  fallback?: 'redirect' | 'modal' | 'toast'
  redirectTo?: string
  children: ReactNode
}

/**
 * 컴포넌트를 인증 가드로 감싸는 HOC
 */
export const AuthGuard = ({ 
  fallback = 'redirect', 
  redirectTo = '/login',
  children 
}: AuthGuardProps) => {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    if (fallback === 'redirect') {
      const currentPath = window.location.pathname + window.location.search;

      navigate({ to: `${redirectTo}?redirect=${encodeURIComponent(currentPath)}` });

      return null;
    }
  }

  return <>{children}</>;
};
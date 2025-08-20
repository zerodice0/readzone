import { useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '@/store/authStore';
import type { ReactNode } from 'react';

interface AuthGuardProps {
  fallback?: 'redirect' | 'modal' | 'toast';
  redirectTo?: string;
  children?: ReactNode;
}

interface AuthGuardOptions {
  fallback?: 'redirect' | 'modal' | 'toast';
  redirectTo?: string;
  message?: {
    title: string;
    description: string;
  };
}

/**
 * 인증이 필요한 작업을 수행하기 전에 로그인 여부를 확인하는 유틸리티 훅
 */
export const useAuthGuard = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const requireAuth = (
    action: () => void | Promise<void>,
    options: AuthGuardOptions = {}
  ) => {
    const {
      fallback = 'modal',
      redirectTo,
      message = {
        title: '로그인 필요',
        description: '이 기능을 사용하려면 로그인이 필요합니다.'
      }
    } = options;

    if (isAuthenticated) {
      return action();
    }

    // 비인증 사용자 처리
    switch (fallback) {
      case 'redirect': {
        const currentPath = window.location.pathname + window.location.search;
        const redirectPath = redirectTo ?? `/login?redirect=${encodeURIComponent(currentPath)}`;

        navigate({ to: redirectPath });
        break;
      }
        
      case 'modal': {
        // 모달 상태를 전역 상태로 관리
        useAuthStore.getState().setLoginRequiredModal({
          isOpen: true,
          message,
          redirectTo: redirectTo ?? window.location.pathname
        });
        break;
      }
        
      case 'toast':
        // Toast 컴포넌트 사용 (기존 코드 유지)
        break;
    }
  };

  return { requireAuth, isAuthenticated };
};

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

/**
 * 로그인이 필요한 액션을 감싸는 유틸리티 함수
 */
export const withAuthGuard = <T extends unknown[]>(
  action: (...args: T) => void | Promise<void>,
  options: AuthGuardOptions = {}
) => {
  return (...args: T) => {
    const { isAuthenticated } = useAuthStore.getState();
    
    if (isAuthenticated) {
      return action(...args);
    }

    // 비인증 사용자 처리
    const { requireAuth } = useAuthGuard();

    requireAuth(() => action(...args), options);
  };
};
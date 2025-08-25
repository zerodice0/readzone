import { useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '@/store/authStore'

interface AuthMessage {
  title: string
  description: string
}

interface AuthGuardOptions {
  fallback?: 'redirect' | 'modal' | 'toast'
  redirectTo?: string
  message?: AuthMessage
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

    const {
      fallback = 'modal',
      redirectTo,
      message = {
        title: '로그인 필요',
        description: '이 기능을 사용하려면 로그인이 필요합니다.'
      }
    } = options;

    // 비인증 사용자 처리
    switch (fallback) {
      case 'redirect': {
        const currentPath = window.location.pathname + window.location.search;
        const redirectPath = redirectTo ?? `/login?redirect=${encodeURIComponent(currentPath)}`;
        
        // navigate를 직접 호출할 수 없으므로 window.location 사용
        window.location.href = redirectPath;
        break;
      }
        
      case 'modal': {
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
};

export type { AuthGuardOptions, AuthMessage }
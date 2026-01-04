import { useClerk } from '@clerk/clerk-react';

interface ClerkLoadingWrapperProps {
  children: React.ReactNode;
  /** 디버깅 모드 활성화 시 콘솔에 로그 출력 */
  debug?: boolean;
}

/**
 * Clerk SDK 로딩 상태를 처리하는 래퍼 컴포넌트
 *
 * iOS Chrome(WKWebView)에서 cross-origin 쿠키 제한으로 인해
 * Clerk SDK 초기화가 지연되거나 실패할 수 있습니다.
 * 이 컴포넌트는 로딩 중 적절한 UI를 표시합니다.
 *
 * @see https://bugs.webkit.org/show_bug.cgi?id=200857
 * @see https://bugs.webkit.org/show_bug.cgi?id=213510
 */
export function ClerkLoadingWrapper({
  children,
  debug = false,
}: ClerkLoadingWrapperProps) {
  const { loaded } = useClerk();

  if (debug) {
    console.log('[Clerk Debug] loaded:', loaded);
    console.log('[Clerk Debug] userAgent:', navigator.userAgent);
  }

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-stone-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-stone-500 text-sm">로딩 중...</p>
          {debug && (
            <p className="text-xs text-stone-400 mt-2">
              Clerk SDK 초기화 대기 중
            </p>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

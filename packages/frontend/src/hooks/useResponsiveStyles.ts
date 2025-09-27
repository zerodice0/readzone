import { type ReactNode, useMemo } from 'react';
import { useBreakpointContext } from './useBreakpointContext';

/**
 * 반응형 스타일 계산 훅
 */
export function useResponsiveStyles<T>(styles: {
  mobile?: T;
  tablet?: T;
  desktop?: T;
  default: T;
}): T {
  const { isMobile, isTablet, isDesktop } = useBreakpointContext();

  if (isMobile && styles.mobile) {
    return styles.mobile;
  }

  if (isTablet && styles.tablet) {
    return styles.tablet;
  }

  if (isDesktop && styles.desktop) {
    return styles.desktop;
  }

  return styles.default;
}

/**
 * 조건부 렌더링 훅
 */
export function useConditionalRender() {
  const breakpoints = useBreakpointContext();

  return {
    // 브레이크포인트별 조건부 렌더링
    showOnMobile: (component: ReactNode) =>
      breakpoints.isMobile ? component : null,
    showOnTablet: (component: ReactNode) =>
      breakpoints.isTablet ? component : null,
    showOnDesktop: (component: ReactNode) =>
      breakpoints.isDesktop ? component : null,

    // 터치 디바이스별 조건부 렌더링
    showOnTouch: (component: ReactNode) =>
      breakpoints.isTouchDevice ? component : null,
    showOnNonTouch: (component: ReactNode) =>
      !breakpoints.isTouchDevice ? component : null,

    // 접근성 설정별 조건부 렌더링
    showWithMotion: (component: ReactNode) =>
      !breakpoints.prefersReducedMotion ? component : null,
    showWithoutMotion: (component: ReactNode) =>
      breakpoints.prefersReducedMotion ? component : null,
  };
}

/**
 * 터치 최적화 스타일 훅
 */
export function useTouchOptimizedStyles() {
  const { isTouchDevice, isMobile } = useBreakpointContext();

  return useMemo(
    () => ({
      // 터치 타겟 크기
      touchTargetSize: isTouchDevice
        ? 'min-h-[44px] min-w-[44px]'
        : 'min-h-[32px] min-w-[32px]',

      // 터치 간격
      touchSpacing: isTouchDevice ? 'gap-3' : 'gap-2',

      // 터치 패딩
      touchPadding: isTouchDevice ? 'px-4 py-3' : 'px-3 py-2',

      // 모바일 최적화 텍스트
      touchText: isMobile ? 'text-base' : 'text-sm',

      // 터치 호버 효과
      touchHover: isTouchDevice ? 'active:scale-95' : 'hover:scale-105',

      // 스크롤바 스타일
      scrollbarStyle: isTouchDevice
        ? 'scrollbar-hide'
        : 'scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100',
    }),
    [isTouchDevice, isMobile]
  );
}

/**
 * 접근성 최적화 스타일 훅
 */
export function useAccessibilityStyles() {
  const { prefersReducedMotion, isTouchDevice } = useBreakpointContext();

  return useMemo(
    () => ({
      // 애니메이션 설정
      animation: prefersReducedMotion
        ? 'transition-none'
        : 'transition-all duration-200',

      // 포커스 스타일
      focusRing:
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',

      // 터치 포커스
      touchFocus: isTouchDevice
        ? 'focus:bg-gray-100 dark:focus:bg-gray-800'
        : 'focus:bg-gray-50 dark:focus:bg-gray-700',

      // 고대비 모드 지원
      highContrast:
        'contrast-more:border-black contrast-more:text-black dark:contrast-more:border-white dark:contrast-more:text-white',
    }),
    [prefersReducedMotion, isTouchDevice]
  );
}

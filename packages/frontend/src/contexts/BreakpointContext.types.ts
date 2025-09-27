import type { ReactNode } from 'react';

/**
 * 브레이크포인트 컨텍스트 값 타입
 */
export interface BreakpointContextValue {
  // 현재 브레이크포인트 정보
  currentBreakpoint: 'sm' | 'md' | 'lg' | 'xl' | '2xl';

  // 개별 브레이크포인트 체크
  isSm: boolean;
  isMd: boolean;
  isLg: boolean;
  isXl: boolean;
  is2Xl: boolean;

  // 편의 속성
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;

  // 화면 크기 정보
  screenWidth: number;
  screenHeight: number;

  // 방향 정보
  isPortrait: boolean;
  isLandscape: boolean;

  // 터치 지원 여부
  isTouchDevice: boolean;

  // 접근성 설정
  prefersReducedMotion: boolean;
  prefersDarkMode: boolean;
}

/**
 * 브레이크포인트 프로바이더 Props 타입
 */
export interface BreakpointProviderProps {
  children: ReactNode;
}

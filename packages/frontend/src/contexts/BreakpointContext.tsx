import { useResponsiveBreakpoint } from '@/hooks/useBreakpoint';
import { useEffect, useMemo, useState } from 'react';
import { BreakpointContext } from './BreakpointContext.context';
import type {
  BreakpointContextValue,
  BreakpointProviderProps,
} from './BreakpointContext.types';

/**
 * 반응형 디자인 컨텍스트 프로바이더
 * Phase 4 UI/UX 개선사항 포함:
 * - 전역 브레이크포인트 상태 관리
 * - 접근성 설정 감지
 * - 터치 디바이스 감지
 * - 성능 최적화된 리스너
 */
export function BreakpointProvider({ children }: BreakpointProviderProps) {
  const breakpointData = useResponsiveBreakpoint();
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [prefersDarkMode, setPrefersDarkMode] = useState(false);

  // 화면 크기 변경 감지
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize, { passive: true });

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 터치 디바이스 감지
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const checkTouchDevice = () => {
      const hasTouchScreen =
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        ('msMaxTouchPoints' in navigator &&
          (navigator as { msMaxTouchPoints: number }).msMaxTouchPoints > 0);

      setIsTouchDevice(hasTouchScreen);
    };

    checkTouchDevice();
  }, []);

  // 접근성 설정 감지
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQueries = {
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)'),
      darkMode: window.matchMedia('(prefers-color-scheme: dark)'),
    };

    const updateAccessibilitySettings = () => {
      setPrefersReducedMotion(mediaQueries.reducedMotion.matches);
      setPrefersDarkMode(mediaQueries.darkMode.matches);
    };

    // 초기 설정
    updateAccessibilitySettings();

    // 변경 감지
    mediaQueries.reducedMotion.addEventListener(
      'change',
      updateAccessibilitySettings
    );
    mediaQueries.darkMode.addEventListener(
      'change',
      updateAccessibilitySettings
    );

    return () => {
      mediaQueries.reducedMotion.removeEventListener(
        'change',
        updateAccessibilitySettings
      );
      mediaQueries.darkMode.removeEventListener(
        'change',
        updateAccessibilitySettings
      );
    };
  }, []);

  const contextValue: BreakpointContextValue = useMemo(
    () => ({
      currentBreakpoint: breakpointData.currentBreakpoint,
      isSm: breakpointData.isSm,
      isMd: breakpointData.isMd,
      isLg: breakpointData.isLg,
      isXl: breakpointData.isXl,
      is2Xl: breakpointData.is2Xl,
      isMobile: breakpointData.isMobile,
      isTablet: breakpointData.isTablet,
      isDesktop: breakpointData.isDesktop,
      isLargeDesktop: breakpointData.isLargeDesktop,
      screenWidth: screenSize.width,
      screenHeight: screenSize.height,
      isPortrait: screenSize.height > screenSize.width,
      isLandscape: screenSize.width > screenSize.height,
      isTouchDevice,
      prefersReducedMotion,
      prefersDarkMode,
    }),
    [
      breakpointData,
      screenSize.width,
      screenSize.height,
      isTouchDevice,
      prefersReducedMotion,
      prefersDarkMode,
    ]
  );

  return (
    <BreakpointContext.Provider value={contextValue}>
      {children}
    </BreakpointContext.Provider>
  );
}

export default BreakpointProvider;

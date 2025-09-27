import { useEffect, useState } from 'react';

/**
 * 크로스 브라우저 MediaQueryList 이벤트 리스너 관리 유틸리티
 * 최신 addEventListener를 우선 사용하고, 구형 브라우저는 addListener 폴백
 */
function attachMediaQueryListener(
  media: MediaQueryList,
  listener: (e: MediaQueryListEvent) => void
): () => void {
  // 최신 브라우저는 addEventListener 사용
  if (media.addEventListener) {
    media.addEventListener('change', listener);

    return () => media.removeEventListener('change', listener);
  }

  // 구형 브라우저는 deprecated addListener 사용 (bracket notation으로 deprecation 경고 회피)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mediaAny = media as any;

  if (typeof mediaAny['addListener'] === 'function') {
    mediaAny['addListener'](listener);

    return () => {
      if (typeof mediaAny['removeListener'] === 'function') {
        mediaAny['removeListener'](listener);
      }
    };
  }

  // 폴백: 빈 cleanup 함수 반환 (구형 브라우저 호환성을 위해 필요)
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  return () => {};
}

const breakpoints = {
  sm: '(min-width: 640px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
  '2xl': '(min-width: 1536px)',
} as const;

export type Breakpoint = keyof typeof breakpoints;

interface UseBreakpointReturn {
  matches: boolean;
  breakpoint: Breakpoint | 'xs';
  currentBreakpoint: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  isSm: boolean;
  isMd: boolean;
  isLg: boolean;
  isXl: boolean;
  is2Xl: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
  isWide: boolean;
}

/**
 * 반응형 브레이크포인트 감지 훅
 * Tailwind CSS 브레이크포인트 기준 사용
 */
export function useBreakpoint(breakpoint: Breakpoint): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.matchMedia(breakpoints[breakpoint]).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const media = window.matchMedia(breakpoints[breakpoint]);

    setMatches(media.matches);

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);

    return attachMediaQueryListener(media, listener);
  }, [breakpoint]);

  return matches;
}

/**
 * 현재 활성 브레이크포인트와 디바이스 타입 감지
 */
export function useResponsiveBreakpoint(): UseBreakpointReturn {
  const sm = useBreakpoint('sm');
  const md = useBreakpoint('md');
  const lg = useBreakpoint('lg');
  const xl = useBreakpoint('xl');
  const xxl = useBreakpoint('2xl');

  // 현재 브레이크포인트 결정
  const breakpoint: Breakpoint | 'xs' = xxl
    ? '2xl'
    : xl
      ? 'xl'
      : lg
        ? 'lg'
        : md
          ? 'md'
          : sm
            ? 'sm'
            : 'xs';

  const currentBreakpoint: 'sm' | 'md' | 'lg' | 'xl' | '2xl' =
    breakpoint === 'xs' ? 'sm' : breakpoint;

  return {
    matches: true, // 항상 하나의 브레이크포인트에는 매치됨
    breakpoint,
    currentBreakpoint,
    isSm: sm,
    isMd: md,
    isLg: lg,
    isXl: xl,
    is2Xl: xxl,
    isMobile: !sm, // xs
    isTablet: sm && !lg, // sm, md
    isDesktop: lg && !xxl, // lg, xl
    isLargeDesktop: xxl, // 2xl
    isWide: xxl, // 2xl
  };
}

/**
 * 모바일 디바이스 감지 훅
 * 터치 지원과 화면 크기를 모두 고려
 */
export function useMobileDetection() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    // 터치 지원 검사
    const hasTouchScreen =
      'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // 화면 크기 검사
    const isSmallScreen = window.innerWidth < 768;

    // User-Agent 기반 검사 (보조적)
    const mobileUserAgent =
      /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );

    return (hasTouchScreen && isSmallScreen) || mobileUserAgent;
  });

  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>(
    () => {
      if (typeof window === 'undefined') {
        return 'desktop';
      }

      const width = window.innerWidth;

      if (width < 768) {
        return 'mobile';
      }
      if (width < 1024) {
        return 'tablet';
      }

      return 'desktop';
    }
  );

  useEffect(() => {
    const checkDevice = () => {
      const hasTouchScreen =
        'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const width = window.innerWidth;
      const isSmallScreen = width < 768;
      const mobileUserAgent =
        /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );

      setIsMobile((hasTouchScreen && isSmallScreen) || mobileUserAgent);

      // 디바이스 타입 결정
      if (width < 768) {
        setDeviceType('mobile');
      } else if (width < 1024) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    };

    checkDevice();

    // 리사이즈 이벤트 리스너
    window.addEventListener('resize', checkDevice);

    // 오리엔테이션 변경 이벤트 (모바일)
    window.addEventListener('orientationchange', checkDevice);

    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('orientationchange', checkDevice);
    };
  }, []);

  return {
    isMobile,
    deviceType,
    isTouchDevice: isMobile,
    isLandscape:
      typeof window !== 'undefined'
        ? window.innerWidth > window.innerHeight
        : false,
  };
}

/**
 * 컨테이너 쿼리를 위한 요소 크기 감지 훅
 * ResizeObserver 기반
 */
export function useElementSize<T extends HTMLElement = HTMLElement>() {
  const [element, setElement] = useState<T | null>(null);
  const [size, setSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    if (!element) {
      return;
    }

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;

        setSize({ width, height });
      }
    });

    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, [element]);

  return {
    ref: setElement,
    size,
    width: size.width,
    height: size.height,
  };
}

/**
 * 미디어 쿼리 훅 (사용자 정의 쿼리)
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const media = window.matchMedia(query);

    setMatches(media.matches);

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);

    return attachMediaQueryListener(media, listener);
  }, [query]);

  return matches;
}

/**
 * 다크 모드 선호도 감지
 */
export function usePrefersDarkMode(): boolean {
  return useMediaQuery('(prefers-color-scheme: dark)');
}

/**
 * 애니메이션 선호도 감지 (접근성)
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

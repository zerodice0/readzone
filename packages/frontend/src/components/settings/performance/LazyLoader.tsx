import {
  type ComponentType,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { animations } from '@/lib/animations';

interface LazyLoaderProps {
  children: ReactNode;
  fallback?: ReactNode;
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  className?: string | undefined;
  onIntersect?: () => void;
  delay?: number;
}

/**
 * 레이지 로딩 컴포넌트
 * Phase 4 UI/UX 개선사항 포함:
 * - Intersection Observer API 활용
 * - 성능 최적화
 * - 부드러운 애니메이션 전환
 * - 접근성 지원
 */
export function LazyLoader({
  children,
  fallback,
  threshold = 0.1,
  rootMargin = '50px',
  triggerOnce = true,
  className,
  onIntersect,
  delay = 0,
}: LazyLoaderProps) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;

    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry?.isIntersecting;

        if (isVisible) {
          if (delay > 0) {
            setTimeout(() => {
              setIsIntersecting(true);
              setHasIntersected(true);
              onIntersect?.();
            }, delay);
          } else {
            setIsIntersecting(true);
            setHasIntersected(true);
            onIntersect?.();
          }

          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsIntersecting(false);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin, triggerOnce, onIntersect, delay]);

  const shouldRender = triggerOnce ? hasIntersected : isIntersecting;

  return (
    <div ref={elementRef} className={clsx('w-full', className)}>
      {shouldRender ? (
        <motion.div
          {...animations.fadeIn}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          {children}
        </motion.div>
      ) : (
        (fallback ?? (
          <div className="w-full h-32 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg flex items-center justify-center">
            <div className="text-gray-400 dark:text-gray-600 text-sm">
              로딩 중...
            </div>
          </div>
        ))
      )}
    </div>
  );
}

/**
 * 컴포넌트 레이지 로딩 유틸리티
 */
interface LazyComponentProps {
  importFn: () => Promise<{ default: ComponentType<unknown> }>;
  fallback?: ReactNode;
  errorComponent?: ComponentType<{ error: Error; retry: () => void }>;
  retryAttempts?: number;
  className?: string;
}

export function LazyComponent({
  importFn,
  fallback,
  errorComponent: ErrorComponent,
  retryAttempts = 3,
  className,
}: LazyComponentProps) {
  const [Component, setComponent] = useState<ComponentType<unknown> | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [attempts, setAttempts] = useState(0);

  const loadComponent = useCallback(async () => {
    if (Component || loading) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const module = await importFn();

      setComponent(() => module.default);
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error('컴포넌트 로딩 실패');

      setError(error);
    } finally {
      setLoading(false);
    }
  }, [importFn, Component, loading]);

  const retry = useCallback(() => {
    if (attempts < retryAttempts) {
      setAttempts((prev) => prev + 1);
      setComponent(null);
      loadComponent();
    }
  }, [attempts, retryAttempts, loadComponent]);

  useEffect(() => {
    loadComponent();
  }, [loadComponent]);

  if (loading) {
    return (
      <div className={clsx('w-full', className)}>
        {fallback ?? (
          <motion.div
            className="flex items-center justify-center p-8"
            animate={{
              scale: [1, 1.02, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
              <motion.div
                className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              <span className="text-sm">컴포넌트 로딩 중...</span>
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  if (error) {
    if (ErrorComponent) {
      return <ErrorComponent error={error} retry={retry} />;
    }

    return (
      <motion.div
        className={clsx(
          'p-6 border border-red-200 rounded-lg bg-red-50 dark:border-red-800 dark:bg-red-900/20',
          className
        )}
        {...animations.slideDown}
      >
        <div className="flex items-center mb-2">
          <svg
            className="w-5 h-5 text-red-500 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
            컴포넌트 로딩 실패
          </h3>
        </div>
        <p className="text-sm text-red-600 dark:text-red-300 mb-4">
          {error.message}
        </p>
        {attempts < retryAttempts && (
          <button
            onClick={retry}
            className="px-3 py-1 text-xs font-medium bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            다시 시도 ({attempts + 1}/{retryAttempts})
          </button>
        )}
      </motion.div>
    );
  }

  if (!Component) {
    return null;
  }

  return (
    <motion.div className={className} {...animations.fadeIn}>
      <Component />
    </motion.div>
  );
}

/**
 * 섹션 레이지 로딩 컴포넌트
 */
interface LazySectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  priority?: 'high' | 'medium' | 'low';
  threshold?: number;
  fallbackHeight?: number;
}

export function LazySection({
  title,
  children,
  className,
  priority = 'medium',
  threshold: _threshold = 0.1,
  fallbackHeight = 200,
}: LazySectionProps) {
  const priorityConfig = {
    high: { threshold: 0.5, delay: 0 },
    medium: { threshold: 0.1, delay: 100 },
    low: { threshold: 0.05, delay: 200 },
  };

  const config = priorityConfig[priority];

  const fallback = (
    <div
      className="bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"
      style={{ height: fallbackHeight }}
    >
      <div className="p-4">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
        </div>
      </div>
    </div>
  );

  return (
    <LazyLoader
      threshold={config.threshold}
      delay={config.delay}
      fallback={fallback}
      className={className}
    >
      <motion.section className="space-y-4" {...animations.slideUp}>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h2>
        {children}
      </motion.section>
    </LazyLoader>
  );
}

/**
 * 레이지 리스트 아이템
 */
interface LazyListItemProps {
  children: React.ReactNode;
  index: number;
  threshold?: number;
  className?: string;
  fallbackHeight?: number;
}

export function LazyListItem({
  children,
  index,
  threshold = 0.1,
  className,
  fallbackHeight = 60,
}: LazyListItemProps) {
  const delay = Math.min(index * 50, 500); // 최대 500ms 지연

  const fallback = (
    <div
      className="bg-gray-100 dark:bg-gray-800 rounded animate-pulse p-4"
      style={{ height: fallbackHeight }}
    >
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    </div>
  );

  return (
    <LazyLoader
      threshold={threshold}
      delay={delay}
      fallback={fallback}
      className={className}
    >
      {children}
    </LazyLoader>
  );
}

export default LazyLoader;

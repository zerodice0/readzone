import { animations } from '@/lib/animations';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import {
  type ComponentType,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

interface CodeSplittingProps {
  loader: () => Promise<{ default: ComponentType<unknown> }>;
  fallback?: ReactNode;
  errorBoundary?: ComponentType<{ error: Error; retry: () => void }>;
  retryAttempts?: number;
  preload?: boolean;
  timeout?: number;
  className?: string | undefined;
}

/**
 * 코드 스플리팅 컴포넌트
 * Phase 4 UI/UX 개선사항 포함:
 * - 동적 임포트 지원
 * - 에러 바운더리
 * - 재시도 로직
 * - 프리로드 지원
 * - 타임아웃 처리
 */
export function CodeSplitting({
  loader,
  fallback,
  errorBoundary: ErrorBoundary,
  retryAttempts = 3,
  preload = false,
  timeout = 10000,
  className,
}: CodeSplittingProps) {
  const [Component, setComponent] = useState<ComponentType<unknown> | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [attempt, setAttempt] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadComponent = useCallback(async () => {
    if (Component && !error) {
      return;
    }

    setLoading(true);
    setError(null);

    // 타임아웃 설정
    timeoutRef.current = setTimeout(() => {
      setError(new Error('컴포넌트 로딩 시간 초과'));
      setLoading(false);
    }, timeout);

    try {
      const module = await loader();

      clearTimeout(timeoutRef.current);
      setComponent(() => module.default);
      setLoading(false);
    } catch (err) {
      clearTimeout(timeoutRef.current);
      const error =
        err instanceof Error ? err : new Error('컴포넌트 로딩 실패');

      setError(error);
      setLoading(false);
    }
  }, [loader, Component, error, timeout]);

  const retry = useCallback(() => {
    if (attempt < retryAttempts) {
      setAttempt((prev) => prev + 1);
      setComponent(null);
      loadComponent();
    }
  }, [attempt, retryAttempts, loadComponent]);

  // 초기 로드 또는 프리로드
  useEffect(() => {
    if (preload || !Component) {
      loadComponent();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [loadComponent, preload, Component]);

  if (loading) {
    return (
      <div className={clsx('w-full', className)}>
        {fallback ?? <DefaultLoadingFallback />}
      </div>
    );
  }

  if (error) {
    if (ErrorBoundary) {
      return <ErrorBoundary error={error} retry={retry} />;
    }

    return (
      <DefaultErrorFallback
        error={error}
        retry={retry}
        canRetry={attempt < retryAttempts}
      />
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
 * 설정 섹션 코드 스플리팅
 */
interface SettingsSectionSplitProps {
  sectionId: string;
  loader: () => Promise<{ default: ComponentType<unknown> }>;
  fallbackHeight?: number;
  className?: string;
}

export function SettingsSectionSplit({
  sectionId,
  loader,
  fallbackHeight = 200,
  className,
}: SettingsSectionSplitProps) {
  const fallback = (
    <motion.div
      className="space-y-4"
      {...animations.fadeIn}
      style={{ height: fallbackHeight }}
    >
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          <div className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg"></div>
          <div className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg"></div>
          <div className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg"></div>
        </div>
      </div>
    </motion.div>
  );

  const errorBoundary = ({
    error,
    retry,
  }: {
    error: Error;
    retry: () => void;
  }) => (
    <motion.div
      className="p-6 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20"
      {...animations.slideDown}
    >
      <div className="flex items-center mb-3">
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
        <h3 className="text-lg font-medium text-red-800 dark:text-red-200">
          설정 섹션 로딩 실패
        </h3>
      </div>
      <p className="text-sm text-red-600 dark:text-red-300 mb-4">
        {sectionId} 섹션을 불러올 수 없습니다: {error.message}
      </p>
      <button
        onClick={retry}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
      >
        다시 시도
      </button>
    </motion.div>
  );

  return (
    <CodeSplitting
      loader={loader}
      fallback={fallback}
      errorBoundary={errorBoundary}
      preload={false}
      className={className}
    />
  );
}

/**
 * 기본 로딩 폴백 컴포넌트
 */
function DefaultLoadingFallback() {
  return (
    <motion.div
      className="flex items-center justify-center p-8"
      {...animations.fadeIn}
    >
      <div className="flex items-center space-x-3">
        <motion.div
          className="w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
        <span className="text-gray-600 dark:text-gray-400">
          컴포넌트 로딩 중...
        </span>
      </div>
    </motion.div>
  );
}

/**
 * 기본 에러 폴백 컴포넌트
 */
function DefaultErrorFallback({
  error,
  retry,
  canRetry,
}: {
  error: Error;
  retry: () => void;
  canRetry: boolean;
}) {
  return (
    <motion.div
      className="p-6 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20"
      {...animations.slideDown}
    >
      <div className="flex items-center mb-3">
        <svg
          className="w-6 h-6 text-red-500 mr-3"
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
        <h3 className="text-lg font-medium text-red-800 dark:text-red-200">
          컴포넌트 로딩 실패
        </h3>
      </div>
      <p className="text-sm text-red-600 dark:text-red-300 mb-4">
        {error.message}
      </p>
      {canRetry && (
        <button
          onClick={retry}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
        >
          다시 시도
        </button>
      )}
    </motion.div>
  );
}

export default CodeSplitting;

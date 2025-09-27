import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { useBreakpointContext } from '@/hooks/useBreakpointContext';
import { settingsAnalytics } from '@/lib/analytics';
import { animations } from '@/lib/animations';

interface PerformanceMetrics {
  // Core Web Vitals
  LCP: number | null; // Largest Contentful Paint
  FID: number | null; // First Input Delay
  CLS: number | null; // Cumulative Layout Shift

  // 기타 성능 메트릭
  FCP: number | null; // First Contentful Paint
  TTI: number | null; // Time to Interactive
  TTFB: number | null; // Time to First Byte

  // 메모리 사용량
  memoryUsage: number | null;

  // 페이지 로드 시간
  loadTime: number | null;

  // 리소스 메트릭
  resourceCount: number;
  imageLoadTime: number | null;
  scriptLoadTime: number | null;
}

interface PerformanceMonitorProps {
  enabled?: boolean;
  reportInterval?: number;
  thresholds?: {
    LCP: number;
    FID: number;
    CLS: number;
    memoryUsage: number;
  };
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
  showDebugInfo?: boolean;
  className?: string;
}

/**
 * 성능 모니터링 컴포넌트
 * Phase 4 UI/UX 개선사항 포함:
 * - Core Web Vitals 측정
 * - 메모리 사용량 모니터링
 * - 리소스 로딩 성능 추적
 * - 실시간 성능 인사이트
 */
export function PerformanceMonitor({
  enabled = true,
  reportInterval = 5000,
  thresholds = {
    LCP: 2500, // 2.5초
    FID: 100, // 100ms
    CLS: 0.1, // 0.1
    memoryUsage: 50, // 50MB
  },
  onMetricsUpdate,
  showDebugInfo = false,
  className,
}: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    LCP: null,
    FID: null,
    CLS: null,
    FCP: null,
    TTI: null,
    TTFB: null,
    memoryUsage: null,
    loadTime: null,
    resourceCount: 0,
    imageLoadTime: null,
    scriptLoadTime: null,
  });

  const [isMonitoring, setIsMonitoring] = useState(false);
  const { isMobile } = useBreakpointContext();
  const observerRef = useRef<PerformanceObserver | null>(null);
  const intervalRef = useRef<number | undefined>(undefined);

  // 성능 메트릭 수집
  const collectMetrics = useCallback(() => {
    if (!enabled || typeof window === 'undefined') {
      return;
    }

    const newMetrics: PerformanceMetrics = { ...metrics };

    // Navigation Timing API
    const navigation = performance.getEntriesByType(
      'navigation'
    )[0] as PerformanceNavigationTiming;

    if (navigation) {
      newMetrics.TTFB = navigation.responseStart - navigation.requestStart;
      newMetrics.loadTime = navigation.loadEventEnd - navigation.fetchStart;
    }

    // Resource Timing API
    const resources = performance.getEntriesByType('resource');

    newMetrics.resourceCount = resources.length;

    const images = resources.filter(
      (resource) =>
        (resource as PerformanceResourceTiming).initiatorType === 'img' ||
        resource.name.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i)
    );

    if (images.length > 0) {
      newMetrics.imageLoadTime =
        images.reduce((sum, img) => sum + img.duration, 0) / images.length;
    }

    const scripts = resources.filter(
      (resource) =>
        (resource as PerformanceResourceTiming).initiatorType === 'script'
    );

    if (scripts.length > 0) {
      newMetrics.scriptLoadTime =
        scripts.reduce((sum, script) => sum + script.duration, 0) /
        scripts.length;
    }

    // Memory API (Chrome only)
    if ('memory' in performance) {
      const memory = (performance as { memory?: { usedJSHeapSize: number } })
        .memory;

      if (memory) {
        newMetrics.memoryUsage = memory.usedJSHeapSize / (1024 * 1024); // MB로 변환
      }
    }

    // Paint Timing API
    const paintEntries = performance.getEntriesByType('paint');
    const fcpEntry = paintEntries.find(
      (entry) => entry.name === 'first-contentful-paint'
    );

    if (fcpEntry) {
      newMetrics.FCP = fcpEntry.startTime;
    }

    setMetrics(newMetrics);
    onMetricsUpdate?.(newMetrics);

    // 성능 임계값 초과 시 알림
    const warnings: string[] = [];

    if (newMetrics.LCP && newMetrics.LCP > thresholds.LCP) {
      warnings.push(
        `LCP가 ${thresholds.LCP}ms를 초과했습니다 (${newMetrics.LCP.toFixed(0)}ms)`
      );
    }

    if (newMetrics.FID && newMetrics.FID > thresholds.FID) {
      warnings.push(
        `FID가 ${thresholds.FID}ms를 초과했습니다 (${newMetrics.FID.toFixed(0)}ms)`
      );
    }

    if (newMetrics.CLS && newMetrics.CLS > thresholds.CLS) {
      warnings.push(
        `CLS가 ${thresholds.CLS}를 초과했습니다 (${newMetrics.CLS.toFixed(3)})`
      );
    }

    if (
      newMetrics.memoryUsage &&
      newMetrics.memoryUsage > thresholds.memoryUsage
    ) {
      warnings.push(
        `메모리 사용량이 ${thresholds.memoryUsage}MB를 초과했습니다 (${newMetrics.memoryUsage.toFixed(1)}MB)`
      );
    }

    if (warnings.length > 0) {
      warnings.forEach((warning) => {
        settingsAnalytics.error('performance', 'threshold_exceeded', warning);
      });
    }
  }, [enabled, metrics, onMetricsUpdate, thresholds]);

  // Core Web Vitals 측정 (Web Vitals API 필요)
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      return;
    }

    let lcpObserver: PerformanceObserver | null = null;
    let fidObserver: PerformanceObserver | null = null;
    let clsObserver: PerformanceObserver | null = null;

    // LCP (Largest Contentful Paint)
    if ('PerformanceObserver' in window) {
      lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];

        if (lastEntry) {
          setMetrics((prev) => ({ ...prev, LCP: lastEntry.startTime }));
        }
      });

      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (_e) {
        console.warn('LCP 측정이 지원되지 않습니다');
      }

      // FID (First Input Delay)
      fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();

        entries.forEach((entry) => {
          if (entry.entryType === 'first-input') {
            const fidEntry = entry as PerformanceEntry & {
              processingStart?: number;
            };

            if (fidEntry.processingStart) {
              const fid = fidEntry.processingStart - fidEntry.startTime;

              setMetrics((prev) => ({ ...prev, FID: fid }));
            }
          }
        });
      });

      try {
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (_e) {
        console.warn('FID 측정이 지원되지 않습니다');
      }

      // CLS (Cumulative Layout Shift)
      let clsValue = 0;

      clsObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          const clsEntry = entry as PerformanceEntry & {
            hadRecentInput?: boolean;
            value?: number;
          };

          if (!clsEntry.hadRecentInput && clsEntry.value) {
            clsValue += clsEntry.value;
          }
        }
        setMetrics((prev) => ({ ...prev, CLS: clsValue }));
      });

      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (_e) {
        console.warn('CLS 측정이 지원되지 않습니다');
      }

      observerRef.current = lcpObserver; // 하나의 옵저버만 저장 (실제로는 배열로 관리)
    }

    return () => {
      lcpObserver?.disconnect();
      fidObserver?.disconnect();
      clsObserver?.disconnect();
    };
  }, [enabled]);

  // 정기적 메트릭 수집
  useEffect(() => {
    if (!enabled) {
      return;
    }

    setIsMonitoring(true);
    collectMetrics();

    intervalRef.current = window.setInterval(collectMetrics, reportInterval);

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
      setIsMonitoring(false);
    };
  }, [enabled, reportInterval, collectMetrics]);

  // 성능 점수 계산
  const getPerformanceScore = () => {
    let score = 100;
    const { LCP, FID, CLS } = metrics;

    if (LCP) {
      if (LCP > 4000) {
        score -= 30;
      } else if (LCP > 2500) {
        score -= 15;
      }
    }

    if (FID) {
      if (FID > 300) {
        score -= 30;
      } else if (FID > 100) {
        score -= 15;
      }
    }

    if (CLS) {
      if (CLS > 0.25) {
        score -= 30;
      } else if (CLS > 0.1) {
        score -= 15;
      }
    }

    return Math.max(score, 0);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) {
      return 'text-green-600 dark:text-green-400';
    }
    if (score >= 70) {
      return 'text-yellow-600 dark:text-yellow-400';
    }

    return 'text-red-600 dark:text-red-400';
  };

  const formatMetric = (value: number | null, unit: string, decimals = 0) => {
    return value !== null ? `${value.toFixed(decimals)}${unit}` : '측정 중...';
  };

  if (!enabled || !showDebugInfo) {
    return null;
  }

  const performanceScore = getPerformanceScore();

  return (
    <motion.div
      className={clsx(
        'fixed bottom-4 right-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50',
        isMobile ? 'max-w-xs' : 'w-80',
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          성능 모니터
        </h3>
        <div className="flex items-center space-x-2">
          {isMonitoring && (
            <motion.div
              className="w-2 h-2 bg-green-500 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
          <span
            className={clsx(
              'text-lg font-bold',
              getScoreColor(performanceScore)
            )}
          >
            {performanceScore}
          </span>
        </div>
      </div>

      {/* Core Web Vitals */}
      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">LCP:</span>
          <span
            className={clsx(
              'font-medium',
              metrics.LCP && metrics.LCP > thresholds.LCP
                ? 'text-red-600'
                : 'text-green-600'
            )}
          >
            {formatMetric(metrics.LCP, 'ms')}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">FID:</span>
          <span
            className={clsx(
              'font-medium',
              metrics.FID && metrics.FID > thresholds.FID
                ? 'text-red-600'
                : 'text-green-600'
            )}
          >
            {formatMetric(metrics.FID, 'ms')}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">CLS:</span>
          <span
            className={clsx(
              'font-medium',
              metrics.CLS && metrics.CLS > thresholds.CLS
                ? 'text-red-600'
                : 'text-green-600'
            )}
          >
            {formatMetric(metrics.CLS, '', 3)}
          </span>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">메모리:</span>
            <span
              className={clsx(
                'font-medium',
                metrics.memoryUsage &&
                  metrics.memoryUsage > thresholds.memoryUsage
                  ? 'text-red-600'
                  : 'text-gray-900 dark:text-gray-100'
              )}
            >
              {formatMetric(metrics.memoryUsage, 'MB', 1)}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">리소스:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {metrics.resourceCount}
            </span>
          </div>

          {metrics.loadTime && (
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                로드 시간:
              </span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {formatMetric(metrics.loadTime, 'ms')}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/**
 * 성능 최적화 제안 컴포넌트
 */
interface PerformanceInsightsProps {
  metrics: PerformanceMetrics;
  className?: string;
}

export function PerformanceInsights({
  metrics,
  className,
}: PerformanceInsightsProps) {
  const getInsights = () => {
    const insights: {
      type: 'warning' | 'error' | 'info';
      title: string;
      message: string;
      action?: string;
    }[] = [];

    // LCP 최적화 제안
    if (metrics.LCP && metrics.LCP > 2500) {
      insights.push({
        type: metrics.LCP > 4000 ? 'error' : 'warning',
        title: 'LCP 최적화 필요',
        message: '가장 큰 콘텐츠 요소의 로딩 시간이 느립니다.',
        action:
          '이미지 최적화, 중요한 리소스 우선 로드, 서버 응답 시간 개선을 고려해보세요.',
      });
    }

    // FID 최적화 제안
    if (metrics.FID && metrics.FID > 100) {
      insights.push({
        type: metrics.FID > 300 ? 'error' : 'warning',
        title: 'FID 최적화 필요',
        message: '사용자 상호작용 응답 시간이 느립니다.',
        action:
          '메인 스레드를 차단하는 JavaScript를 줄이고 코드를 분할해보세요.',
      });
    }

    // CLS 최적화 제안
    if (metrics.CLS && metrics.CLS > 0.1) {
      insights.push({
        type: metrics.CLS > 0.25 ? 'error' : 'warning',
        title: 'CLS 최적화 필요',
        message: '레이아웃이 예상치 못하게 이동하고 있습니다.',
        action:
          '이미지와 광고 요소에 명시적 크기를 설정하고 동적 콘텐츠 삽입을 피해보세요.',
      });
    }

    // 메모리 사용량 제안
    if (metrics.memoryUsage && metrics.memoryUsage > 50) {
      insights.push({
        type: metrics.memoryUsage > 100 ? 'error' : 'warning',
        title: '메모리 사용량 최적화',
        message: 'JavaScript 힙 메모리 사용량이 높습니다.',
        action: '메모리 누수를 확인하고 불필요한 객체 참조를 정리해보세요.',
      });
    }

    // 리소스 수 제안
    if (metrics.resourceCount > 100) {
      insights.push({
        type: 'info',
        title: '리소스 최적화',
        message: `${metrics.resourceCount}개의 리소스가 로드되었습니다.`,
        action:
          '번들 분할, 리소스 합치기, 불필요한 리소스 제거를 고려해보세요.',
      });
    }

    return insights;
  };

  const insights = getInsights();

  if (insights.length === 0) {
    return (
      <motion.div
        className={clsx(
          'p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg',
          className
        )}
        {...animations.fadeIn}
      >
        <div className="flex items-center">
          <svg
            className="w-5 h-5 text-green-600 dark:text-green-400 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-sm font-medium text-green-800 dark:text-green-200">
            성능이 양호합니다
          </span>
        </div>
      </motion.div>
    );
  }

  return (
    <div className={clsx('space-y-3', className)}>
      {insights.map((insight, index) => (
        <motion.div
          key={index}
          className={clsx(
            'p-4 rounded-lg border',
            insight.type === 'error' &&
              'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
            insight.type === 'warning' &&
              'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
            insight.type === 'info' &&
              'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
          )}
          {...animations.slideUp}
          transition={{ delay: index * 0.1 }}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0 mr-3">
              {insight.type === 'error' && (
                <svg
                  className="w-5 h-5 text-red-600 dark:text-red-400"
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
              )}
              {insight.type === 'warning' && (
                <svg
                  className="w-5 h-5 text-yellow-600 dark:text-yellow-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              )}
              {insight.type === 'info' && (
                <svg
                  className="w-5 h-5 text-blue-600 dark:text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <h4
                className={clsx(
                  'text-sm font-medium mb-1',
                  insight.type === 'error' && 'text-red-800 dark:text-red-200',
                  insight.type === 'warning' &&
                    'text-yellow-800 dark:text-yellow-200',
                  insight.type === 'info' && 'text-blue-800 dark:text-blue-200'
                )}
              >
                {insight.title}
              </h4>
              <p
                className={clsx(
                  'text-sm mb-2',
                  insight.type === 'error' && 'text-red-700 dark:text-red-300',
                  insight.type === 'warning' &&
                    'text-yellow-700 dark:text-yellow-300',
                  insight.type === 'info' && 'text-blue-700 dark:text-blue-300'
                )}
              >
                {insight.message}
              </p>
              {insight.action && (
                <p
                  className={clsx(
                    'text-xs',
                    insight.type === 'error' &&
                      'text-red-600 dark:text-red-400',
                    insight.type === 'warning' &&
                      'text-yellow-600 dark:text-yellow-400',
                    insight.type === 'info' &&
                      'text-blue-600 dark:text-blue-400'
                  )}
                >
                  💡 {insight.action}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default PerformanceMonitor;

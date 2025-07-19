import React, { useState, useEffect } from 'react';
import { Activity, Zap, Database, Clock, BarChart3 } from 'lucide-react';
import { apiCache, imageCache, userCache } from '../../utils/cache';

interface PerformanceStats {
  navigation?: PerformanceNavigationTiming;
  memory?: any;
  cacheStats: {
    api: any;
    image: any;
    user: any;
  };
  bundleInfo?: {
    totalSize: number;
    chunks: number;
  };
}

const PerformanceMonitor: React.FC = () => {
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateStats = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const memory = (performance as any).memory;

      setStats({
        navigation,
        memory,
        cacheStats: {
          api: apiCache.getStats(),
          image: imageCache.getStats(),
          user: userCache.getStats(),
        },
      });
    };

    updateStats();
    const interval = setInterval(updateStats, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Only show in development mode
  if (import.meta.env.PROD) {
    return null;
  }

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
        title="성능 모니터 열기"
      >
        <Activity className="w-5 h-5" />
      </button>
    );
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (time: number) => {
    return Math.round(time) + 'ms';
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-xl border p-4 max-w-md w-80 z-50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Activity className="w-5 h-5 mr-2 text-blue-600" />
          성능 모니터
        </h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>

      {stats && (
        <div className="space-y-4 text-sm">
          {/* Navigation Timing */}
          {stats.navigation && (
            <div>
              <h4 className="font-medium text-gray-700 flex items-center mb-2">
                <Clock className="w-4 h-4 mr-1" />
                페이지 로딩
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">DOM 로딩:</span>
                  <span className="ml-1 font-mono">
                    {formatTime(stats.navigation.domContentLoadedEventEnd - stats.navigation.fetchStart)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">페이지 완료:</span>
                  <span className="ml-1 font-mono">
                    {formatTime(stats.navigation.loadEventEnd - stats.navigation.fetchStart)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">첫 바이트:</span>
                  <span className="ml-1 font-mono">
                    {formatTime(stats.navigation.responseStart - stats.navigation.fetchStart)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">DNS 조회:</span>
                  <span className="ml-1 font-mono">
                    {formatTime(stats.navigation.domainLookupEnd - stats.navigation.domainLookupStart)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Memory Usage */}
          {stats.memory && (
            <div>
              <h4 className="font-medium text-gray-700 flex items-center mb-2">
                <BarChart3 className="w-4 h-4 mr-1" />
                메모리 사용량
              </h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">사용 중:</span>
                  <span className="font-mono">{formatBytes(stats.memory.usedJSHeapSize)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">총 크기:</span>
                  <span className="font-mono">{formatBytes(stats.memory.totalJSHeapSize)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">제한:</span>
                  <span className="font-mono">{formatBytes(stats.memory.jsHeapSizeLimit)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Cache Stats */}
          <div>
            <h4 className="font-medium text-gray-700 flex items-center mb-2">
              <Database className="w-4 h-4 mr-1" />
              캐시 현황
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">API 캐시:</span>
                <span className="font-mono">
                  {stats.cacheStats.api.size}/{stats.cacheStats.api.maxSize}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">이미지 캐시:</span>
                <span className="font-mono">
                  {stats.cacheStats.image.size}/{stats.cacheStats.image.maxSize}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">사용자 캐시:</span>
                <span className="font-mono">
                  {stats.cacheStats.user.size}/{stats.cacheStats.user.maxSize}
                </span>
              </div>
            </div>
          </div>

          {/* Cache Controls */}
          <div>
            <h4 className="font-medium text-gray-700 flex items-center mb-2">
              <Zap className="w-4 h-4 mr-1" />
              캐시 제어
            </h4>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  apiCache.clear();
                  imageCache.clear();
                  userCache.clear();
                }}
                className="flex-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
              >
                전체 캐시 삭제
              </button>
              <button
                onClick={() => {
                  console.log('API Cache:', apiCache.getStats());
                  console.log('Image Cache:', imageCache.getStats());
                  console.log('User Cache:', userCache.getStats());
                }}
                className="flex-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
              >
                콘솔에 로그
              </button>
            </div>
          </div>

          {/* Performance Tips */}
          <div className="bg-yellow-50 p-2 rounded text-xs">
            <p className="text-yellow-800 font-medium mb-1">💡 성능 팁</p>
            <ul className="text-yellow-700 space-y-1">
              <li>• 이미지는 lazy loading으로 최적화됩니다</li>
              <li>• API 응답은 자동으로 캐시됩니다</li>
              <li>• 코드 스플리팅으로 초기 로딩을 최적화했습니다</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceMonitor;
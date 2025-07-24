'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { likeBatchManager } from '@/lib/like-batch-manager'
import { cn } from '@/lib/utils'

interface PerformanceMetric {
  id: string
  duration: number
  startTime: number
  type: 'animation' | 'api' | 'batch' | 'total'
  success: boolean
  errorMessage?: string
}

interface LikePerformanceMonitorProps {
  /**
   * 모니터링 활성화 여부
   */
  enabled?: boolean
  /**
   * 실시간 업데이트 간격 (ms)
   */
  updateInterval?: number
  /**
   * 최대 메트릭 보관 수
   */
  maxMetrics?: number
  /**
   * 성능 임계값들
   */
  thresholds?: {
    animation: number  // 애니메이션 임계값 (ms)
    api: number        // API 응답 임계값 (ms)
    batch: number      // 배치 처리 임계값 (ms)
  }
  className?: string
}

/**
 * 좋아요 시스템 성능 모니터링 컴포넌트
 * 개발 및 프로덕션 환경에서 성능 메트릭을 실시간으로 모니터링
 * 
 * Features:
 * - 실시간 성능 메트릭 수집 및 표시
 * - 배치 처리 큐 상태 모니터링
 * - 성능 임계값 기반 경고
 * - 상세 분석을 위한 메트릭 내보내기
 * - 시각적 성능 대시보드
 */
export function LikePerformanceMonitor({
  enabled = process.env.NODE_ENV === 'development',
  updateInterval = 1000,
  maxMetrics = 100,
  thresholds = {
    animation: 16, // 60fps
    api: 500,      // 0.5초
    batch: 200     // 0.2초
  },
  className
}: LikePerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([])
  const [queueStatus, setQueueStatus] = useState({
    queueSize: 0,
    retryQueueSize: 0,
    isProcessing: false,
    isOnline: true
  })
  const [isVisible, setIsVisible] = useState(false)

  // 성능 메트릭 수집
  const collectMetrics = useCallback(() => {
    if (!enabled || typeof window === 'undefined') return

    try {
      // Performance API에서 메트릭 수집
      const performanceEntries = performance.getEntriesByType('measure')
        .filter(entry => entry.name.includes('like-'))
        .map(entry => ({
          id: `${entry.name}-${entry.startTime}`,
          duration: entry.duration,
          startTime: entry.startTime,
          type: entry.name.includes('animation') ? 'animation' as const
              : entry.name.includes('batch') ? 'batch' as const
              : entry.name.includes('api') ? 'api' as const
              : 'total' as const,
          success: true
        }))

      // 새로운 메트릭만 추가
      setMetrics(prev => {
        const existingIds = new Set(prev.map(m => m.id))
        const newMetrics = performanceEntries.filter(m => !existingIds.has(m.id))
        
        const combined = [...prev, ...newMetrics]
        
        // 최대 개수 제한
        return combined.slice(-maxMetrics)
      })

      // 배치 매니저 상태 업데이트
      setQueueStatus(likeBatchManager.getQueueStatus())

    } catch (error) {
      console.warn('Failed to collect performance metrics:', error)
    }
  }, [enabled, maxMetrics])

  // 주기적 업데이트
  useEffect(() => {
    if (!enabled) return

    const interval = setInterval(collectMetrics, updateInterval)
    return () => clearInterval(interval)
  }, [enabled, updateInterval, collectMetrics])

  // 계산된 통계
  const stats = useMemo(() => {
    const recent = metrics.slice(-20) // 최근 20개
    
    const avgDuration = recent.length > 0 
      ? recent.reduce((sum, m) => sum + m.duration, 0) / recent.length 
      : 0

    const slowOperations = recent.filter(m => {
      const threshold = thresholds[m.type] || 500
      return m.duration > threshold
    }).length

    const successRate = recent.length > 0
      ? (recent.filter(m => m.success).length / recent.length) * 100
      : 100

    const byType = recent.reduce((acc, m) => {
      acc[m.type] = (acc[m.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      avgDuration,
      slowOperations,
      successRate,
      totalOperations: recent.length,
      byType
    }
  }, [metrics, thresholds])

  // 성능 상태 평가
  const performanceStatus = useMemo(() => {
    if (stats.avgDuration > 1000) return 'critical'
    if (stats.avgDuration > 500 || stats.slowOperations > 3) return 'warning'
    if (queueStatus.queueSize > 10) return 'warning'
    return 'good'
  }, [stats, queueStatus])

  // 메트릭 초기화
  const clearMetrics = useCallback(() => {
    setMetrics([])
    if (typeof window !== 'undefined') {
      performance.clearMeasures()
      performance.clearMarks()
    }
  }, [])

  // 메트릭 내보내기
  const exportMetrics = useCallback(() => {
    const exportData = {
      timestamp: new Date().toISOString(),
      metrics,
      stats,
      queueStatus,
      thresholds
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `like-performance-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [metrics, stats, queueStatus, thresholds])

  if (!enabled) return null

  return (
    <>
      {/* 플로팅 모니터 토글 버튼 */}
      <Button
        onClick={() => setIsVisible(!isVisible)}
        className={cn(
          'fixed bottom-4 right-4 z-50 w-12 h-12 rounded-full shadow-lg',
          performanceStatus === 'critical' && 'bg-red-500 hover:bg-red-600 animate-pulse',
          performanceStatus === 'warning' && 'bg-yellow-500 hover:bg-yellow-600',
          performanceStatus === 'good' && 'bg-green-500 hover:bg-green-600'
        )}
        size="sm"
        aria-label="성능 모니터 토글"
      >
        📊
      </Button>

      {/* 모니터 패널 */}
      {isVisible && (
        <Card className={cn(
          'fixed bottom-20 right-4 z-40 w-80 max-h-96 overflow-y-auto shadow-xl',
          'bg-white/95 backdrop-blur-sm border-2',
          performanceStatus === 'critical' && 'border-red-300',
          performanceStatus === 'warning' && 'border-yellow-300',
          performanceStatus === 'good' && 'border-green-300',
          className
        )}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              좋아요 성능 모니터
              <Badge variant={
                performanceStatus === 'critical' ? 'destructive' :
                performanceStatus === 'warning' ? 'secondary' : 'default'
              }>
                {performanceStatus === 'critical' ? '위험' :
                 performanceStatus === 'warning' ? '주의' : '정상'}
              </Badge>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* 실시간 통계 */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="space-y-1">
                <div className="text-muted-foreground">평균 응답시간</div>
                <div className="font-mono font-bold">
                  {stats.avgDuration.toFixed(1)}ms
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-muted-foreground">성공률</div>
                <div className="font-mono font-bold">
                  {stats.successRate.toFixed(1)}%
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-muted-foreground">느린 작업</div>
                <div className="font-mono font-bold">
                  {stats.slowOperations}개
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-muted-foreground">총 작업</div>
                <div className="font-mono font-bold">
                  {stats.totalOperations}개
                </div>
              </div>
            </div>

            {/* 배치 큐 상태 */}
            <div className="border-t pt-3">
              <div className="text-xs text-muted-foreground mb-2">배치 큐 상태</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  대기 중: <span className="font-mono">{queueStatus.queueSize}</span>
                </div>
                <div>
                  재시도: <span className="font-mono">{queueStatus.retryQueueSize}</span>
                </div>
                <div className="col-span-2 flex items-center space-x-2">
                  <Badge variant={queueStatus.isProcessing ? 'default' : 'secondary'}>
                    {queueStatus.isProcessing ? '처리중' : '대기중'}
                  </Badge>
                  <Badge variant={queueStatus.isOnline ? 'default' : 'destructive'}>
                    {queueStatus.isOnline ? '온라인' : '오프라인'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* 최근 메트릭 */}
            <div className="border-t pt-3">
              <div className="text-xs text-muted-foreground mb-2">최근 작업</div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {metrics.slice(-5).reverse().map(metric => (
                  <div key={metric.id} className="flex justify-between items-center text-xs">
                    <span className="truncate">
                      {metric.type}
                    </span>
                    <span className={cn(
                      'font-mono',
                      metric.duration > (thresholds[metric.type] || 500) 
                        ? 'text-red-600' : 'text-green-600'
                    )}>
                      {metric.duration.toFixed(1)}ms
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 제어 버튼 */}
            <div className="border-t pt-3 flex space-x-2">
              <Button
                onClick={clearMetrics}
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
              >
                초기화
              </Button>
              <Button
                onClick={exportMetrics}
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
              >
                내보내기
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}

/**
 * 성능 모니터링을 위한 유틸리티 훅
 */
export function useLikePerformanceMonitoring() {
  const recordMetric = useCallback((type: string, duration: number, success = true, error?: string) => {
    if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') return

    const metricName = `like-${type}-${Date.now()}`
    
    try {
      performance.mark(`${metricName}-start`)
      performance.mark(`${metricName}-end`)
      performance.measure(metricName, `${metricName}-start`, `${metricName}-end`)
    } catch (error) {
      console.warn('Failed to record performance metric:', error)
    }
  }, [])

  const startTiming = useCallback((type: string) => {
    if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') return null

    const id = `like-${type}-${Date.now()}`
    const startTime = performance.now()
    
    return {
      id,
      end: (success = true, error?: string) => {
        const duration = performance.now() - startTime
        recordMetric(type, duration, success, error)
        return duration
      }
    }
  }, [recordMetric])

  return {
    recordMetric,
    startTiming
  }
}
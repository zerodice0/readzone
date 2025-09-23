import { useCallback, useEffect, useRef } from 'react'

interface PerformanceMetrics {
  lcp?: number // Largest Contentful Paint
  fid?: number // First Input Delay
  cls?: number // Cumulative Layout Shift
  fcp?: number // First Contentful Paint
  ttfb?: number // Time to First Byte
}

interface PerformanceMonitorOptions {
  onMetric?: (name: string, value: number, metrics: PerformanceMetrics) => void
  enableLogs?: boolean
  enableAnalytics?: boolean
}

export function usePerformanceMonitor({
  onMetric,
  enableLogs = import.meta.env.MODE === 'development',
  enableAnalytics = import.meta.env.MODE === 'production'
}: PerformanceMonitorOptions = {}) {
  const metricsRef = useRef<PerformanceMetrics>({})
  const observersRef = useRef<PerformanceObserver[]>([])

  const reportMetric = useCallback((name: string, value: number) => {
    metricsRef.current = { ...metricsRef.current, [name.toLowerCase()]: value }

    if (enableLogs) {
      console.warn(`[Performance] ${name}: ${value.toFixed(2)}ms`)
    }

    if (enableAnalytics && window.gtag) {
      window.gtag('event', name, {
        custom_parameter_1: value,
        event_category: 'performance'
      })
    }

    onMetric?.(name, value, metricsRef.current)
  }, [onMetric, enableLogs, enableAnalytics])

  useEffect(() => {
    // Cleanup function
    const cleanup = () => {
      observersRef.current.forEach(observer => observer.disconnect())
      observersRef.current = []
    }

    try {
      // Largest Contentful Paint (LCP)
      if ('PerformanceObserver' in window) {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1] as PerformanceEntry & {
            startTime: number
          }

          if (lastEntry) {
            reportMetric('LCP', lastEntry.startTime)
          }
        })

        try {
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
          observersRef.current.push(lcpObserver)
        } catch (_e) {
          // Ignore errors for unsupported browsers
        }

        // First Input Delay (FID)
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()

          entries.forEach((entry) => {
            const fidEntry = entry as PerformanceEntry & {
              processingStart: number
              startTime: number
            }

            if (fidEntry.processingStart && fidEntry.startTime) {
              const fid = fidEntry.processingStart - fidEntry.startTime

              reportMetric('FID', fid)
            }
          })
        })

        try {
          fidObserver.observe({ entryTypes: ['first-input'] })
          observersRef.current.push(fidObserver)
        } catch (_e) {
          // Ignore errors for unsupported browsers
        }

        // Cumulative Layout Shift (CLS)
        let clsValue = 0
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()

          entries.forEach((entry) => {
            const clsEntry = entry as PerformanceEntry & { value: number; hadRecentInput?: boolean }

            if (!clsEntry.hadRecentInput) {
              clsValue += clsEntry.value
            }
          })
          reportMetric('CLS', clsValue)
        })

        try {
          clsObserver.observe({ entryTypes: ['layout-shift'] })
          observersRef.current.push(clsObserver)
        } catch (_e) {
          // Ignore errors for unsupported browsers
        }

        // Navigation timing
        const navObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()

          entries.forEach((entry) => {
            const navEntry = entry as PerformanceNavigationTiming

            // First Contentful Paint
            if (navEntry.loadEventEnd && navEntry.fetchStart) {
              const ttfb = navEntry.responseStart - navEntry.fetchStart

              reportMetric('TTFB', ttfb)
            }
          })
        })

        try {
          navObserver.observe({ entryTypes: ['navigation'] })
          observersRef.current.push(navObserver)
        } catch (_e) {
          // Ignore errors for unsupported browsers
        }

        // Paint timing
        const paintObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()

          entries.forEach((entry) => {
            if (entry.name === 'first-contentful-paint') {
              reportMetric('FCP', entry.startTime)
            }
          })
        })

        try {
          paintObserver.observe({ entryTypes: ['paint'] })
          observersRef.current.push(paintObserver)
        } catch (_e) {
          // Ignore errors for unsupported browsers
        }
      }

      // Memory usage monitoring
      if ('memory' in performance) {
        const memoryCheck = () => {
          const memory = (performance as Performance & { memory?: { usedJSHeapSize: number; totalJSHeapSize: number } }).memory

          if (memory) {
            const memoryUsage = memory.usedJSHeapSize / memory.totalJSHeapSize

            if (memoryUsage > 0.8) {
              if (enableLogs) {
                console.warn(`[Performance] High memory usage: ${(memoryUsage * 100).toFixed(2)}%`)
              }
            }
          }
        }

        const memoryInterval = setInterval(memoryCheck, 30000) // Check every 30 seconds

        return () => {
          cleanup()
          clearInterval(memoryInterval)
        }
      }
    } catch (error) {
      if (enableLogs) {
        console.warn('[Performance] Failed to initialize monitoring:', error)
      }
    }

    return cleanup
  }, [reportMetric, enableLogs])

  // Manual performance measurement
  const measurePerformance = useCallback((name: string, fn: () => void | Promise<void>) => {
    const start = performance.now()

    const measure = () => {
      const duration = performance.now() - start

      reportMetric(name, duration)
    }

    try {
      const result = fn()

      if (result instanceof Promise) {
        return result.finally(measure)
      } else {
        measure()

        return result
      }
    } catch (error) {
      measure()
      throw error
    }
  }, [reportMetric])

  // Get current metrics
  const getMetrics = useCallback(() => {
    return { ...metricsRef.current }
  }, [])

  return {
    measurePerformance,
    getMetrics,
    metrics: metricsRef.current
  }
}

// Hook for component-level performance monitoring
export function useComponentPerformance(componentName: string) {
  const { measurePerformance } = usePerformanceMonitor()
  const renderCount = useRef(0)

  useEffect(() => {
    renderCount.current += 1

    // Report mount time on first render
    if (renderCount.current === 1) {
      measurePerformance(`${componentName}_mount`, () => {
        // Mount measurement placeholder
      })
    }

    return () => {
      // Report unmount time
      measurePerformance(`${componentName}_unmount`, () => {
        // Unmount measurement placeholder
      })
    }
  })

  useEffect(() => {
    // Report render count periodically
    if (renderCount.current > 0 && renderCount.current % 10 === 0) {
      console.warn(`[Performance] ${componentName} has rendered ${renderCount.current} times`)
    }
  })

  return {
    measurePerformance,
    renderCount: renderCount.current
  }
}
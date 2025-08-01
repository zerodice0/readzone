/**
 * Draft System Performance Monitor
 * Tracks PRD compliance and performance metrics
 */

import { connectionMonitor } from '@/lib/db/connection-pool'
import { bookSyncCache } from '@/lib/cache/book-sync-cache'
import { ProcessingMetrics } from '@/lib/performance/content-processor'

interface PerformanceMetric {
  operation: string
  duration: number
  timestamp: number
  userId?: string
  success: boolean
  metadata?: Record<string, any>
}

interface PerformanceTargets {
  draftSave: number    // <500ms
  draftList: number    // <1s 
  draftRestore: number // <2s
  bookSync: number     // <1s
}

interface SystemHealth {
  healthy: boolean
  score: number // 0-100
  issues: string[]
  recommendations: string[]
}

/**
 * Performance monitoring system for draft APIs
 * Tracks compliance with PRD performance requirements
 */
export class DraftPerformanceMonitor {
  private static instance: DraftPerformanceMonitor
  private metrics: PerformanceMetric[] = []
  private readonly MAX_METRICS = 10000 // Keep last 10k metrics
  
  private readonly TARGETS: PerformanceTargets = {
    draftSave: 500,    // PRD: <500ms
    draftList: 1000,   // PRD: <1s
    draftRestore: 2000, // PRD: <2s
    bookSync: 1000     // PRD: <1s
  }

  // Alert thresholds (for future use)
  // private readonly ALERT_THRESHOLDS = {
  //   slowOperationRate: 0.1,    // 10% slow operations
  //   errorRate: 0.01,           // 1% error rate
  //   avgResponseTime: 0.8,      // 80% of target
  // }

  private constructor() {
    this.startPerformanceCollection()
  }

  static getInstance(): DraftPerformanceMonitor {
    if (!this.instance) {
      this.instance = new DraftPerformanceMonitor()
    }
    return this.instance
  }

  /**
   * Record a performance metric
   */
  recordMetric(
    operation: string,
    duration: number,
    success: boolean = true,
    metadata?: Record<string, any>
  ): void {
    const metric: PerformanceMetric = {
      operation,
      duration,
      timestamp: Date.now(),
      success,
      metadata,
    }

    // Add to metrics array
    this.metrics.push(metric)

    // Trim old metrics to prevent memory bloat
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS)
    }

    // Check for performance violations
    this.checkPerformanceViolation(metric)

    // Log significant performance events
    if (duration > this.getTargetTime(operation)) {
      console.warn(`🐌 Slow operation: ${operation} took ${duration}ms (target: ${this.getTargetTime(operation)}ms)`)
    }
  }

  /**
   * Measure and record an async operation
   */
  async measureOperation<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const startTime = performance.now()
    let success = true
    
    try {
      const result = await fn()
      return result
    } catch (error) {
      success = false
      throw error
    } finally {
      const duration = performance.now() - startTime
      this.recordMetric(operation, duration, success, metadata)
    }
  }

  /**
   * Get target time for operation
   */
  private getTargetTime(operation: string): number {
    if (operation.includes('save') || operation.includes('POST')) return this.TARGETS.draftSave
    if (operation.includes('list') || operation.includes('GET') && !operation.includes('[id]')) return this.TARGETS.draftList
    if (operation.includes('restore') || operation.includes('GET') && operation.includes('[id]')) return this.TARGETS.draftRestore
    if (operation.includes('sync')) return this.TARGETS.bookSync
    return 1000 // Default 1s
  }

  /**
   * Check for performance violations
   */
  private checkPerformanceViolation(metric: PerformanceMetric): void {
    const target = this.getTargetTime(metric.operation)
    
    if (metric.duration > target * 2) {
      console.error(`🚨 Critical performance violation: ${metric.operation} took ${metric.duration}ms (target: ${target}ms)`)
    } else if (metric.duration > target * 1.5) {
      console.warn(`⚠️ Performance warning: ${metric.operation} took ${metric.duration}ms (target: ${target}ms)`)
    }
  }

  /**
   * Get performance statistics for a specific operation
   */
  getOperationStats(operation: string, timeWindow: number = 3600000): {
    totalRequests: number
    averageTime: number
    p50: number
    p95: number
    p99: number
    errorRate: number
    targetComplianceRate: number
  } {
    const cutoff = Date.now() - timeWindow
    const operationMetrics = this.metrics.filter(
      m => m.operation === operation && m.timestamp > cutoff
    )

    if (operationMetrics.length === 0) {
      return {
        totalRequests: 0,
        averageTime: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        errorRate: 0,
        targetComplianceRate: 0,
      }
    }

    const durations = operationMetrics.map(m => m.duration).sort((a, b) => a - b)
    const target = this.getTargetTime(operation)
    const withinTarget = operationMetrics.filter(m => m.duration <= target).length
    const errors = operationMetrics.filter(m => !m.success).length

    return {
      totalRequests: operationMetrics.length,
      averageTime: durations.reduce((a, b) => a + b, 0) / durations.length,
      p50: durations[Math.floor(durations.length * 0.5)] || 0,
      p95: durations[Math.floor(durations.length * 0.95)] || 0,
      p99: durations[Math.floor(durations.length * 0.99)] || 0,
      errorRate: (errors / operationMetrics.length) * 100,
      targetComplianceRate: (withinTarget / operationMetrics.length) * 100,
    }
  }

  /**
   * Get comprehensive system health assessment
   */
  async getSystemHealth(): Promise<SystemHealth> {
    const issues: string[] = []
    const recommendations: string[] = []
    let healthScore = 100

    // Check API performance
    const draftSaveStats = this.getOperationStats('draft_save')
    // const draftListStats = this.getOperationStats('draft_list')
    const draftRestoreStats = this.getOperationStats('draft_restore')

    // Check draft save performance
    if (draftSaveStats.targetComplianceRate < 95) {
      issues.push(`Draft save compliance: ${draftSaveStats.targetComplianceRate.toFixed(1)}% (<500ms)`)
      recommendations.push('Review async audit logging and database connection pooling')
      healthScore -= 20
    }

    // Check draft restore performance  
    if (draftRestoreStats.targetComplianceRate < 90) {
      issues.push(`Draft restore compliance: ${draftRestoreStats.targetComplianceRate.toFixed(1)}% (<2s)`)
      recommendations.push('Optimize book sync caching and content processing')
      healthScore -= 15
    }

    // Check database health
    const dbHealth = await this.checkDatabaseHealth()
    if (!dbHealth.healthy) {
      issues.push('Database performance issues detected')
      recommendations.push('Review connection pool utilization and query performance')
      healthScore -= 25
    }

    // Check cache performance
    const cacheHealth = bookSyncCache.getCacheHealth()
    if (!cacheHealth.healthy) {
      issues.push(...cacheHealth.issues)
      recommendations.push(...cacheHealth.recommendations)
      healthScore -= 10
    }

    // Check memory usage
    const memoryUsage = process.memoryUsage()
    const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024
    if (heapUsedMB > 512) { // 512MB threshold
      issues.push(`High memory usage: ${heapUsedMB.toFixed(1)}MB`)
      recommendations.push('Review content processing caches and optimize memory usage')
      healthScore -= 10
    }

    return {
      healthy: issues.length === 0,
      score: Math.max(0, healthScore),
      issues,
      recommendations,
    }
  }

  /**
   * Check database health
   */
  private async checkDatabaseHealth(): Promise<{ healthy: boolean; metrics: any }> {
    try {
      const { checkDbHealth } = await import('@/lib/db')
      const dbHealth = await checkDbHealth()
      const poolMetrics = connectionMonitor.getMetrics()
      
      const healthy = dbHealth.healthy && 
        dbHealth.responseTime < 100 && 
        !connectionMonitor.isPoolUnderStress()

      return {
        healthy,
        metrics: {
          ...dbHealth,
          poolMetrics,
        }
      }
    } catch (error) {
      console.error('Database health check failed:', error)
      return { healthy: false, metrics: {} }
    }
  }

  /**
   * Get performance dashboard data
   */
  async getPerformanceDashboard() {
    const systemHealth = await this.getSystemHealth()
    
    return {
      timestamp: new Date().toISOString(),
      systemHealth,
      
      // API Performance
      apiPerformance: {
        draftSave: this.getOperationStats('draft_save'),
        draftList: this.getOperationStats('draft_list'), 
        draftRestore: this.getOperationStats('draft_restore'),
        bookSync: this.getOperationStats('book_sync'),
      },
      
      // System Resources
      systemResources: {
        memory: process.memoryUsage(),
        database: connectionMonitor.getMetrics(),
        cache: bookSyncCache.getMetrics(),
        contentProcessing: ProcessingMetrics.getMetrics(),
      },
      
      // PRD Compliance
      prdCompliance: {
        targets: this.TARGETS,
        compliance: {
          draftSave: this.getOperationStats('draft_save').targetComplianceRate,
          draftList: this.getOperationStats('draft_list').targetComplianceRate,
          draftRestore: this.getOperationStats('draft_restore').targetComplianceRate,
          bookSync: this.getOperationStats('book_sync').targetComplianceRate,
        }
      },
      
      // Recent Performance Trends
      recentTrends: this.getRecentTrends(),
    }
  }

  /**
   * Get recent performance trends
   */
  private getRecentTrends() {
    const last24h = Date.now() - 24 * 60 * 60 * 1000
    const recentMetrics = this.metrics.filter(m => m.timestamp > last24h)
    
    // Group by hour
    const hourlyStats = new Map<number, { count: number; avgDuration: number }>()
    
    recentMetrics.forEach(metric => {
      const hour = Math.floor(metric.timestamp / (60 * 60 * 1000))
      const existing = hourlyStats.get(hour) || { count: 0, avgDuration: 0 }
      
      hourlyStats.set(hour, {
        count: existing.count + 1,
        avgDuration: (existing.avgDuration * existing.count + metric.duration) / (existing.count + 1)
      })
    })
    
    return Array.from(hourlyStats.entries())
      .sort(([a], [b]) => a - b)
      .slice(-24) // Last 24 hours
      .map(([hour, stats]) => ({
        hour: new Date(hour * 60 * 60 * 1000).toISOString(),
        ...stats
      }))
  }

  /**
   * Start background performance collection
   */
  private startPerformanceCollection(): void {
    // Collect system metrics every minute
    setInterval(() => {
      const memUsage = process.memoryUsage()
      this.recordMetric('system_memory', memUsage.heapUsed / 1024 / 1024, true, memUsage)
    }, 60000)

    console.log('📊 Draft performance monitoring started')
  }

  /**
   * Clear all metrics (for testing)
   */
  clearMetrics(): void {
    this.metrics = []
  }

  /**
   * Get raw metrics (for testing)
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }
}

// Export singleton
export const performanceMonitor = DraftPerformanceMonitor.getInstance()

// Middleware helper for Next.js API routes
export function withPerformanceMonitoring<T extends (...args: any[]) => Promise<any>>(
  operation: string,
  handler: T
): T {
  return (async (...args: any[]) => {
    return performanceMonitor.measureOperation(operation, () => handler(...args))
  }) as T
}
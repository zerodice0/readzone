/**
 * API 사용량 로깅 시스템
 * - 엔드포인트별 사용량 추적
 * - 에러율 모니터링
 * - 일일/주간/월간 통계
 * - 사용 패턴 분석
 */

import { db } from '@/lib/db'

// 사용량 로그 데이터
interface UsageLogData {
  endpoint: string
  method: string
  success: boolean
  responseTime?: number
  errorType?: string
  userAgent?: string
  ip?: string
}

// 사용량 통계
interface UsageStats {
  date: string
  endpoint: string
  method: string
  totalRequests: number
  successCount: number
  errorCount: number
  averageResponseTime: number
  errorRate: number
}

// 트렌드 데이터
interface UsageTrend {
  period: 'daily' | 'weekly' | 'monthly'
  data: Array<{
    date: string
    requests: number
    errors: number
    errorRate: number
  }>
}

/**
 * API 사용량 로거
 */
export class UsageLogger {
  private logQueue: UsageLogData[] = []
  private flushInterval: NodeJS.Timeout | null = null
  private readonly BATCH_SIZE = 50
  private readonly FLUSH_INTERVAL = 60000 // 1분

  constructor() {
    // 주기적으로 큐 비우기
    this.flushInterval = setInterval(() => {
      this.flush()
    }, this.FLUSH_INTERVAL)

    // 프로세스 종료 시 남은 로그 저장
    process.on('beforeExit', () => {
      this.flush()
    })
  }

  /**
   * API 호출 로그 기록
   */
  async log(data: UsageLogData): Promise<void> {
    this.logQueue.push(data)

    // 큐가 가득 차면 즉시 플러시
    if (this.logQueue.length >= this.BATCH_SIZE) {
      await this.flush()
    }
  }

  /**
   * 큐에 있는 로그들을 DB에 저장
   */
  private async flush(): Promise<void> {
    if (this.logQueue.length === 0) return

    const logsToProcess = [...this.logQueue]
    this.logQueue = []

    try {
      // 날짜별, 엔드포인트별로 그룹화
      const groupedLogs = this.groupLogsByDateAndEndpoint(logsToProcess)

      // 각 그룹별로 통계 업데이트
      for (const group of groupedLogs) {
        await this.updateUsageStats(group)
      }

    } catch (error) {
      console.error('Usage log flush error:', error)
      // 실패한 로그는 다시 큐에 추가 (메모리 누수 방지를 위해 일부만)
      this.logQueue.unshift(...logsToProcess.slice(0, 10))
    }
  }

  /**
   * 로그를 날짜와 엔드포인트별로 그룹화
   */
  private groupLogsByDateAndEndpoint(logs: UsageLogData[]): Array<{
    date: string
    endpoint: string
    method: string
    requests: UsageLogData[]
  }> {
    const groups = new Map<string, UsageLogData[]>()

    logs.forEach(log => {
      const today = new Date().toISOString().split('T')[0]
      const key = `${today}:${log.endpoint}:${log.method}`
      
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push(log)
    })

    return Array.from(groups.entries()).map(([key, requests]) => {
      const [date, endpoint, method] = key.split(':')
      return { date, endpoint, method, requests }
    })
  }

  /**
   * 사용량 통계 업데이트
   */
  private async updateUsageStats(group: {
    date: string
    endpoint: string
    method: string
    requests: UsageLogData[]
  }): Promise<void> {
    const { date, endpoint, method, requests } = group
    
    const successCount = requests.filter(r => r.success).length
    const errorCount = requests.length - successCount
    const responseTimes = requests
      .filter(r => r.responseTime !== undefined)
      .map(r => r.responseTime!)

    const averageResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 0

    try {
      await db.apiUsageLog.upsert({
        where: {
          date_endpoint: {
            date,
            endpoint: `${method} ${endpoint}`
          }
        },
        update: {
          searchCount: { increment: successCount },
          errorCount: { increment: errorCount },
          updatedAt: new Date()
        },
        create: {
          date,
          endpoint: `${method} ${endpoint}`,
          method,
          searchCount: successCount,
          errorCount
        }
      })
    } catch (error) {
      console.error('Usage stats update error:', error)
    }
  }

  /**
   * 일일 사용량 통계 조회
   */
  async getDailyStats(date?: string): Promise<UsageStats[]> {
    const targetDate = date || new Date().toISOString().split('T')[0]

    try {
      const logs = await db.apiUsageLog.findMany({
        where: { date: targetDate },
        orderBy: { searchCount: 'desc' }
      })

      return logs.map(log => ({
        date: log.date,
        endpoint: log.endpoint,
        method: log.method,
        totalRequests: log.searchCount + log.errorCount,
        successCount: log.searchCount,
        errorCount: log.errorCount,
        averageResponseTime: 0, // TODO: 응답 시간 추적 구현
        errorRate: log.searchCount + log.errorCount > 0 
          ? (log.errorCount / (log.searchCount + log.errorCount)) * 100 
          : 0
      }))
    } catch (error) {
      console.error('Daily stats query error:', error)
      return []
    }
  }

  /**
   * 기간별 트렌드 데이터 조회
   */
  async getTrend(period: 'daily' | 'weekly' | 'monthly', days: number = 7): Promise<UsageTrend> {
    try {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(endDate.getDate() - days)

      const logs = await db.apiUsageLog.findMany({
        where: {
          date: {
            gte: startDate.toISOString().split('T')[0],
            lte: endDate.toISOString().split('T')[0]
          }
        },
        orderBy: { date: 'asc' }
      })

      // 날짜별로 그룹화
      const groupedByDate = logs.reduce((acc, log) => {
        if (!acc[log.date]) {
          acc[log.date] = { requests: 0, errors: 0 }
        }
        acc[log.date].requests += log.searchCount
        acc[log.date].errors += log.errorCount
        return acc
      }, {} as Record<string, { requests: number; errors: number }>)

      const data = Object.entries(groupedByDate).map(([date, stats]) => ({
        date,
        requests: stats.requests,
        errors: stats.errors,
        errorRate: stats.requests > 0 ? (stats.errors / (stats.requests + stats.errors)) * 100 : 0
      }))

      return { period, data }
    } catch (error) {
      console.error('Trend query error:', error)
      return { period, data: [] }
    }
  }

  /**
   * 인기 엔드포인트 조회
   */
  async getPopularEndpoints(days: number = 7, limit: number = 10): Promise<Array<{
    endpoint: string
    method: string
    totalRequests: number
    errorRate: number
  }>> {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const logs = await db.apiUsageLog.findMany({
        where: {
          date: {
            gte: startDate.toISOString().split('T')[0]
          }
        }
      })

      // 엔드포인트별로 집계
      const endpointStats = logs.reduce((acc, log) => {
        const key = `${log.method}:${log.endpoint}`
        if (!acc[key]) {
          acc[key] = {
            endpoint: log.endpoint,
            method: log.method,
            totalRequests: 0,
            totalErrors: 0
          }
        }
        acc[key].totalRequests += log.searchCount
        acc[key].totalErrors += log.errorCount
        return acc
      }, {} as Record<string, any>)

      return Object.values(endpointStats)
        .map((stats: any) => ({
          endpoint: stats.endpoint,
          method: stats.method,
          totalRequests: stats.totalRequests,
          errorRate: stats.totalRequests > 0 
            ? (stats.totalErrors / (stats.totalRequests + stats.totalErrors)) * 100 
            : 0
        }))
        .sort((a, b) => b.totalRequests - a.totalRequests)
        .slice(0, limit)
    } catch (error) {
      console.error('Popular endpoints query error:', error)
      return []
    }
  }

  /**
   * 에러 패턴 분석
   */
  async getErrorPatterns(days: number = 7): Promise<Array<{
    endpoint: string
    method: string
    errorCount: number
    errorRate: number
    totalRequests: number
  }>> {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const logs = await db.apiUsageLog.findMany({
        where: {
          date: {
            gte: startDate.toISOString().split('T')[0]
          },
          errorCount: {
            gt: 0
          }
        },
        orderBy: { errorCount: 'desc' }
      })

      return logs.map(log => ({
        endpoint: log.endpoint,
        method: log.method,
        errorCount: log.errorCount,
        totalRequests: log.searchCount + log.errorCount,
        errorRate: (log.errorCount / (log.searchCount + log.errorCount)) * 100
      }))
    } catch (error) {
      console.error('Error patterns query error:', error)
      return []
    }
  }

  /**
   * 정리 (오래된 로그 삭제)
   */
  async cleanup(retentionDays: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

      const result = await db.apiUsageLog.deleteMany({
        where: {
          date: {
            lt: cutoffDate.toISOString().split('T')[0]
          }
        }
      })

      return result.count
    } catch (error) {
      console.error('Usage log cleanup error:', error)
      return 0
    }
  }

  /**
   * 리소스 정리
   */
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
      this.flushInterval = null
    }
    this.flush() // 마지막 플러시
  }
}

// 싱글톤 인스턴스
let usageLogger: UsageLogger | null = null

export function getUsageLogger(): UsageLogger {
  if (!usageLogger) {
    usageLogger = new UsageLogger()
  }
  return usageLogger
}

// 편의 함수들
export async function logApiUsage(data: UsageLogData): Promise<void> {
  const logger = getUsageLogger()
  return logger.log(data)
}

export async function getDailyUsageStats(date?: string): Promise<UsageStats[]> {
  const logger = getUsageLogger()
  return logger.getDailyStats(date)
}

export async function getUsageTrend(period: 'daily' | 'weekly' | 'monthly', days?: number): Promise<UsageTrend> {
  const logger = getUsageLogger()
  return logger.getTrend(period, days)
}

export async function getPopularEndpoints(days?: number, limit?: number) {
  const logger = getUsageLogger()
  return logger.getPopularEndpoints(days, limit)
}
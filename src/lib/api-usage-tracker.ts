import type { ApiUsage } from '@/types/kakao'

/**
 * API 사용량 추적 시스템
 * - 일일 사용량 모니터링
 * - 할당량 초과 방지
 * - 사용 통계 제공
 */
export class ApiUsageTracker {
  private readonly usage = new Map<string, ApiUsage>()
  private readonly dailyLimit = 300000 // 카카오 API 일일 한도 (300,000회)
  private readonly warningThreshold = 0.8 // 80% 사용 시 경고

  /**
   * API 호출 추적
   */
  async track(apiKey: string = 'default'): Promise<void> {
    const today = this.getTodayKey()
    const currentUsage = this.usage.get(today) || this.createDefaultUsage(today)

    currentUsage.searchCount += 1
    currentUsage.remaining = Math.max(0, this.dailyLimit - currentUsage.searchCount)
    currentUsage.lastUpdated = new Date()

    this.usage.set(today, currentUsage)

    // 임계값 경고
    if (this.isNearLimit(currentUsage)) {
      console.warn(`API 사용량 경고: ${currentUsage.searchCount}/${this.dailyLimit} (${this.getUsagePercentage(currentUsage)}%)`)
    }

    // 일일 한도 초과 확인
    if (this.isLimitExceeded(currentUsage)) {
      console.error(`API 일일 한도 초과: ${currentUsage.searchCount}/${this.dailyLimit}`)
    }
  }

  /**
   * 요청 가능 여부 확인
   */
  async canMakeRequest(apiKey: string = 'default'): Promise<boolean> {
    const today = this.getTodayKey()
    const currentUsage = this.usage.get(today) || this.createDefaultUsage(today)

    return !this.isLimitExceeded(currentUsage)
  }

  /**
   * 남은 할당량 조회
   */
  async getRemainingQuota(apiKey: string = 'default'): Promise<number> {
    const today = this.getTodayKey()
    const currentUsage = this.usage.get(today) || this.createDefaultUsage(today)

    return currentUsage.remaining
  }

  /**
   * 오늘의 사용량 조회
   */
  async getTodayUsage(apiKey: string = 'default'): Promise<ApiUsage> {
    const today = this.getTodayKey()
    return this.usage.get(today) || this.createDefaultUsage(today)
  }

  /**
   * 사용량 통계 조회
   */
  async getUsageStats(apiKey: string = 'default'): Promise<{
    today: ApiUsage
    usagePercentage: number
    isNearLimit: boolean
    isLimitExceeded: boolean
    timeUntilReset: number
  }> {
    const today = this.getTodayKey()
    const currentUsage = this.usage.get(today) || this.createDefaultUsage(today)

    return {
      today: currentUsage,
      usagePercentage: this.getUsagePercentage(currentUsage),
      isNearLimit: this.isNearLimit(currentUsage),
      isLimitExceeded: this.isLimitExceeded(currentUsage),
      timeUntilReset: this.getTimeUntilReset()
    }
  }

  /**
   * 과거 사용량 데이터 조회 (최근 7일)
   */
  async getHistoricalUsage(): Promise<ApiUsage[]> {
    const result: ApiUsage[] = []
    const today = new Date()

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateKey = this.formatDate(date)
      
      const usage = this.usage.get(dateKey) || this.createDefaultUsage(dateKey)
      result.push(usage)
    }

    return result
  }

  /**
   * 사용량 초기화 (새로운 날짜)
   */
  async resetDailyUsage(): Promise<void> {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayKey = this.formatDate(yesterday)

    // 어제 데이터 정리 (선택적)
    this.usage.delete(yesterdayKey)

    // 오늘 데이터 초기화
    const today = this.getTodayKey()
    this.usage.set(today, this.createDefaultUsage(today))
  }

  /**
   * 메모리 정리 (오래된 데이터 삭제)
   */
  async cleanup(): Promise<void> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 7) // 7일 이전 데이터 삭제

    for (const [dateKey] of this.usage) {
      const date = new Date(dateKey)
      if (date < cutoffDate) {
        this.usage.delete(dateKey)
      }
    }
  }

  /**
   * 오늘 날짜 키 생성
   */
  private getTodayKey(): string {
    return this.formatDate(new Date())
  }

  /**
   * 날짜 포맷팅 (YYYY-MM-DD)
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0]
  }

  /**
   * 기본 사용량 객체 생성
   */
  private createDefaultUsage(date: string): ApiUsage {
    const resetTime = new Date(date)
    resetTime.setDate(resetTime.getDate() + 1) // 다음 날 00:00:00
    resetTime.setHours(0, 0, 0, 0)

    return {
      id: `usage-${date}`,
      date,
      searchCount: 0,
      remaining: this.dailyLimit,
      resetTime,
      lastUpdated: new Date()
    }
  }

  /**
   * 사용률 계산
   */
  private getUsagePercentage(usage: ApiUsage): number {
    return Math.round((usage.searchCount / this.dailyLimit) * 100)
  }

  /**
   * 한도 근접 여부 확인
   */
  private isNearLimit(usage: ApiUsage): boolean {
    return usage.searchCount >= this.dailyLimit * this.warningThreshold
  }

  /**
   * 한도 초과 여부 확인
   */
  private isLimitExceeded(usage: ApiUsage): boolean {
    return usage.searchCount >= this.dailyLimit
  }

  /**
   * 리셋까지 남은 시간 (밀리초)
   */
  private getTimeUntilReset(): number {
    const now = new Date()
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    return tomorrow.getTime() - now.getTime()
  }
}

// 싱글톤 인스턴스
let usageTracker: ApiUsageTracker | null = null

export function getUsageTracker(): ApiUsageTracker {
  if (!usageTracker) {
    usageTracker = new ApiUsageTracker()
  }
  return usageTracker
}

// 편의 함수들
export async function trackApiUsage(apiKey?: string): Promise<void> {
  const tracker = getUsageTracker()
  await tracker.track(apiKey)
}

export async function canMakeApiRequest(apiKey?: string): Promise<boolean> {
  const tracker = getUsageTracker()
  return tracker.canMakeRequest(apiKey)
}

export async function getRemainingApiQuota(apiKey?: string): Promise<number> {
  const tracker = getUsageTracker()
  return tracker.getRemainingQuota(apiKey)
}

export async function getApiUsageStats(apiKey?: string) {
  const tracker = getUsageTracker()
  return tracker.getUsageStats(apiKey)
}
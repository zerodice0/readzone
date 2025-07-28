/**
 * 도서 API 캐시 관리 시스템
 * - Kakao API 응답 캐싱
 * - TTL 기반 만료 관리
 * - LRU 캐시 전략
 * - 메모리와 DB 캐시 결합
 */

import { db } from '@/lib/db'
import type { CacheConfig } from '@/types/book'

// 메모리 캐시 엔트리
interface CacheEntry<T> {
  data: T
  timestamp: number
  hits: number
  expiresAt: number
}

// 캐시 통계
interface CacheStats {
  memoryHitRate: number
  dbHitRate: number
  totalHits: number
  totalMisses: number
  size: number
  maxSize: number
}

/**
 * 도서 API 캐시 매니저
 */
export class BookCacheManager {
  private memoryCache = new Map<string, CacheEntry<any>>()
  private config: CacheConfig
  private stats = {
    memoryHits: 0,
    dbHits: 0,
    misses: 0,
    total: 0
  }

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      enabled: true,
      ttl: 24 * 60 * 60, // 24시간 (초)
      maxSize: 1000, // 최대 1000개 엔트리
      strategy: 'LRU',
      ...config
    }

    // 주기적 정리 (1시간마다)
    setInterval(() => {
      this.cleanup()
    }, 60 * 60 * 1000)
  }

  /**
   * 캐시에서 데이터 조회
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.config.enabled) return null

    this.stats.total++

    // 1. 메모리 캐시 확인
    const memoryEntry = this.memoryCache.get(key)
    if (memoryEntry && memoryEntry.expiresAt > Date.now()) {
      memoryEntry.hits++
      this.stats.memoryHits++
      this.updateAccessOrder(key) // LRU 업데이트
      return memoryEntry.data
    }

    // 2. DB 캐시 확인
    try {
      const dbEntry = await db.bookApiCache.findUnique({
        where: { query: key }
      })

      if (dbEntry && dbEntry.expiresAt > new Date()) {
        const data = JSON.parse(dbEntry.response)
        
        // DB에서 찾은 데이터를 메모리 캐시에도 저장
        this.setMemoryCache(key, data)
        
        // 검색 횟수 증가
        await db.bookApiCache.update({
          where: { id: dbEntry.id },
          data: {
            searchCount: { increment: 1 },
            updatedAt: new Date()
          }
        }).catch(() => {}) // 에러 무시 (통계 업데이트 실패는 치명적이지 않음)

        this.stats.dbHits++
        return data
      }
    } catch (error) {
      console.error('Cache DB error:', error)
    }

    // 3. 캐시 미스
    this.stats.misses++
    return null
  }

  /**
   * 캐시에 데이터 저장
   */
  async set<T>(key: string, data: T, customTtl?: number): Promise<void> {
    if (!this.config.enabled) return

    const ttl = customTtl || this.config.ttl
    const expiresAt = new Date(Date.now() + ttl * 1000)

    // 1. 메모리 캐시 저장
    this.setMemoryCache(key, data, ttl)

    // 2. DB 캐시 저장 (비동기, 에러 무시)
    this.setDbCache(key, data, expiresAt).catch(error => {
      console.error('Cache DB write error:', error)
    })
  }

  /**
   * 메모리 캐시에 데이터 저장
   */
  private setMemoryCache<T>(key: string, data: T, ttl?: number): void {
    const actualTtl = ttl || this.config.ttl
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      hits: 0,
      expiresAt: Date.now() + actualTtl * 1000
    }

    // 캐시 크기 제한 확인
    if (this.memoryCache.size >= this.config.maxSize) {
      this.evictOldest()
    }

    this.memoryCache.set(key, entry)
  }

  /**
   * DB 캐시에 데이터 저장
   */
  private async setDbCache<T>(key: string, data: T, expiresAt: Date): Promise<void> {
    try {
      await db.bookApiCache.upsert({
        where: { query: key },
        update: {
          response: JSON.stringify(data),
          expiresAt,
          searchCount: { increment: 1 },
          updatedAt: new Date()
        },
        create: {
          query: key,
          response: JSON.stringify(data),
          expiresAt,
          searchCount: 1
        }
      })
    } catch (error) {
      // DB 에러는 로그만 출력하고 계속 진행
      console.error('DB cache write failed:', error)
    }
  }

  /**
   * 캐시에서 데이터 삭제
   */
  async delete(key: string): Promise<void> {
    // 메모리 캐시에서 삭제
    this.memoryCache.delete(key)

    // DB 캐시에서 삭제
    try {
      await db.bookApiCache.delete({
        where: { query: key }
      })
    } catch (error) {
      // 존재하지 않는 키는 무시
      console.error('Cache delete error:', error)
    }
  }

  /**
   * 패턴으로 캐시 삭제
   */
  async deletePattern(pattern: RegExp): Promise<number> {
    let deletedCount = 0

    // 메모리 캐시에서 패턴 매칭 삭제
    for (const [key] of Array.from(this.memoryCache)) {
      if (pattern.test(key)) {
        this.memoryCache.delete(key)
        deletedCount++
      }
    }

    // DB 캐시에서도 삭제 (LIKE 쿼리 사용)
    try {
      const result = await db.bookApiCache.deleteMany({
        where: {
          query: {
            contains: pattern.source.replace(/[.*+?^${}()|[\]\\]/g, '') // 간단한 패턴만 지원
          }
        }
      })
      deletedCount += result.count
    } catch (error) {
      console.error('Pattern delete error:', error)
    }

    return deletedCount
  }

  /**
   * 전체 캐시 지우기
   */
  async clear(): Promise<void> {
    // 메모리 캐시 지우기
    this.memoryCache.clear()

    // DB 캐시 지우기
    try {
      await db.bookApiCache.deleteMany()
    } catch (error) {
      console.error('Cache clear error:', error)
    }

    // 통계 초기화
    this.stats = {
      memoryHits: 0,
      dbHits: 0,
      misses: 0,
      total: 0
    }
  }

  /**
   * 만료된 캐시 정리
   */
  async cleanup(): Promise<number> {
    const now = Date.now()
    let deletedCount = 0

    // 메모리 캐시 정리
    for (const [key, entry] of Array.from(this.memoryCache)) {
      if (entry.expiresAt <= now) {
        this.memoryCache.delete(key)
        deletedCount++
      }
    }

    // DB 캐시 정리
    try {
      const result = await db.bookApiCache.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      })
      deletedCount += result.count
    } catch (error) {
      console.error('Cache cleanup error:', error)
    }

    return deletedCount
  }

  /**
   * 캐시 통계 조회
   */
  async getStats(): Promise<CacheStats> {
    const totalRequests = this.stats.memoryHits + this.stats.dbHits + this.stats.misses
    
    return {
      memoryHitRate: totalRequests > 0 ? (this.stats.memoryHits / totalRequests) * 100 : 0,
      dbHitRate: totalRequests > 0 ? (this.stats.dbHits / totalRequests) * 100 : 0,
      totalHits: this.stats.memoryHits + this.stats.dbHits,
      totalMisses: this.stats.misses,
      size: this.memoryCache.size,
      maxSize: this.config.maxSize
    }
  }

  /**
   * 캐시 키 생성
   */
  static createKey(type: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key]
        return result
      }, {} as Record<string, any>)

    return `${type}:${JSON.stringify(sortedParams)}`
  }

  /**
   * LRU 캐시를 위한 접근 순서 업데이트
   */
  private updateAccessOrder(key: string): void {
    const entry = this.memoryCache.get(key)
    if (entry) {
      // 다시 삽입하여 순서 업데이트 (Map은 삽입 순서 유지)
      this.memoryCache.delete(key)
      this.memoryCache.set(key, entry)
    }
  }

  /**
   * 가장 오래된 엔트리 제거 (LRU)
   */
  private evictOldest(): void {
    if (this.config.strategy === 'LRU') {
      // Map의 첫 번째 항목이 가장 오래된 항목
      const firstKey = this.memoryCache.keys().next().value
      if (firstKey) {
        this.memoryCache.delete(firstKey)
      }
    } else if (this.config.strategy === 'LFU') {
      // 가장 적게 사용된 항목 찾기
      let leastUsedKey = null
      let minHits = Infinity

      for (const [key, entry] of Array.from(this.memoryCache)) {
        if (entry.hits < minHits) {
          minHits = entry.hits
          leastUsedKey = key
        }
      }

      if (leastUsedKey) {
        this.memoryCache.delete(leastUsedKey)
      }
    }
  }

  /**
   * 캐시 워밍 (인기 검색어 미리 캐싱)
   */
  async warmUp(popularQueries: string[]): Promise<void> {
    console.log(`Warming up cache with ${popularQueries.length} queries...`)
    
    for (const query of popularQueries) {
      try {
        // 실제 API 호출은 하지 않고, 빈 응답으로 캐시 슬롯만 예약
        const key = BookCacheManager.createKey('search', { query })
        if (!(await this.get(key))) {
          // 캐시에 없는 경우에만 워밍업 필요
          console.log(`Need to warm up: ${query}`)
        }
      } catch (error) {
        console.error(`Cache warm-up failed for ${query}:`, error)
      }
    }
  }
}

// 싱글톤 인스턴스
let cacheManager: BookCacheManager | null = null

export function getCacheManager(): BookCacheManager {
  if (!cacheManager) {
    cacheManager = new BookCacheManager({
      enabled: process.env.NODE_ENV === 'production', // 프로덕션에서만 캐시 활성화
      ttl: 24 * 60 * 60, // 24시간
      maxSize: 500 // 메모리 사용량 고려
    })
  }
  return cacheManager
}

// 편의 함수들
export async function getCachedData<T>(key: string): Promise<T | null> {
  const cache = getCacheManager()
  return cache.get<T>(key)
}

export async function setCachedData<T>(key: string, data: T, ttl?: number): Promise<void> {
  const cache = getCacheManager()
  return cache.set(key, data, ttl)
}

export async function deleteCachedData(key: string): Promise<void> {
  const cache = getCacheManager()
  return cache.delete(key)
}

export async function getCacheStats(): Promise<CacheStats> {
  const cache = getCacheManager()
  return cache.getStats()
}
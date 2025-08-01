/**
 * High-Performance Book Sync Cache
 * Reduces database queries and improves sync performance (<1s requirement)
 */

interface BookMatchResult {
  bookId: string | null
  matchScore: number
  matchType: 'isbn13' | 'title_author' | 'fuzzy' | 'no_match'
  timestamp: number
}

interface CacheEntry {
  result: BookMatchResult
  expiresAt: number
  accessCount: number
  lastAccessed: number
}

interface CacheMetrics {
  totalRequests: number
  cacheHits: number
  cacheMisses: number
  hitRate: number
  averageResponseTime: number
  evictedEntries: number
}

/**
 * In-memory cache for book synchronization results
 * Optimized for draft system performance requirements
 */
export class BookSyncCache {
  private static instance: BookSyncCache
  private cache = new Map<string, CacheEntry>()
  private metrics: CacheMetrics = {
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    hitRate: 0,
    averageResponseTime: 0,
    evictedEntries: 0,
  }

  // Cache configuration
  private readonly MAX_CACHE_SIZE = 2000 // Max cached book matches
  private readonly CACHE_TTL = 30 * 60 * 1000 // 30 minutes
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000 // 5 minutes
  private readonly MAX_RESPONSE_TIME = 100 // ms, target for cache operations

  private cleanupTimer?: NodeJS.Timeout

  private constructor() {
    this.startCleanupTimer()
  }

  static getInstance(): BookSyncCache {
    if (!this.instance) {
      this.instance = new BookSyncCache()
    }
    return this.instance
  }

  /**
   * Generate cache key from Kakao book data
   */
  private generateCacheKey(kakaoBookData: any): string {
    // Create key from most stable identifiers
    const isbn = kakaoBookData.isbn || ''
    const title = kakaoBookData.title || ''
    const authors = kakaoBookData.authors?.[0] || ''
    
    return `book:${isbn}:${title.slice(0, 50)}:${authors.slice(0, 30)}`
  }

  /**
   * Get cached book match result
   */
  async getCachedMatch(kakaoBookData: any): Promise<BookMatchResult | null> {
    const startTime = performance.now()
    this.metrics.totalRequests++

    const cacheKey = this.generateCacheKey(kakaoBookData)
    const entry = this.cache.get(cacheKey)

    if (!entry) {
      this.metrics.cacheMisses++
      this.updateMetrics(performance.now() - startTime)
      return null
    }

    // Check if entry is expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(cacheKey)
      this.metrics.cacheMisses++
      this.updateMetrics(performance.now() - startTime)
      return null
    }

    // Update access statistics
    entry.accessCount++
    entry.lastAccessed = Date.now()
    
    this.metrics.cacheHits++
    this.updateMetrics(performance.now() - startTime)

    console.log(`🎯 Book sync cache hit: ${cacheKey.slice(0, 50)}... (score: ${entry.result.matchScore})`)
    
    return entry.result
  }

  /**
   * Cache book match result
   */
  async setCachedMatch(kakaoBookData: any, result: BookMatchResult): Promise<void> {
    const startTime = performance.now()
    const cacheKey = this.generateCacheKey(kakaoBookData)

    // Don't cache failed matches (waste of memory)
    if (result.matchScore === 0 || result.matchType === 'no_match') {
      return
    }

    const entry: CacheEntry = {
      result: {
        ...result,
        timestamp: Date.now(),
      },
      expiresAt: Date.now() + this.CACHE_TTL,
      accessCount: 1,
      lastAccessed: Date.now(),
    }

    // Evict entries if cache is full
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.evictLeastRecentlyUsed()
    }

    this.cache.set(cacheKey, entry)

    const duration = performance.now() - startTime
    if (duration > this.MAX_RESPONSE_TIME) {
      console.warn(`⚠️ Slow cache set operation: ${duration.toFixed(2)}ms`)
    }

    console.log(`💾 Cached book match: ${cacheKey.slice(0, 50)}... (score: ${result.matchScore})`)
  }

  /**
   * Evict least recently used entries
   */
  private evictLeastRecentlyUsed(): void {
    const entries: Array<[string, CacheEntry]> = Array.from(this.cache.entries())
    
    // Sort by last accessed time (oldest first)
    entries.sort(([,a], [,b]) => a.lastAccessed - b.lastAccessed)
    
    // Remove oldest 20% of entries
    const entriesToRemove = Math.floor(this.MAX_CACHE_SIZE * 0.2)
    
    for (let i = 0; i < entriesToRemove && i < entries.length; i++) {
      const [key] = entries[i]
      this.cache.delete(key)
      this.metrics.evictedEntries++
    }

    console.log(`🧹 Evicted ${entriesToRemove} cache entries`)
  }

  /**
   * Clean up expired entries
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now()
    let removedCount = 0

    this.cache.forEach((entry, key) => {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
        removedCount++
      }
    })

    if (removedCount > 0) {
      console.log(`🧹 Cleaned up ${removedCount} expired cache entries`)
    }
  }

  /**
   * Start automatic cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredEntries()
    }, this.CLEANUP_INTERVAL)
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(responseTime: number): void {
    this.metrics.hitRate = this.metrics.totalRequests > 0
      ? (this.metrics.cacheHits / this.metrics.totalRequests) * 100
      : 0

    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) + responseTime) / 
      this.metrics.totalRequests
  }

  /**
   * Get cache performance metrics
   */
  getMetrics(): CacheMetrics & { cacheSize: number; memoryUsage: string } {
    const memoryUsageBytes = JSON.stringify(Array.from(this.cache.entries())).length
    const memoryUsageMB = (memoryUsageBytes / 1024 / 1024).toFixed(2)

    return {
      ...this.metrics,
      cacheSize: this.cache.size,
      memoryUsage: `${memoryUsageMB} MB`,
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
    console.log('🧹 Book sync cache cleared')
  }

  /**
   * Preload frequently accessed books
   * Can be called during application startup
   */
  async preloadFrequentBooks(): Promise<void> {
    // This would typically load from database or external source
    // For now, we'll skip preloading as it requires database access
    console.log('📚 Book sync cache ready for preloading')
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheHealth(): {
    healthy: boolean
    issues: string[]
    recommendations: string[]
  } {
    const issues: string[] = []
    const recommendations: string[] = []
    
    // Check hit rate
    if (this.metrics.hitRate < 70) {
      issues.push(`Low cache hit rate: ${this.metrics.hitRate.toFixed(1)}%`)
      recommendations.push('Consider increasing cache TTL or reviewing cache key strategy')
    }

    // Check response time
    if (this.metrics.averageResponseTime > this.MAX_RESPONSE_TIME) {
      issues.push(`Slow cache operations: ${this.metrics.averageResponseTime.toFixed(2)}ms`)
      recommendations.push('Consider reducing cache size or optimizing cache keys')
    }

    // Check memory usage
    if (this.cache.size > this.MAX_CACHE_SIZE * 0.9) {
      issues.push('Cache near capacity')
      recommendations.push('Consider increasing cache size or decreasing TTL')
    }

    return {
      healthy: issues.length === 0,
      issues,
      recommendations,
    }
  }

  /**
   * Shutdown cache and cleanup
   */
  shutdown(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
    }
    this.clear()
    console.log('📴 Book sync cache shutdown complete')
  }
}

// Export singleton instance
export const bookSyncCache = BookSyncCache.getInstance()

// Export class for testing
export type { BookSyncCache as BookSyncCacheType }
// Browser cache utility for API responses and static data
interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number
  etag?: string
}

interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  maxSize?: number // Maximum number of items to cache
  enableCompression?: boolean
}

class BrowserCache {
  private cache = new Map<string, CacheItem<unknown>>()
  private accessTimes = new Map<string, number>()
  private maxSize: number
  private enableCompression: boolean

  constructor(options: CacheOptions = {}) {
    this.maxSize = options.maxSize ?? 100
    this.enableCompression = options.enableCompression ?? false

    // Clean up expired items periodically
    setInterval(() => this.cleanup(), 300000) // Every 5 minutes
  }

  private isExpired(item: CacheItem<unknown>): boolean {
    return Date.now() - item.timestamp > item.ttl
  }

  private evictLRU(): void {
    if (this.cache.size < this.maxSize) {return}

    let lruKey: string | null = null
    let lruTime = Date.now()

    for (const [key, time] of this.accessTimes) {
      if (time < lruTime) {
        lruTime = time
        lruKey = key
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey)
      this.accessTimes.delete(lruKey)
    }
  }

  private compress(data: unknown): string {
    // Simple compression using JSON + basic encoding
    // In production, consider using a proper compression library
    return btoa(JSON.stringify(data))
  }

  private decompress(compressedData: string): unknown {
    try {
      return JSON.parse(atob(compressedData))
    } catch (error) {
      console.warn('[Cache] Failed to decompress data:', error)

      return null
    }
  }

  set<T>(key: string, data: T, ttl = 300000, etag?: string): void {
    this.evictLRU()

    const item: CacheItem<T> = {
      data: this.enableCompression ? (this.compress(data) as T) : data,
      timestamp: Date.now(),
      ttl,
      ...(etag && { etag })
    }

    this.cache.set(key, item)
    this.accessTimes.set(key, Date.now())
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key)

    if (!item) {
      return null
    }

    if (this.isExpired(item)) {
      this.cache.delete(key)
      this.accessTimes.delete(key)

      return null
    }

    // Update access time for LRU
    this.accessTimes.set(key, Date.now())

    return this.enableCompression
      ? this.decompress(item.data as string) as T
      : item.data as T
  }

  has(key: string): boolean {
    const item = this.cache.get(key)

    if (!item) {return false}

    if (this.isExpired(item)) {
      this.cache.delete(key)
      this.accessTimes.delete(key)

      return false
    }

    return true
  }

  delete(key: string): boolean {
    this.accessTimes.delete(key)

    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
    this.accessTimes.clear()
  }

  cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    for (const [key, item] of this.cache) {
      if (now - item.timestamp > item.ttl) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => {
      this.cache.delete(key)
      this.accessTimes.delete(key)
    })

    if (keysToDelete.length > 0) {
      console.warn(`[Cache] Cleaned up ${keysToDelete.length} expired items`)
    }
  }

  getStats(): {
    size: number
    hitRate: number
    memoryUsage: number
  } {
    const hits = this.accessTimes.size
    const requests = hits // This would need more sophisticated tracking in a real implementation

    let memoryUsage = 0

    for (const item of this.cache.values()) {
      memoryUsage += JSON.stringify(item).length * 2 // Rough estimate
    }

    return {
      size: this.cache.size,
      hitRate: requests > 0 ? hits / requests : 0,
      memoryUsage
    }
  }

  // Get ETag for conditional requests
  getETag(key: string): string | undefined {
    const item = this.cache.get(key)

    return item?.etag
  }

  // Update cache with conditional response
  updateConditional<T>(key: string, data: T, etag?: string, notModified = false): void {
    if (notModified) {
      // Just update the timestamp to extend TTL
      const item = this.cache.get(key)

      if (item) {
        item.timestamp = Date.now()
        this.accessTimes.set(key, Date.now())
      }
    } else {
      // Set new data
      this.set(key, data, 300000, etag)
    }
  }
}

// Create global cache instance
export const apiCache = new BrowserCache({
  maxSize: 200,
  enableCompression: true
})

// Cache keys generator
export const cacheKeys = {
  userProfile: (userid: string) => `user_profile_${userid}`,
  userBadges: (userid: string) => `user_badges_${userid}`,
  userReviews: (userid: string, page = 1) => `user_reviews_${userid}_${page}`,
  bookDetail: (bookId: string) => `book_detail_${bookId}`,
  bookReviews: (bookId: string, page = 1) => `book_reviews_${bookId}_${page}`,
  searchResults: (query: string, type: string, page = 1) => `search_${encodeURIComponent(query)}_${type}_${page}`,
  allBadges: () => 'all_badges',
  notifications: (userid: string) => `notifications_${userid}`,
  feedData: (page = 1) => `feed_data_${page}`
}

// Cache TTL constants (in milliseconds)
export const cacheTTL = {
  SHORT: 60000,      // 1 minute
  MEDIUM: 300000,    // 5 minutes
  LONG: 900000,      // 15 minutes
  VERY_LONG: 3600000 // 1 hour
}

// Utility functions for React Query integration
export const createCacheConfig = (ttl: number = cacheTTL.MEDIUM) => ({
  staleTime: ttl * 0.8, // Consider data stale at 80% of TTL
  cacheTime: ttl,
  refetchOnWindowFocus: false,
  refetchOnMount: false
})

// HOC for caching API functions
export function withCache<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  keyGenerator: (...args: Parameters<T>) => string,
  ttl: number = cacheTTL.MEDIUM
): T {
  return (async (...args: Parameters<T>) => {
    const key = keyGenerator(...args)

    // Try to get from cache first
    const cached = apiCache.get(key)

    if (cached) {
      return cached
    }

    // Call the original function
    const result = await fn(...args)

    // Cache the result
    apiCache.set(key, result, ttl)

    return result
  }) as T
}

// Prefetch utility
export async function prefetchData<T>(
  fetcher: () => Promise<T>,
  cacheKey: string,
  ttl: number = cacheTTL.MEDIUM
): Promise<void> {
  try {
    if (!apiCache.has(cacheKey)) {
      const data = await fetcher()

      apiCache.set(cacheKey, data, ttl)
    }
  } catch (error) {
    console.warn(`[Cache] Failed to prefetch ${cacheKey}:`, error)
  }
}

// Cache invalidation utilities
export const invalidateCache = {
  userProfile: (userid: string) => {
    apiCache.delete(cacheKeys.userProfile(userid))
    // Also invalidate related caches
    apiCache.delete(cacheKeys.userBadges(userid))
  },

  userContent: (userid: string) => {
    // Invalidate all user-related content
    const pattern = new RegExp(`user_(profile|badges|reviews)_${userid}`)

    for (const key of apiCache['cache'].keys()) {
      if (pattern.test(key)) {
        apiCache.delete(key)
      }
    }
  },

  searchResults: () => {
    // Invalidate all search results
    const pattern = /^search_/

    for (const key of apiCache['cache'].keys()) {
      if (pattern.test(key)) {
        apiCache.delete(key)
      }
    }
  },

  all: () => apiCache.clear()
}
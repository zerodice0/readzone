interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of items to store
}

class MemoryCache {
  private cache = new Map<string, CacheItem<any>>();
  private accessOrder = new Map<string, number>(); // For LRU tracking
  private accessCounter = 0;
  private maxSize: number;
  private options: CacheOptions;

  constructor(options: CacheOptions = {}) {
    this.options = options;
    this.maxSize = options.maxSize || 100;
    
    // Cleanup expired items every 5 minutes
    setInterval(() => {
      this.cleanupExpired();
    }, 5 * 60 * 1000);
  }

  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const timeToLive = ttl || this.options.ttl || 15 * 60 * 1000; // Default 15 minutes
    
    const item: CacheItem<T> = {
      data,
      timestamp: now,
      expiresAt: now + timeToLive,
    };

    // Remove oldest item if cache is full
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.removeLeastRecentlyUsed();
    }

    this.cache.set(key, item);
    this.accessOrder.set(key, ++this.accessCounter);
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key) as CacheItem<T> | undefined;
    
    if (!item) {
      return null;
    }

    // Check if expired
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
      return null;
    }

    // Update access order for LRU
    this.accessOrder.set(key, ++this.accessCounter);
    return item.data;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    // Check if expired
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
      return false;
    }
    
    return true;
  }

  delete(key: string): boolean {
    this.accessOrder.delete(key);
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder.clear();
    this.accessCounter = 0;
  }

  size(): number {
    return this.cache.size;
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      accessCounter: this.accessCounter,
    };
  }

  private cleanupExpired(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => {
      this.cache.delete(key);
      this.accessOrder.delete(key);
    });

    if (expiredKeys.length > 0) {
      console.log(`Cache cleanup: removed ${expiredKeys.length} expired items`);
    }
  }

  private removeLeastRecentlyUsed(): void {
    let oldestKey = '';
    let oldestAccess = Infinity;

    for (const [key, accessCount] of this.accessOrder.entries()) {
      if (accessCount < oldestAccess) {
        oldestAccess = accessCount;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.accessOrder.delete(oldestKey);
    }
  }
}

// Global cache instances
export const apiCache = new MemoryCache({
  ttl: 10 * 60 * 1000, // 10 minutes for API responses
  maxSize: 200,
});

export const imageCache = new MemoryCache({
  ttl: 30 * 60 * 1000, // 30 minutes for images
  maxSize: 50,
});

export const userCache = new MemoryCache({
  ttl: 5 * 60 * 1000, // 5 minutes for user data
  maxSize: 100,
});

// Cache key generators
export const generateCacheKey = {
  posts: (params: any) => `posts:${JSON.stringify(params)}`,
  post: (id: string) => `post:${id}`,
  user: (id: string) => `user:${id}`,
  book: (isbn: string) => `book:${isbn}`,
  library: (params: any) => `library:${JSON.stringify(params)}`,
  search: (query: string, type: string) => `search:${type}:${query}`,
  stats: (userId: string) => `stats:${userId}`,
  notifications: (userId: string) => `notifications:${userId}`,
};

// Cache wrapper for API calls
export const withCache = async <T>(
  cacheKey: string,
  apiCall: () => Promise<T>,
  cache = apiCache,
  ttl?: number
): Promise<T> => {
  // Try to get from cache first
  const cached = cache.get<T>(cacheKey);
  if (cached !== null) {
    console.log(`Cache hit: ${cacheKey}`);
    return cached;
  }

  // Make API call and cache result
  console.log(`Cache miss: ${cacheKey}`);
  try {
    const result = await apiCall();
    cache.set(cacheKey, result, ttl);
    return result;
  } catch (error) {
    console.error(`API call failed for ${cacheKey}:`, error);
    throw error;
  }
};

export default MemoryCache;
/**
 * High-Performance Content Processing Utilities
 * Optimized for draft system performance requirements (<500ms save time)
 */

// JSON processing cache for frequently accessed data
const jsonCache = new Map<string, any>()
const MAX_CACHE_SIZE = 1000
// const CACHE_TTL = 5 * 60 * 1000 // 5 minutes (for future use)

interface ContentProcessingOptions {
  enableCache?: boolean
  maxPreviewLength?: number
  stripHtmlTags?: boolean
  compressContent?: boolean
}

/**
 * Optimized JSON parsing with caching
 * Reduces CPU overhead for repeated JSON operations
 */
export class OptimizedJsonProcessor {
  private static cacheHits = 0
  private static totalRequests = 0

  static parse<T = any>(
    jsonString: string | null | undefined, 
    defaultValue: T = {} as T
  ): T {
    this.totalRequests++

    if (!jsonString || jsonString === '{}' || jsonString === 'null') {
      return defaultValue
    }

    // Check cache first
    const cacheKey = `parse:${jsonString.substring(0, 100)}` // Use first 100 chars as key
    if (jsonCache.has(cacheKey)) {
      this.cacheHits++
      return jsonCache.get(cacheKey) as T
    }

    try {
      const parsed = JSON.parse(jsonString) as T
      
      // Cache result if within size limit
      if (jsonCache.size < MAX_CACHE_SIZE) {
        jsonCache.set(cacheKey, parsed)
        // Clean old entries periodically
        if (jsonCache.size > MAX_CACHE_SIZE * 0.8) {
          this.cleanCache()
        }
      }
      
      return parsed
    } catch (error) {
      console.warn('JSON parse error, returning default:', error)
      return defaultValue
    }
  }

  static stringify(obj: any): string {
    const cacheKey = `stringify:${JSON.stringify(obj).substring(0, 100)}`
    
    if (jsonCache.has(cacheKey)) {
      this.cacheHits++
      return jsonCache.get(cacheKey) as string
    }

    try {
      const result = JSON.stringify(obj)
      
      if (jsonCache.size < MAX_CACHE_SIZE) {
        jsonCache.set(cacheKey, result)
      }
      
      return result
    } catch (error) {
      console.warn('JSON stringify error:', error)
      return '{}'
    }
  }

  private static cleanCache() {
    // Remove oldest 20% of cache entries
    const entriesToRemove = Math.floor(jsonCache.size * 0.2)
    const keys = Array.from(jsonCache.keys())
    
    for (let i = 0; i < entriesToRemove; i++) {
      jsonCache.delete(keys[i])
    }
  }

  static getCacheStats() {
    return {
      cacheSize: jsonCache.size,
      cacheHits: this.cacheHits,
      totalRequests: this.totalRequests,
      hitRate: this.totalRequests > 0 ? (this.cacheHits / this.totalRequests) * 100 : 0,
    }
  }
}

/**
 * High-performance content preview generator
 * Optimized for draft list processing
 */
export class ContentPreviewGenerator {
  private static readonly HTML_TAG_REGEX = /<[^>]*>/g
  private static readonly WHITESPACE_REGEX = /\s+/g
  private static readonly previewCache = new Map<string, string>()

  static generatePreview(
    content: string, 
    maxLength: number = 200,
    options: ContentProcessingOptions = {}
  ): string {
    const { enableCache = true, stripHtmlTags = true } = options
    
    // Generate cache key
    const cacheKey = `preview:${content.substring(0, 50)}:${maxLength}`
    
    if (enableCache && this.previewCache.has(cacheKey)) {
      return this.previewCache.get(cacheKey)!
    }

    let processedContent = content

    // Strip HTML tags if enabled (faster than DOM parsing)
    if (stripHtmlTags) {
      processedContent = content.replace(this.HTML_TAG_REGEX, '')
    }

    // Normalize whitespace
    processedContent = processedContent
      .replace(this.WHITESPACE_REGEX, ' ')
      .trim()

    // Generate preview
    const preview = processedContent.length > maxLength
      ? processedContent.substring(0, maxLength) + '...'
      : processedContent

    // Cache result
    if (enableCache && this.previewCache.size < MAX_CACHE_SIZE) {
      this.previewCache.set(cacheKey, preview)
    }

    return preview
  }

  static getTextLength(content: string): number {
    return content.replace(this.HTML_TAG_REGEX, '').length
  }

  static clearCache() {
    this.previewCache.clear()
  }
}

/**
 * Book authors array processing optimization
 * Handles frequent JSON array operations efficiently
 */
export class BookAuthorsProcessor {
  private static readonly authorsCache = new Map<string, string[]>()

  static parseAuthors(authorsJson: string | null | undefined): string[] {
    if (!authorsJson) return []

    const cacheKey = `authors:${authorsJson}`
    if (this.authorsCache.has(cacheKey)) {
      return this.authorsCache.get(cacheKey)!
    }

    try {
      const authors = JSON.parse(authorsJson) as string[]
      
      // Validate and sanitize
      const cleanAuthors = Array.isArray(authors) 
        ? authors.filter(author => typeof author === 'string' && author.trim())
        : []

      // Cache result
      if (this.authorsCache.size < MAX_CACHE_SIZE) {
        this.authorsCache.set(cacheKey, cleanAuthors)
      }

      return cleanAuthors
    } catch (error) {
      console.warn('Authors parse error:', error)
      return []
    }
  }

  static stringifyAuthors(authors: string[]): string {
    if (!Array.isArray(authors) || authors.length === 0) {
      return '[]'
    }

    const cacheKey = `stringify:${authors.join(',')}`
    if (this.authorsCache.has(cacheKey)) {
      return JSON.stringify(this.authorsCache.get(cacheKey))
    }

    return JSON.stringify(authors)
  }
}

/**
 * Performance monitoring for content processing
 */
export class ContentProcessingMetrics {
  private static metrics = {
    totalOperations: 0,
    totalProcessingTime: 0,
    cacheHitRate: 0,
    averageOperationTime: 0,
  }

  static async measureOperation<T>(
    operationName: string,
    operation: () => Promise<T> | T
  ): Promise<T> {
    const startTime = performance.now()
    this.metrics.totalOperations++

    try {
      const result = await operation()
      const duration = performance.now() - startTime
      
      this.metrics.totalProcessingTime += duration
      this.metrics.averageOperationTime = 
        this.metrics.totalProcessingTime / this.metrics.totalOperations

      // Log slow operations (>10ms for content processing)
      if (duration > 10) {
        console.warn(`Slow content operation: ${operationName} took ${duration.toFixed(2)}ms`)
      }

      return result
    } catch (error) {
      console.error(`Content processing error in ${operationName}:`, error)
      throw error
    }
  }

  static getMetrics() {
    return {
      ...this.metrics,
      jsonCacheStats: OptimizedJsonProcessor.getCacheStats(),
    }
  }

  static reset() {
    this.metrics = {
      totalOperations: 0,
      totalProcessingTime: 0,
      cacheHitRate: 0,
      averageOperationTime: 0,
    }
  }
}

/**
 * Optimized draft formatting for API responses
 * Combines all processing operations efficiently
 */
export function formatDraftForResponse(draft: any, options: ContentProcessingOptions = {}): any {
  const { maxPreviewLength = 200 } = options

  return ContentProcessingMetrics.measureOperation('formatDraftForResponse', () => {
    // Use optimized JSON processing
    const metadata = OptimizedJsonProcessor.parse(draft.metadata, {})
    const authors = draft.book?.authors 
      ? BookAuthorsProcessor.parseAuthors(draft.book.authors)
      : []

    // Generate content preview efficiently
    const contentPreview = ContentPreviewGenerator.generatePreview(
      draft.content, 
      maxPreviewLength
    )

    return {
      ...draft,
      metadata,
      contentPreview,
      textLength: ContentPreviewGenerator.getTextLength(draft.content),
      book: draft.book ? {
        ...draft.book,
        authors,
      } : null,
    }
  })
}

// Export performance monitoring
export { ContentProcessingMetrics as ProcessingMetrics }
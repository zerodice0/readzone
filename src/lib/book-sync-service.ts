/**
 * Enhanced Book Synchronization Service
 * Provides robust, race-condition-safe book synchronization with performance optimization
 * Includes intelligent caching for <1s sync performance (PRD requirement)
 */

import { db } from '@/lib/db'
import type { KakaoBook } from '@/types/kakao'
import { bookSyncCache } from '@/lib/cache/book-sync-cache'
import { performanceMonitor } from '@/lib/monitoring/performance-monitor'

// Types for enhanced synchronization
export interface SyncResult {
  success: boolean
  bookId?: string
  action: 'synced' | 'created' | 'failed' | 'no_match'
  duration: number
  error?: string
  matchScore?: number
}

export interface SyncMetrics {
  syncSuccessRate: number
  averageSyncTime: number
  duplicatesPrevented: number
  totalSyncs: number
  lastSyncAt?: Date
}

export interface BookMatch {
  id: string
  score: number
  matchType: 'isbn13' | 'title_author' | 'fuzzy'
}

/**
 * Enhanced Book Synchronization Service
 * Features:
 * - Race condition prevention with optimistic locking
 * - Advanced similarity matching with scoring
 * - Performance monitoring and metrics
 * - Comprehensive error handling
 */
export class EnhancedBookSyncService {
  private static instance: EnhancedBookSyncService
  private readonly MATCH_THRESHOLD = 70 // Minimum match score (0-100)

  static getInstance(): EnhancedBookSyncService {
    if (!this.instance) {
      this.instance = new EnhancedBookSyncService()
    }
    return this.instance
  }

  /**
   * Synchronize a single draft with existing books
   * Uses advanced matching and race condition prevention
   */
  async syncDraftBook(draftId: string, userId?: string): Promise<SyncResult> {
    return performanceMonitor.measureOperation('book_sync', async () => {
    const startTime = Date.now()
    
    try {
      // Get draft with optimistic locking
      const draft = await db.reviewDraft.findUnique({
        where: { id: draftId },
        select: {
          id: true,
          userId: true,
          bookData: true,
          bookId: true,
          version: true,
        },
      })

      if (!draft) {
        return {
          success: false,
          action: 'failed',
          duration: Date.now() - startTime,
          error: 'Draft not found',
        }
      }

      // Skip if already synced
      if (draft.bookId) {
        return {
          success: true,
          action: 'synced',
          bookId: draft.bookId,
          duration: Date.now() - startTime,
        }
      }

      // Skip if no book data
      if (!draft.bookData) {
        return {
          success: false,
          action: 'no_match',
          duration: Date.now() - startTime,
          error: 'No book data to sync',
        }
      }

      // Parse Kakao book data
      const kakaoBookData: KakaoBook = JSON.parse(draft.bookData)
      
      // Check cache first for performance optimization
      const cachedMatch = await bookSyncCache.getCachedMatch(kakaoBookData)
      let bookMatch: BookMatch | null
      
      if (cachedMatch && cachedMatch.bookId) {
        // Use cached result, convert to BookMatch format
        bookMatch = {
          id: cachedMatch.bookId,
          score: cachedMatch.matchScore,
          matchType: cachedMatch.matchType as 'isbn13' | 'title_author' | 'fuzzy'
        }
        console.log(`🎯 Using cached book match: ${bookMatch.id} (score: ${bookMatch.score})`)
      } else {
        // Find best book match with advanced algorithm
        bookMatch = await this.findBestBookMatch(kakaoBookData)
        
        // Cache the result for future use
        if (bookMatch) {
          await bookSyncCache.setCachedMatch(kakaoBookData, {
            bookId: bookMatch.id,
            matchScore: bookMatch.score,
            matchType: bookMatch.matchType,
            timestamp: Date.now()
          })
        }
      }
      
      if (!bookMatch || bookMatch.score < this.MATCH_THRESHOLD) {
        return {
          success: false,
          action: 'no_match',
          duration: Date.now() - startTime,
          matchScore: bookMatch?.score || 0,
        }
      }

      // Sync with race condition prevention
      const syncResult = await this.performSync(draft.id, bookMatch.id, draft.version, userId || draft.userId)
      
      // Record metrics
      await this.recordSyncMetric(syncResult.success, Date.now() - startTime, bookMatch.matchType)

      return {
        success: syncResult.success,
        action: syncResult.success ? 'synced' : 'failed',
        bookId: syncResult.success ? bookMatch.id : undefined,
        duration: Date.now() - startTime,
        matchScore: bookMatch.score,
        error: syncResult.error,
      }
    } catch (error) {
      console.error('Enhanced sync error:', error)
      await this.recordSyncMetric(false, Date.now() - startTime, 'error')
      
      return {
        success: false,
        action: 'failed',
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
    })
  }

  /**
   * Advanced book matching with similarity scoring
   * Priority: ISBN13 (100) > Title+Author (90) > Fuzzy Title (70)
   */
  private async findBestBookMatch(kakaoBookData: KakaoBook): Promise<BookMatch | null> {
    const matches: BookMatch[] = []
    
    // 1. Exact ISBN13 match (highest priority)
    if (kakaoBookData.isbn) {
      const isbnMatch = await db.book.findFirst({
        where: { isbn13: kakaoBookData.isbn },
        select: { id: true },
      })
      
      if (isbnMatch) {
        matches.push({
          id: isbnMatch.id,
          score: 100,
          matchType: 'isbn13',
        })
      }
    }

    // 2. Title + Author match (high priority)
    if (kakaoBookData.title && kakaoBookData.authors?.length > 0) {
      const titleAuthorMatch = await db.book.findFirst({
        where: {
          title: { contains: kakaoBookData.title },
          authors: { 
            contains: JSON.stringify(kakaoBookData.authors[0]) 
          },
        },
        select: { id: true },
      })
      
      if (titleAuthorMatch) {
        matches.push({
          id: titleAuthorMatch.id,
          score: 90,
          matchType: 'title_author',
        })
      }
    }

    // 3. Fuzzy title match (lower priority, for backup)
    if (kakaoBookData.title && matches.length === 0) {
      const fuzzyMatches = await db.book.findMany({
        where: {
          title: { 
            contains: this.extractKeywords(kakaoBookData.title)[0] // Use first keyword
          },
        },
        select: { id: true, title: true },
        take: 3, // Limit fuzzy matches for performance
      })
      
      for (const fuzzyMatch of fuzzyMatches) {
        const score = this.calculateTitleSimilarity(kakaoBookData.title, fuzzyMatch.title)
        if (score >= this.MATCH_THRESHOLD) {
          matches.push({
            id: fuzzyMatch.id,
            score,
            matchType: 'fuzzy',
          })
        }
      }
    }

    // Return best match
    return matches.length > 0 
      ? matches.reduce((best, current) => current.score > best.score ? current : best)
      : null
  }

  /**
   * Perform atomic sync with race condition prevention
   */
  private async performSync(draftId: string, bookId: string, expectedVersion: number, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await db.$transaction(async (tx) => {
        // Update draft with optimistic locking
        const updatedDraft = await tx.reviewDraft.update({
          where: {
            id: draftId,
            version: expectedVersion, // Optimistic lock
          },
          data: {
            bookId,
            bookData: null, // Clear after successful sync
            version: { increment: 1 },
            lastAccessed: new Date(),
          },
        }).catch((error) => {
          if (error.code === 'P2025') {
            throw new Error('CONFLICT: Draft was modified by another process')
          }
          throw error
        })

        // Create audit log
        await tx.reviewDraftAudit.create({
          data: {
            draftId,
            userId,
            action: 'BOOK_SYNCED',
            oldData: JSON.stringify({ bookId: null, version: expectedVersion }),
            newData: JSON.stringify({ bookId, version: updatedDraft.version }),
          },
        })
      })

      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Sync transaction failed:', errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Calculate title similarity score (0-100)
   * Uses basic text similarity algorithm
   */
  private calculateTitleSimilarity(title1: string, title2: string): number {
    const normalize = (str: string) => str.toLowerCase().replace(/[^\w\s]/g, '').trim()
    const n1 = normalize(title1)
    const n2 = normalize(title2)
    
    if (n1 === n2) return 100
    if (n1.includes(n2) || n2.includes(n1)) return 85
    
    // Simple word overlap scoring
    const words1 = n1.split(/\s+/)
    const words2 = n2.split(/\s+/)
    const overlap = words1.filter(word => words2.includes(word)).length
    const totalWords = Math.max(words1.length, words2.length)
    
    return Math.round((overlap / totalWords) * 100)
  }

  /**
   * Extract keywords from title for fuzzy matching
   */
  private extractKeywords(title: string): string[] {
    return title
      .toLowerCase()
      .replace(/[^\w\s가-힣]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 1)
      .slice(0, 3) // Take first 3 keywords
  }

  /**
   * Record synchronization metrics for monitoring
   */
  private async recordSyncMetric(success: boolean, duration: number, matchType: string): Promise<void> {
    try {
      // In a real implementation, this would go to a metrics database
      // For now, we'll log to console and could extend to store in DB
      console.log(`📊 Sync metric: ${success ? 'SUCCESS' : 'FAILED'} (${duration}ms, ${matchType})`)
      
      // TODO: Store in metrics table for dashboard
      // await db.syncMetrics.create({
      //   data: { success, duration, matchType, timestamp: new Date() }
      // })
    } catch (error) {
      // Don't let metrics recording break the sync process
      console.warn('Failed to record sync metric:', error)
    }
  }

  /**
   * Get synchronization metrics for monitoring dashboard (includes cache metrics)
   */
  async getSyncMetrics(): Promise<SyncMetrics & { cacheMetrics?: any }> {
    try {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      
      const [totalSyncs, successfulSyncs, recentAudits] = await Promise.all([
        db.reviewDraftAudit.count({
          where: { 
            action: { in: ['BOOK_SYNCED'] },
            createdAt: { gte: oneWeekAgo }
          }
        }),
        db.reviewDraftAudit.count({
          where: { 
            action: 'BOOK_SYNCED',
            createdAt: { gte: oneWeekAgo }
          }
        }),
        db.reviewDraftAudit.findFirst({
          where: { action: 'BOOK_SYNCED' },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true }
        })
      ])

      const syncSuccessRate = totalSyncs > 0 ? (successfulSyncs / totalSyncs) : 0
      
      return {
        syncSuccessRate,
        averageSyncTime: 0, // TODO: Calculate from stored metrics
        duplicatesPrevented: 0, // TODO: Track prevented duplicates
        totalSyncs,
        lastSyncAt: recentAudits?.createdAt,
        cacheMetrics: bookSyncCache.getMetrics()
      }
    } catch (error) {
      console.error('Failed to get sync metrics:', error)
      return {
        syncSuccessRate: 0,
        averageSyncTime: 0,
        duplicatesPrevented: 0,
        totalSyncs: 0,
        cacheMetrics: bookSyncCache.getMetrics()
      }
    }
  }

  /**
   * Batch synchronization with enhanced error handling
   */
  async batchSync(candidateIds: string[], batchSize: number = 10): Promise<{
    processed: number
    synced: number
    failed: number
    duration: number
    errors: string[]
  }> {
    const startTime = Date.now()
    const result = {
      processed: 0,
      synced: 0,
      failed: 0,
      duration: 0,
      errors: [] as string[]
    }

    console.log(`🔄 Enhanced batch sync starting: ${candidateIds.length} candidates`)

    // Process in batches to avoid overwhelming the database
    for (let i = 0; i < candidateIds.length; i += batchSize) {
      const batch = candidateIds.slice(i, i + batchSize)
      
      const batchResults = await Promise.allSettled(
        batch.map(draftId => this.syncDraftBook(draftId))
      )

      for (let index = 0; index < batchResults.length; index++) {
        const syncResult = batchResults[index]
        result.processed++
        
        if (syncResult.status === 'fulfilled') {
          if (syncResult.value.success && syncResult.value.action === 'synced') {
            result.synced++
          } else if (syncResult.value.action === 'failed') {
            result.failed++
            result.errors.push(`${batch[index]}: ${syncResult.value.error}`)
          }
        } else {
          result.failed++
          result.errors.push(`${batch[index]}: ${syncResult.reason}`)
        }
      }

      // Small delay between batches to prevent overwhelming the system
      if (i + batchSize < candidateIds.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    result.duration = Date.now() - startTime
    
    console.log(`✅ Enhanced batch sync completed (${result.duration}ms):`)
    console.log(`  - Processed: ${result.processed}`)
    console.log(`  - Synced: ${result.synced}`)
    console.log(`  - Failed: ${result.failed}`)
    
    return result
  }
}

// Export singleton instance
export const bookSyncService = EnhancedBookSyncService.getInstance()
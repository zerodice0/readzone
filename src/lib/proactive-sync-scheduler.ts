/**
 * Proactive Book Synchronization Scheduler
 * Implements background synchronization to improve user experience
 */

import { db } from '@/lib/db'
import { bookSyncService } from './book-sync-service'
import type { BookSyncCandidate } from './draft-batch-utils'

export interface SchedulerConfig {
  enabled: boolean
  syncInterval: number // minutes
  batchSize: number
  maxCandidates: number
  syncThreshold: number // minimum candidates to trigger sync
}

export interface SchedulerStats {
  lastRun: Date | null
  nextRun: Date | null
  totalRuns: number
  successfulRuns: number
  averageProcessingTime: number
  candidatesProcessed: number
  candidatesSynced: number
}

/**
 * Proactive Sync Scheduler
 * Automatically syncs draft books in the background to improve user experience
 */
export class ProactiveSyncScheduler {
  private static instance: ProactiveSyncScheduler
  private timer: NodeJS.Timeout | null = null
  private isRunning: boolean = false
  private stats: SchedulerStats = {
    lastRun: null,
    nextRun: null,
    totalRuns: 0,
    successfulRuns: 0,
    averageProcessingTime: 0,
    candidatesProcessed: 0,
    candidatesSynced: 0,
  }

  private config: SchedulerConfig = {
    enabled: true,
    syncInterval: 30, // 30 minutes
    batchSize: 20,
    maxCandidates: 100,
    syncThreshold: 5, // Only run if 5+ candidates
  }

  static getInstance(): ProactiveSyncScheduler {
    if (!this.instance) {
      this.instance = new ProactiveSyncScheduler()
    }
    return this.instance
  }

  /**
   * Start the proactive sync scheduler
   */
  start(customConfig?: Partial<SchedulerConfig>): void {
    if (customConfig) {
      this.config = { ...this.config, ...customConfig }
    }

    if (!this.config.enabled) {
      console.log('🔄 Proactive sync scheduler is disabled')
      return
    }

    if (this.timer) {
      console.log('🔄 Proactive sync scheduler already running')
      return
    }

    const intervalMs = this.config.syncInterval * 60 * 1000
    this.timer = setInterval(() => {
      this.runScheduledSync().catch(console.error)
    }, intervalMs)

    this.stats.nextRun = new Date(Date.now() + intervalMs)
    
    console.log(`🚀 Proactive sync scheduler started (interval: ${this.config.syncInterval}m)`)
    
    // Run initial sync after 2 minutes
    setTimeout(() => {
      this.runScheduledSync().catch(console.error)
    }, 2 * 60 * 1000)
  }

  /**
   * Stop the proactive sync scheduler
   */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
      this.stats.nextRun = null
      console.log('⏹️ Proactive sync scheduler stopped')
    }
  }

  /**
   * Run a scheduled synchronization cycle
   */
  private async runScheduledSync(): Promise<void> {
    if (this.isRunning) {
      console.log('⏭️ Skipping scheduled sync - already running')
      return
    }

    this.isRunning = true
    const startTime = Date.now()
    
    try {
      console.log('🔄 Starting proactive sync cycle...')
      
      // Find sync candidates
      const candidates = await this.findSyncCandidates()
      
      if (candidates.length < this.config.syncThreshold) {
        console.log(`📊 Not enough candidates (${candidates.length} < ${this.config.syncThreshold}), skipping sync`)
        return
      }

      console.log(`📚 Found ${candidates.length} sync candidates`)

      // Perform batch synchronization
      const syncResult = await bookSyncService.batchSync(
        candidates.map(c => c.draftId),
        this.config.batchSize
      )

      // Update statistics
      this.updateStats(startTime, syncResult.processed, syncResult.synced, true)

      console.log(`✅ Proactive sync completed:`)
      console.log(`  - Processed: ${syncResult.processed}`)
      console.log(`  - Synced: ${syncResult.synced}`)
      console.log(`  - Failed: ${syncResult.failed}`)
      console.log(`  - Duration: ${syncResult.duration}ms`)

      // Log any errors
      if (syncResult.errors.length > 0) {
        console.warn('⚠️ Proactive sync errors:', syncResult.errors.slice(0, 5)) // Log first 5 errors
      }

    } catch (error) {
      console.error('❌ Proactive sync failed:', error)
      this.updateStats(startTime, 0, 0, false)
    } finally {
      this.isRunning = false
      this.stats.nextRun = new Date(Date.now() + this.config.syncInterval * 60 * 1000)
    }
  }

  /**
   * Find candidates for proactive synchronization
   * Prioritizes recently accessed drafts for better user experience
   */
  private async findSyncCandidates(): Promise<BookSyncCandidate[]> {
    const candidates = await db.reviewDraft.findMany({
      where: {
        bookData: { not: null },
        bookId: null,
        status: 'DRAFT',
        // Prioritize drafts accessed in the last 24 hours
        lastAccessed: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      },
      select: {
        id: true,
        userId: true,
        bookData: true,
        title: true,
        lastAccessed: true,
      },
      orderBy: [
        { lastAccessed: 'desc' }, // Most recently accessed first
        { updatedAt: 'desc' }
      ],
      take: this.config.maxCandidates,
    })

    return candidates
      .filter(draft => draft.bookData) // Ensure bookData exists
      .map(draft => ({
        draftId: draft.id,
        userId: draft.userId,
        bookData: draft.bookData!,
        title: draft.title || undefined,
      }))
  }

  /**
   * Update scheduler statistics
   */
  private updateStats(startTime: number, processed: number, synced: number, successful: boolean): void {
    const duration = Date.now() - startTime
    
    this.stats.lastRun = new Date()
    this.stats.totalRuns++
    if (successful) this.stats.successfulRuns++
    
    // Update moving average for processing time
    this.stats.averageProcessingTime = 
      (this.stats.averageProcessingTime * (this.stats.totalRuns - 1) + duration) / this.stats.totalRuns
    
    this.stats.candidatesProcessed += processed
    this.stats.candidatesSynced += synced
  }

  /**
   * Get scheduler statistics
   */
  getStats(): SchedulerStats & { config: SchedulerConfig } {
    return {
      ...this.stats,
      config: { ...this.config }
    }
  }

  /**
   * Update scheduler configuration
   */
  updateConfig(newConfig: Partial<SchedulerConfig>): void {
    const oldInterval = this.config.syncInterval
    this.config = { ...this.config, ...newConfig }
    
    // Restart with new interval if it changed
    if (this.timer && oldInterval !== this.config.syncInterval) {
      this.stop()
      this.start()
    }
    
    console.log('🔧 Proactive sync config updated:', this.config)
  }

  /**
   * Manual trigger for sync (for testing or admin use)
   */
  async triggerManualSync(): Promise<{
    success: boolean
    processed: number
    synced: number
    duration: number
    error?: string
  }> {
    if (this.isRunning) {
      return {
        success: false,
        processed: 0,
        synced: 0,
        duration: 0,
        error: 'Sync already running'
      }
    }

    const startTime = Date.now()
    
    try {
      const candidates = await this.findSyncCandidates()
      const syncResult = await bookSyncService.batchSync(
        candidates.map(c => c.draftId),
        this.config.batchSize
      )

      this.updateStats(startTime, syncResult.processed, syncResult.synced, true)

      return {
        success: true,
        processed: syncResult.processed,
        synced: syncResult.synced,
        duration: Date.now() - startTime
      }
    } catch (error) {
      this.updateStats(startTime, 0, 0, false)
      
      return {
        success: false,
        processed: 0,
        synced: 0,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Health check for the scheduler
   */
  isHealthy(): boolean {
    const now = Date.now()
    const expectedInterval = this.config.syncInterval * 60 * 1000
    const maxDelay = expectedInterval * 1.5 // 50% tolerance
    
    // Check if scheduler is enabled and timer exists
    if (!this.config.enabled || !this.timer) {
      return !this.config.enabled // Healthy if disabled intentionally
    }

    // Check if last run was within expected timeframe
    if (this.stats.lastRun) {
      const timeSinceLastRun = now - this.stats.lastRun.getTime()
      return timeSinceLastRun <= maxDelay
    }

    // No last run yet, check if it's been too long since start
    return true // Give it time for the first run
  }
}

// Export singleton instance
export const proactiveSyncScheduler = ProactiveSyncScheduler.getInstance()

// Auto-start in production (can be disabled via config)
if (process.env.NODE_ENV === 'production') {
  // Start after a delay to allow app initialization
  setTimeout(() => {
    proactiveSyncScheduler.start({
      enabled: process.env.PROACTIVE_SYNC_ENABLED !== 'false',
      syncInterval: parseInt(process.env.PROACTIVE_SYNC_INTERVAL || '30'),
      batchSize: parseInt(process.env.PROACTIVE_SYNC_BATCH_SIZE || '20'),
    })
  }, 5000)
}
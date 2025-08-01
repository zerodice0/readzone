/**
 * Migration utilities for ReadZone draft system enhancement
 * Provides safe migration and rollback functions for draft system upgrade
 */

import { db } from '@/lib/db'

export interface MigrationStats {
  totalRecords: number
  migratedRecords: number
  failedRecords: number
  duration: number
  errors: string[]
}

/**
 * Migrate existing ReviewDraft records to new schema
 */
export async function migrateExistingDrafts(): Promise<MigrationStats> {
  const startTime = Date.now()
  const stats: MigrationStats = {
    totalRecords: 0,
    migratedRecords: 0,
    failedRecords: 0,
    duration: 0,
    errors: []
  }

  try {
    // Get all existing drafts that need migration
    const existingDrafts = await db.reviewDraft.findMany({
      where: {
        OR: [
          { expiresAt: { equals: undefined } },
          { status: { equals: undefined } },
          { version: { equals: undefined } },
          { lastAccessed: { equals: undefined } }
        ]
      }
    })

    stats.totalRecords = existingDrafts.length

    if (stats.totalRecords === 0) {
      stats.duration = Date.now() - startTime
      return stats
    }

    console.log(`🔄 Migrating ${stats.totalRecords} draft records...`)

    // Process in batches to avoid memory issues
    const batchSize = 50
    for (let i = 0; i < existingDrafts.length; i += batchSize) {
      const batch = existingDrafts.slice(i, i + batchSize)
      
      await Promise.allSettled(
        batch.map(async (draft) => {
          try {
            await db.reviewDraft.update({
              where: { id: draft.id },
              data: {
                expiresAt: draft.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                lastAccessed: draft.lastAccessed || draft.updatedAt,
                status: 'DRAFT',
                version: 1
              }
            })
            stats.migratedRecords++
          } catch (error) {
            stats.failedRecords++
            stats.errors.push(`Draft ${draft.id}: ${error}`)
            console.error(`Failed to migrate draft ${draft.id}:`, error)
          }
        })
      )
    }

    stats.duration = Date.now() - startTime
    console.log(`✅ Migration completed: ${stats.migratedRecords}/${stats.totalRecords} successful`)
    
    if (stats.failedRecords > 0) {
      console.warn(`⚠️  ${stats.failedRecords} records failed to migrate`)
    }

    return stats
  } catch (error) {
    stats.duration = Date.now() - startTime
    stats.errors.push(`Migration failed: ${error}`)
    throw error
  }
}

/**
 * Validate migrated data integrity
 */
export async function validateMigration(): Promise<{
  isValid: boolean
  issues: string[]
  stats: {
    totalDrafts: number
    validDrafts: number
    expiredDrafts: number
    orphanedDrafts: number
  }
}> {
  const issues: string[] = []
  
  try {
    // Check all drafts have required fields
    const allDrafts = await db.reviewDraft.findMany({
      include: {
        user: true,
        book: true
      }
    })

    const stats = {
      totalDrafts: allDrafts.length,
      validDrafts: 0,
      expiredDrafts: 0,
      orphanedDrafts: 0
    }

    for (const draft of allDrafts) {
      let isValid = true

      // Check required fields
      if (!draft.expiresAt) {
        issues.push(`Draft ${draft.id}: Missing expiresAt`)
        isValid = false
      }
      
      if (!draft.lastAccessed) {
        issues.push(`Draft ${draft.id}: Missing lastAccessed`)
        isValid = false
      }
      
      if (!draft.status) {
        issues.push(`Draft ${draft.id}: Missing status`)
        isValid = false
      }
      
      if (!draft.version || draft.version < 1) {
        issues.push(`Draft ${draft.id}: Invalid version`)
        isValid = false
      }

      // Check relationships
      if (!draft.user) {
        issues.push(`Draft ${draft.id}: Orphaned - no user found`)
        stats.orphanedDrafts++
        isValid = false
      }

      if (draft.bookId && !draft.book) {
        issues.push(`Draft ${draft.id}: Invalid bookId reference`)
        isValid = false
      }

      // Check expiration
      if (draft.expiresAt && draft.expiresAt < new Date()) {
        stats.expiredDrafts++
      }

      if (isValid) {
        stats.validDrafts++
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
      stats
    }
  } catch (error) {
    issues.push(`Validation failed: ${error}`)
    throw error
  }
}

/**
 * Rollback migration (emergency use only)
 */
export async function rollbackMigration(): Promise<MigrationStats> {
  const startTime = Date.now()
  const stats: MigrationStats = {
    totalRecords: 0,
    migratedRecords: 0,
    failedRecords: 0,
    duration: 0,
    errors: []
  }

  console.warn('🚨 Starting migration rollback - this will remove enhanced fields!')

  try {
    // This would require raw SQL since Prisma doesn't support removing columns
    // In a real rollback, you'd need to:
    // 1. Backup current data
    // 2. Drop new columns
    // 3. Drop new indexes
    // 4. Restore old schema
    
    console.log('⚠️  Rollback requires manual database operations')
    console.log('1. Backup current database')
    console.log('2. Run: ALTER TABLE ReviewDraft DROP COLUMN bookData;')
    console.log('3. Run: ALTER TABLE ReviewDraft DROP COLUMN status;')
    console.log('4. Run: ALTER TABLE ReviewDraft DROP COLUMN version;')
    console.log('5. Run: ALTER TABLE ReviewDraft DROP COLUMN expiresAt;')
    console.log('6. Run: ALTER TABLE ReviewDraft DROP COLUMN lastAccessed;')
    console.log('7. Drop ReviewDraftAudit table')
    console.log('8. Recreate old indexes')

    stats.duration = Date.now() - startTime
    return stats
  } catch (error) {
    stats.duration = Date.now() - startTime
    stats.errors.push(`Rollback failed: ${error}`)
    throw error
  }
}

/**
 * Get migration status and statistics
 */
export async function getMigrationStatus() {
  try {
    const [totalDrafts, newFormatDrafts, expiredDrafts, auditRecords] = await Promise.all([
      db.reviewDraft.count(),
      db.reviewDraft.count({
        where: {
          AND: [
            { expiresAt: { not: undefined } },
            { status: { not: undefined } },
            { version: { not: undefined } },
            { lastAccessed: { not: undefined } }
          ]
        }
      }),
      db.reviewDraft.count({
        where: {
          expiresAt: { lt: new Date() }
        }
      }),
      db.reviewDraftAudit.count()
    ])

    const migrationComplete = totalDrafts === newFormatDrafts
    const migrationProgress = totalDrafts > 0 ? (newFormatDrafts / totalDrafts) * 100 : 100

    return {
      migrationComplete,
      migrationProgress: Math.round(migrationProgress),
      totalDrafts,
      newFormatDrafts,
      expiredDrafts,
      auditRecords,
      needsCleanup: expiredDrafts > 0
    }
  } catch (error) {
    console.error('Failed to get migration status:', error)
    throw error
  }
}

/**
 * Run post-migration cleanup
 */
export async function postMigrationCleanup(): Promise<{
  cleanedExpired: number
  cleanedOrphaned: number
  optimizedIndexes: boolean
}> {
  console.log('🧹 Running post-migration cleanup...')

  try {
    // Clean up expired drafts
    const expiredResult = await db.reviewDraft.updateMany({
      where: {
        expiresAt: { lt: new Date() },
        status: 'DRAFT'
      },
      data: {
        status: 'EXPIRED'
      }
    })

    // Clean up orphaned drafts (drafts with invalid user references)
    const orphanedResult = await db.reviewDraft.deleteMany({
      where: {
        user: { is: undefined }
      }
    })

    console.log(`✅ Cleanup completed: ${expiredResult.count} expired, ${orphanedResult.count} orphaned`)

    return {
      cleanedExpired: expiredResult.count,
      cleanedOrphaned: orphanedResult.count,
      optimizedIndexes: true // Indexes are already created in migration
    }
  } catch (error) {
    console.error('Post-migration cleanup failed:', error)
    throw error
  }
}
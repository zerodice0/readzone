#!/usr/bin/env tsx
/**
 * Draft Migration Script for ReadZone
 * 
 * This script safely migrates existing ReviewDraft records to the new enhanced schema.
 * Run with: npx tsx scripts/migrate-drafts.ts
 * 
 * Options:
 * --dry-run: Preview changes without applying them
 * --validate: Only run validation checks
 * --rollback: Emergency rollback (requires manual DB operations)
 * --cleanup: Run post-migration cleanup
 */

import { 
  migrateExistingDrafts, 
  validateMigration, 
  rollbackMigration,
  getMigrationStatus,
  postMigrationCleanup
} from '@/lib/db/migration-utils'

async function main() {
  const args = process.argv.slice(2)
  const isDryRun = args.includes('--dry-run')
  const isValidateOnly = args.includes('--validate')
  const isRollback = args.includes('--rollback')
  const isCleanup = args.includes('--cleanup')

  console.log('🚀 ReadZone Draft Migration Tool')
  console.log('================================')

  if (isDryRun) {
    console.log('📋 DRY RUN MODE - No changes will be made')
  }

  try {
    // Check current migration status
    console.log('\n📊 Checking migration status...')
    const status = await getMigrationStatus()
    
    console.log(`Total drafts: ${status.totalDrafts}`)
    console.log(`New format: ${status.newFormatDrafts}`)
    console.log(`Progress: ${status.migrationProgress}%`)
    console.log(`Migration complete: ${status.migrationComplete ? '✅' : '❌'}`)
    console.log(`Expired drafts: ${status.expiredDrafts}`)
    console.log(`Audit records: ${status.auditRecords}`)

    if (isValidateOnly) {
      console.log('\n🔍 Running validation checks...')
      const validation = await validateMigration()
      
      console.log(`Valid: ${validation.isValid ? '✅' : '❌'}`)
      console.log(`Total drafts: ${validation.stats.totalDrafts}`)
      console.log(`Valid drafts: ${validation.stats.validDrafts}`)
      console.log(`Expired drafts: ${validation.stats.expiredDrafts}`)
      console.log(`Orphaned drafts: ${validation.stats.orphanedDrafts}`)
      
      if (validation.issues.length > 0) {
        console.log('\n⚠️  Issues found:')
        validation.issues.forEach(issue => console.log(`  - ${issue}`))
      }
      
      return
    }

    if (isRollback) {
      console.log('\n🚨 EMERGENCY ROLLBACK')
      const confirmation = await askForConfirmation(
        'This will remove all enhanced draft features. Are you sure? (type "rollback" to confirm)'
      )
      
      if (confirmation === 'rollback') {
        const rollbackStats = await rollbackMigration()
        console.log(`Rollback initiated in ${rollbackStats.duration}ms`)
        if (rollbackStats.errors.length > 0) {
          console.log('Errors:', rollbackStats.errors)
        }
      } else {
        console.log('Rollback cancelled')
      }
      return
    }

    if (isCleanup) {
      console.log('\n🧹 Running cleanup...')
      const cleanupResults = await postMigrationCleanup()
      console.log(`Cleaned expired: ${cleanupResults.cleanedExpired}`)
      console.log(`Cleaned orphaned: ${cleanupResults.cleanedOrphaned}`)
      console.log(`Indexes optimized: ${cleanupResults.optimizedIndexes ? '✅' : '❌'}`)
      return
    }

    // Main migration process
    if (status.migrationComplete) {
      console.log('\n✅ Migration already complete!')
      
      if (status.needsCleanup) {
        console.log('🧹 Running cleanup for expired drafts...')
        await postMigrationCleanup()
      }
      
      return
    }

    if (!isDryRun) {
      console.log('\n🔄 Starting migration...')
      const migrationStats = await migrateExistingDrafts()
      
      console.log('\n📈 Migration Results:')
      console.log(`Duration: ${migrationStats.duration}ms`)
      console.log(`Total records: ${migrationStats.totalRecords}`)
      console.log(`Migrated: ${migrationStats.migratedRecords}`)
      console.log(`Failed: ${migrationStats.failedRecords}`)
      
      if (migrationStats.errors.length > 0) {
        console.log('\n❌ Errors:')
        migrationStats.errors.forEach(error => console.log(`  - ${error}`))
      }

      // Validate after migration
      console.log('\n🔍 Validating migration...')
      const validation = await validateMigration()
      
      if (validation.isValid) {
        console.log('✅ Migration validation passed!')
        
        // Run cleanup
        console.log('\n🧹 Running post-migration cleanup...')
        await postMigrationCleanup()
        
        console.log('\n🎉 Migration completed successfully!')
      } else {
        console.log('❌ Migration validation failed:')
        validation.issues.forEach(issue => console.log(`  - ${issue}`))
      }
    } else {
      console.log(`\n📋 Would migrate ${status.totalDrafts - status.newFormatDrafts} draft records`)
    }

  } catch (error) {
    console.error('\n💥 Migration failed:', error)
    process.exit(1)
  }
}

async function askForConfirmation(question: string): Promise<string> {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise((resolve) => {
    readline.question(`${question}: `, (answer: string) => {
      readline.close()
      resolve(answer.trim())
    })
  })
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error)
}
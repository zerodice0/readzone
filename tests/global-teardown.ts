import { FullConfig } from '@playwright/test'

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Global teardown starting...')
  
  try {
    const fs = require('fs')
    const path = require('path')
    
    // Clean up test database files
    const testDbFiles = [
      'test-global.db',
      'test-e2e.db',
      'test-security.db',
      'test-security-e2e.db',
      'build-validation.db'
    ]
    
    for (const dbFile of testDbFiles) {
      const fullPath = path.join(process.cwd(), dbFile)
      if (fs.existsSync(fullPath)) {
        console.log(`🗑️  Removing test database: ${dbFile}`)
        fs.unlinkSync(fullPath)
      }
    }
    
    // Clean up test artifacts that might be left behind
    const testArtifacts = [
      'test-results',
      'playwright-report',
      'coverage'
    ]
    
    for (const artifact of testArtifacts) {
      const fullPath = path.join(process.cwd(), artifact)
      if (fs.existsSync(fullPath)) {
        console.log(`🗑️  Cleaning test artifact: ${artifact}`)
        fs.rmSync(fullPath, { recursive: true, force: true })
      }
    }
    
    console.log('✅ Global teardown completed successfully')
  } catch (error) {
    console.error('❌ Global teardown failed:', error)
    // Don't throw error in teardown to avoid masking test failures
  }
}

export default globalTeardown
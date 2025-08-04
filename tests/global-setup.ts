import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Global setup starting...')
  
  // Set up test database
  const { execSync } = require('child_process')
  
  try {
    // Generate Prisma client for tests
    console.log('📦 Generating Prisma client...')
    execSync('npx prisma generate', { stdio: 'inherit' })
    
    // Push database schema for tests
    console.log('🗄️ Setting up test database...')
    execSync('npx prisma db push --force-reset', { 
      stdio: 'inherit',
      env: { 
        ...process.env,
        DATABASE_URL: process.env.TEST_DATABASE_URL || 'file:./test-global.db'
      }
    })
    
    // Seed test data if needed
    if (process.env.SEED_TEST_DATA === 'true') {
      console.log('🌱 Seeding test data...')
      execSync('npm run db:seed', { 
        stdio: 'inherit',
        env: { 
          ...process.env,
          DATABASE_URL: process.env.TEST_DATABASE_URL || 'file:./test-global.db'
        }
      })
    }
    
    console.log('✅ Global setup completed successfully')
  } catch (error) {
    console.error('❌ Global setup failed:', error)
    throw error
  }
}

export default globalSetup
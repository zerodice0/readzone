/**
 * Draft System Load Testing Suite
 * Based on PRD Performance Requirements
 * 
 * Target Requirements:
 * - Concurrent Users: 1,000
 * - Draft Save TPS: 100/second
 * - Response Times: Save <500ms, List <1s, Restore <2s, Sync <1s
 * - Success Rate: >99.9%
 */

import { test, type Page, type BrowserContext } from '@playwright/test'
import { performance } from 'perf_hooks'

// Test Configuration
const CONFIG = {
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  apiUrl: process.env.API_URL || 'http://localhost:3000/api',
  testDuration: 300, // 5 minutes
  rampUpTime: 60, // 1 minute
  targetVirtualUsers: 1000,
  targetTPS: 100,
  
  // Performance Thresholds
  thresholds: {
    draftSave: { p95: 500, p99: 800 },
    draftList: { p95: 1000, p99: 1500 },
    draftRestore: { p95: 2000, p99: 3000 },
    bookSync: { p95: 1000, p99: 1500 },
    successRate: 0.999, // 99.9%
  }
}

// Performance Metrics Collector
class MetricsCollector {
  private metrics: Map<string, number[]> = new Map()
  private errors: Map<string, number> = new Map()
  private startTime: number = Date.now()

  recordMetric(operation: string, duration: number, success: boolean = true) {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, [])
      this.errors.set(operation, 0)
    }

    if (success) {
      this.metrics.get(operation)!.push(duration)
    } else {
      this.errors.set(operation, (this.errors.get(operation) || 0) + 1)
    }
  }

  getPercentile(operation: string, percentile: number): number {
    const values = this.metrics.get(operation) || []
    if (values.length === 0) return 0

    const sorted = [...values].sort((a, b) => a - b)
    const index = Math.ceil((percentile / 100) * sorted.length) - 1
    return sorted[index] || 0
  }

  getSuccessRate(operation: string): number {
    const successes = (this.metrics.get(operation) || []).length
    const errors = this.errors.get(operation) || 0
    const total = successes + errors
    return total === 0 ? 0 : successes / total
  }

  getTPS(operation: string): number {
    const count = (this.metrics.get(operation) || []).length
    const duration = (Date.now() - this.startTime) / 1000
    return count / duration
  }

  getReport() {
    const operations = Array.from(this.metrics.keys())
    const report: any = {
      summary: {
        duration: (Date.now() - this.startTime) / 1000,
        totalOperations: 0,
        totalErrors: 0,
      },
      operations: {}
    }

    operations.forEach(op => {
      const metrics = this.metrics.get(op) || []
      const errors = this.errors.get(op) || 0
      
      report.operations[op] = {
        count: metrics.length,
        errors,
        successRate: this.getSuccessRate(op),
        tps: this.getTPS(op),
        latency: {
          min: Math.min(...metrics),
          max: Math.max(...metrics),
          avg: metrics.reduce((a, b) => a + b, 0) / metrics.length,
          p50: this.getPercentile(op, 50),
          p95: this.getPercentile(op, 95),
          p99: this.getPercentile(op, 99),
        }
      }

      report.summary.totalOperations += metrics.length
      report.summary.totalErrors += errors
    })

    report.summary.overallSuccessRate = 
      report.summary.totalOperations / (report.summary.totalOperations + report.summary.totalErrors)

    return report
  }
}

// Virtual User Class
class VirtualUser {
  private page: Page
  private userId: string
  private authToken: string
  private metrics: MetricsCollector

  constructor(page: Page, _context: BrowserContext, userId: string, metrics: MetricsCollector) {
    this.page = page
    this.userId = userId
    this.metrics = metrics
    this.authToken = ''
  }

  async login() {
    const start = performance.now()
    try {
      const response = await this.page.request.post(`${CONFIG.apiUrl}/auth/login`, {
        data: {
          email: `testuser${this.userId}@example.com`,
          password: 'TestPassword123!'
        }
      })

      if (response.ok()) {
        const data = await response.json()
        this.authToken = data.token
        this.metrics.recordMetric('auth_login', performance.now() - start)
      } else {
        throw new Error(`Login failed: ${response.status()}`)
      }
    } catch (error) {
      this.metrics.recordMetric('auth_login', performance.now() - start, false)
      throw error
    }
  }

  async saveDraft(content: string) {
    const start = performance.now()
    try {
      const response = await this.page.request.post(`${CONFIG.apiUrl}/reviews/draft`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          content,
          title: `Load Test Draft ${Date.now()}`,
          bookData: JSON.stringify({
            isbn: '9788937834790',
            title: '데미안',
            authors: ['헤르만 헤세'],
            thumbnail: 'https://example.com/book.jpg'
          }),
          metadata: {
            lastSavedAt: new Date().toISOString(),
            wordCount: content.split(' ').length
          }
        }
      })

      const duration = performance.now() - start
      
      if (response.ok()) {
        const data = await response.json()
        this.metrics.recordMetric('draft_save', duration)
        return data.data.draft.id
      } else {
        throw new Error(`Save draft failed: ${response.status()}`)
      }
    } catch (error) {
      this.metrics.recordMetric('draft_save', performance.now() - start, false)
      throw error
    }
  }

  async listDrafts(page: number = 1, limit: number = 10) {
    const start = performance.now()
    try {
      const response = await this.page.request.get(
        `${CONFIG.apiUrl}/reviews/draft?page=${page}&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${this.authToken}`
          }
        }
      )

      const duration = performance.now() - start
      
      if (response.ok()) {
        const data = await response.json()
        this.metrics.recordMetric('draft_list', duration)
        return data.data.items
      } else {
        throw new Error(`List drafts failed: ${response.status()}`)
      }
    } catch (error) {
      this.metrics.recordMetric('draft_list', performance.now() - start, false)
      throw error
    }
  }

  async restoreDraft(draftId: string) {
    const start = performance.now()
    try {
      const response = await this.page.request.get(
        `${CONFIG.apiUrl}/reviews/draft/${draftId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.authToken}`
          }
        }
      )

      const duration = performance.now() - start
      
      if (response.ok()) {
        const data = await response.json()
        this.metrics.recordMetric('draft_restore', duration)
        
        // Check if book was synced
        if (data.data.synced) {
          this.metrics.recordMetric('book_sync', duration)
        }
        
        return data.data.draft
      } else {
        throw new Error(`Restore draft failed: ${response.status()}`)
      }
    } catch (error) {
      this.metrics.recordMetric('draft_restore', performance.now() - start, false)
      throw error
    }
  }

  async runUserScenario() {
    // Realistic user behavior scenario
    const scenarios = [
      this.scenarioCreateAndSaveDraft.bind(this),
      this.scenarioListAndRestoreDraft.bind(this),
      this.scenarioMultipleDraftUpdates.bind(this),
      this.scenarioConcurrentDraftOperations.bind(this)
    ]

    // Randomly select and execute a scenario
    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)]
    await scenario()
  }

  private async scenarioCreateAndSaveDraft() {
    // User creates new draft and saves multiple times
    const content = this.generateDraftContent()
    await this.saveDraft(content)
    
    // Simulate auto-save every 30 seconds
    for (let i = 0; i < 3; i++) {
      await this.page.waitForTimeout(30000)
      await this.saveDraft(content + `\n\n추가 내용 ${i + 1}`)
    }
  }

  private async scenarioListAndRestoreDraft() {
    // User lists drafts and restores one
    const drafts = await this.listDrafts()
    
    if (drafts.length > 0) {
      const randomDraft = drafts[Math.floor(Math.random() * drafts.length)]
      await this.restoreDraft(randomDraft.id)
    }
  }

  private async scenarioMultipleDraftUpdates() {
    // User creates multiple drafts (up to 5)
    const draftCount = Math.floor(Math.random() * 5) + 1
    
    for (let i = 0; i < draftCount; i++) {
      const content = this.generateDraftContent()
      await this.saveDraft(content)
      await this.page.waitForTimeout(1000) // Brief pause between saves
    }
  }

  private async scenarioConcurrentDraftOperations() {
    // Simulate concurrent operations
    const operations = [
      this.saveDraft(this.generateDraftContent()),
      this.listDrafts(),
      this.listDrafts(2, 5)
    ]

    await Promise.all(operations)
  }

  private generateDraftContent(): string {
    const templates = [
      '이 책을 읽으면서 느낀 점은 정말 많았습니다. 특히 주인공의 성장 과정이 인상적이었는데...',
      '작가의 문체가 매우 독특하고 흥미로웠습니다. 각 장면의 묘사가 생생하게 그려져서...',
      '이 책의 주제는 현대 사회의 문제점을 잘 보여주고 있습니다. 특히 인간관계에 대한...',
      '처음에는 이해하기 어려웠지만, 읽다 보니 점점 빠져들게 되었습니다. 특히 중반부의...',
      '이 책을 통해 많은 것을 배울 수 있었습니다. 저자의 통찰력이 돋보이는 부분은...'
    ]

    const content = templates[Math.floor(Math.random() * templates.length)]
    const wordCount = Math.floor(Math.random() * 1000) + 500 // 500-1500 words

    // Generate additional content to reach target word count
    let fullContent = content
    while (fullContent.split(' ').length < wordCount) {
      fullContent += ` ${templates[Math.floor(Math.random() * templates.length)]}`
    }

    return fullContent
  }
}

// Main Load Test Suite
test.describe('Draft System Load Test', () => {
  let metrics: MetricsCollector

  test.beforeAll(async () => {
    metrics = new MetricsCollector()
    console.log('🚀 Starting load test with configuration:', CONFIG)
  })

  test('Execute load test scenario', async ({ browser }) => {
    const virtualUsers: VirtualUser[] = []
    const userPromises: Promise<void>[] = []

    // Ramp-up phase
    console.log('📈 Starting ramp-up phase...')
    const rampUpInterval = CONFIG.rampUpTime * 1000 / CONFIG.targetVirtualUsers

    for (let i = 0; i < CONFIG.targetVirtualUsers; i++) {
      const userPromise = (async () => {
        // Stagger user creation
        await new Promise(resolve => setTimeout(resolve, i * rampUpInterval))

        const context = await browser.newContext()
        const page = await context.newPage()
        const user = new VirtualUser(page, context, `user${i}`, metrics)

        try {
          // Login user
          await user.login()
          virtualUsers.push(user)

          // Run scenarios for test duration
          const endTime = Date.now() + (CONFIG.testDuration * 1000)
          while (Date.now() < endTime) {
            await user.runUserScenario()
            
            // Think time between scenarios (1-5 seconds)
            const thinkTime = Math.random() * 4000 + 1000
            await page.waitForTimeout(thinkTime)
          }
        } catch (error) {
          console.error(`User ${i} failed:`, error)
        } finally {
          await context.close()
        }
      })()

      userPromises.push(userPromise)
    }

    // Wait for all users to complete
    await Promise.all(userPromises)

    // Generate and validate report
    const report = metrics.getReport()
    console.log('📊 Load Test Report:', JSON.stringify(report, null, 2))

    // Validate against thresholds
    validatePerformance(report)
  })

  function validatePerformance(report: any) {
    const failures: string[] = []

    // Check draft save performance
    if (report.operations.draft_save) {
      const save = report.operations.draft_save
      if (save.latency.p95 > CONFIG.thresholds.draftSave.p95) {
        failures.push(`Draft save P95 (${save.latency.p95}ms) exceeds threshold (${CONFIG.thresholds.draftSave.p95}ms)`)
      }
      if (save.successRate < CONFIG.thresholds.successRate) {
        failures.push(`Draft save success rate (${save.successRate}) below threshold (${CONFIG.thresholds.successRate})`)
      }
    }

    // Check draft list performance
    if (report.operations.draft_list) {
      const list = report.operations.draft_list
      if (list.latency.p95 > CONFIG.thresholds.draftList.p95) {
        failures.push(`Draft list P95 (${list.latency.p95}ms) exceeds threshold (${CONFIG.thresholds.draftList.p95}ms)`)
      }
    }

    // Check draft restore performance
    if (report.operations.draft_restore) {
      const restore = report.operations.draft_restore
      if (restore.latency.p95 > CONFIG.thresholds.draftRestore.p95) {
        failures.push(`Draft restore P95 (${restore.latency.p95}ms) exceeds threshold (${CONFIG.thresholds.draftRestore.p95}ms)`)
      }
    }

    // Check book sync performance
    if (report.operations.book_sync) {
      const sync = report.operations.book_sync
      if (sync.latency.p95 > CONFIG.thresholds.bookSync.p95) {
        failures.push(`Book sync P95 (${sync.latency.p95}ms) exceeds threshold (${CONFIG.thresholds.bookSync.p95}ms)`)
      }
    }

    // Check TPS
    if (report.operations.draft_save && report.operations.draft_save.tps < CONFIG.targetTPS) {
      failures.push(`Draft save TPS (${report.operations.draft_save.tps}) below target (${CONFIG.targetTPS})`)
    }

    // Report results
    if (failures.length > 0) {
      console.error('❌ Performance validation failed:')
      failures.forEach(failure => console.error(`  - ${failure}`))
      throw new Error('Load test failed performance thresholds')
    } else {
      console.log('✅ All performance thresholds met!')
    }
  }
})

// Stress Test - Beyond Normal Load
test.describe('Draft System Stress Test', () => {
  test.skip('Stress test - 2x normal load', async ({ browser: _browser }) => {
    // Double the normal load to find breaking point
    // const stressConfig = {
    //   ...CONFIG,
    //   targetVirtualUsers: CONFIG.targetVirtualUsers * 2,
    //   targetTPS: CONFIG.targetTPS * 2,
    //   testDuration: 180 // 3 minutes
    // }

    // console.log('💥 Starting stress test with 2x load:', stressConfig)
    // Similar implementation to load test but with higher load
  })
})

// Spike Test - Sudden Load Increase
test.describe('Draft System Spike Test', () => {
  test.skip('Spike test - sudden load increase', async ({ browser: _browser }) => {
    // Test system behavior under sudden load spikes
    console.log('⚡ Starting spike test...')
    
    // Start with normal load
    // Suddenly increase to 3x load
    // Return to normal load
    // Measure recovery time
  })
})

// Endurance Test - Extended Duration
test.describe('Draft System Endurance Test', () => {
  test.skip('Endurance test - 1 hour sustained load', async ({ browser: _browser }) => {
    // Test system stability over extended period
    // const enduranceConfig = {
    //   ...CONFIG,
    //   testDuration: 3600, // 1 hour
    //   targetVirtualUsers: 500 // Moderate sustained load
    // }

    console.log('⏱️ Starting endurance test for 1 hour...')
    // Monitor for memory leaks, connection pool exhaustion, etc.
  })
})
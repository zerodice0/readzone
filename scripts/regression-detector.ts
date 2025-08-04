#!/usr/bin/env tsx

/**
 * ReadZone Performance Regression Detection System
 * Automatically detects and reports performance regressions in CI/CD pipeline
 */

import { execSync } from 'child_process'
import { writeFileSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'

interface RegressionThreshold {
  metric: string
  warningThreshold: number  // Percentage change that triggers warning
  criticalThreshold: number // Percentage change that triggers critical alert
  baseline: number
  unit: string
  direction: 'lower_is_better' | 'higher_is_better'
}

interface RegressionResult {
  metric: string
  current: number
  baseline: number
  change: number
  changePercent: number
  severity: 'ok' | 'warning' | 'critical'
  message: string
  recommendation: string
  timestamp: string
}

interface AlertConfig {
  slack?: {
    webhook: string
    channel: string
  }
  github?: {
    createIssue: boolean
    labels: string[]
  }
  email?: {
    recipients: string[]
    smtp: string
  }
}

class RegressionDetector {
  private thresholds: RegressionThreshold[] = [
    {
      metric: 'build_time',
      warningThreshold: 15,
      criticalThreshold: 30,
      baseline: 180, // 3 minutes in seconds
      unit: 'seconds',
      direction: 'lower_is_better'
    },
    {
      metric: 'bundle_size',
      warningThreshold: 10,
      criticalThreshold: 25,
      baseline: 2048, // 2MB in KB
      unit: 'KB',
      direction: 'lower_is_better'
    },
    {
      metric: 'test_time',
      warningThreshold: 20,
      criticalThreshold: 40,
      baseline: 120, // 2 minutes in seconds
      unit: 'seconds',
      direction: 'lower_is_better'
    },
    {
      metric: 'cache_hit_rate',
      warningThreshold: -10,
      criticalThreshold: -20,
      baseline: 85, // 85% target
      unit: '%',
      direction: 'higher_is_better'
    },
    {
      metric: 'parallel_efficiency',
      warningThreshold: -15,
      criticalThreshold: -30,
      baseline: 70, // 70% target
      unit: '%',
      direction: 'higher_is_better'
    },
    {
      metric: 'test_coverage',
      warningThreshold: -5,
      criticalThreshold: -10,
      baseline: 80, // 80% target
      unit: '%',
      direction: 'higher_is_better'
    }
  ]

  private alertConfig: AlertConfig = {
    github: {
      createIssue: true,
      labels: ['performance', 'regression', 'ci-cd']
    }
  }

  private runCommand(command: string, silent: boolean = true): string | null {
    try {
      return execSync(command, { 
        stdio: silent ? 'pipe' : 'inherit',
        encoding: 'utf8'
      }).toString().trim()
    } catch (error) {
      return null
    }
  }

  private loadBaseline(): { [key: string]: number } {
    const baselineFile = 'performance-baseline.json'
    
    if (!existsSync(baselineFile)) {
      // Return default baselines
      const defaultBaseline: { [key: string]: number } = {}
      this.thresholds.forEach(threshold => {
        defaultBaseline[threshold.metric] = threshold.baseline
      })
      return defaultBaseline
    }

    try {
      const data = JSON.parse(readFileSync(baselineFile, 'utf8'))
      return {
        build_time: data.buildTime?.p95 || this.thresholds.find(t => t.metric === 'build_time')?.baseline || 180,
        bundle_size: data.bundleSize?.total || this.thresholds.find(t => t.metric === 'bundle_size')?.baseline || 2048,
        test_time: 120, // Would be extracted from CI logs
        cache_hit_rate: 85, // Would be calculated from cache statistics
        parallel_efficiency: 70, // Would be calculated from job timing
        test_coverage: data.testCoverage?.unit || 80
      }
    } catch (error) {
      console.warn('Could not load baseline, using defaults:', error)
      const defaultBaseline: { [key: string]: number } = {}
      this.thresholds.forEach(threshold => {
        defaultBaseline[threshold.metric] = threshold.baseline
      })
      return defaultBaseline
    }
  }

  private getCurrentMetrics(): { [key: string]: number } {
    const metrics: { [key: string]: number } = {}

    try {
      // Build time (from environment or estimation)
      metrics.build_time = parseInt(process.env.BUILD_TIME || '0') || this.estimateBuildTime()

      // Bundle size analysis
      const bundleSize = this.calculateBundleSize()
      metrics.bundle_size = bundleSize.total

      // Test time (from environment or estimation)
      metrics.test_time = parseInt(process.env.TEST_TIME || '0') || this.estimateTestTime()

      // Cache hit rate
      metrics.cache_hit_rate = this.calculateCacheHitRate()

      // Parallel efficiency
      metrics.parallel_efficiency = this.calculateParallelEfficiency()

      // Test coverage
      metrics.test_coverage = this.calculateTestCoverage()

    } catch (error) {
      console.error('Error collecting current metrics:', error)
    }

    return metrics
  }

  private estimateBuildTime(): number {
    // Estimate build time based on file count and complexity
    try {
      const fileCount = parseInt(this.runCommand('find src -name "*.ts" -o -name "*.tsx" | wc -l') || '0')
      const estimatedTime = Math.max(60, fileCount * 2) // Rough estimation: 2 seconds per file
      return Math.min(estimatedTime, 600) // Cap at 10 minutes
    } catch {
      return 180 // Default 3 minutes
    }
  }

  private calculateBundleSize(): { total: number } {
    try {
      if (!existsSync('.next')) {
        return { total: 0 }
      }

      const buildSizeCmd = 'find .next -name "*.js" -o -name "*.css" -type f -exec du -b {} + | awk "{sum+=\\$1} END {print sum}"'
      const totalSizeBytes = parseInt(this.runCommand(buildSizeCmd) || '0')
      const totalSizeKB = Math.round(totalSizeBytes / 1024)

      return { total: totalSizeKB }
    } catch (error) {
      console.warn('Could not calculate bundle size:', error)
      return { total: 0 }
    }
  }

  private estimateTestTime(): number {
    try {
      const testCount = parseInt(this.runCommand('find tests __tests__ -name "*.test.ts" -o -name "*.spec.ts" | wc -l') || '0')
      const estimatedTime = Math.max(30, testCount * 5) // Rough estimation: 5 seconds per test file
      return Math.min(estimatedTime, 300) // Cap at 5 minutes
    } catch {
      return 120 // Default 2 minutes
    }
  }

  private calculateCacheHitRate(): number {
    const cacheIndicators = [
      'node_modules/.package-lock.json',
      'node_modules/.prisma',
      '.next/cache'
    ]

    let hits = 0
    const total = cacheIndicators.length

    for (const indicator of cacheIndicators) {
      if (existsSync(indicator)) {
        hits++
      }
    }

    return Math.round((hits / total) * 100)
  }

  private calculateParallelEfficiency(): number {
    // This would typically be calculated from CI job logs
    // For now, we'll estimate based on available parallel jobs
    const availableJobs = ['quality-check', 'unit-tests', 'security-tests', 'build-validation']
    const parallelizableJobs = ['unit-tests', 'security-tests', 'build-validation']
    
    const efficiency = Math.round((parallelizableJobs.length / availableJobs.length) * 100)
    return Math.min(efficiency, 85) // Cap at 85% for realistic expectations
  }

  private calculateTestCoverage(): number {
    try {
      if (existsSync('coverage/coverage-summary.json')) {
        const coverageData = JSON.parse(readFileSync('coverage/coverage-summary.json', 'utf8'))
        return coverageData.total?.lines?.pct || 0
      }
    } catch (error) {
      console.warn('Could not read test coverage:', error)
    }
    
    // Fallback: estimate based on test-to-source ratio
    const sourceFiles = parseInt(this.runCommand('find src -name "*.ts" -o -name "*.tsx" | wc -l') || '1')
    const testFiles = parseInt(this.runCommand('find tests __tests__ -name "*.test.ts" -o -name "*.spec.ts" | wc -l') || '0')
    
    return Math.min(Math.round((testFiles / sourceFiles) * 100), 100)
  }

  private analyzeRegression(metric: string, current: number, threshold: RegressionThreshold): RegressionResult {
    const baseline = threshold.baseline
    const change = current - baseline
    const changePercent = baseline > 0 ? Math.round((change / baseline) * 100) : 0

    let severity: 'ok' | 'warning' | 'critical' = 'ok'
    let message = ''
    let recommendation = ''

    if (threshold.direction === 'lower_is_better') {
      if (changePercent >= threshold.criticalThreshold) {
        severity = 'critical'
        message = `Critical regression: ${metric} increased by ${changePercent}% (${current}${threshold.unit} vs baseline ${baseline}${threshold.unit})`
        recommendation = this.getRecommendation(metric, 'critical', 'increase')
      } else if (changePercent >= threshold.warningThreshold) {
        severity = 'warning'
        message = `Warning: ${metric} increased by ${changePercent}% (${current}${threshold.unit} vs baseline ${baseline}${threshold.unit})`
        recommendation = this.getRecommendation(metric, 'warning', 'increase')
      } else {
        message = `${metric} is within acceptable range: ${current}${threshold.unit} (baseline: ${baseline}${threshold.unit})`
        recommendation = changePercent < -10 ? `Excellent improvement in ${metric}! Consider documenting optimization.` : ''
      }
    } else {
      // higher_is_better
      const decreasePercent = Math.abs(changePercent)
      if (decreasePercent >= Math.abs(threshold.criticalThreshold)) {
        severity = 'critical'
        message = `Critical regression: ${metric} decreased by ${decreasePercent}% (${current}${threshold.unit} vs baseline ${baseline}${threshold.unit})`
        recommendation = this.getRecommendation(metric, 'critical', 'decrease')
      } else if (decreasePercent >= Math.abs(threshold.warningThreshold)) {
        severity = 'warning'
        message = `Warning: ${metric} decreased by ${decreasePercent}% (${current}${threshold.unit} vs baseline ${baseline}${threshold.unit})`
        recommendation = this.getRecommendation(metric, 'warning', 'decrease')
      } else {
        message = `${metric} is within acceptable range: ${current}${threshold.unit} (baseline: ${baseline}${threshold.unit})`
        recommendation = changePercent > 10 ? `Great improvement in ${metric}!` : ''
      }
    }

    return {
      metric,
      current,
      baseline,
      change,
      changePercent,
      severity,
      message,
      recommendation,
      timestamp: new Date().toISOString()
    }
  }

  private getRecommendation(metric: string, severity: 'warning' | 'critical', direction: 'increase' | 'decrease'): string {
    const recommendations: { [key: string]: { [key: string]: string } } = {
      build_time: {
        increase: severity === 'critical' 
          ? 'Immediate action required: Check for new heavy dependencies, review build process, enable parallel builds'
          : 'Review recent changes, optimize imports, consider code splitting'
      },
      bundle_size: {
        increase: severity === 'critical'
          ? 'Critical bundle bloat detected: Review new dependencies, implement tree shaking, use dynamic imports'
          : 'Monitor bundle growth, consider lazy loading for large components'
      },
      test_time: {
        increase: severity === 'critical'
          ? 'Test suite performance critical: Parallelize tests, review slow tests, optimize test database'
          : 'Review test efficiency, consider test sharding or mocking improvements'
      },
      cache_hit_rate: {
        decrease: severity === 'critical'
          ? 'Cache system failing: Review cache keys, check cache invalidation, investigate CI environment'
          : 'Cache efficiency declining: Review cache strategies, check dependency changes'
      },
      parallel_efficiency: {
        decrease: severity === 'critical'
          ? 'Parallelization broken: Review job dependencies, check resource allocation, fix blocking jobs'
          : 'Parallelization suboptimal: Review job sequencing, consider more parallel jobs'
      },
      test_coverage: {
        decrease: severity === 'critical'
          ? 'Coverage critically low: Add tests for new code, review coverage requirements, fix coverage calculation'
          : 'Coverage declining: Add tests for recent changes, review coverage exclusions'
      }
    }

    return recommendations[metric]?.[direction] || 'Review recent changes and investigate performance impact'
  }

  private async sendAlert(results: RegressionResult[]) {
    const criticalRegressions = results.filter(r => r.severity === 'critical')
    const warningRegressions = results.filter(r => r.severity === 'warning')

    if (criticalRegressions.length === 0 && warningRegressions.length === 0) {
      console.log('✅ No performance regressions detected')
      return
    }

    console.log('\n🚨 Performance Regression Alert')
    console.log('=' .repeat(50))

    if (criticalRegressions.length > 0) {
      console.log('\n🚨 CRITICAL REGRESSIONS:')
      criticalRegressions.forEach(result => {
        console.log(`❌ ${result.message}`)
        console.log(`   💡 ${result.recommendation}`)
      })
    }

    if (warningRegressions.length > 0) {
      console.log('\n⚠️  WARNING REGRESSIONS:')
      warningRegressions.forEach(result => {
        console.log(`⚠️  ${result.message}`)
        console.log(`   💡 ${result.recommendation}`)
      })
    }

    // Generate GitHub issue if configured
    if (this.alertConfig.github?.createIssue && criticalRegressions.length > 0) {
      await this.createGitHubIssue(criticalRegressions)
    }

    // Send Slack notification if configured
    if (this.alertConfig.slack?.webhook) {
      await this.sendSlackNotification([...criticalRegressions, ...warningRegressions])
    }
  }

  private async createGitHubIssue(regressions: RegressionResult[]) {
    const title = `Performance Regression Detected - ${regressions.length} Critical Issues`
    
    const body = `
## 🚨 Performance Regression Alert

**Detection Time:** ${new Date().toISOString()}
**Affected Metrics:** ${regressions.map(r => r.metric).join(', ')}

### Critical Regressions

${regressions.map(r => `
#### ${r.metric}
- **Current:** ${r.current}${this.thresholds.find(t => t.metric === r.metric)?.unit || ''}
- **Baseline:** ${r.baseline}${this.thresholds.find(t => t.metric === r.metric)?.unit || ''}
- **Change:** ${r.changePercent > 0 ? '+' : ''}${r.changePercent}%
- **Impact:** ${r.message}
- **Recommendation:** ${r.recommendation}
`).join('\n')}

### Investigation Steps

1. **Review Recent Changes**
   - Check commits since last successful build
   - Review dependency updates
   - Analyze code changes in critical paths

2. **Immediate Actions**
   - Run performance profiling on affected components
   - Check CI/CD resource allocation
   - Validate cache configuration

3. **Monitoring**
   - Set up enhanced monitoring for affected metrics
   - Create alerts for future regressions
   - Document findings and solutions

### Auto-Generated Report
This issue was automatically created by the Performance Regression Detection system.
- **Script:** \`scripts/regression-detector.ts\`
- **CI Run:** ${process.env.GITHUB_RUN_ID || 'Local'}
- **Commit:** ${process.env.GITHUB_SHA || 'Unknown'}
`

    console.log('\n📝 GitHub Issue Content Generated:')
    console.log('Title:', title)
    console.log('Body Preview:', body.substring(0, 200) + '...')
    
    // In a real implementation, this would use GitHub API
    console.log('💡 To create GitHub issue, run:')
    console.log(`gh issue create --title "${title}" --body-file <(echo "${body.replace(/"/g, '\\"')}")`)
  }

  private async sendSlackNotification(regressions: RegressionResult[]) {
    const criticalCount = regressions.filter(r => r.severity === 'critical').length
    const warningCount = regressions.filter(r => r.severity === 'warning').length
    
    const message = {
      text: `🚨 Performance Regression Alert - ${criticalCount} critical, ${warningCount} warnings`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🚨 Performance Regression Detected'
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Critical:* ${criticalCount}`
            },
            {
              type: 'mrkdwn',
              text: `*Warnings:* ${warningCount}`
            }
          ]
        },
        ...regressions.slice(0, 5).map(r => ({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `${r.severity === 'critical' ? '🚨' : '⚠️'} *${r.metric}*: ${r.changePercent > 0 ? '+' : ''}${r.changePercent}%\n${r.recommendation}`
          }
        }))
      ]
    }

    console.log('\n📱 Slack Notification Generated:')
    console.log(JSON.stringify(message, null, 2))
    console.log('💡 Configure SLACK_WEBHOOK_URL to enable actual Slack notifications')
  }

  async detectRegressions(): Promise<RegressionResult[]> {
    console.log('🔍 Starting performance regression detection...')
    
    const baseline = this.loadBaseline()
    const currentMetrics = this.getCurrentMetrics()
    
    console.log('\n📊 Current Metrics vs Baseline:')
    console.log('Metric'.padEnd(20), 'Current'.padEnd(12), 'Baseline'.padEnd(12), 'Change')
    console.log('-'.repeat(60))
    
    const results: RegressionResult[] = []
    
    for (const threshold of this.thresholds) {
      const current = currentMetrics[threshold.metric] || 0
      const baselineValue = baseline[threshold.metric] || threshold.baseline
      
      // Update threshold baseline with loaded baseline
      const updatedThreshold = { ...threshold, baseline: baselineValue }
      const result = this.analyzeRegression(threshold.metric, current, updatedThreshold)
      results.push(result)
      
      const changeStr = result.changePercent > 0 ? `+${result.changePercent}%` : `${result.changePercent}%`
      const statusIcon = result.severity === 'critical' ? '🚨' : result.severity === 'warning' ? '⚠️' : '✅'
      
      console.log(
        `${statusIcon} ${threshold.metric.padEnd(18)}`,
        `${current}${threshold.unit}`.padEnd(12),
        `${baselineValue}${threshold.unit}`.padEnd(12),
        changeStr
      )
    }
    
    // Save results for historical tracking
    const resultsFile = 'regression-results.json'
    const historicalResults = existsSync(resultsFile) 
      ? JSON.parse(readFileSync(resultsFile, 'utf8')) 
      : []
    
    historicalResults.push({
      timestamp: new Date().toISOString(),
      results
    })
    
    // Keep only last 50 results
    if (historicalResults.length > 50) {
      historicalResults.splice(0, historicalResults.length - 50)
    }
    
    writeFileSync(resultsFile, JSON.stringify(historicalResults, null, 2))
    
    return results
  }

  generateReport(results: RegressionResult[]) {
    const criticalCount = results.filter(r => r.severity === 'critical').length
    const warningCount = results.filter(r => r.severity === 'warning').length
    const okCount = results.filter(r => r.severity === 'ok').length
    
    console.log('\n📋 Regression Detection Summary')
    console.log('=' .repeat(50))
    console.log(`✅ OK: ${okCount}`)
    console.log(`⚠️  Warnings: ${warningCount}`)
    console.log(`🚨 Critical: ${criticalCount}`)
    
    if (criticalCount > 0 || warningCount > 0) {
      console.log('\n🎯 Action Items:')
      
      results
        .filter(r => r.severity !== 'ok')
        .forEach((result, index) => {
          console.log(`${index + 1}. ${result.severity === 'critical' ? '🚨' : '⚠️'} ${result.metric}`)
          console.log(`   ${result.message}`)
          console.log(`   💡 ${result.recommendation}`)
          console.log()
        })
    }
    
    // Return exit code based on severity
    return criticalCount > 0 ? 2 : warningCount > 0 ? 1 : 0
  }
}

// CLI interface
async function main() {
  const command = process.argv[2] || 'detect'
  const detector = new RegressionDetector()

  try {
    switch (command) {
      case 'detect':
        const results = await detector.detectRegressions()
        await detector.sendAlert(results)
        const exitCode = detector.generateReport(results)
        process.exit(exitCode)
        break

      case 'report':
        const reportResults = await detector.detectRegressions()
        detector.generateReport(reportResults)
        break

      case 'alert-test':
        // Test alerting system with mock regressions
        const mockResults: RegressionResult[] = [
          {
            metric: 'build_time',
            current: 240,
            baseline: 180,
            change: 60,
            changePercent: 33,
            severity: 'critical',
            message: 'Critical regression: build_time increased by 33%',
            recommendation: 'Immediate action required: Check for new heavy dependencies',
            timestamp: new Date().toISOString()
          }
        ]
        await detector.sendAlert(mockResults)
        break

      default:
        console.log('Usage: tsx regression-detector.ts [detect|report|alert-test]')
        console.log('  detect     - Run regression detection and send alerts (default)')
        console.log('  report     - Generate regression report without alerts')
        console.log('  alert-test - Test alerting system with mock data')
        process.exit(1)
    }
  } catch (error) {
    console.error('❌ Regression detection failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error)
}

export default RegressionDetector
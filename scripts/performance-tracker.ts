#!/usr/bin/env tsx

/**
 * ReadZone Enhanced Performance Tracker
 * Comprehensive CI/CD and application performance monitoring system
 * Phase 4.3: Advanced metrics collection, regression detection, and alerting
 */

import { execSync } from 'child_process'
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

interface CIPerfMetrics {
  buildTime: number
  testTime: number
  deployTime: number
  typeCheckTime: number
  lintTime: number
  cacheHitRate: number
  parallelEfficiency: number
  resourceUtilization: number
  memoryUsage: number
  cpuUsage: number
  timestamp: string
  commitSha: string
  branch: string
  triggeredBy: string
}

interface AppPerfMetrics {
  performanceScore: number
  lcpScore: number
  fidScore: number
  clsScore: number
  bundleSize: number
  firstLoadJS: number
  totalBlockingTime: number
  speedIndex: number
  accessibilityScore: number
  bestPracticesScore: number
  seoScore: number
}

interface PerformanceBaseline {
  buildTime: { p50: number, p95: number, p99: number }
  bundleSize: { initial: number, total: number }
  testCoverage: { unit: number, e2e: number }
  securityScore: number
  applicationPerformance: { 
    performanceScore: number
    lcpThreshold: number
    fidThreshold: number
    clsThreshold: number
  }
}

interface PerformanceReport {
  timestamp: string
  commit: string
  branch: string
  ci: CIPerfMetrics
  app: AppPerfMetrics
  environment: {
    nodeVersion: string
    platform: string
    cpuCount: number
    totalMemory: number
  }
  grade: {
    overall: string
    score: number
    breakdown: {
      build: number
      app: number
      cache: number
      parallel: number
    }
  }
  alerts: PerformanceAlert[]
}

interface PerformanceAlert {
  type: 'critical' | 'warning' | 'info'
  metric: string
  message: string
  threshold: number
  current: number
  recommendation: string
}

interface PerformanceTrend {
  metric: string
  current: number
  previous: number
  change: number
  changePercent: number
  trend: 'improving' | 'degrading' | 'stable'
  significance: 'critical' | 'warning' | 'info'
}

class PerformanceTracker {
  private metricsFile = 'ci-performance-metrics.json'
  private baselineFile = 'performance-baseline.json'
  private trendsFile = 'performance-trends.json'
  private reportsDir = '.performance-reports'
  private alertsFile = 'performance-alerts.json'

  constructor() {
    // Ensure reports directory exists
    if (!existsSync(this.reportsDir)) {
      mkdirSync(this.reportsDir, { recursive: true })
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

  private getGitInfo() {
    const commitSha = this.runCommand('git rev-parse HEAD')?.substring(0, 8) || 'unknown'
    const branch = this.runCommand('git rev-parse --abbrev-ref HEAD') || 'unknown'
    const triggeredBy = process.env.GITHUB_ACTOR || process.env.USER || 'unknown'
    
    return { commitSha, branch, triggeredBy }
  }

  private calculateCacheHitRate(): number {
    // In a real implementation, this would check GitHub Actions cache statistics
    // For now, we'll simulate based on file existence and modification times
    
    const cacheIndicators = [
      'node_modules/.package-lock.json',
      'node_modules/.prisma',
      '.next/cache',
      '.next/static'
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

  private calculateBundleSize(): { initial: number, total: number } {
    try {
      let totalSize = 0
      let initialSize = 0

      // Calculate total .next build size
      const buildSizeCmd = 'find .next -name "*.js" -o -name "*.css" -type f -exec du -b {} + | awk "{sum+=\\$1} END {print sum}"'
      const totalSizeBytes = parseInt(this.runCommand(buildSizeCmd) || '0')
      totalSize = Math.round(totalSizeBytes / 1024) // Convert to KB

      // Calculate critical chunks size (approximation)
      const criticalSizeCmd = 'find .next/static/chunks -name "*.js" -type f -exec du -b {} + | head -5 | awk "{sum+=\\$1} END {print sum}"'
      const initialSizeBytes = parseInt(this.runCommand(criticalSizeCmd) || '0')
      initialSize = Math.round(initialSizeBytes / 1024) // Convert to KB

      return { initial: initialSize, total: totalSize }
    } catch (error) {
      console.warn('Could not calculate bundle size:', error)
      return { initial: 0, total: 0 }
    }
  }

  private calculateTestCoverage(): { unit: number, e2e: number } {
    try {
      // Read Jest coverage if available
      let unitCoverage = 0
      if (existsSync('coverage/coverage-summary.json')) {
        const coverageData = JSON.parse(readFileSync('coverage/coverage-summary.json', 'utf8'))
        unitCoverage = coverageData.total?.lines?.pct || 0
      }

      // E2E coverage would need to be tracked separately
      // For now, we'll estimate based on test file count vs component count
      const e2eTestCount = parseInt(this.runCommand('find tests -name "*.spec.ts" -type f | wc -l') || '0')
      const componentCount = parseInt(this.runCommand('find src/components -name "*.tsx" -type f | wc -l') || '1')
      const e2eCoverage = Math.min(Math.round((e2eTestCount / componentCount) * 100), 100)

      return { unit: unitCoverage, e2e: e2eCoverage }
    } catch (error) {
      console.warn('Could not calculate test coverage:', error)
      return { unit: 0, e2e: 0 }
    }
  }

  private loadMetricsHistory(): CIPerfMetrics[] {
    if (!existsSync(this.metricsFile)) {
      return []
    }

    try {
      const data = readFileSync(this.metricsFile, 'utf8')
      return JSON.parse(data)
    } catch (error) {
      console.warn('Could not load metrics history:', error)
      return []
    }
  }

  private saveMetrics(metrics: CIPerfMetrics[]) {
    try {
      writeFileSync(this.metricsFile, JSON.stringify(metrics, null, 2))
    } catch (error) {
      console.error('Could not save metrics:', error)
    }
  }

  private loadBaseline(): PerformanceBaseline | null {
    if (!existsSync(this.baselineFile)) {
      return null
    }

    try {
      const data = readFileSync(this.baselineFile, 'utf8')
      return JSON.parse(data)
    } catch (error) {
      console.warn('Could not load performance baseline:', error)
      return null
    }
  }

  private calculateBaseline(metrics: CIPerfMetrics[]): PerformanceBaseline {
    if (metrics.length === 0) {
      return {
        buildTime: { p50: 300, p95: 600, p99: 900 }, // Default targets in seconds
        bundleSize: { initial: 500, total: 2048 }, // Default targets in KB
        testCoverage: { unit: 80, e2e: 70 }, // Default targets in percentage
        securityScore: 95 // Default target
      }
    }

    // Calculate percentiles for build time
    const buildTimes = metrics.map(m => m.buildTime).sort((a, b) => a - b)
    const p50Index = Math.floor(buildTimes.length * 0.5)
    const p95Index = Math.floor(buildTimes.length * 0.95)
    const p99Index = Math.floor(buildTimes.length * 0.99)

    // Get latest bundle size and coverage data
    const latestMetric = metrics[metrics.length - 1]
    const bundleSize = this.calculateBundleSize()
    const testCoverage = this.calculateTestCoverage()

    return {
      buildTime: {
        p50: buildTimes[p50Index] || 300,
        p95: buildTimes[p95Index] || 600,
        p99: buildTimes[p99Index] || 900
      },
      bundleSize,
      testCoverage,
      securityScore: 95 // This would be calculated from security scans
    }
  }

  private detectPerformanceRegression(
    current: CIPerfMetrics, 
    history: CIPerfMetrics[], 
    baseline: PerformanceBaseline
  ): PerformanceTrend[] {
    const trends: PerformanceTrend[] = []

    if (history.length === 0) {
      return trends
    }

    const previous = history[history.length - 1]

    // Build time trend
    const buildTimeChange = current.buildTime - previous.buildTime
    const buildTimeChangePercent = Math.round((buildTimeChange / previous.buildTime) * 100)
    
    trends.push({
      metric: 'buildTime',
      current: current.buildTime,
      previous: previous.buildTime,
      change: buildTimeChange,
      changePercent: buildTimeChangePercent,
      trend: buildTimeChange > 30 ? 'degrading' : buildTimeChange < -30 ? 'improving' : 'stable',
      significance: current.buildTime > baseline.buildTime.p95 ? 'critical' : 
                   current.buildTime > baseline.buildTime.p50 ? 'warning' : 'info'
    })

    // Cache hit rate trend
    const cacheChange = current.cacheHitRate - previous.cacheHitRate
    const cacheChangePercent = previous.cacheHitRate > 0 ? Math.round((cacheChange / previous.cacheHitRate) * 100) : 0

    trends.push({
      metric: 'cacheHitRate',
      current: current.cacheHitRate,
      previous: previous.cacheHitRate,
      change: cacheChange,
      changePercent: cacheChangePercent,
      trend: cacheChange > 5 ? 'improving' : cacheChange < -5 ? 'degrading' : 'stable',
      significance: current.cacheHitRate < 70 ? 'critical' : 
                   current.cacheHitRate < 85 ? 'warning' : 'info'
    })

    // Parallel efficiency trend
    const parallelChange = current.parallelEfficiency - previous.parallelEfficiency
    const parallelChangePercent = previous.parallelEfficiency > 0 ? Math.round((parallelChange / previous.parallelEfficiency) * 100) : 0

    trends.push({
      metric: 'parallelEfficiency',
      current: current.parallelEfficiency,
      previous: previous.parallelEfficiency,
      change: parallelChange,
      changePercent: parallelChangePercent,
      trend: parallelChange > 5 ? 'improving' : parallelChange < -5 ? 'degrading' : 'stable',
      significance: current.parallelEfficiency < 50 ? 'critical' : 
                   current.parallelEfficiency < 70 ? 'warning' : 'info'
    })

    return trends
  }

  /**
   * Enhanced CI metrics collection with more detailed measurements
   */
  async collectMetrics(): Promise<CIPerfMetrics> {
    console.log('📊 Collecting enhanced CI/CD performance metrics...')

    const { commitSha, branch, triggeredBy } = this.getGitInfo()
    const timestamp = new Date().toISOString()

    const startTime = Date.now()
    
    // Collect actual build metrics with timing
    const buildStart = Date.now()
    const buildTime = this.measureBuildTime()
    
    const testStart = Date.now()
    const testTime = this.measureTestTime()
    
    const typeCheckStart = Date.now()
    const typeCheckTime = this.measureTypeCheckTime()
    
    const lintStart = Date.now()
    const lintTime = this.measureLintTime()
    
    const deployTime = parseInt(process.env.DEPLOY_TIME || '0') || 0

    const cacheHitRate = this.calculateCacheHitRate()
    const systemMetrics = this.getSystemMetrics()
    
    // Calculate parallel efficiency (jobs running simultaneously vs total time)
    const totalSequentialTime = buildTime + testTime + typeCheckTime + lintTime + deployTime
    const actualPipelineTime = Math.max(buildTime, testTime, typeCheckTime, lintTime, deployTime) + 30
    const parallelEfficiency = Math.round(((totalSequentialTime - actualPipelineTime) / totalSequentialTime) * 100)

    const metrics: CIPerfMetrics = {
      buildTime,
      testTime,
      deployTime,
      typeCheckTime,
      lintTime,
      cacheHitRate,
      parallelEfficiency: Math.max(0, parallelEfficiency),
      resourceUtilization: systemMetrics.resource,
      memoryUsage: systemMetrics.memory,
      cpuUsage: systemMetrics.cpu,
      timestamp,
      commitSha,
      branch,
      triggeredBy
    }

    console.log('✅ Enhanced metrics collected successfully')
    return metrics
  }

  /**
   * Measure actual build time
   */
  private measureBuildTime(): number {
    const startTime = Date.now()
    try {
      this.runCommand('npm run build', false)
      return Math.round((Date.now() - startTime) / 1000)
    } catch (error) {
      console.warn('Build measurement failed, using default')
      return parseInt(process.env.BUILD_TIME || '0') || 300
    }
  }

  /**
   * Measure test execution time
   */
  private measureTestTime(): number {
    const startTime = Date.now()
    try {
      this.runCommand('npm test -- --passWithNoTests --coverage=false', false)
      return Math.round((Date.now() - startTime) / 1000)
    } catch (error) {
      console.warn('Test measurement failed, using default')
      return parseInt(process.env.TEST_TIME || '0') || 120
    }
  }

  /**
   * Measure TypeScript type checking time
   */
  private measureTypeCheckTime(): number {
    const startTime = Date.now()
    try {
      this.runCommand('npm run type-check', false)
      return Math.round((Date.now() - startTime) / 1000)
    } catch (error) {
      console.warn('TypeCheck measurement failed, using default')
      return 30
    }
  }

  /**
   * Measure linting time
   */
  private measureLintTime(): number {
    const startTime = Date.now()
    try {
      this.runCommand('npm run lint', false)
      return Math.round((Date.now() - startTime) / 1000)
    } catch (error) {
      console.warn('Lint measurement failed, using default')
      return 20
    }
  }

  /**
   * Get enhanced system metrics
   */
  private getSystemMetrics(): { resource: number, memory: number, cpu: number } {
    const os = require('os')
    
    const totalMem = os.totalmem()
    const freeMem = os.freemem()
    const usedMem = totalMem - freeMem
    
    return {
      resource: Math.round((usedMem / totalMem) * 100),
      memory: Math.round(usedMem / 1024 / 1024), // MB
      cpu: Math.round(os.loadavg()[0] * 100 / os.cpus().length) // Approximate
    }
  }

  /**
   * Collect application performance metrics using Lighthouse
   */
  async collectAppMetrics(url: string = 'http://localhost:3000'): Promise<AppPerfMetrics> {
    console.log('🔍 Collecting application performance metrics...')
    
    try {
      // Start application if needed
      const appProcess = await this.startApplicationForTesting(url)
      
      // Run Lighthouse audit
      const report = await this.runLighthouseAudit(url)
      
      // Stop application
      if (appProcess) {
        this.stopApplication(appProcess)
      }
      
      return report
    } catch (error) {
      console.error('❌ Application metrics collection failed:', error)
      return this.getDefaultAppMetrics()
    }
  }

  /**
   * Start application for performance testing
   */
  private async startApplicationForTesting(url: string): Promise<any> {
    console.log('🚀 Starting application for testing...')
    
    const { spawn } = require('child_process')
    const appProcess = spawn('npm', ['start'], { detached: true, stdio: 'ignore' })
    
    // Wait for application to be ready
    for (let i = 0; i < 30; i++) {
      try {
        const response = await fetch(url)
        if (response.ok) {
          console.log('✅ Application ready for testing')
          return appProcess
        }
      } catch {}
      
      console.log(`⏳ Waiting for application... (${i + 1}/30)`)
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
    
    throw new Error('Application failed to start within timeout')
  }

  /**
   * Stop application
   */
  private stopApplication(appProcess: any): void {
    if (appProcess) {
      appProcess.kill()
    }
  }

  /**
   * Run comprehensive Lighthouse audit
   */
  private async runLighthouseAudit(url: string): Promise<AppPerfMetrics> {
    try {
      const outputPath = join(this.reportsDir, 'lighthouse-report.json')
      
      const lighthouseCmd = [
        `npx lighthouse "${url}"`,
        '--output=json',
        `--output-path="${outputPath}"`,
        '--chrome-flags="--headless --no-sandbox --disable-dev-shm-usage"',
        '--only-categories=performance,accessibility,best-practices,seo',
        '--throttling-method=simulate',
        '--emulated-form-factor=desktop',
        '--quiet'
      ].join(' ')
      
      this.runCommand(lighthouseCmd, false)
      
      if (existsSync(outputPath)) {
        const report = JSON.parse(readFileSync(outputPath, 'utf8'))
        
        return {
          performanceScore: Math.round((report.categories.performance?.score || 0) * 100),
          lcpScore: Math.round((report.audits['largest-contentful-paint']?.score || 0) * 100),
          fidScore: Math.round((report.audits['max-potential-fid']?.score || 0) * 100),
          clsScore: Math.round((report.audits['cumulative-layout-shift']?.score || 0) * 100),
          bundleSize: this.calculateBundleSize().total,
          firstLoadJS: this.calculateBundleSize().initial,
          totalBlockingTime: report.audits['total-blocking-time']?.numericValue || 0,
          speedIndex: report.audits['speed-index']?.numericValue || 0,
          accessibilityScore: Math.round((report.categories.accessibility?.score || 0) * 100),
          bestPracticesScore: Math.round((report.categories['best-practices']?.score || 0) * 100),
          seoScore: Math.round((report.categories.seo?.score || 0) * 100)
        }
      }
    } catch (error) {
      console.warn('⚠️ Lighthouse audit failed:', error.message)
    }
    
    return this.getDefaultAppMetrics()
  }

  /**
   * Get default app metrics when measurement fails
   */
  private getDefaultAppMetrics(): AppPerfMetrics {
    return {
      performanceScore: 0,
      lcpScore: 0,
      fidScore: 0,
      clsScore: 0,
      bundleSize: 0,
      firstLoadJS: 0,
      totalBlockingTime: 0,
      speedIndex: 0,
      accessibilityScore: 0,
      bestPracticesScore: 0,
      seoScore: 0
    }
  }

  /**
   * Enhanced performance analysis with application metrics
   */
  async analyzePerformance(includeApp: boolean = true): Promise<PerformanceReport> {
    console.log('🔍 Analyzing comprehensive performance...')

    const currentMetrics = await this.collectMetrics()
    const appMetrics = includeApp ? await this.collectAppMetrics() : this.getDefaultAppMetrics()
    const history = this.loadMetricsHistory()
    const baseline = this.loadBaseline() || this.calculateBaseline(history)

    // Detect trends and regressions
    const trends = this.detectPerformanceRegression(currentMetrics, history, baseline)

    // Generate performance alerts
    const alerts = this.generatePerformanceAlerts(currentMetrics, appMetrics, baseline)

    // Calculate performance grade
    const grade = this.calculatePerformanceGrade(currentMetrics, appMetrics, baseline)

    // Add current metrics to history
    history.push(currentMetrics)

    // Keep only last 50 entries to prevent file growth
    if (history.length > 50) {
      history.splice(0, history.length - 50)
    }

    // Save updated metrics
    this.saveMetrics(history)

    // Update baseline if needed
    const shouldUpdateBaseline = !existsSync(this.baselineFile) || 
                                Math.random() < 0.05 || // 5% chance for periodic updates
                                trends.some(t => t.trend === 'improving' && t.changePercent > 25)

    if (shouldUpdateBaseline) {
      const newBaseline = this.calculateBaseline(history)
      writeFileSync(this.baselineFile, JSON.stringify(newBaseline, null, 2))
      console.log('📊 Performance baseline updated')
    }

    // Save trends and alerts
    writeFileSync(this.trendsFile, JSON.stringify(trends, null, 2))
    writeFileSync(this.alertsFile, JSON.stringify(alerts, null, 2))

    // Create comprehensive report
    const os = require('os')
    const report: PerformanceReport = {
      timestamp: new Date().toISOString(),
      commit: currentMetrics.commitSha,
      branch: currentMetrics.branch,
      ci: currentMetrics,
      app: appMetrics,
      environment: {
        nodeVersion: process.version,
        platform: os.platform(),
        cpuCount: os.cpus().length,
        totalMemory: Math.round(os.totalmem() / 1024 / 1024) // MB
      },
      grade,
      alerts
    }

    // Save comprehensive report
    const reportPath = join(this.reportsDir, `performance-${Date.now()}.json`)
    writeFileSync(reportPath, JSON.stringify(report, null, 2))

    console.log('✅ Comprehensive performance analysis completed')
    return report
  }

  /**
   * Generate performance alerts based on thresholds
   */
  private generatePerformanceAlerts(
    ci: CIPerfMetrics, 
    app: AppPerfMetrics, 
    baseline: PerformanceBaseline
  ): PerformanceAlert[] {
    const alerts: PerformanceAlert[] = []

    // CI/CD Performance Alerts
    if (ci.buildTime > baseline.buildTime.p99) {
      alerts.push({
        type: 'critical',
        metric: 'buildTime',
        message: 'Build time exceeds 99th percentile threshold',
        threshold: baseline.buildTime.p99,
        current: ci.buildTime,
        recommendation: 'Investigate build optimizations, dependency caching, or parallel execution'
      })
    } else if (ci.buildTime > baseline.buildTime.p95) {
      alerts.push({
        type: 'warning',
        metric: 'buildTime',
        message: 'Build time exceeds 95th percentile threshold',
        threshold: baseline.buildTime.p95,
        current: ci.buildTime,
        recommendation: 'Consider reviewing recent changes for performance impact'
      })
    }

    if (ci.cacheHitRate < 60) {
      alerts.push({
        type: 'critical',
        metric: 'cacheHitRate',
        message: 'Cache hit rate critically low',
        threshold: 60,
        current: ci.cacheHitRate,
        recommendation: 'Review cache configuration and dependency management'
      })
    } else if (ci.cacheHitRate < 80) {
      alerts.push({
        type: 'warning',
        metric: 'cacheHitRate',
        message: 'Cache hit rate below optimal',
        threshold: 80,
        current: ci.cacheHitRate,
        recommendation: 'Optimize cache keys and invalidation strategies'
      })
    }

    // Application Performance Alerts
    if (app.performanceScore > 0) {
      if (app.performanceScore < 60) {
        alerts.push({
          type: 'critical',
          metric: 'performanceScore',
          message: 'Application performance score critically low',
          threshold: 60,
          current: app.performanceScore,
          recommendation: 'Urgent optimization needed - review Core Web Vitals and bundle size'
        })
      } else if (app.performanceScore < 80) {
        alerts.push({
          type: 'warning',
          metric: 'performanceScore',
          message: 'Application performance below target',
          threshold: 80,
          current: app.performanceScore,
          recommendation: 'Optimize loading performance, reduce bundle size, improve caching'
        })
      }

      if (app.bundleSize > 3072) { // 3MB
        alerts.push({
          type: 'critical',
          metric: 'bundleSize',
          message: 'Bundle size exceeds recommended maximum',
          threshold: 3072,
          current: app.bundleSize,
          recommendation: 'Implement code splitting, tree shaking, and dependency optimization'
        })
      } else if (app.bundleSize > 2048) { // 2MB
        alerts.push({
          type: 'warning',
          metric: 'bundleSize',
          message: 'Bundle size above recommended threshold',
          threshold: 2048,
          current: app.bundleSize,
          recommendation: 'Consider code splitting and removing unused dependencies'
        })
      }

      if (app.lcpScore < 50) {
        alerts.push({
          type: 'warning',
          metric: 'lcpScore',
          message: 'Largest Contentful Paint needs improvement',
          threshold: 50,
          current: app.lcpScore,
          recommendation: 'Optimize image loading, critical CSS, and server response times'
        })
      }

      if (app.clsScore < 75) {
        alerts.push({
          type: 'warning',
          metric: 'clsScore',
          message: 'Cumulative Layout Shift needs improvement',
          threshold: 75,
          current: app.clsScore,
          recommendation: 'Set explicit dimensions for images and reserve space for dynamic content'
        })
      }
    }

    return alerts
  }

  /**
   * Calculate comprehensive performance grade
   */
  private calculatePerformanceGrade(
    ci: CIPerfMetrics, 
    app: AppPerfMetrics, 
    baseline: PerformanceBaseline
  ): PerformanceReport['grade'] {
    // Build performance (25%)
    let buildScore = 100
    if (ci.buildTime > baseline.buildTime.p99) buildScore = 30
    else if (ci.buildTime > baseline.buildTime.p95) buildScore = 60
    else if (ci.buildTime > baseline.buildTime.p50) buildScore = 80

    // Application performance (35%)
    let appScore = app.performanceScore || 0
    if (app.performanceScore === 0) appScore = 70 // Default when not measured

    // Cache efficiency (20%)
    let cacheScore = ci.cacheHitRate
    if (cacheScore < 60) cacheScore = 30
    else if (cacheScore < 80) cacheScore = 60

    // Parallel efficiency (20%)
    let parallelScore = ci.parallelEfficiency
    if (parallelScore < 40) parallelScore = 30
    else if (parallelScore < 60) parallelScore = 60

    // Calculate weighted overall score
    const overallScore = Math.round(
      (buildScore * 0.25) + (appScore * 0.35) + (cacheScore * 0.20) + (parallelScore * 0.20)
    )

    let grade = 'F'
    if (overallScore >= 90) grade = 'A+'
    else if (overallScore >= 85) grade = 'A'
    else if (overallScore >= 80) grade = 'B+'
    else if (overallScore >= 75) grade = 'B'
    else if (overallScore >= 70) grade = 'C+'
    else if (overallScore >= 65) grade = 'C'
    else if (overallScore >= 60) grade = 'D'

    return {
      overall: grade,
      score: overallScore,
      breakdown: {
        build: buildScore,
        app: appScore,
        cache: cacheScore,
        parallel: parallelScore
      }
    }
  }

  generateReport(analysis: { metrics: CIPerfMetrics, trends: PerformanceTrend[], baseline: PerformanceBaseline }) {
    console.log('\n📈 CI/CD Performance Report')
    console.log('=' .repeat(50))
    
    const { metrics, trends, baseline } = analysis

    console.log('\n📊 Current Metrics:')
    console.log(`Build Time: ${metrics.buildTime}s`)
    console.log(`Test Time: ${metrics.testTime}s`)
    console.log(`Deploy Time: ${metrics.deployTime}s`)
    console.log(`Cache Hit Rate: ${metrics.cacheHitRate}%`)
    console.log(`Parallel Efficiency: ${metrics.parallelEfficiency}%`)
    console.log(`Resource Utilization: ${metrics.resourceUtilization}%`)

    console.log('\n🎯 Performance Targets:')
    console.log(`Build Time Target: <${baseline.buildTime.p95}s (P95)`)
    console.log(`Cache Hit Rate Target: >85%`)
    console.log(`Parallel Efficiency Target: >70%`)

    console.log('\n📈 Performance Trends:')
    for (const trend of trends) {
      const trendIcon = trend.trend === 'improving' ? '📈' : trend.trend === 'degrading' ? '📉' : '➡️'
      const significanceIcon = trend.significance === 'critical' ? '🚨' : trend.significance === 'warning' ? '⚠️' : 'ℹ️'
      
      console.log(`${significanceIcon} ${trendIcon} ${trend.metric}: ${trend.current} (${trend.changePercent > 0 ? '+' : ''}${trend.changePercent}%)`)
    }

    // Performance score calculation
    let score = 100
    
    // Deduct points for performance issues
    if (metrics.buildTime > baseline.buildTime.p95) score -= 20
    else if (metrics.buildTime > baseline.buildTime.p50) score -= 10
    
    if (metrics.cacheHitRate < 70) score -= 20
    else if (metrics.cacheHitRate < 85) score -= 10
    
    if (metrics.parallelEfficiency < 50) score -= 15
    else if (metrics.parallelEfficiency < 70) score -= 5
    
    console.log(`\n🏆 Overall Performance Score: ${Math.max(0, score)}/100`)

    // Recommendations
    console.log('\n💡 Recommendations:')
    if (metrics.buildTime > baseline.buildTime.p95) {
      console.log('- 🚨 Build time is significantly above baseline - investigate build optimizations')
    }
    if (metrics.cacheHitRate < 85) {
      console.log('- ⚠️ Cache hit rate below target - review cache key strategies')
    }
    if (metrics.parallelEfficiency < 70) {
      console.log('- 📊 Parallel efficiency can be improved - review job dependencies')
    }
    if (score >= 90) {
      console.log('- ✅ Excellent performance! Consider sharing optimizations with other projects')
    }

    console.log('\n🔗 Integration Points:')
    console.log('- GitHub Actions: Set performance checks as status checks')
    console.log('- Slack/Teams: Send alerts for critical performance regressions')
    console.log('- Grafana: Visualize trends and set up alerting dashboards')
    console.log('- PR Comments: Include performance impact in PR reviews')
  }

  async generateGitHubSummary(analysis: { metrics: CIPerfMetrics, trends: PerformanceTrend[], baseline: PerformanceBaseline }) {
    const { metrics, trends, baseline } = analysis
    
    // Calculate performance score
    let score = 100
    if (metrics.buildTime > baseline.buildTime.p95) score -= 20
    else if (metrics.buildTime > baseline.buildTime.p50) score -= 10
    if (metrics.cacheHitRate < 70) score -= 20
    else if (metrics.cacheHitRate < 85) score -= 10
    if (metrics.parallelEfficiency < 50) score -= 15
    else if (metrics.parallelEfficiency < 70) score -= 5

    const summary = `
## 📈 CI/CD Performance Report

### Performance Score: ${Math.max(0, score)}/100

| Metric | Current | Target | Status |
|--------|---------|--------|---------|
| Build Time | ${metrics.buildTime}s | <${baseline.buildTime.p95}s | ${metrics.buildTime <= baseline.buildTime.p95 ? '✅' : '❌'} |
| Cache Hit Rate | ${metrics.cacheHitRate}% | >85% | ${metrics.cacheHitRate >= 85 ? '✅' : '❌'} |
| Parallel Efficiency | ${metrics.parallelEfficiency}% | >70% | ${metrics.parallelEfficiency >= 70 ? '✅' : '❌'} |

### Performance Trends
${trends.map(trend => {
  const trendIcon = trend.trend === 'improving' ? '📈' : trend.trend === 'degrading' ? '📉' : '➡️'
  const significanceIcon = trend.significance === 'critical' ? '🚨' : trend.significance === 'warning' ? '⚠️' : 'ℹ️'
  return `- ${significanceIcon} ${trendIcon} **${trend.metric}**: ${trend.current} (${trend.changePercent > 0 ? '+' : ''}${trend.changePercent}%)`
}).join('\n')}

### Quick Actions
${score < 80 ? '- 🚨 Performance below acceptable threshold - investigate immediately' : ''}
${metrics.cacheHitRate < 85 ? '- ⚠️ Review cache strategies to improve hit rate' : ''}
${metrics.parallelEfficiency < 70 ? '- 📊 Optimize job parallelization' : ''}
${score >= 90 ? '- ✅ Excellent performance maintained!' : ''}

*Report generated at ${metrics.timestamp}*
`

    if (process.env.GITHUB_STEP_SUMMARY) {
      try {
        writeFileSync(process.env.GITHUB_STEP_SUMMARY, summary)
        console.log('✅ GitHub summary generated')
      } catch (error) {
        console.warn('Could not write GitHub summary:', error)
      }
    }

    return summary
  }

  /**
   * Enhanced report generation with comprehensive metrics
   */
  generateEnhancedReport(report: PerformanceReport): void {
    const gradeEmoji = this.getGradeEmoji(report.grade.overall)
    
    console.log('\n📊 ReadZone Performance Report - Phase 4.3')
    console.log('=' .repeat(60))
    console.log(`Overall Grade: ${gradeEmoji} ${report.grade.overall} (${report.grade.score}/100)`)
    console.log(`Commit: ${report.commit.substring(0, 8)} | Branch: ${report.branch}`)
    console.log(`Generated: ${report.timestamp}`)
    
    console.log('\n🏗️ CI/CD Performance:')
    console.log(`• Build Time: ${report.ci.buildTime}s`)
    console.log(`• Test Time: ${report.ci.testTime}s`)
    console.log(`• TypeCheck Time: ${report.ci.typeCheckTime}s`)
    console.log(`• Lint Time: ${report.ci.lintTime}s`)
    console.log(`• Cache Hit Rate: ${report.ci.cacheHitRate}%`)
    console.log(`• Parallel Efficiency: ${report.ci.parallelEfficiency}%`)
    console.log(`• Memory Usage: ${report.ci.memoryUsage}MB`)
    
    console.log('\n🌐 Application Performance:')
    if (report.app.performanceScore > 0) {
      console.log(`• Performance Score: ${report.app.performanceScore}/100`)
      console.log(`• LCP Score: ${report.app.lcpScore}/100`)
      console.log(`• FID Score: ${report.app.fidScore}/100`)
      console.log(`• CLS Score: ${report.app.clsScore}/100`)
      console.log(`• Bundle Size: ${report.app.bundleSize}KB`)
      console.log(`• Accessibility: ${report.app.accessibilityScore}/100`)
      console.log(`• Best Practices: ${report.app.bestPracticesScore}/100`)
      console.log(`• SEO: ${report.app.seoScore}/100`)
    } else {
      console.log('• Application metrics not collected (use --app flag)')
    }
    
    console.log('\n📈 Performance Breakdown:')
    console.log(`• Build: ${report.grade.breakdown.build}/100`)
    console.log(`• Application: ${report.grade.breakdown.app}/100`)
    console.log(`• Cache: ${report.grade.breakdown.cache}/100`)
    console.log(`• Parallel: ${report.grade.breakdown.parallel}/100`)
    
    if (report.alerts.length > 0) {
      console.log('\n🚨 Performance Alerts:')
      for (const alert of report.alerts) {
        const alertEmoji = alert.type === 'critical' ? '🚨' : alert.type === 'warning' ? '⚠️' : 'ℹ️'
        console.log(`${alertEmoji} ${alert.metric}: ${alert.message}`)
        console.log(`   Current: ${alert.current} | Threshold: ${alert.threshold}`)
        console.log(`   Recommendation: ${alert.recommendation}`)
      }
    } else {
      console.log('\n✅ No performance alerts - all metrics within acceptable ranges')
    }
    
    console.log('\n💡 Phase 4.3 Features:')
    console.log('• ✅ Enhanced CI/CD metrics collection')
    console.log('• ✅ Comprehensive Lighthouse integration')
    console.log('• ✅ Automated regression detection')
    console.log('• ✅ Performance alerting system')
    console.log('• ✅ Detailed reporting and grading')
  }

  private getGradeEmoji(grade: string): string {
    switch (grade) {
      case 'A+': 
      case 'A': return '🟢'
      case 'B+':
      case 'B': return '🟡'
      case 'C+':
      case 'C': return '🟠'
      case 'D': return '🔴'
      default: return '⚫'
    }
  }

  /**
   * Enhanced GitHub summary generation
   */
  async generateEnhancedGitHubSummary(report: PerformanceReport): Promise<string> {
    const gradeEmoji = this.getGradeEmoji(report.grade.overall)
    const criticalAlerts = report.alerts.filter(a => a.type === 'critical')
    const warningAlerts = report.alerts.filter(a => a.type === 'warning')
    
    const summary = `
## 📊 ReadZone Performance Report - Phase 4.3

### Performance Grade: ${gradeEmoji} ${report.grade.overall} (${report.grade.score}/100)

| Category | Score | Grade | Status |
|----------|-------|-------|--------|
| Build Performance | ${report.grade.breakdown.build}/100 | ${this.getLetterGrade(report.grade.breakdown.build)} | ${report.grade.breakdown.build >= 80 ? '✅' : report.grade.breakdown.build >= 70 ? '⚠️' : '❌'} |
| Application Performance | ${report.grade.breakdown.app}/100 | ${this.getLetterGrade(report.grade.breakdown.app)} | ${report.grade.breakdown.app >= 80 ? '✅' : report.grade.breakdown.app >= 70 ? '⚠️' : '❌'} |
| Cache Efficiency | ${report.grade.breakdown.cache}/100 | ${this.getLetterGrade(report.grade.breakdown.cache)} | ${report.grade.breakdown.cache >= 80 ? '✅' : report.grade.breakdown.cache >= 70 ? '⚠️' : '❌'} |
| Parallel Efficiency | ${report.grade.breakdown.parallel}/100 | ${this.getLetterGrade(report.grade.breakdown.parallel)} | ${report.grade.breakdown.parallel >= 80 ? '✅' : report.grade.breakdown.parallel >= 70 ? '⚠️' : '❌'} |

### 🏗️ CI/CD Metrics
- **Build Time**: ${report.ci.buildTime}s
- **Test Time**: ${report.ci.testTime}s  
- **TypeCheck**: ${report.ci.typeCheckTime}s
- **Lint**: ${report.ci.lintTime}s
- **Cache Hit Rate**: ${report.ci.cacheHitRate}%
- **Memory Usage**: ${report.ci.memoryUsage}MB

### 🌐 Application Metrics
${report.app.performanceScore > 0 ? `
- **Performance Score**: ${report.app.performanceScore}/100
- **Bundle Size**: ${report.app.bundleSize}KB
- **LCP Score**: ${report.app.lcpScore}/100
- **FID Score**: ${report.app.fidScore}/100
- **CLS Score**: ${report.app.clsScore}/100
- **Accessibility**: ${report.app.accessibilityScore}/100
` : '- Application metrics not collected in this run'}

### 🚨 Alerts Summary
${criticalAlerts.length > 0 ? `
**Critical Alerts (${criticalAlerts.length})**:
${criticalAlerts.map(alert => `- 🚨 **${alert.metric}**: ${alert.message}`).join('\n')}
` : ''}
${warningAlerts.length > 0 ? `
**Warnings (${warningAlerts.length})**:
${warningAlerts.map(alert => `- ⚠️ **${alert.metric}**: ${alert.message}`).join('\n')}
` : ''}
${report.alerts.length === 0 ? '✅ **No performance alerts** - All metrics within acceptable ranges' : ''}

### 📈 Phase 4.3 Enhancements
- ✅ Enhanced CI/CD performance tracking
- ✅ Comprehensive Lighthouse integration  
- ✅ Automated regression detection
- ✅ Performance alerting system
- ✅ Detailed grading and reporting

### 💡 Quick Actions
${report.grade.score < 70 ? '- 🚨 **Urgent**: Performance below acceptable threshold - immediate optimization required' : ''}
${criticalAlerts.some(a => a.metric === 'buildTime') ? '- ⚡ **Build Optimization**: Review build configuration and dependencies' : ''}
${criticalAlerts.some(a => a.metric === 'bundleSize') ? '- 📦 **Bundle Optimization**: Implement code splitting and tree shaking' : ''}
${report.ci.cacheHitRate < 70 ? '- 💾 **Cache Optimization**: Review cache strategies and key management' : ''}
${report.grade.score >= 90 ? '- ✅ **Excellent Performance**: Consider sharing optimizations across projects' : ''}

*Report generated: ${report.timestamp}*
*Commit: \`${report.commit}\` | Branch: \`${report.branch}\`*
`

    if (process.env.GITHUB_STEP_SUMMARY) {
      try {
        writeFileSync(process.env.GITHUB_STEP_SUMMARY, summary)
        console.log('✅ Enhanced GitHub summary generated')
      } catch (error) {
        console.warn('Could not write GitHub summary:', error)
      }
    }

    return summary
  }

  private getLetterGrade(score: number): string {
    if (score >= 90) return 'A'
    if (score >= 80) return 'B'
    if (score >= 70) return 'C'
    if (score >= 60) return 'D'
    return 'F'
  }
}

// Enhanced CLI interface
async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const command = args[0] || 'analyze'
  const includeApp = args.includes('--app') || args.includes('--full')
  const skipApp = args.includes('--skip-app')
  const tracker = new PerformanceTracker()

  console.log('🚀 ReadZone Enhanced Performance Tracker - Phase 4.3')
  console.log('=' .repeat(60))

  try {
    switch (command) {
      case 'ci':
        console.log('📊 Collecting CI/CD performance metrics...')
        const ciMetrics = await tracker.collectMetrics()
        console.log('\n✅ CI Metrics:')
        console.log(`• Build Time: ${ciMetrics.buildTime}s`)
        console.log(`• Test Time: ${ciMetrics.testTime}s`)
        console.log(`• Cache Hit Rate: ${ciMetrics.cacheHitRate}%`)
        console.log(`• Parallel Efficiency: ${ciMetrics.parallelEfficiency}%`)
        break

      case 'app':
        console.log('🌐 Collecting application performance metrics...')
        const appMetrics = await tracker.collectAppMetrics()
        console.log('\n✅ Application Metrics:')
        console.log(`• Performance Score: ${appMetrics.performanceScore}/100`)
        console.log(`• Bundle Size: ${appMetrics.bundleSize}KB`)
        console.log(`• LCP Score: ${appMetrics.lcpScore}/100`)
        console.log(`• Accessibility: ${appMetrics.accessibilityScore}/100`)
        break

      case 'analyze':
      case 'full':
      default:
        console.log('📊 Running comprehensive performance analysis...')
        const shouldIncludeApp = includeApp || (command === 'full' && !skipApp)
        const report = await tracker.analyzePerformance(shouldIncludeApp)
        
        tracker.generateEnhancedReport(report)
        
        if (process.env.CI === 'true') {
          await tracker.generateEnhancedGitHubSummary(report)
        }
        
        // Exit with error code if performance is critically low
        if (report.grade.score < 60 || report.alerts.some(a => a.type === 'critical')) {
          console.log('\n❌ Critical performance issues detected')
          process.exit(1)
        }
        break

      case 'help':
        console.log('\nUsage:')
        console.log('  tsx performance-tracker.ts [command] [options]')
        console.log('\nCommands:')
        console.log('  analyze, full  - Comprehensive performance analysis (default)')
        console.log('  ci            - CI/CD metrics only')
        console.log('  app           - Application metrics only')
        console.log('  help          - Show this help')
        console.log('\nOptions:')
        console.log('  --app         - Include application metrics')
        console.log('  --skip-app    - Skip application metrics')
        console.log('  --full        - Full analysis (same as analyze --app)')
        console.log('\nExamples:')
        console.log('  tsx performance-tracker.ts                    # Basic analysis')
        console.log('  tsx performance-tracker.ts analyze --app      # With app metrics')
        console.log('  tsx performance-tracker.ts ci                 # CI metrics only')
        console.log('  tsx performance-tracker.ts app                # App metrics only')
        process.exit(0)

      default:
        console.log(`❌ Unknown command: ${command}`)
        console.log('Run "tsx performance-tracker.ts help" for usage information')
        process.exit(1)
    }

    console.log('\n✅ Performance tracking completed successfully')
  } catch (error) {
    console.error('\n❌ Performance tracking failed:', error.message)
    if (process.env.DEBUG) {
      console.error(error.stack)
    }
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error)
}

export default PerformanceTracker
/**
 * Real-time Performance Monitoring for Load Tests
 * Provides live metrics and alerts during test execution
 */

import { chromium, type Browser, type Page } from '@playwright/test'
import * as fs from 'fs/promises'
import * as path from 'path'

interface PerformanceMetric {
  timestamp: number
  operation: string
  duration: number
  success: boolean
  errorMessage?: string
  metadata?: Record<string, any>
}

interface SystemMetrics {
  timestamp: number
  cpu: number
  memory: {
    used: number
    total: number
    percentage: number
  }
  activeConnections: number
  requestsPerSecond: number
}

export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private systemMetrics: SystemMetrics[] = []
  private browser: Browser | null = null
  private monitoringPage: Page | null = null
  private isMonitoring: boolean = false
  private startTime: number = Date.now()
  
  // Alerting thresholds
  private readonly alertThresholds = {
    responseTime: {
      draftSave: 500,
      draftList: 1000,
      draftRestore: 2000,
      bookSync: 1000
    },
    errorRate: 0.01, // 1%
    systemResources: {
      cpu: 80, // 80%
      memory: 85 // 85%
    }
  }

  async startMonitoring(dashboardPort: number = 3001) {
    this.isMonitoring = true
    this.startTime = Date.now()

    // Start browser for monitoring dashboard
    this.browser = await chromium.launch({
      headless: false,
      devtools: true
    })

    // Create monitoring dashboard
    await this.createDashboard(dashboardPort)

    // Start system metrics collection
    this.collectSystemMetrics()

    // Start real-time analysis
    this.analyzeMetrics()

    console.log(`🔍 Performance monitoring started on http://localhost:${dashboardPort}`)
  }

  async stopMonitoring() {
    this.isMonitoring = false
    
    if (this.browser) {
      await this.browser.close()
    }

    // Generate final report
    await this.generateReport()
  }

  recordMetric(metric: PerformanceMetric) {
    this.metrics.push({
      ...metric,
      timestamp: Date.now()
    })

    // Check for alerts
    this.checkAlerts(metric)
  }

  private async createDashboard(port: number) {
    // Create a simple HTML dashboard
    const dashboardHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>ReadZone Load Test Monitor</title>
  <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
      background-color: #f5f5f5;
    }
    .container {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }
    .metric-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .metric-value {
      font-size: 36px;
      font-weight: bold;
      color: #333;
    }
    .metric-label {
      color: #666;
      margin-bottom: 10px;
    }
    .alert {
      background-color: #ff6b6b;
      color: white;
      padding: 10px;
      border-radius: 4px;
      margin: 10px 0;
    }
    .success { color: #51cf66; }
    .warning { color: #ffd43b; }
    .danger { color: #ff6b6b; }
    #responseTimeChart, #throughputChart, #errorRateChart, #systemChart {
      width: 100%;
      height: 300px;
    }
  </style>
</head>
<body>
  <h1>ReadZone Draft System - Load Test Monitor</h1>
  
  <div id="alerts"></div>
  
  <div class="container">
    <div class="metric-card">
      <div class="metric-label">Draft Save - P95 Response Time</div>
      <div class="metric-value" id="draftSaveP95">-- ms</div>
    </div>
    
    <div class="metric-card">
      <div class="metric-label">Overall Success Rate</div>
      <div class="metric-value" id="successRate">--%</div>
    </div>
    
    <div class="metric-card">
      <div class="metric-label">Current TPS</div>
      <div class="metric-value" id="currentTPS">--</div>
    </div>
    
    <div class="metric-card">
      <div class="metric-label">Active Virtual Users</div>
      <div class="metric-value" id="activeUsers">--</div>
    </div>
  </div>
  
  <div class="container" style="margin-top: 20px;">
    <div class="metric-card">
      <h3>Response Time Trends</h3>
      <div id="responseTimeChart"></div>
    </div>
    
    <div class="metric-card">
      <h3>Throughput (TPS)</h3>
      <div id="throughputChart"></div>
    </div>
    
    <div class="metric-card">
      <h3>Error Rate (%)</h3>
      <div id="errorRateChart"></div>
    </div>
    
    <div class="metric-card">
      <h3>System Resources</h3>
      <div id="systemChart"></div>
    </div>
  </div>
  
  <script>
    // Initialize empty charts
    const responseTimeLayout = { title: 'Response Times by Operation' };
    const throughputLayout = { title: 'Transactions Per Second' };
    const errorRateLayout = { title: 'Error Rate Over Time' };
    const systemLayout = { title: 'CPU & Memory Usage' };
    
    Plotly.newPlot('responseTimeChart', [], responseTimeLayout);
    Plotly.newPlot('throughputChart', [], throughputLayout);
    Plotly.newPlot('errorRateChart', [], errorRateLayout);
    Plotly.newPlot('systemChart', [], systemLayout);
    
    // WebSocket connection for real-time updates
    const ws = new WebSocket('ws://localhost:${port + 1}');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      updateDashboard(data);
    };
    
    function updateDashboard(data) {
      // Update metric cards
      document.getElementById('draftSaveP95').textContent = data.draftSaveP95 + ' ms';
      document.getElementById('successRate').textContent = (data.successRate * 100).toFixed(2) + '%';
      document.getElementById('currentTPS').textContent = data.currentTPS.toFixed(1);
      document.getElementById('activeUsers').textContent = data.activeUsers;
      
      // Update success rate color
      const successRateEl = document.getElementById('successRate');
      if (data.successRate >= 0.999) {
        successRateEl.className = 'metric-value success';
      } else if (data.successRate >= 0.99) {
        successRateEl.className = 'metric-value warning';
      } else {
        successRateEl.className = 'metric-value danger';
      }
      
      // Update charts
      updateCharts(data);
      
      // Update alerts
      updateAlerts(data.alerts);
    }
    
    function updateCharts(data) {
      // Update response time chart
      Plotly.update('responseTimeChart', {
        x: [data.timestamps],
        y: [data.responseTimes]
      }, [0]);
      
      // Update other charts similarly...
    }
    
    function updateAlerts(alerts) {
      const alertsContainer = document.getElementById('alerts');
      alertsContainer.innerHTML = alerts.map(alert => 
        '<div class="alert">' + alert + '</div>'
      ).join('');
    }
  </script>
</body>
</html>
    `

    // Save dashboard HTML
    const dashboardPath = path.join(__dirname, 'dashboard.html')
    await fs.writeFile(dashboardPath, dashboardHtml)

    // Open dashboard in browser
    const context = await this.browser!.newContext()
    this.monitoringPage = await context.newPage()
    await this.monitoringPage.goto(`file://${dashboardPath}`)
  }

  private async collectSystemMetrics() {
    // Simulate system metrics collection
    // In real implementation, this would connect to actual monitoring tools
    
    setInterval(() => {
      if (!this.isMonitoring) return

      const metric: SystemMetrics = {
        timestamp: Date.now(),
        cpu: Math.random() * 100, // Simulated
        memory: {
          used: Math.random() * 16 * 1024 * 1024 * 1024, // Simulated
          total: 16 * 1024 * 1024 * 1024,
          percentage: Math.random() * 100
        },
        activeConnections: Math.floor(Math.random() * 1000),
        requestsPerSecond: Math.random() * 150
      }

      this.systemMetrics.push(metric)
    }, 1000)
  }

  private analyzeMetrics() {
    setInterval(() => {
      if (!this.isMonitoring) return

      const now = Date.now()
      const recentMetrics = this.metrics.filter(m => m.timestamp > now - 60000) // Last minute

      // Calculate current statistics
      const stats = this.calculateStats(recentMetrics)

      // Update dashboard via WebSocket (simulated)
      this.updateDashboard(stats)

      // Log summary
      console.log(`📊 [${new Date().toLocaleTimeString()}] TPS: ${stats.currentTPS.toFixed(1)}, Success: ${(stats.successRate * 100).toFixed(2)}%, P95: ${stats.p95ResponseTimes.draftSave}ms`)
    }, 5000) // Update every 5 seconds
  }

  private calculateStats(metrics: PerformanceMetric[]) {
    const operations = ['draft_save', 'draft_list', 'draft_restore', 'book_sync']
    const stats: any = {
      currentTPS: 0,
      successRate: 0,
      p95ResponseTimes: {},
      errorCounts: {},
      activeUsers: new Set(metrics.map(m => m.metadata?.userId)).size
    }

    // Calculate per-operation stats
    operations.forEach(op => {
      const opMetrics = metrics.filter(m => m.operation === op)
      const successfulMetrics = opMetrics.filter(m => m.success)
      
      if (opMetrics.length > 0) {
        stats.errorCounts[op] = opMetrics.length - successfulMetrics.length
        stats.p95ResponseTimes[op] = this.calculatePercentile(
          successfulMetrics.map(m => m.duration),
          95
        )
      }
    })

    // Calculate overall stats
    const totalOps = metrics.length
    const successfulOps = metrics.filter(m => m.success).length
    stats.successRate = totalOps > 0 ? successfulOps / totalOps : 0
    stats.currentTPS = totalOps / 60 // Operations per second in last minute

    return stats
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0
    
    const sorted = [...values].sort((a, b) => a - b)
    const index = Math.ceil((percentile / 100) * sorted.length) - 1
    return sorted[index] || 0
  }

  private checkAlerts(metric: PerformanceMetric) {
    const alerts: string[] = []

    // Check response time threshold
    const threshold = this.alertThresholds.responseTime[metric.operation as keyof typeof this.alertThresholds.responseTime]
    if (threshold && metric.duration > threshold && metric.success) {
      alerts.push(`⚠️ ${metric.operation} response time (${metric.duration}ms) exceeded threshold (${threshold}ms)`)
    }

    // Check for errors
    if (!metric.success) {
      alerts.push(`❌ ${metric.operation} failed: ${metric.errorMessage || 'Unknown error'}`)
    }

    // Log alerts
    alerts.forEach(alert => console.error(alert))
  }

  private updateDashboard(stats: any) {
    // In real implementation, this would send data via WebSocket
    // For now, we'll just log it
    if (this.monitoringPage && this.monitoringPage.url().includes('dashboard.html')) {
      // Update dashboard with current stats
      this.monitoringPage.evaluate((stats) => {
        // This would be executed in the dashboard context
        if ((window as any).updateDashboard) {
          (window as any).updateDashboard(stats)
        }
      }, stats).catch(() => {})
    }
  }

  private async generateReport() {
    const report = {
      summary: {
        startTime: new Date(this.startTime).toISOString(),
        endTime: new Date().toISOString(),
        duration: (Date.now() - this.startTime) / 1000,
        totalOperations: this.metrics.length,
        totalErrors: this.metrics.filter(m => !m.success).length
      },
      operations: this.generateOperationReport(),
      systemMetrics: this.generateSystemReport(),
      recommendations: this.generateRecommendations()
    }

    // Save report
    const reportPath = path.join(__dirname, `load-test-report-${Date.now()}.json`)
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2))
    
    console.log(`📄 Report saved to: ${reportPath}`)
    
    // Also generate HTML report
    await this.generateHtmlReport(report, reportPath.replace('.json', '.html'))
  }

  private generateOperationReport() {
    const operations: Record<string, any> = {}
    const operationTypes = new Set(this.metrics.map(m => m.operation))

    operationTypes.forEach(op => {
      const opMetrics = this.metrics.filter(m => m.operation === op)
      const successfulMetrics = opMetrics.filter(m => m.success)
      const durations = successfulMetrics.map(m => m.duration)

      operations[op] = {
        count: opMetrics.length,
        errors: opMetrics.length - successfulMetrics.length,
        successRate: opMetrics.length > 0 ? successfulMetrics.length / opMetrics.length : 0,
        latency: {
          min: Math.min(...durations),
          max: Math.max(...durations),
          avg: durations.reduce((a, b) => a + b, 0) / durations.length,
          p50: this.calculatePercentile(durations, 50),
          p95: this.calculatePercentile(durations, 95),
          p99: this.calculatePercentile(durations, 99)
        },
        tps: opMetrics.length / ((Date.now() - this.startTime) / 1000)
      }
    })

    return operations
  }

  private generateSystemReport() {
    if (this.systemMetrics.length === 0) return {}

    const cpuValues = this.systemMetrics.map(m => m.cpu)
    const memoryValues = this.systemMetrics.map(m => m.memory.percentage)

    return {
      cpu: {
        min: Math.min(...cpuValues),
        max: Math.max(...cpuValues),
        avg: cpuValues.reduce((a, b) => a + b, 0) / cpuValues.length,
        p95: this.calculatePercentile(cpuValues, 95)
      },
      memory: {
        min: Math.min(...memoryValues),
        max: Math.max(...memoryValues),
        avg: memoryValues.reduce((a, b) => a + b, 0) / memoryValues.length,
        p95: this.calculatePercentile(memoryValues, 95)
      },
      maxConnections: Math.max(...this.systemMetrics.map(m => m.activeConnections)),
      peakRPS: Math.max(...this.systemMetrics.map(m => m.requestsPerSecond))
    }
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = []
    const operations = this.generateOperationReport()

    // Check draft save performance
    if (operations.draft_save?.latency.p95 > 500) {
      recommendations.push('Optimize draft save queries - P95 exceeds 500ms threshold')
    }

    // Check success rates
    Object.entries(operations).forEach(([op, stats]) => {
      if (stats.successRate < 0.999) {
        recommendations.push(`Investigate ${op} failures - success rate below 99.9%`)
      }
    })

    // Check system resources
    const systemReport = this.generateSystemReport()
    if (systemReport.cpu?.p95 && systemReport.cpu.p95 > 80) {
      recommendations.push('Consider scaling up CPU resources - P95 CPU usage exceeds 80%')
    }

    if (systemReport.memory?.p95 && systemReport.memory.p95 > 85) {
      recommendations.push('Optimize memory usage or increase available memory')
    }

    return recommendations
  }

  private async generateHtmlReport(report: any, outputPath: string) {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Load Test Report - ${new Date().toLocaleDateString()}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    h1, h2 { color: #333; }
    .summary { background: #f5f5f5; padding: 20px; border-radius: 8px; }
    .metric { margin: 10px 0; }
    .success { color: green; }
    .warning { color: orange; }
    .error { color: red; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    .recommendation { background: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; margin: 10px 0; }
  </style>
</head>
<body>
  <h1>ReadZone Draft System - Load Test Report</h1>
  
  <div class="summary">
    <h2>Test Summary</h2>
    <div class="metric">Duration: ${report.summary.duration.toFixed(0)}s</div>
    <div class="metric">Total Operations: ${report.summary.totalOperations.toLocaleString()}</div>
    <div class="metric">Total Errors: ${report.summary.totalErrors}</div>
    <div class="metric">Overall Success Rate: ${((1 - report.summary.totalErrors / report.summary.totalOperations) * 100).toFixed(2)}%</div>
  </div>
  
  <h2>Operation Performance</h2>
  <table>
    <tr>
      <th>Operation</th>
      <th>Count</th>
      <th>Success Rate</th>
      <th>P50 (ms)</th>
      <th>P95 (ms)</th>
      <th>P99 (ms)</th>
      <th>TPS</th>
    </tr>
    ${Object.entries(report.operations).map(([op, stats]: [string, any]) => `
      <tr>
        <td>${op}</td>
        <td>${stats.count.toLocaleString()}</td>
        <td class="${stats.successRate >= 0.999 ? 'success' : stats.successRate >= 0.99 ? 'warning' : 'error'}">
          ${(stats.successRate * 100).toFixed(2)}%
        </td>
        <td>${stats.latency.p50.toFixed(0)}</td>
        <td class="${stats.latency.p95 > this.getThreshold(op) ? 'error' : 'success'}">
          ${stats.latency.p95.toFixed(0)}
        </td>
        <td>${stats.latency.p99.toFixed(0)}</td>
        <td>${stats.tps.toFixed(1)}</td>
      </tr>
    `).join('')}
  </table>
  
  <h2>System Resources</h2>
  <table>
    <tr>
      <th>Resource</th>
      <th>Min</th>
      <th>Avg</th>
      <th>Max</th>
      <th>P95</th>
    </tr>
    <tr>
      <td>CPU (%)</td>
      <td>${report.systemMetrics.cpu?.min.toFixed(1) || 'N/A'}</td>
      <td>${report.systemMetrics.cpu?.avg.toFixed(1) || 'N/A'}</td>
      <td>${report.systemMetrics.cpu?.max.toFixed(1) || 'N/A'}</td>
      <td class="${report.systemMetrics.cpu?.p95 > 80 ? 'warning' : 'success'}">
        ${report.systemMetrics.cpu?.p95.toFixed(1) || 'N/A'}
      </td>
    </tr>
    <tr>
      <td>Memory (%)</td>
      <td>${report.systemMetrics.memory?.min.toFixed(1) || 'N/A'}</td>
      <td>${report.systemMetrics.memory?.avg.toFixed(1) || 'N/A'}</td>
      <td>${report.systemMetrics.memory?.max.toFixed(1) || 'N/A'}</td>
      <td class="${report.systemMetrics.memory?.p95 > 85 ? 'warning' : 'success'}">
        ${report.systemMetrics.memory?.p95.toFixed(1) || 'N/A'}
      </td>
    </tr>
  </table>
  
  <h2>Recommendations</h2>
  ${report.recommendations.map((rec: string) => `
    <div class="recommendation">${rec}</div>
  `).join('')}
  
  <p><small>Generated: ${new Date().toLocaleString()}</small></p>
</body>
</html>
    `

    await fs.writeFile(outputPath, html)
    console.log(`📊 HTML report saved to: ${outputPath}`)
  }

  private getThreshold(operation: string): number {
    const thresholds: Record<string, number> = {
      draft_save: 500,
      draft_list: 1000,
      draft_restore: 2000,
      book_sync: 1000
    }
    return thresholds[operation] || 1000
  }
}

// Export for use in tests
export default PerformanceMonitor
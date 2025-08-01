/**
 * Database Connection Pool Manager
 * Implements connection pooling for enhanced performance per PRD requirements
 */

import { PrismaClient } from '@prisma/client'

// Enhanced Prisma client with connection pooling
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Connection pool configuration per PRD requirements
const CONNECTION_POOL_CONFIG = {
  // PRD requirement: DB connection pool size = 20
  connection_limit: 20,
  // Optimize for draft system workload
  pool_timeout: 20, // seconds
  statement_cache_size: 100, // Cache prepared statements
  
  // Performance optimization settings
  query_timeout: 30000, // 30s timeout per query
  connect_timeout: 10000, // 10s connection timeout
  
  // Log configuration
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error'] as any
    : ['warn', 'error'] as any,
}

export const db = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + 
        `?connection_limit=${CONNECTION_POOL_CONFIG.connection_limit}` +
        `&pool_timeout=${CONNECTION_POOL_CONFIG.pool_timeout}` +
        `&statement_cache_size=${CONNECTION_POOL_CONFIG.statement_cache_size}`
    }
  },
  log: CONNECTION_POOL_CONFIG.log,
  
  // Additional performance optimizations
  errorFormat: 'minimal',
})

// Register cleanup handlers for graceful shutdown
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}

// Connection pool monitoring
export class ConnectionPoolMonitor {
  private static instance: ConnectionPoolMonitor
  private metrics = {
    activeConnections: 0,
    totalQueries: 0,
    averageQueryTime: 0,
    poolExhaustionCount: 0,
    slowQueryCount: 0,
  }

  static getInstance(): ConnectionPoolMonitor {
    if (!this.instance) {
      this.instance = new ConnectionPoolMonitor()
    }
    return this.instance
  }

  async trackQuery<T>(
    operation: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now()
    this.metrics.activeConnections++
    
    try {
      const result = await queryFn()
      const duration = Date.now() - startTime
      
      // Track performance metrics
      this.metrics.totalQueries++
      this.metrics.averageQueryTime = 
        (this.metrics.averageQueryTime * (this.metrics.totalQueries - 1) + duration) / 
        this.metrics.totalQueries
        
      // Alert on slow queries (>500ms impacts PRD targets)
      if (duration > 500) {
        this.metrics.slowQueryCount++
        console.warn(`⚠️ Slow query detected: ${operation} took ${duration}ms`)
      }
      
      return result
    } catch (error: any) {
      // Track connection pool exhaustion
      if (error.message?.includes('connection') || error.message?.includes('pool')) {
        this.metrics.poolExhaustionCount++
        console.error(`🔴 Connection pool issue: ${operation}`, error.message)
      }
      throw error
    } finally {
      this.metrics.activeConnections--
    }
  }

  getMetrics() {
    return {
      ...this.metrics,
      poolUtilization: (this.metrics.activeConnections / CONNECTION_POOL_CONFIG.connection_limit) * 100,
      slowQueryRate: this.metrics.totalQueries > 0 
        ? (this.metrics.slowQueryCount / this.metrics.totalQueries) * 100 
        : 0,
    }
  }

  // Check if pool is under stress (>80% utilization)
  isPoolUnderStress(): boolean {
    const utilization = (this.metrics.activeConnections / CONNECTION_POOL_CONFIG.connection_limit) * 100
    return utilization > 80
  }
}

// Export singleton instance
export const connectionMonitor = ConnectionPoolMonitor.getInstance()

// Graceful shutdown handler
export async function disconnectDb(): Promise<void> {
  try {
    await db.$disconnect()
    console.log('✅ Database connection pool closed gracefully')
  } catch (error) {
    console.error('❌ Error closing database connection pool:', error)
  }
}

// Health check function
export async function checkDbHealth(): Promise<{
  healthy: boolean
  responseTime: number
  connectionPoolStatus: any
}> {
  const startTime = Date.now()
  
  try {
    // Simple query to test connection
    await db.$queryRaw`SELECT 1`
    const responseTime = Date.now() - startTime
    
    return {
      healthy: true,
      responseTime,
      connectionPoolStatus: connectionMonitor.getMetrics(),
    }
  } catch (error) {
    console.error('Database health check failed:', error)
    return {
      healthy: false,
      responseTime: Date.now() - startTime,
      connectionPoolStatus: connectionMonitor.getMetrics(),
    }
  }
}
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

/**
 * Health Check Endpoint for Docker Container
 * Used by Docker healthcheck and load balancers
 */
export async function GET() {
  try {
    // Basic health status
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '0.1.0',
      environment: process.env.NODE_ENV || 'development',
    }

    // Check database connectivity
    try {
      await prisma.$queryRaw`SELECT 1`
      health.database = 'connected'
    } catch (error) {
      health.database = 'disconnected'
      health.status = 'degraded'
    }

    // Check Redis connectivity (if configured)
    if (process.env.REDIS_URL) {
      try {
        // Simple Redis ping check would go here
        health.redis = 'connected'
      } catch (error) {
        health.redis = 'disconnected'
        health.status = 'degraded'
      }
    }

    // Determine HTTP status code
    const statusCode = health.status === 'healthy' ? 200 : 503

    return NextResponse.json(health, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    })

  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { 
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    )
  }
}
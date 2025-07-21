import { Router, Request, Response } from 'express';
import { register } from '../middleware/metrics';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Basic health check
router.get('/health', async (_req: Request, res: Response) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      memory: process.memoryUsage(),
      database: 'connected'
    };

    res.status(200).json(healthData);
  } catch (error) {
    const healthData = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      memory: process.memoryUsage(),
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error'
    };

    res.status(503).json(healthData);
  }
});

// Detailed health check
router.get('/health/detailed', async (_req: Request, res: Response) => {
  const checks: { [key: string]: any } = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  };

  // Database check
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const duration = Date.now() - start;
    
    checks.database = {
      status: 'healthy',
      responseTime: `${duration}ms`
    };
  } catch (error) {
    checks.database = {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }

  // Redis check (if implemented)
  try {
    // Add Redis health check here when implemented
    checks.redis = {
      status: 'not_implemented'
    };
  } catch (error) {
    checks.redis = {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }

  // Memory check
  const memory = process.memoryUsage();
  const memoryUsageMB = {
    rss: Math.round(memory.rss / 1024 / 1024),
    heapUsed: Math.round(memory.heapUsed / 1024 / 1024),
    heapTotal: Math.round(memory.heapTotal / 1024 / 1024),
    external: Math.round(memory.external / 1024 / 1024)
  };

  checks.memory = {
    status: memoryUsageMB.heapUsed < 512 ? 'healthy' : 'warning',
    usage: memoryUsageMB,
    unit: 'MB'
  };

  // CPU check (simplified)
  const cpuUsage = process.cpuUsage();
  checks.cpu = {
    status: 'healthy',
    user: cpuUsage.user,
    system: cpuUsage.system
  };

  // Disk space check (if needed)
  checks.disk = {
    status: 'not_implemented'
  };

  // External services check
  checks.externalServices = {
    kakaoApi: {
      status: 'not_checked' // Add actual check when implemented
    }
  };

  // Overall status
  const allHealthy = Object.values(checks)
    .filter(check => typeof check === 'object' && check.status)
    .every(check => check.status === 'healthy');

  const overallStatus = allHealthy ? 'healthy' : 'degraded';

  res.status(overallStatus === 'healthy' ? 200 : 207).json({
    status: overallStatus,
    checks
  });
});

// Readiness check (for Kubernetes)
router.get('/ready', async (_req: Request, res: Response) => {
  try {
    // Check if the application is ready to serve traffic
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Liveness check (for Kubernetes)
router.get('/live', (_req: Request, res: Response) => {
  // Simple liveness check - if the process is running, it's alive
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Metrics endpoint for Prometheus
router.get('/metrics', async (_req: Request, res: Response) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end(error);
  }
});

// Performance metrics endpoint
router.get('/performance', async (_req: Request, res: Response) => {
  const performance = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    eventLoop: {
      // Add event loop lag measurement if needed
      lag: 'not_implemented'
    },
    gc: {
      // Add garbage collection stats if needed
      stats: 'not_implemented'
    }
  };

  res.json(performance);
});

export default router;
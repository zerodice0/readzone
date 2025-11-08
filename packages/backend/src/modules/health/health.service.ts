import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../common/utils/prisma';
import { RedisService } from '../../common/utils/redis';
import { LoggerService } from '../../common/utils/logger';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
  };
}

export interface ServiceHealth {
  status: 'up' | 'down';
  responseTime?: number;
  error?: string;
}

/**
 * Health check service
 * Checks health of application dependencies
 */
@Injectable()
export class HealthService {
  private readonly logger = new LoggerService('HealthService');

  private readonly startTime = Date.now();

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(RedisService) private readonly redis: RedisService
  ) {}

  /**
   * Performs health checks on all services
   */
  async check(): Promise<HealthStatus> {
    const [database, redis] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    const status = HealthService.determineOverallStatus(database, redis);

    return {
      status,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      services: {
        database,
        redis,
      },
    };
  }

  /**
   * Checks database connectivity
   */
  private async checkDatabase(): Promise<ServiceHealth> {
    const startTime = Date.now();
    try {
      const isConnected = await this.prisma.checkConnection();
      const responseTime = Date.now() - startTime;

      if (isConnected) {
        return {
          status: 'up',
          responseTime,
        };
      }

      return {
        status: 'down',
        responseTime,
        error: 'Database connection failed',
      };
    } catch (error) {
      this.logger.error(
        'Database health check failed',
        error instanceof Error ? error.stack : undefined
      );
      return {
        status: 'down',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Checks Redis connectivity
   */
  private async checkRedis(): Promise<ServiceHealth> {
    const startTime = Date.now();
    try {
      const isConnected = await this.redis.checkConnection();
      const responseTime = Date.now() - startTime;

      if (isConnected) {
        return {
          status: 'up',
          responseTime,
        };
      }

      return {
        status: 'down',
        responseTime,
        error: 'Redis connection failed',
      };
    } catch (error) {
      this.logger.error(
        'Redis health check failed',
        error instanceof Error ? error.stack : undefined
      );
      return {
        status: 'down',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Determines overall health status based on service health
   */
  private static determineOverallStatus(
    database: ServiceHealth,
    redis: ServiceHealth
  ): 'healthy' | 'degraded' | 'unhealthy' {
    // If database is down, system is unhealthy
    if (database.status === 'down') {
      return 'unhealthy';
    }

    // If Redis is down but database is up, system is degraded
    if (redis.status === 'down') {
      return 'degraded';
    }

    // All services are up
    return 'healthy';
  }
}

import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { PrismaService } from '../../common/utils/prisma';
import { RedisService } from '../../common/utils/redis';

/**
 * Health check module
 * Provides health endpoint for monitoring
 */
@Module({
  controllers: [HealthController],
  providers: [HealthService, PrismaService, RedisService],
  exports: [HealthService],
})
export class HealthModule {}

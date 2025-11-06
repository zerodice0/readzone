import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { configFactory } from './config';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { PrismaService } from './common/utils/prisma';
import { RedisService } from './common/utils/redis';
import { AuditService } from './common/services/audit.service';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';

/**
 * Root application module
 * Imports all feature modules and configures global providers
 */
@Global()
@Module({
  imports: [
    // Configuration module with Zod validation
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configFactory],
      cache: true,
    }),

    // Feature modules
    HealthModule,
    AuthModule,
  ],
  providers: [
    // Global exception filter
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },

    // Global services
    PrismaService,
    RedisService,
    AuditService,
  ],
  exports: [PrismaService, RedisService, AuditService],
})
export class AppModule {}

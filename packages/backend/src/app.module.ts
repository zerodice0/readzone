import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { configFactory } from './config';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { CustomThrottlerGuard } from './common/guards/custom-throttler.guard';
import { PrismaService } from './common/utils/prisma';
import { RedisService } from './common/utils/redis';
import { AuditService } from './common/services/audit.service';
import { EmailService } from './common/services/email.service';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AdminModule } from './modules/admin/admin.module';

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

    // Rate limiting module with Redis storage
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: () => ({
        throttlers: [
          {
            name: 'default',
            ttl: 60000, // 1 minute in milliseconds
            limit: 100, // 100 requests per minute for anonymous users
          },
        ],
        // Redis storage will be configured via custom storage provider
      }),
    }),

    // Feature modules
    HealthModule,
    AuthModule,
    UsersModule,
    AdminModule,
  ],
  providers: [
    // Global exception filter
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },

    // Global rate limiting guard (custom with auth-based limits)
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },

    // Global services
    PrismaService,
    RedisService,
    AuditService,
    EmailService,
  ],
  exports: [PrismaService, RedisService, AuditService, EmailService],
})
export class AppModule {}

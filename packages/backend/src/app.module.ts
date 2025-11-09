import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { configFactory } from './config';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { CustomThrottlerGuard } from './common/guards/custom-throttler.guard';
import { CsrfGuard } from './common/guards/csrf.guard';
import { PrismaService } from './common/utils/prisma';
import { RedisService } from './common/utils/redis';
import { ThrottlerRedisStorage } from './common/utils/throttler-redis-storage';
import { AuditService } from './common/services/audit.service';
import { EmailService } from './common/services/email.service';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AdminModule } from './modules/admin/admin.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { BooksModule } from './modules/books/books.module';
import { LikesModule } from './modules/likes/likes.module';
import { BookmarksModule } from './modules/bookmarks/bookmarks.module';

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
      inject: [RedisService],
      useFactory: (redis: RedisService) => ({
        throttlers: [
          {
            name: 'default',
            ttl: 60000, // 1 minute in milliseconds
            limit: 100, // 100 requests per minute for anonymous users
          },
        ],
        storage: new ThrottlerRedisStorage(redis),
      }),
    }),

    // Feature modules
    HealthModule,
    AuthModule,
    UsersModule,
    AdminModule,
    ReviewsModule,
    BooksModule,
    LikesModule,
    BookmarksModule,
  ],
  providers: [
    // Global exception filter
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },

    // Global CSRF protection guard (executes first)
    {
      provide: APP_GUARD,
      useClass: CsrfGuard,
    },

    // Global rate limiting guard (custom with auth-based limits)
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },

    // Global services
    PrismaService,
    RedisService,
    ThrottlerRedisStorage,
    AuditService,
    EmailService,
  ],
  exports: [
    PrismaService,
    RedisService,
    ThrottlerRedisStorage,
    AuditService,
    EmailService,
  ],
})
export class AppModule {}

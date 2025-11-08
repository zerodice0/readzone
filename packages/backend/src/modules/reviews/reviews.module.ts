import { Module } from '@nestjs/common';
import { ReviewsController } from './controllers/reviews.controller';
import { ReviewsService } from './services/reviews.service';

/**
 * Reviews Module
 *
 * Provides endpoints for:
 * - Feed: GET /reviews/feed (paginated review list)
 * - Details: GET /reviews/:id
 * - Create: POST /reviews
 * - Update: PATCH /reviews/:id
 * - Delete: DELETE /reviews/:id (soft delete)
 *
 * Dependencies:
 * - PrismaService (injected globally from AppModule)
 * - RedisService (for view count caching and feed caching)
 */
@Module({
  imports: [],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}

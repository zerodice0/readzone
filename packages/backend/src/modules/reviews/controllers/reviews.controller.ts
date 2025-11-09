import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  UseGuards,
  Request,
  Body,
  Param,
  Query,
  Ip,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../auth/guards/optional-jwt-auth.guard';
import { ReviewsService } from '../services/reviews.service';
import {
  CreateReviewDto,
  UpdateReviewDto,
  FeedQueryDto,
  FeedResponseDto,
  ReviewResponseDto,
  CreateReviewResponseDto,
} from '../dto';

interface RequestWithUser {
  user?: {
    userId: string;
    email: string;
  };
}

/**
 * Reviews Controller
 *
 * Handles all review-related HTTP endpoints:
 * - GET /reviews/feed - Paginated review feed (public)
 * - GET /reviews/:id - Single review detail (public)
 * - POST /reviews - Create new review (authenticated)
 * - PATCH /reviews/:id - Update review (authenticated, author only)
 * - DELETE /reviews/:id - Delete review (authenticated, author only)
 */
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  /**
   * GET /reviews/feed
   *
   * Get paginated review feed ordered by publishedAt DESC.
   * Public endpoint with optional authentication for personalized data.
   *
   * @param query - Pagination parameters (page, limit)
   * @param req - Optional user from JWT
   * @returns Paginated feed with reviews, user info, book info
   */
  @Get('feed')
  @UseGuards(OptionalJwtAuthGuard)
  async getFeed(
    @Query() query: FeedQueryDto,
    @Request() req: RequestWithUser,
  ): Promise<FeedResponseDto> {
    return this.reviewsService.getFeed(query, req.user?.userId);
  }

  /**
   * GET /reviews/:id
   *
   * Get single review by ID with full details.
   * Public endpoint with optional authentication for personalized data.
   * Increments view count with deduplication (1 hour per IP).
   *
   * @param id - Review UUID
   * @param req - Optional user from JWT
   * @param ipAddress - Client IP for view deduplication
   * @returns Review detail with book and user info
   */
  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  async getReviewById(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
    @Ip() ipAddress: string,
  ): Promise<ReviewResponseDto> {
    return this.reviewsService.getReviewById(
      id,
      req.user?.userId,
      ipAddress,
    );
  }

  /**
   * POST /reviews
   *
   * Create new review.
   * Requires authentication.
   *
   * @param dto - Review creation data
   * @param req - Request with user from JWT
   * @returns Created review DTO
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createReview(
    @Body() dto: CreateReviewDto,
    @Request() req: RequestWithUser,
  ): Promise<CreateReviewResponseDto> {
    return this.reviewsService.createReview(req.user!.userId, dto);
  }

  /**
   * PATCH /reviews/:id
   *
   * Update existing review.
   * Requires authentication and author ownership.
   *
   * @param id - Review UUID
   * @param dto - Review update data
   * @param req - Request with user from JWT
   * @returns Updated review DTO
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async updateReview(
    @Param('id') id: string,
    @Body() dto: UpdateReviewDto,
    @Request() req: RequestWithUser,
  ): Promise<CreateReviewResponseDto> {
    return this.reviewsService.updateReview(id, req.user!.userId, dto);
  }

  /**
   * DELETE /reviews/:id
   *
   * Soft delete review (sets status=DELETED, deletedAt timestamp).
   * Requires authentication and author ownership.
   *
   * @param id - Review UUID
   * @param req - Request with user from JWT
   * @returns 204 No Content
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteReview(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<void> {
    return this.reviewsService.deleteReview(id, req.user!.userId);
  }
}

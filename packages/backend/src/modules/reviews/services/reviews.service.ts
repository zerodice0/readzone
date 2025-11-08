import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ReviewStatus } from '@prisma/client';
import { PrismaService } from '../../../common/utils/prisma';
import { RedisService } from '../../../common/utils/redis';
import {
  CreateReviewDto,
  UpdateReviewDto,
  FeedQueryDto,
  FeedResponseDto,
  ReviewResponseDto,
  CreateReviewResponseDto,
  ReviewFeedItemDto,
  ReviewDetailDto,
} from '../dto';

/**
 * Reviews Service
 *
 * Handles all review-related business logic:
 * - Feed retrieval with pagination
 * - Review detail retrieval with view counting
 * - Review creation
 * - Review update (author only)
 * - Review deletion (soft delete, author only)
 *
 * Performance optimizations:
 * - N+1 query prevention via Prisma include
 * - Redis caching for anonymous feed (TTL: 60s)
 * - View count deduplication (1 hour per IP/session)
 */
@Injectable()
export class ReviewsService {
  private readonly FEED_CACHE_TTL = 60; // 60 seconds
  private readonly VIEW_DEDUPE_TTL = 3600; // 1 hour

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Get paginated review feed
   *
   * Returns published reviews ordered by publishedAt DESC.
   * Prevents N+1 queries by including user and book relations.
   * Caches anonymous feed requests in Redis.
   *
   * @param query - Pagination parameters (page, limit)
   * @param userId - Optional user ID for personalized data (isLikedByMe, isBookmarkedByMe)
   * @returns Paginated feed with metadata
   */
  async getFeed(
    query: FeedQueryDto,
    userId?: string,
  ): Promise<FeedResponseDto> {
    const { page = 0, limit = 20 } = query;
    const skip = page * limit;

    // Check cache for anonymous users only
    const cacheKey = userId ? null : `feed:${page}:${limit}`;
    if (cacheKey) {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    }

    // Query with N+1 prevention
    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: {
          status: ReviewStatus.PUBLISHED,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profileImage: true,
            },
          },
          book: {
            select: {
              id: true,
              title: true,
              author: true,
              coverImageUrl: true,
            },
          },
          likes: userId ? { where: { userId } } : false,
          bookmarks: userId ? { where: { userId } } : false,
        },
        orderBy: {
          publishedAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.review.count({
        where: {
          status: ReviewStatus.PUBLISHED,
        },
      }),
    ]);

    // Transform to DTO
    const data: ReviewFeedItemDto[] = reviews.map((review) => ({
      id: review.id,
      title: review.title,
      content: this.truncateContent(review.content, 150),
      isRecommended: review.isRecommended,
      rating: review.rating,
      readStatus: review.readStatus,
      likeCount: review.likeCount,
      bookmarkCount: review.bookmarkCount,
      viewCount: review.viewCount,
      publishedAt: review.publishedAt,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      user: {
        id: review.user.id,
        name: review.user.name,
        profileImage: review.user.profileImage,
      },
      book: {
        id: review.book.id,
        title: review.book.title,
        author: review.book.author,
        coverImageUrl: review.book.coverImageUrl,
      },
      ...(userId && {
        isLikedByMe: (review.likes as unknown[]).length > 0,
        isBookmarkedByMe: (review.bookmarks as unknown[]).length > 0,
      }),
    }));

    const response: FeedResponseDto = {
      data,
      meta: {
        page,
        limit,
        total,
        hasMore: skip + limit < total,
        timestamp: new Date(),
      },
    };

    // Cache for anonymous users
    if (cacheKey) {
      await this.redis.set(
        cacheKey,
        JSON.stringify(response),
        this.FEED_CACHE_TTL,
      );
    }

    return response;
  }

  /**
   * Get single review by ID
   *
   * Returns full review details including complete book information.
   * Increments view count with deduplication (1 hour per IP).
   *
   * @param reviewId - Review UUID
   * @param userId - Optional user ID for personalized data
   * @param ipAddress - User's IP address for view deduplication
   * @returns Review detail DTO
   * @throws NotFoundException if review not found or deleted
   */
  async getReviewById(
    reviewId: string,
    userId?: string,
    ipAddress?: string,
  ): Promise<ReviewResponseDto> {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
        book: {
          select: {
            id: true,
            isbn: true,
            title: true,
            author: true,
            publisher: true,
            publishedDate: true,
            coverImageUrl: true,
            description: true,
            pageCount: true,
          },
        },
        likes: userId ? { where: { userId } } : false,
        bookmarks: userId ? { where: { userId } } : false,
      },
    });

    if (!review || review.status === ReviewStatus.DELETED) {
      throw new NotFoundException('Review not found');
    }

    // Increment view count with deduplication
    if (ipAddress) {
      const viewKey = `view:${reviewId}:${ipAddress}`;
      const viewed = await this.redis.get(viewKey);

      if (!viewed) {
        await Promise.all([
          this.prisma.review.update({
            where: { id: reviewId },
            data: { viewCount: { increment: 1 } },
          }),
          this.redis.set(viewKey, '1', this.VIEW_DEDUPE_TTL),
        ]);

        // Update local object for response
        review.viewCount += 1;
      }
    }

    const data: ReviewDetailDto = {
      id: review.id,
      title: review.title,
      content: review.content,
      isRecommended: review.isRecommended,
      rating: review.rating,
      readStatus: review.readStatus,
      likeCount: review.likeCount,
      bookmarkCount: review.bookmarkCount,
      viewCount: review.viewCount,
      status: review.status,
      publishedAt: review.publishedAt,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      user: {
        id: review.user.id,
        name: review.user.name,
        profileImage: review.user.profileImage,
      },
      book: {
        id: review.book.id,
        isbn: review.book.isbn,
        title: review.book.title,
        author: review.book.author,
        publisher: review.book.publisher,
        publishedDate: review.book.publishedDate,
        coverImageUrl: review.book.coverImageUrl,
        description: review.book.description,
        pageCount: review.book.pageCount,
      },
      ...(userId && {
        isLikedByMe: (review.likes as unknown[]).length > 0,
        isBookmarkedByMe: (review.bookmarks as unknown[]).length > 0,
      }),
    };

    return {
      data,
      meta: {
        timestamp: new Date(),
      },
    };
  }

  /**
   * Create new review
   *
   * Validates that the book exists before creating the review.
   * Sets publishedAt timestamp if status is PUBLISHED.
   *
   * @param userId - Review author's user ID
   * @param dto - Review creation data
   * @returns Created review DTO
   * @throws NotFoundException if book not found
   * @throws BadRequestException if validation fails
   */
  async createReview(
    userId: string,
    dto: CreateReviewDto,
  ): Promise<CreateReviewResponseDto> {
    // Verify book exists
    const book = await this.prisma.book.findUnique({
      where: { id: dto.bookId },
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    // Sanitize content (remove HTML tags to prevent XSS)
    const sanitizedContent = this.sanitizeHtml(dto.content);

    // Create review
    const review = await this.prisma.review.create({
      data: {
        userId,
        bookId: dto.bookId,
        title: dto.title,
        content: sanitizedContent,
        rating: dto.rating,
        isRecommended: dto.isRecommended,
        readStatus: dto.readStatus,
        status: dto.status ?? ReviewStatus.PUBLISHED,
        publishedAt:
          (dto.status ?? ReviewStatus.PUBLISHED) === ReviewStatus.PUBLISHED
            ? new Date()
            : null,
      },
    });

    return {
      data: {
        id: review.id,
        bookId: review.bookId,
        title: review.title,
        content: review.content,
        isRecommended: review.isRecommended,
        rating: review.rating,
        readStatus: review.readStatus,
        status: review.status,
        likeCount: review.likeCount,
        bookmarkCount: review.bookmarkCount,
        viewCount: review.viewCount,
        publishedAt: review.publishedAt,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
      },
      meta: {
        timestamp: new Date(),
      },
    };
  }

  /**
   * Update existing review
   *
   * Only the author can update their own review.
   * Updates publishedAt when status changes to PUBLISHED.
   *
   * @param reviewId - Review UUID
   * @param userId - Current user's ID
   * @param dto - Review update data
   * @returns Updated review DTO
   * @throws NotFoundException if review not found
   * @throws ForbiddenException if user is not the author
   */
  async updateReview(
    reviewId: string,
    userId: string,
    dto: UpdateReviewDto,
  ): Promise<CreateReviewResponseDto> {
    // Check ownership
    const existing = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!existing || existing.status === ReviewStatus.DELETED) {
      throw new NotFoundException('Review not found');
    }

    if (existing.userId !== userId) {
      throw new ForbiddenException('You can only update your own reviews');
    }

    // Sanitize content if provided
    const sanitizedContent = dto.content
      ? this.sanitizeHtml(dto.content)
      : undefined;

    // Determine publishedAt update
    const publishedAt =
      dto.status === ReviewStatus.PUBLISHED && !existing.publishedAt
        ? new Date()
        : undefined;

    // Update review
    const review = await this.prisma.review.update({
      where: { id: reviewId },
      data: {
        title: dto.title,
        content: sanitizedContent,
        rating: dto.rating,
        isRecommended: dto.isRecommended,
        readStatus: dto.readStatus,
        status: dto.status,
        publishedAt,
      },
    });

    return {
      data: {
        id: review.id,
        bookId: review.bookId,
        title: review.title,
        content: review.content,
        isRecommended: review.isRecommended,
        rating: review.rating,
        readStatus: review.readStatus,
        status: review.status,
        likeCount: review.likeCount,
        bookmarkCount: review.bookmarkCount,
        viewCount: review.viewCount,
        publishedAt: review.publishedAt,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
      },
      meta: {
        timestamp: new Date(),
      },
    };
  }

  /**
   * Delete review (soft delete)
   *
   * Only the author can delete their own review.
   * Sets status to DELETED and records deletedAt timestamp.
   * Likes and bookmarks are preserved for statistics.
   *
   * @param reviewId - Review UUID
   * @param userId - Current user's ID
   * @throws NotFoundException if review not found
   * @throws ForbiddenException if user is not the author
   */
  async deleteReview(reviewId: string, userId: string): Promise<void> {
    // Check ownership
    const existing = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!existing || existing.status === ReviewStatus.DELETED) {
      throw new NotFoundException('Review not found');
    }

    if (existing.userId !== userId) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    // Soft delete
    await this.prisma.review.update({
      where: { id: reviewId },
      data: {
        status: ReviewStatus.DELETED,
        deletedAt: new Date(),
      },
    });
  }

  /**
   * Truncate content to specified length
   *
   * @param content - Original content
   * @param maxLength - Maximum length
   * @returns Truncated content with ellipsis if needed
   */
  private truncateContent(content: string, maxLength: number): string {
    if (content.length <= maxLength) {
      return content;
    }
    return content.substring(0, maxLength) + '...';
  }

  /**
   * Sanitize HTML content to prevent XSS attacks
   *
   * Removes all HTML tags from content.
   *
   * @param content - Raw content
   * @returns Sanitized content
   */
  private sanitizeHtml(content: string): string {
    return content.replace(/<[^>]*>/g, '');
  }
}

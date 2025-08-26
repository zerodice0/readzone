import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FeedQueryDto, FeedTab } from './dto/feed-query.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { LikeActionDto, LikeAction } from './dto/like-action.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prismaService: PrismaService) {}

  async getFeed(feedQueryDto: FeedQueryDto) {
    const { tab, cursor, limit } = feedQueryDto;

    // Base conditions for published and public reviews
    const baseConditions = {
      status: 'PUBLISHED' as const,
      isPublic: true,
    };

    // Determine ordering based on tab
    let orderBy: Record<string, 'desc' | 'asc'> = {};
    switch (tab) {
      case FeedTab.RECOMMENDED:
        // For recommended, we could order by likes count, but for now use creation date
        orderBy = { createdAt: 'desc' };
        break;
      case FeedTab.LATEST:
        orderBy = { createdAt: 'desc' };
        break;
      case FeedTab.FOLLOWING:
        // This would need user following data, for now use creation date
        orderBy = { createdAt: 'desc' };
        break;
    }

    // Build query with cursor pagination
    const queryOptions: {
      where: any;
      include: any;
      orderBy: any;
      take: number;
      cursor?: { id: string };
      skip?: number;
    } = {
      where: baseConditions,
      include: {
        user: {
          select: {
            id: true,
            userid: true,
            nickname: true,
            profileImage: true,
            isVerified: true,
          },
        },
        book: {
          select: {
            id: true,
            title: true,
            author: true,
            isbn: true,
            thumbnail: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy,
      take: limit,
    };

    // Add cursor pagination if provided
    if (cursor) {
      queryOptions.cursor = { id: cursor };
      queryOptions.skip = 1;
    }

    const reviews = await this.prismaService.review.findMany(queryOptions);

    return {
      success: true,
      data: {
        reviews: reviews.map((review) => ({
          ...review,
          createdAt: review.createdAt.toISOString(),
          updatedAt: review.updatedAt.toISOString(),
        })),
        hasMore: reviews.length === limit,
        nextCursor:
          reviews.length === limit ? reviews[reviews.length - 1].id : null,
      },
    };
  }

  async createReview(createReviewDto: CreateReviewDto, userId: string) {
    const review = await this.prismaService.review.create({
      data: {
        bookId: createReviewDto.bookId,
        title: createReviewDto.title,
        content: createReviewDto.content,
        isRecommended: createReviewDto.isRecommended,
        rating: createReviewDto.rating,
        tags: createReviewDto.tags
          ? JSON.stringify(createReviewDto.tags)
          : null,
        isPublic: createReviewDto.isPublic,
        userId,
        status: 'PUBLISHED',
      },
      include: {
        user: {
          select: {
            id: true,
            userid: true,
            nickname: true,
            profileImage: true,
            isVerified: true,
          },
        },
        book: {
          select: {
            id: true,
            title: true,
            author: true,
            isbn: true,
            thumbnail: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    return {
      success: true,
      data: {
        review: {
          ...review,
          createdAt: review.createdAt.toISOString(),
          updatedAt: review.updatedAt.toISOString(),
        },
      },
    };
  }

  async likeReview(
    reviewId: string,
    likeActionDto: LikeActionDto,
    userId: string,
  ) {
    const { action } = likeActionDto;

    if (action === LikeAction.LIKE) {
      // Create like if not exists
      await this.prismaService.like.upsert({
        where: {
          userId_reviewId: {
            userId,
            reviewId,
          },
        },
        create: {
          userId,
          reviewId,
        },
        update: {}, // No updates needed if already exists
      });
    } else {
      // Remove like
      await this.prismaService.like.deleteMany({
        where: {
          userId,
          reviewId,
        },
      });
    }

    // Get updated like count
    const likeCount = await this.prismaService.like.count({
      where: { reviewId },
    });

    return {
      success: true,
      data: {
        action,
        likeCount,
      },
    };
  }
}

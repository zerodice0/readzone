import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../../common/utils/prisma';

@Injectable()
export class LikesService {
  constructor(private prisma: PrismaService) {}

  async toggleLike(reviewId: string, userId: string) {
    // Check if review exists and is not deleted
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('독후감을 찾을 수 없습니다');
    }

    if (review.status === 'DELETED') {
      throw new UnprocessableEntityException(
        '삭제된 독후감에는 좋아요를 할 수 없습니다'
      );
    }

    // Check if like exists
    const existingLike = await this.prisma.like.findUnique({
      where: {
        userId_reviewId: {
          userId,
          reviewId,
        },
      },
    });

    let isLiked: boolean;
    let likeCount: number;

    if (existingLike) {
      // Unlike: Delete like and decrement count
      await this.prisma.$transaction([
        this.prisma.like.delete({
          where: { id: existingLike.id },
        }),
        this.prisma.review.update({
          where: { id: reviewId },
          data: { likeCount: { decrement: 1 } },
        }),
      ]);

      isLiked = false;
      likeCount = review.likeCount - 1;
    } else {
      // Like: Create like and increment count
      await this.prisma.$transaction([
        this.prisma.like.create({
          data: {
            userId,
            reviewId,
          },
        }),
        this.prisma.review.update({
          where: { id: reviewId },
          data: { likeCount: { increment: 1 } },
        }),
      ]);

      isLiked = true;
      likeCount = review.likeCount + 1;
    }

    return {
      data: {
        isLiked,
        likeCount,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  async getReviewLikes(
    reviewId: string,
    pagination: { page: number; limit: number }
  ) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });
    if (!review) {
      throw new NotFoundException('독후감을 찾을 수 없습니다');
    }

    const { page, limit } = pagination;
    const skip = page * limit;

    const likes = await this.prisma.like.findMany({
      where: { reviewId },
      include: {
        user: {
          select: { id: true, name: true, profileImage: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit + 1,
    });

    const hasMore = likes.length > limit;
    const data = hasMore ? likes.slice(0, limit) : likes;

    const total = await this.prisma.like.count({
      where: { reviewId },
    });

    return {
      data,
      meta: {
        page,
        limit,
        total,
        hasMore,
        timestamp: new Date().toISOString(),
      },
    };
  }

  async getUserLikes(
    userId: string,
    pagination: { page: number; limit: number }
  ) {
    const { page, limit } = pagination;
    const skip = page * limit;

    const likes = await this.prisma.like.findMany({
      where: { userId },
      include: {
        review: {
          include: {
            user: {
              select: { id: true, name: true, profileImage: true },
            },
            book: {
              select: {
                id: true,
                title: true,
                author: true,
                coverImageUrl: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit + 1,
    });

    const hasMore = likes.length > limit;
    const data = hasMore ? likes.slice(0, limit) : likes;

    // Map and truncate review content
    const mappedData = data.map((like) => ({
      ...like,
      review: {
        ...like.review,
        content: like.review.content.substring(0, 150),
      },
    }));

    const total = await this.prisma.like.count({
      where: { userId },
    });

    return {
      data: mappedData,
      meta: {
        page,
        limit,
        total,
        hasMore,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

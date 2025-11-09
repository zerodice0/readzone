import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../../common/utils/prisma';

@Injectable()
export class BookmarksService {
  constructor(private prisma: PrismaService) {}

  async toggleBookmark(reviewId: string, userId: string) {
    // Check if review exists and is not deleted
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('독후감을 찾을 수 없습니다');
    }

    if (review.status === 'DELETED') {
      throw new UnprocessableEntityException(
        '삭제된 독후감은 북마크할 수 없습니다'
      );
    }

    // Check if bookmark exists
    const existingBookmark = await this.prisma.bookmark.findUnique({
      where: {
        userId_reviewId: {
          userId,
          reviewId,
        },
      },
    });

    let isBookmarked: boolean;
    let bookmarkCount: number;

    if (existingBookmark) {
      // Remove bookmark: Delete bookmark and decrement count
      await this.prisma.$transaction([
        this.prisma.bookmark.delete({
          where: { id: existingBookmark.id },
        }),
        this.prisma.review.update({
          where: { id: reviewId },
          data: { bookmarkCount: { decrement: 1 } },
        }),
      ]);

      isBookmarked = false;
      bookmarkCount = review.bookmarkCount - 1;
    } else {
      // Add bookmark: Create bookmark and increment count
      await this.prisma.$transaction([
        this.prisma.bookmark.create({
          data: {
            userId,
            reviewId,
          },
        }),
        this.prisma.review.update({
          where: { id: reviewId },
          data: { bookmarkCount: { increment: 1 } },
        }),
      ]);

      isBookmarked = true;
      bookmarkCount = review.bookmarkCount + 1;
    }

    return {
      data: {
        isBookmarked,
        bookmarkCount,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  async getUserBookmarks(
    userId: string,
    pagination: { page: number; limit: number }
  ) {
    const { page, limit } = pagination;
    const skip = page * limit;

    const bookmarks = await this.prisma.bookmark.findMany({
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

    const hasMore = bookmarks.length > limit;
    const data = hasMore ? bookmarks.slice(0, limit) : bookmarks;

    // Map and truncate review content
    const mappedData = data.map((bookmark) => ({
      ...bookmark,
      review: {
        ...bookmark.review,
        content: bookmark.review.content.substring(0, 150),
      },
    }));

    const total = await this.prisma.bookmark.count({
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

  async deleteBookmark(id: string, userId: string) {
    const bookmark = await this.prisma.bookmark.findUnique({
      where: { id },
      include: { review: true },
    });

    if (!bookmark) {
      throw new NotFoundException('북마크를 찾을 수 없습니다');
    }

    if (bookmark.userId !== userId) {
      throw new ForbiddenException('본인의 북마크만 삭제할 수 있습니다');
    }

    // Delete bookmark and decrement count
    await this.prisma.$transaction([
      this.prisma.bookmark.delete({
        where: { id },
      }),
      this.prisma.review.update({
        where: { id: bookmark.reviewId },
        data: { bookmarkCount: { decrement: 1 } },
      }),
    ]);

    return {
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FeedQueryDto, FeedTab } from './dto/feed-query.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { LikeActionDto, LikeAction } from './dto/like-action.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import {
  parseKakaoIsbn,
  buildIsbnSearchQuery,
} from '../../common/utils/isbn.utils';

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
    let bookId = createReviewDto.bookId;

    // bookId가 없으면 도서 생성/조회
    if (!bookId && createReviewDto.bookData) {
      const {
        isbn,
        title,
        author,
        publisher,
        publishedAt,
        thumbnail,
        description,
      } = createReviewDto.bookData;

      if (isbn) {
        // Parse ISBN from Kakao API (handles ISBN-10, ISBN-13, or both)
        const parsedIsbn = parseKakaoIsbn(isbn);
        const searchQuery = buildIsbnSearchQuery(parsedIsbn);

        // Check if book already exists by either ISBN-10 or ISBN-13
        if (searchQuery) {
          const existingBook = await this.prismaService.book.findFirst({
            where: searchQuery,
          });

          if (existingBook) {
            // Book exists, use existing one
            bookId = existingBook.id;
          } else {
            // Book doesn't exist, create new one
            const newBook = await this.prismaService.book.create({
              data: {
                isbn: parsedIsbn.primaryIsbn, // Legacy compatibility
                isbn10: parsedIsbn.isbn10,
                isbn13: parsedIsbn.isbn13,
                title,
                author,
                publisher,
                publishedAt,
                thumbnail,
                description,
                source: 'KAKAO_API',
              },
            });
            bookId = newBook.id;
          }
        } else {
          // No valid ISBN found, create book without ISBN search
          const newBook = await this.prismaService.book.create({
            data: {
              isbn: parsedIsbn.primaryIsbn, // Legacy compatibility
              isbn10: parsedIsbn.isbn10,
              isbn13: parsedIsbn.isbn13,
              title,
              author,
              publisher,
              publishedAt,
              thumbnail,
              description,
              source: 'KAKAO_API',
            },
          });
          bookId = newBook.id;
        }
      } else {
        // ISBN 없으면 새로 생성
        const book = await this.prismaService.book.create({
          data: {
            title,
            author,
            publisher,
            publishedAt,
            thumbnail,
            description,
            source: 'MANUAL',
          },
        });
        bookId = book.id;
      }
    }

    if (!bookId) {
      throw new Error('Either bookId or bookData must be provided');
    }

    const review = await this.prismaService.review.create({
      data: {
        bookId,
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

  async getReviewDetail(id: string, userId?: string) {
    const review = await this.prismaService.review.findUnique({
      where: { id },
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
            publisher: true,
            publishedAt: true,
          },
        },
        comments: {
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
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    if (!review) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: '리뷰를 찾을 수 없습니다' },
      };
    }

    // compute userHasLiked
    let userHasLiked = false;
    if (userId) {
      const like = await this.prismaService.like.findFirst({
        where: { userId, reviewId: id },
        select: { id: true },
      });
      userHasLiked = Boolean(like);
    }

    return {
      success: true,
      data: {
        review: {
          ...review,
          createdAt: review.createdAt.toISOString(),
          updatedAt: review.updatedAt.toISOString(),
          tags: review.tags ? (JSON.parse(review.tags) as string[]) : [],
          comments: review.comments.map((c) => ({
            ...c,
            createdAt: c.createdAt.toISOString(),
            updatedAt: c.updatedAt.toISOString(),
          })),
          userHasLiked,
        },
      },
    };
  }

  async createComment(reviewId: string, userId: string, dto: CreateCommentDto) {
    // Ensure review exists
    await this.prismaService.review.findUniqueOrThrow({
      where: { id: reviewId },
      select: { id: true },
    });

    if (dto.parentId) {
      // Ensure parent exists and belongs to same review
      const parent = await this.prismaService.comment.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent || parent.reviewId !== reviewId) {
        throw new Error('Invalid parent comment');
      }
    }

    const comment = await this.prismaService.comment.create({
      data: {
        content: dto.content,
        parentId: dto.parentId ?? null,
        userId,
        reviewId,
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
      },
    });

    const count = await this.prismaService.comment.count({
      where: { reviewId },
    });

    return {
      success: true,
      data: {
        comment: {
          ...comment,
          createdAt: comment.createdAt.toISOString(),
          updatedAt: comment.updatedAt.toISOString(),
        },
        count,
      },
    };
  }

  async getComments(reviewId: string) {
    const comments = await this.prismaService.comment.findMany({
      where: { reviewId },
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
      },
      orderBy: { createdAt: 'asc' },
    });

    return {
      success: true,
      data: {
        comments: comments.map((c) => ({
          ...c,
          createdAt: c.createdAt.toISOString(),
          updatedAt: c.updatedAt.toISOString(),
        })),
      },
    };
  }
}

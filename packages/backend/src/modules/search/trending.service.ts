import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface TrendingBook {
  id: string;
  title: string;
  author: string;
  thumbnail: string | null;
  reviewCount: number;
  likeCount: number;
}

export interface PopularTag {
  name: string;
  count: number;
}

@Injectable()
export class TrendingService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Get books that have been reviewed in the last 24 hours
   */
  async getRecentlyReviewedBooks(limit = 5): Promise<TrendingBook[]> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const recentBooks = await this.prismaService.book.findMany({
      where: {
        reviews: {
          some: {
            createdAt: {
              gte: twentyFourHoursAgo,
            },
            status: 'PUBLISHED',
          },
        },
      },
      select: {
        id: true,
        title: true,
        author: true,
        thumbnail: true,
        reviews: {
          where: {
            createdAt: {
              gte: twentyFourHoursAgo,
            },
            status: 'PUBLISHED',
          },
          select: {
            id: true,
            likes: {
              select: {
                id: true,
              },
            },
          },
        },
      },
      orderBy: {
        reviews: {
          _count: 'desc',
        },
      },
      take: limit,
    });

    return recentBooks.map((book) => {
      const likeCount = book.reviews.reduce(
        (sum, review) => sum + review.likes.length,
        0,
      );

      return {
        id: book.id,
        title: book.title,
        author: book.author,
        thumbnail: book.thumbnail,
        reviewCount: book.reviews.length,
        likeCount,
      };
    });
  }

  /**
   * Get most popular books this month based on likes
   */
  async getPopularBooksThisMonth(limit = 5): Promise<TrendingBook[]> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Get books with reviews from this month and count likes
    const popularBooks = await this.prismaService.$queryRaw<
      Array<{
        id: string;
        title: string;
        author: string;
        thumbnail: string | null;
        review_count: bigint;
        like_count: bigint;
      }>
    >`
      SELECT
        b.id,
        b.title,
        b.author,
        b.thumbnail,
        COUNT(DISTINCT r.id) as review_count,
        COUNT(DISTINCT l.id) as like_count
      FROM "Book" b
      INNER JOIN "Review" r ON b.id = r."bookId"
      LEFT JOIN "Like" l ON r.id = l."reviewId"
      WHERE r."createdAt" >= ${startOfMonth}
        AND r.status = 'PUBLISHED'
      GROUP BY b.id, b.title, b.author, b.thumbnail
      ORDER BY like_count DESC
      LIMIT ${limit}
    `;

    return popularBooks.map((book) => ({
      id: book.id,
      title: book.title,
      author: book.author,
      thumbnail: book.thumbnail,
      reviewCount: Number(book.review_count),
      likeCount: Number(book.like_count),
    }));
  }

  /**
   * Get popular tags based on usage frequency
   */
  async getPopularTags(limit = 10): Promise<PopularTag[]> {
    // Get all tags from reviews and count their occurrences
    const reviews = await this.prismaService.review.findMany({
      where: {
        status: 'PUBLISHED',
        tags: {
          not: null,
        },
      },
      select: {
        tags: true,
      },
    });

    // Parse tags and count occurrences
    const tagCounts = new Map<string, number>();

    reviews.forEach((review) => {
      if (review.tags && typeof review.tags === 'string') {
        try {
          const tags = JSON.parse(review.tags) as unknown[];
          if (Array.isArray(tags)) {
            tags.forEach((tag: string) => {
              if (typeof tag === 'string' && tag.trim()) {
                const normalizedTag = tag.trim().toLowerCase();
                tagCounts.set(
                  normalizedTag,
                  (tagCounts.get(normalizedTag) || 0) + 1,
                );
              }
            });
          }
        } catch {
          // Ignore parsing errors
        }
      }
    });

    // Convert to array and sort by count
    const sortedTags = Array.from(tagCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    // If we don't have enough tags from reviews, add some default categories
    const defaultTags = [
      '소설',
      '에세이',
      '자기계발',
      '심리학',
      '역사',
      '과학',
      '철학',
      '경제',
      '인문학',
      '예술',
    ];

    const existingTagNames = new Set(sortedTags.map((t) => t.name));
    const remainingSlots = limit - sortedTags.length;

    if (remainingSlots > 0) {
      const additionalTags = defaultTags
        .filter((tag) => !existingTagNames.has(tag.toLowerCase()))
        .slice(0, remainingSlots)
        .map((tag) => ({ name: tag, count: 0 }));

      sortedTags.push(...additionalTags);
    }

    return sortedTags;
  }

  /**
   * Get search suggestions based on recent searches and popular content
   */
  async getSearchSuggestions(query?: string, limit = 5): Promise<string[]> {
    const suggestions: string[] = [];

    if (query && query.trim()) {
      // Get book titles matching the query
      const books = await this.prismaService.book.findMany({
        where: {
          OR: [
            {
              title: {
                contains: query,
                mode: 'insensitive',
              },
            },
            {
              author: {
                contains: query,
                mode: 'insensitive',
              },
            },
          ],
        },
        select: {
          title: true,
          author: true,
        },
        take: Math.ceil(limit / 2),
      });

      books.forEach((book) => {
        suggestions.push(book.title);
        if (suggestions.length < limit) {
          suggestions.push(book.author);
        }
      });

      // Get user nicknames matching the query
      if (suggestions.length < limit) {
        const users = await this.prismaService.user.findMany({
          where: {
            nickname: {
              contains: query,
              mode: 'insensitive',
            },
          },
          select: {
            nickname: true,
          },
          take: limit - suggestions.length,
        });

        users.forEach((user) => {
          suggestions.push(user.nickname);
        });
      }
    } else {
      // Return popular search terms when no query is provided
      const popularBooks = await this.prismaService.book.findMany({
        select: {
          title: true,
          _count: {
            select: {
              reviews: true,
            },
          },
        },
        orderBy: {
          reviews: {
            _count: 'desc',
          },
        },
        take: limit,
      });

      popularBooks.forEach((book) => {
        suggestions.push(book.title);
      });
    }

    // Remove duplicates and limit results
    return [...new Set(suggestions)].slice(0, limit);
  }
}

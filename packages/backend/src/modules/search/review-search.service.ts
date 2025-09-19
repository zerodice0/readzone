import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ReviewSearchDto,
  ReviewSearchResult,
  ReviewSearchResponse,
} from './dto/review-search.dto';
import { Prisma } from '@prisma/client';

// Define the exact type that our query returns
type ReviewWithRelations = Prisma.ReviewGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        userid: true;
        nickname: true;
        profileImage: true;
      };
    };
    book: {
      select: {
        id: true;
        title: true;
        author: true;
        thumbnail: true;
      };
    };
    _count: {
      select: {
        likes: true;
        comments: true;
      };
    };
  };
}>;

@Injectable()
export class ReviewSearchService {
  constructor(private readonly prismaService: PrismaService) {}

  async searchReviews(
    searchDto: ReviewSearchDto,
  ): Promise<ReviewSearchResponse> {
    const {
      query,
      rating,
      dateFrom,
      dateTo,
      minLikes,
      sort,
      cursor,
      limit = 20,
    } = searchDto;

    // Build search conditions
    const searchConditions: Prisma.ReviewWhereInput[] = [
      { title: { contains: query, mode: Prisma.QueryMode.insensitive } },
      { content: { contains: query, mode: Prisma.QueryMode.insensitive } },
      { tags: { contains: query } },
    ];

    const whereCondition: Prisma.ReviewWhereInput = {
      OR: searchConditions,
    };

    // Apply filters
    if (rating) {
      whereCondition.isRecommended = rating === 'recommend';
    }

    if (dateFrom || dateTo) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (dateFrom) {
        dateFilter.gte = new Date(dateFrom);
      }
      if (dateTo) {
        dateFilter.lte = new Date(dateTo);
      }
      whereCondition.createdAt = dateFilter;
    }

    if (minLikes && minLikes > 0) {
      whereCondition.likes = {
        some: {},
      };
    }

    // Cursor-based pagination
    const cursorCondition: Prisma.ReviewFindManyArgs = {};
    if (cursor) {
      cursorCondition.cursor = { id: cursor };
      cursorCondition.skip = 1; // Skip the cursor item
    }

    // Sort order
    let orderBy: Prisma.ReviewOrderByWithRelationInput = {};
    switch (sort) {
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'popular':
        orderBy = { likes: { _count: 'desc' } };
        break;
      case 'rating':
        // Sort by recommendation first (true first)
        orderBy = { isRecommended: 'desc' };
        break;
      case 'relevance':
      default:
        // For relevance, we'll sort by creation date as a fallback
        // In production, you might want to implement a scoring system
        orderBy = { createdAt: 'desc' };
        break;
    }

    // Get reviews with relations
    const reviews = await this.prismaService.review.findMany({
      where: whereCondition,
      include: {
        user: {
          select: {
            id: true,
            userid: true,
            nickname: true,
            profileImage: true,
          },
        },
        book: {
          select: {
            id: true,
            title: true,
            author: true,
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
      take: limit + 1, // Get one extra to check if there's more
      ...cursorCondition,
    });

    // Check if there are more results
    const hasMore = reviews.length > limit;
    const reviewResults = reviews.slice(0, limit) as ReviewWithRelations[];

    // Transform to ReviewSearchResult
    const transformedReviews: ReviewSearchResult[] = reviewResults.map(
      (review) => {
        const highlights = this.generateHighlights(review, query);
        const contentSummary = this.extractSummary(review.content, query);

        return {
          id: review.id,
          content: contentSummary,
          rating: review.isRecommended ? 'recommend' : 'not_recommend',
          tags: this.parseTags(review.tags),
          createdAt: review.createdAt.toISOString(),
          author: {
            id: review.user.id,
            username: review.user.nickname || review.user.userid,
            profileImage: review.user.profileImage || undefined,
          },
          book: {
            id: review.book.id,
            title: review.book.title,
            author: review.book.author,
            coverImage: review.book.thumbnail || undefined,
          },
          stats: {
            likes: review._count.likes,
            comments: review._count.comments,
          },
          highlights,
        };
      },
    );

    // Get facets for filtering
    const facets = await this.getFacets(whereCondition);

    // Get total count
    const total = await this.prismaService.review.count({
      where: whereCondition,
    });

    return {
      reviews: transformedReviews,
      pagination: {
        nextCursor: hasMore
          ? reviewResults[reviewResults.length - 1].id
          : undefined,
        hasMore,
        total,
      },
      facets,
    };
  }

  /**
   * Generate highlighted text snippets
   */
  private generateHighlights(
    review: Pick<ReviewWithRelations, 'content' | 'tags'>,
    query: string,
  ): { content?: string[]; tags?: string[] } {
    const highlights: { content?: string[]; tags?: string[] } = {};

    if (!query) return highlights;

    const queryLower = query.toLowerCase();

    // Highlight content matches
    if (review.content && review.content.toLowerCase().includes(queryLower)) {
      const snippets = this.extractHighlightedSnippets(review.content, query);
      if (snippets.length > 0) {
        highlights.content = snippets;
      }
    }

    // Highlight tag matches
    const tags = this.parseTags(review.tags);
    const matchingTags = tags.filter((tag) =>
      tag.toLowerCase().includes(queryLower),
    );
    if (matchingTags.length > 0) {
      highlights.tags = matchingTags;
    }

    return highlights;
  }

  /**
   * Extract highlighted snippets from content
   */
  private extractHighlightedSnippets(
    content: string,
    query: string,
    contextLength = 50,
  ): string[] {
    const snippets: string[] = [];
    const queryLower = query.toLowerCase();
    const contentLower = content.toLowerCase();

    let index = contentLower.indexOf(queryLower);
    while (index !== -1 && snippets.length < 3) {
      const start = Math.max(0, index - contextLength);
      const end = Math.min(
        content.length,
        index + query.length + contextLength,
      );
      const snippet = content.substring(start, end);

      // Add ellipsis if truncated
      const formattedSnippet =
        (start > 0 ? '...' : '') +
        snippet +
        (end < content.length ? '...' : '');

      snippets.push(formattedSnippet);

      // Find next occurrence
      index = contentLower.indexOf(queryLower, index + 1);
    }

    return snippets;
  }

  /**
   * Extract a summary of the review content
   */
  private extractSummary(
    content: string,
    query?: string,
    maxLength = 150,
  ): string {
    if (!content) return '';

    // If query exists and is found in content, prioritize that section
    if (query) {
      const queryLower = query.toLowerCase();
      const contentLower = content.toLowerCase();
      const index = contentLower.indexOf(queryLower);

      if (index !== -1) {
        // Extract around the query match
        const start = Math.max(0, index - 50);
        const end = Math.min(content.length, index + 100);
        const summary = content.substring(start, end);
        return summary.length > maxLength
          ? summary.substring(0, maxLength) + '...'
          : summary;
      }
    }

    // Otherwise, return the beginning of the content
    return content.length > maxLength
      ? content.substring(0, maxLength) + '...'
      : content;
  }

  /**
   * Get facets for filtering
   */
  private async getFacets(whereCondition: Prisma.ReviewWhereInput) {
    // Get rating distribution
    const [recommendCount, notRecommendCount] = await Promise.all([
      this.prismaService.review.count({
        where: { ...whereCondition, isRecommended: true },
      }),
      this.prismaService.review.count({
        where: { ...whereCondition, isRecommended: false },
      }),
    ]);

    // Get top authors
    const topAuthors = await this.prismaService.review.groupBy({
      by: ['userId'],
      where: whereCondition,
      _count: true,
      orderBy: {
        _count: {
          userId: 'desc',
        },
      },
      take: 10,
    });

    // Get user details for top authors
    const userIds = topAuthors.map((a) => a.userId);
    const users = await this.prismaService.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, nickname: true, userid: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u.nickname || u.userid]));
    const authorFacets = topAuthors.map((a) => ({
      username: userMap.get(a.userId) || 'Unknown',
      count: a._count,
    }));

    // Get top books
    const topBooks = await this.prismaService.review.groupBy({
      by: ['bookId'],
      where: whereCondition,
      _count: true,
      orderBy: {
        _count: {
          bookId: 'desc',
        },
      },
      take: 10,
    });

    // Get book details
    const bookIds = topBooks.map((b) => b.bookId);
    const books = await this.prismaService.book.findMany({
      where: { id: { in: bookIds } },
      select: { id: true, title: true },
    });

    const bookMap = new Map(books.map((b) => [b.id, b.title]));
    const bookFacets = topBooks.map((b) => ({
      title: bookMap.get(b.bookId) || 'Unknown',
      count: b._count,
    }));

    return {
      ratings: {
        recommend: recommendCount,
        not_recommend: notRecommendCount,
      },
      authors: authorFacets,
      books: bookFacets,
    };
  }

  /**
   * Parse tags from JSON string
   */
  private parseTags(rawTags: string | null): string[] {
    if (!rawTags) return [];

    try {
      const parsed: unknown = JSON.parse(rawTags);
      if (Array.isArray(parsed)) {
        return parsed.filter((tag): tag is string => typeof tag === 'string');
      }
    } catch {
      // Ignore parse errors
    }

    return [];
  }
}

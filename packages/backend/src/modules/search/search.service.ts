import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SearchFiltersDto, UnifiedSearchDto } from './dto/unified-search.dto';
import { SearchSuggestionsDto } from './dto/search-suggestions.dto';
import { Prisma } from '@prisma/client';
import { toLegacyIsbn } from '../../common/utils/isbn.utils';
import { stripAndTruncate } from '../../common/utils/html.utils';

@Injectable()
export class SearchService {
  constructor(private readonly prismaService: PrismaService) {}

  async unifiedSearch(searchDto: UnifiedSearchDto) {
    const { query, type, sort, filters, limit } = searchDto;

    const results = {
      books: [] as any[],
      reviews: [] as any[],
      users: [] as any[],
    };

    // Search books if type is 'all' or 'books'
    if (type === 'all' || type === 'books') {
      results.books = await this.searchBooks(query, filters, sort, limit);
    }

    // Search reviews if type is 'all' or 'reviews'
    if (type === 'all' || type === 'reviews') {
      results.reviews = await this.searchReviews(query, filters, sort, limit);
    }

    // Search users if type is 'all' or 'users'
    if (type === 'all' || type === 'users') {
      results.users = await this.searchUsers(query, filters, sort, limit);
    }

    // Generate suggestions based on query and existing data
    const suggestions = await this.generateSuggestions(query);

    return {
      success: true,
      data: {
        results,
        pagination: {
          hasMore: false, // Simplified for now
          total:
            results.books.length +
            results.reviews.length +
            results.users.length,
          nextCursor: null,
        },
        suggestions,
      },
    };
  }

  private async searchBooks(
    query: string,
    filters: SearchFiltersDto | undefined,
    sort: string,
    limit: number,
  ) {
    const searchConditions: Prisma.BookWhereInput[] = [
      { title: { contains: query, mode: Prisma.QueryMode.insensitive } },
      { author: { contains: query, mode: Prisma.QueryMode.insensitive } },
      { isbn: { contains: query, mode: Prisma.QueryMode.insensitive } },
      { isbn10: { contains: query } },
      { isbn13: { contains: query } },
    ];

    let whereCondition: Prisma.BookWhereInput = { OR: searchConditions };

    // Apply book filters
    if (filters?.publishYear) {
      const yearConditions: Prisma.BookWhereInput[] = [];
      if (filters.publishYear.from) {
        yearConditions.push({
          publishedAt: { contains: filters.publishYear.from.toString() },
        });
      }
      if (filters.publishYear.to) {
        yearConditions.push({
          publishedAt: { contains: filters.publishYear.to.toString() },
        });
      }
      if (yearConditions.length > 0) {
        whereCondition = { AND: [whereCondition, { OR: yearConditions }] };
      }
    }

    if (filters?.genre && filters.genre.length > 0) {
      const genreConditions = filters.genre.map((g: string) => ({
        category: { contains: g, mode: Prisma.QueryMode.insensitive },
      }));
      whereCondition = { AND: [whereCondition, { OR: genreConditions }] };
    }

    // Sort order
    let orderBy: Prisma.BookOrderByWithRelationInput = { createdAt: 'desc' };
    if (sort === 'popularity') {
      orderBy = { reviews: { _count: 'desc' } };
    } else if (sort === 'oldest') {
      orderBy = { createdAt: 'asc' };
    }

    const books = await this.prismaService.book.findMany({
      where: whereCondition,
      include: {
        _count: {
          select: { reviews: true },
        },
      },
      orderBy,
      take: limit,
    });

    return books.map((book) => ({
      id: book.id,
      title: book.title,
      author: book.author,
      publisher: book.publisher || undefined,
      publishedDate: book.publishedAt || undefined,
      isbn:
        book.isbn ||
        toLegacyIsbn(book.isbn10 || undefined, book.isbn13 || undefined) ||
        undefined,
      coverImage: book.thumbnail || undefined,
      description: book.description || undefined,
      genre: book.category ? [book.category] : undefined,
      stats: {
        reviewCount: book._count.reviews,
        recentReviews: 0, // TODO: Implement recent reviews count
      },
      source: book.source || 'db',
      isExisting: true,
    }));
  }

  private async searchReviews(
    query: string,
    filters: SearchFiltersDto | undefined,
    sort: string,
    limit: number,
  ) {
    const searchConditions: Prisma.ReviewWhereInput[] = [
      { title: { contains: query, mode: Prisma.QueryMode.insensitive } },
      { content: { contains: query, mode: Prisma.QueryMode.insensitive } },
      { tags: { contains: query } },
    ];

    let whereCondition: Prisma.ReviewWhereInput = { OR: searchConditions };

    // Apply review filters
    if (filters?.rating) {
      whereCondition = {
        AND: [
          whereCondition,
          { isRecommended: filters.rating === 'recommend' },
        ],
      };
    }

    if (filters?.dateRange) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (filters.dateRange.from) {
        dateFilter.gte = new Date(filters.dateRange.from);
      }
      if (filters.dateRange.to) {
        dateFilter.lte = new Date(filters.dateRange.to);
      }
      whereCondition = { AND: [whereCondition, { createdAt: dateFilter }] };
    }

    if (filters?.minLikes) {
      whereCondition = {
        AND: [whereCondition, { likes: { some: {} } }],
      };
      // Note: For now we filter by existence of likes, implement count filter later
    }

    // Sort order
    let orderBy: Prisma.ReviewOrderByWithRelationInput = { createdAt: 'desc' };
    if (sort === 'popularity') {
      orderBy = { likes: { _count: 'desc' } };
    } else if (sort === 'oldest') {
      orderBy = { createdAt: 'asc' };
    }

    const reviews = await this.prismaService.review.findMany({
      where: whereCondition,
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
    });

    return reviews.map((review) => ({
      id: review.id,
      content: stripAndTruncate(review.content, 150),
      rating: review.isRecommended ? 'recommend' : 'not_recommend',
      tags: this.parseTags(review.tags),
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
      createdAt: review.createdAt.toISOString(),
    }));
  }

  private async searchUsers(
    query: string,
    filters: SearchFiltersDto | undefined,
    sort: string,
    limit: number,
  ) {
    const searchConditions: Prisma.UserWhereInput[] = [
      { nickname: { contains: query, mode: Prisma.QueryMode.insensitive } },
      { userid: { contains: query, mode: Prisma.QueryMode.insensitive } },
      { bio: { contains: query, mode: Prisma.QueryMode.insensitive } },
    ];

    let whereCondition: Prisma.UserWhereInput = { OR: searchConditions };

    // Apply user filters
    if (filters?.hasAvatar) {
      whereCondition = {
        AND: [whereCondition, { profileImage: { not: null } }],
      };
    }

    if (filters?.minFollowers) {
      whereCondition = {
        AND: [whereCondition, { followers: { some: {} } }],
      };
      // Note: For now we filter by existence of followers, implement count filter later
    }

    // Sort order
    let orderBy: Prisma.UserOrderByWithRelationInput = { createdAt: 'desc' };
    if (sort === 'popularity') {
      orderBy = { followers: { _count: 'desc' } };
    } else if (sort === 'oldest') {
      orderBy = { createdAt: 'asc' };
    }

    const users = await this.prismaService.user.findMany({
      where: whereCondition,
      select: {
        id: true,
        userid: true,
        nickname: true,
        bio: true,
        profileImage: true,
        isVerified: true,
        createdAt: true,
        _count: {
          select: {
            reviews: true,
            followers: true,
            following: true,
          },
        },
      },
      orderBy,
      take: limit,
    });

    return users.map((user) => ({
      id: user.id,
      username: user.nickname || user.userid,
      bio: user.bio,
      profileImage: user.profileImage || undefined,
      stats: {
        reviewCount: user._count.reviews,
        followerCount: user._count.followers,
        followingCount: user._count.following,
        likesReceived: 0, // TODO: Implement likes received count
      },
      recentActivity: {
        lastActiveAt: user.createdAt.toISOString(),
      },
    }));
  }

  async getSearchSuggestions(suggestionsDto: SearchSuggestionsDto) {
    const { query, limit } = suggestionsDto;

    if (!query.trim() || query.length < 2) {
      return {
        success: true,
        data: { suggestions: [] },
      };
    }

    // Get suggestions from books, reviews, and popular searches
    const bookSuggestions = await this.prismaService.book.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: Prisma.QueryMode.insensitive } },
          { author: { contains: query, mode: Prisma.QueryMode.insensitive } },
        ],
      },
      select: { title: true, author: true },
      take: limit / 2,
      distinct: ['title'],
    });

    const reviewSuggestions = await this.prismaService.review.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: Prisma.QueryMode.insensitive } },
          { tags: { contains: query } },
        ],
      },
      select: { title: true, tags: true },
      take: limit / 2,
      distinct: ['title'],
    });

    const suggestions = new Set<string>();

    // Add book titles and authors
    bookSuggestions.forEach((book) => {
      if (book.title.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(book.title);
      }
      if (book.author.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(book.author);
      }
    });

    // Add review titles and tags
    reviewSuggestions.forEach((review) => {
      if (review.title.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(review.title);
      }
      if (review.tags) {
        try {
          const parsedTags = JSON.parse(review.tags) as string[];
          parsedTags.forEach((tag) => {
            if (tag.toLowerCase().includes(query.toLowerCase())) {
              suggestions.add(tag);
            }
          });
        } catch {
          // Ignore JSON parse errors
        }
      }
    });

    // Convert to array and limit results
    const suggestionArray = Array.from(suggestions)
      .slice(0, limit)
      .map((text) => ({ text, type: 'content' as const }));

    return {
      success: true,
      data: { suggestions: suggestionArray },
    };
  }

  private async generateSuggestions(query: string): Promise<string[]> {
    // Simple suggestion generation based on existing data
    const suggestions = await this.getSearchSuggestions({ query, limit: 5 });
    return suggestions.data.suggestions.map((s) => s.text);
  }

  private parseTags(rawTags: string | null): string[] {
    if (!rawTags) {
      return [];
    }

    try {
      const parsed: unknown = JSON.parse(rawTags);

      if (Array.isArray(parsed)) {
        return parsed.filter((tag): tag is string => typeof tag === 'string');
      }
    } catch {
      // Ignore malformed tag payloads and fall back to an empty array.
    }

    return [];
  }
}

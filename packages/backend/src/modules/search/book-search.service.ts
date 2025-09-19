import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { KakaoBooksService } from './kakao-books.service';
import {
  BookSearchDto,
  BookSearchResult,
  BookSearchResponse,
  ManualBookDto,
} from './dto/book-search.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class BookSearchService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly kakaoBooksService: KakaoBooksService,
  ) {}

  /**
   * 3-stage book search implementation
   * 1. Search in server database
   * 2. Search via Kakao API
   * 3. Suggest manual book addition
   */
  async searchBooks(searchDto: BookSearchDto): Promise<BookSearchResponse> {
    const { query, source, sort, page = 1, limit = 20 } = searchDto;

    let dbBooks: BookSearchResult[] = [];
    let apiBooks: BookSearchResult[] = [];
    let dbTotal = 0;
    let apiTotal = 0;

    // Stage 1: Search in database
    if (source === 'db' || source === 'all') {
      const dbResult = await this.searchBooksInDB(searchDto);
      dbBooks = dbResult.books;
      dbTotal = dbResult.total;
    }

    // Stage 2: Search via Kakao API (only if needed)
    if (source === 'api' || (source === 'all' && dbBooks.length < limit)) {
      const apiResult = await this.kakaoBooksService.searchBooks(
        query,
        page,
        limit - dbBooks.length,
      );
      apiBooks = apiResult.books;
      apiTotal = apiResult.total;
    }

    // Merge and deduplicate results
    const mergedBooks = this.mergeAndDeduplicateBooks(dbBooks, apiBooks);

    // Apply sorting to merged results
    const sortedBooks = this.sortBooks(mergedBooks, sort, query);

    // Paginate final results
    const paginatedBooks = sortedBooks.slice(0, limit);

    return {
      books: paginatedBooks,
      pagination: {
        page,
        limit,
        total: dbTotal + apiTotal,
        hasMore: sortedBooks.length > limit,
      },
      sources: {
        db: dbBooks.length,
        api: apiBooks.length,
      },
    };
  }

  /**
   * Search books in database with filters
   */
  private async searchBooksInDB(
    searchDto: BookSearchDto,
  ): Promise<{ books: BookSearchResult[]; total: number }> {
    const {
      query,
      genre,
      publisher,
      publishYearFrom,
      publishYearTo,
      limit = 20,
    } = searchDto;

    // Build search conditions
    const searchConditions: Prisma.BookWhereInput[] = [
      { title: { contains: query, mode: Prisma.QueryMode.insensitive } },
      { author: { contains: query, mode: Prisma.QueryMode.insensitive } },
      { isbn: { contains: query } },
      { isbn10: { contains: query } },
      { isbn13: { contains: query } },
      { publisher: { contains: query, mode: Prisma.QueryMode.insensitive } },
    ];

    let whereCondition: Prisma.BookWhereInput = { OR: searchConditions };

    // Apply filters
    const filterConditions: Prisma.BookWhereInput[] = [];

    if (genre && genre.length > 0) {
      filterConditions.push({
        OR: genre.map((g) => ({
          category: { contains: g, mode: Prisma.QueryMode.insensitive },
        })),
      });
    }

    if (publisher && publisher.length > 0) {
      filterConditions.push({
        OR: publisher.map((p) => ({
          publisher: { contains: p, mode: Prisma.QueryMode.insensitive },
        })),
      });
    }

    if (publishYearFrom || publishYearTo) {
      const yearFilter: Prisma.BookWhereInput = {};
      if (publishYearFrom && publishYearTo) {
        yearFilter.publishedAt = {
          gte: `${publishYearFrom}`,
          lte: `${publishYearTo}`,
        };
      } else if (publishYearFrom) {
        yearFilter.publishedAt = {
          gte: `${publishYearFrom}`,
        };
      } else if (publishYearTo) {
        yearFilter.publishedAt = {
          lte: `${publishYearTo}`,
        };
      }
      filterConditions.push(yearFilter);
    }

    if (filterConditions.length > 0) {
      whereCondition = {
        AND: [whereCondition, ...filterConditions],
      };
    }

    // Get total count
    const total = await this.prismaService.book.count({
      where: whereCondition,
    });

    // Get books with statistics
    const books = await this.prismaService.book.findMany({
      where: whereCondition,
      include: {
        reviews: {
          select: {
            id: true,
            isRecommended: true,
            createdAt: true,
          },
        },
        _count: {
          select: { reviews: true },
        },
      },
      take: limit,
    });

    // Transform to BookSearchResult
    const bookResults: BookSearchResult[] = books.map((book) => {
      const recentReviews = book.reviews.filter((review) => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return review.createdAt >= thirtyDaysAgo;
      }).length;

      const recommendCount = book.reviews.filter((r) => r.isRecommended).length;
      const averageRating =
        book.reviews.length > 0
          ? (recommendCount / book.reviews.length) * 100
          : undefined;

      return {
        id: book.id,
        title: book.title,
        author: book.author,
        publisher: book.publisher || '',
        publishedDate: book.publishedAt || '',
        isbn: book.isbn || book.isbn13 || book.isbn10 || undefined,
        coverImage: book.thumbnail || undefined,
        description: book.description || undefined,
        genre: book.category ? [book.category] : [],
        stats: {
          reviewCount: book._count.reviews,
          averageRating,
          recentReviews,
        },
        source: 'db' as const,
        isExisting: true,
      };
    });

    return { books: bookResults, total };
  }

  /**
   * Merge DB and API results, removing duplicates based on ISBN
   */
  private mergeAndDeduplicateBooks(
    dbBooks: BookSearchResult[],
    apiBooks: BookSearchResult[],
  ): BookSearchResult[] {
    const mergedBooks = [...dbBooks];
    const existingISBNs = new Set(
      dbBooks.map((book) => book.isbn).filter((isbn): isbn is string => !!isbn),
    );

    // Add API books that don't exist in DB
    for (const apiBook of apiBooks) {
      if (!apiBook.isbn || !existingISBNs.has(apiBook.isbn)) {
        // Check for title + author match as additional deduplication
        const isDuplicate = dbBooks.some(
          (dbBook) =>
            dbBook.title.toLowerCase() === apiBook.title.toLowerCase() &&
            dbBook.author.toLowerCase() === apiBook.author.toLowerCase(),
        );

        if (!isDuplicate) {
          mergedBooks.push(apiBook);
        }
      }
    }

    return mergedBooks;
  }

  /**
   * Sort books based on relevance, popularity, or other criteria
   */
  private sortBooks(
    books: BookSearchResult[],
    sort?: string,
    query?: string,
  ): BookSearchResult[] {
    if (!sort || sort === 'relevance') {
      if (!query) return books;

      // Calculate relevance score
      return books.sort((a, b) => {
        const scoreA = this.calculateRelevanceScore(query, a);
        const scoreB = this.calculateRelevanceScore(query, b);
        return scoreB - scoreA;
      });
    }

    if (sort === 'popular') {
      return books.sort((a, b) => {
        const countA = a.stats?.reviewCount || 0;
        const countB = b.stats?.reviewCount || 0;
        return countB - countA;
      });
    }

    if (sort === 'newest') {
      return books.sort((a, b) => {
        const dateA = new Date(a.publishedDate).getTime();
        const dateB = new Date(b.publishedDate).getTime();
        return dateB - dateA;
      });
    }

    if (sort === 'title') {
      return books.sort((a, b) => a.title.localeCompare(b.title));
    }

    return books;
  }

  /**
   * Calculate relevance score for search ranking
   */
  private calculateRelevanceScore(
    query: string,
    book: BookSearchResult,
  ): number {
    const queryLower = query.toLowerCase();
    let score = 0;

    // DB results get priority
    if (book.source === 'db') {
      score += 50;
    }

    // Exact title match
    if (book.title.toLowerCase() === queryLower) {
      score += 100;
    }
    // Title starts with query
    else if (book.title.toLowerCase().startsWith(queryLower)) {
      score += 80;
    }
    // Title contains query
    else if (book.title.toLowerCase().includes(queryLower)) {
      score += 60;
    }

    // Author match
    if (book.author.toLowerCase().includes(queryLower)) {
      score += 40;
    }

    // ISBN match
    if (book.isbn && book.isbn.includes(query)) {
      score += 30;
    }

    // Popularity bonus
    if (book.stats) {
      score += Math.min(book.stats.reviewCount * 2, 20);
      if (book.stats.recentReviews > 0) {
        score += 10;
      }
    }

    return score;
  }

  /**
   * Add a book manually (Stage 3 of search)
   */
  async addManualBook(manualBookDto: ManualBookDto): Promise<BookSearchResult> {
    const book = await this.prismaService.book.create({
      data: {
        title: manualBookDto.title,
        author: manualBookDto.author,
        publisher: manualBookDto.publisher,
        publishedAt: manualBookDto.publishedDate,
        isbn: manualBookDto.isbn,
        thumbnail: manualBookDto.coverImage,
        description: manualBookDto.description,
        category: manualBookDto.genre?.[0],
        source: 'manual',
      },
    });

    return {
      id: book.id,
      title: book.title,
      author: book.author,
      publisher: book.publisher || '',
      publishedDate: book.publishedAt || '',
      isbn: book.isbn || undefined,
      coverImage: book.thumbnail || undefined,
      description: book.description || undefined,
      genre: book.category ? [book.category] : [],
      stats: {
        reviewCount: 0,
        recentReviews: 0,
      },
      source: 'db',
      isExisting: true,
    };
  }
}

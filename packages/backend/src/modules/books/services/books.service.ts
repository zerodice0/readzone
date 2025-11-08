import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/utils/prisma';
import { RedisService } from '../../../common/utils/redis';
import { BookApiService } from '../external/book-api.service';
import { SearchBookDto } from '../dto/search-book.dto';
import { CreateBookDto } from '../dto/create-book.dto';

@Injectable()
export class BooksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bookApi: BookApiService,
    private readonly redis: RedisService
  ) {}

  async searchBooks(query: SearchBookDto) {
    const cacheKey = `book:search:${query.source}:${query.q}:${query.page}`;

    // Check cache
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as unknown;
    }

    // Fetch from external APIs
    const results = await this.bookApi.search(query);

    // Cache for 5 minutes
    await this.redis.set(cacheKey, JSON.stringify(results), 300);

    return results;
  }

  async createOrFindBook(dto: CreateBookDto) {
    // Deduplication logic
    let existingBook;

    if (dto.isbn) {
      existingBook = await this.prisma.book.findUnique({
        where: { isbn: dto.isbn },
      });
    }

    if (!existingBook && dto.title && dto.author) {
      existingBook = await this.prisma.book.findFirst({
        where: {
          title: { contains: dto.title, mode: 'insensitive' },
          author: { contains: dto.author, mode: 'insensitive' },
        },
      });
    }

    if (existingBook) {
      return {
        data: existingBook,
        meta: {
          isNew: false,
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Create new book
    const book = await this.prisma.book.create({
      data: dto,
    });

    return {
      data: book,
      meta: {
        isNew: true,
        timestamp: new Date().toISOString(),
      },
    };
  }

  async getBook(id: string) {
    const book = await this.prisma.book.findUnique({
      where: { id },
    });

    if (!book) {
      throw new NotFoundException('책을 찾을 수 없습니다');
    }

    // Aggregate review count
    const reviewCount = await this.prisma.review.count({
      where: {
        bookId: id,
        status: 'PUBLISHED',
      },
    });

    return {
      data: {
        ...book,
        reviewCount,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  async getBookReviews(
    id: string,
    pagination: { page: number; limit: number },
    userId?: string
  ) {
    const book = await this.prisma.book.findUnique({ where: { id } });
    if (!book) {
      throw new NotFoundException('책을 찾을 수 없습니다');
    }

    const { page, limit } = pagination;
    const skip = page * limit;

    const reviews = await this.prisma.review.findMany({
      where: {
        bookId: id,
        status: 'PUBLISHED',
      },
      include: {
        user: {
          select: { id: true, name: true, profileImage: true },
        },
        likes: userId ? { where: { userId } } : false,
        bookmarks: userId ? { where: { userId } } : false,
      },
      orderBy: {
        publishedAt: 'desc',
      },
      skip,
      take: limit + 1,
    });

    const hasMore = reviews.length > limit;
    const data = hasMore ? reviews.slice(0, limit) : reviews;

    const mappedData = data.map((review) => ({
      ...review,
      content: review.content.substring(0, 150),
      isLikedByMe: userId ? review.likes.length > 0 : undefined,
      isBookmarkedByMe: userId ? review.bookmarks.length > 0 : undefined,
      likes: undefined,
      bookmarks: undefined,
    }));

    const total = await this.prisma.review.count({
      where: { bookId: id, status: 'PUBLISHED' },
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

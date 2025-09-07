import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SearchBooksDto } from './dto/search-books.dto';
import { GetBookDto } from './dto/get-book.dto';
import { Prisma } from '@prisma/client';
import {
  parseKakaoIsbn,
  cleanIsbn,
  validateISBN10,
  validateISBN13,
  toLegacyIsbn,
} from '../../common/utils/isbn.utils';
import axios from 'axios';

@Injectable()
export class BooksService {
  constructor(private readonly prismaService: PrismaService) {}

  async searchBooks(searchBooksDto: SearchBooksDto) {
    const { query, page, size, source } = searchBooksDto;
    const skip = (page - 1) * size;

    // Build search conditions - enhance ISBN search with new fields
    const cleanQuery = cleanIsbn(query);
    const searchConditions: Prisma.BookWhereInput[] = [
      { title: { contains: query, mode: Prisma.QueryMode.insensitive } },
      { author: { contains: query, mode: Prisma.QueryMode.insensitive } },
      { isbn: { contains: query, mode: Prisma.QueryMode.insensitive } }, // Legacy field
    ];

    // Add ISBN-specific search conditions if query looks like an ISBN
    if (validateISBN10(cleanQuery)) {
      searchConditions.push({ isbn10: cleanQuery });
    }
    if (validateISBN13(cleanQuery)) {
      searchConditions.push({ isbn13: cleanQuery });
    }
    // Add partial ISBN search for both fields
    if (cleanQuery.length >= 3 && /^\d+$/.test(cleanQuery)) {
      searchConditions.push({ isbn10: { contains: cleanQuery } });
      searchConditions.push({ isbn13: { contains: cleanQuery } });
    }

    const whereCondition: Prisma.BookWhereInput = { OR: searchConditions };

    const dbBooks = await this.prismaService.book.findMany({
      where: whereCondition,
      include: {
        _count: {
          select: {
            reviews: true,
          },
        },
      },
      skip,
      take: size,
      orderBy: { createdAt: 'desc' },
    });

    const total = await this.prismaService.book.count({
      where: whereCondition,
    });

    // If source is forced to kakao or DB has no results, fetch from Kakao API
    if (source === 'kakao' || (total === 0 && !source)) {
      const kakaoUrl =
        process.env.KAKAO_BOOK_API_URL ||
        'https://dapi.kakao.com/v3/search/book';
      const apiKey = process.env.KAKAO_API_KEY;
      if (!apiKey) {
        // Fallback to empty result if not configured
        return {
          success: true,
          data: {
            books: [],
            pagination: { page, size, total: 0, totalPages: 0 },
            source: 'kakao' as const,
          },
        };
      }

      const resp = await axios.get(kakaoUrl, {
        params: { query, page, size },
        headers: { Authorization: `KakaoAK ${apiKey}` },
      });

      interface KakaoBook {
        isbn: string | string[];
        title: string;
        authors: string[];
        publisher: string;
        datetime: string;
        contents: string;
        thumbnail: string;
      }

      interface KakaoResponse {
        documents: KakaoBook[];
        meta: {
          total_count: number;
        };
      }

      const kakaoData = resp.data as KakaoResponse;
      const docs = kakaoData?.documents ?? [];
      const kakaoBooks = docs.map((d) => {
        // Parse Kakao ISBN response (can be string or array)
        const isbnString = Array.isArray(d.isbn)
          ? d.isbn.join(' ') // Join multiple ISBNs with space
          : d.isbn || '';

        const parsedIsbn = parseKakaoIsbn(isbnString);

        return {
          id: undefined,
          isbn: parsedIsbn.primaryIsbn, // Legacy compatibility
          isbn10: parsedIsbn.isbn10,
          isbn13: parsedIsbn.isbn13,
          title: d.title,
          author: Array.isArray(d.authors)
            ? d.authors.join(', ')
            : String(d.authors || ''),
          publisher: d.publisher,
          publishedAt: d.datetime ? String(d.datetime).slice(0, 10) : undefined,
          description: d.contents,
          thumbnail: d.thumbnail,
          source: 'KAKAO_API',
          isExisting: false,
        };
      });

      return {
        success: true,
        data: {
          books: kakaoBooks,
          pagination: {
            page,
            size,
            total: kakaoData?.meta?.total_count ?? kakaoBooks.length,
            totalPages: Math.ceil(
              (kakaoData?.meta?.total_count ?? kakaoBooks.length) / size,
            ),
          },
          source: 'kakao' as const,
        },
      };
    }

    return {
      success: true,
      data: {
        books: dbBooks.map((book) => ({
          ...book,
          createdAt: book.createdAt.toISOString(),
          updatedAt: book.updatedAt.toISOString(),
          isExisting: true,
          // Ensure legacy compatibility for existing clients
          isbn:
            book.isbn ||
            toLegacyIsbn(
              book.isbn10 as string | undefined,
              book.isbn13 as string | undefined,
            ),
        })),
        pagination: {
          page,
          size,
          total,
          totalPages: Math.ceil(total / size),
        },
        source: 'db' as const,
      },
    };
  }

  async getBook(getBookDto: GetBookDto) {
    const book = await this.prismaService.book.findUnique({
      where: { id: getBookDto.id },
      include: {
        reviews: {
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
            _count: {
              select: {
                likes: true,
                comments: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
    });

    if (!book) {
      throw new NotFoundException('도서를 찾을 수 없습니다.');
    }

    return {
      success: true,
      data: {
        book: {
          ...book,
          createdAt: book.createdAt.toISOString(),
          updatedAt: book.updatedAt.toISOString(),
          // Ensure legacy compatibility for existing clients
          isbn:
            book.isbn ||
            toLegacyIsbn(
              book.isbn10 as string | undefined,
              book.isbn13 as string | undefined,
            ),
          reviews: book.reviews.map((review) => ({
            ...review,
            createdAt: review.createdAt.toISOString(),
            updatedAt: review.updatedAt.toISOString(),
          })),
        },
      },
    };
  }

  async getPopularBooks() {
    const books = await this.prismaService.book.findMany({
      include: {
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
      take: 20,
    });

    return {
      success: true,
      data: {
        books: books.map((book) => ({
          ...book,
          createdAt: book.createdAt.toISOString(),
          updatedAt: book.updatedAt.toISOString(),
          // Ensure legacy compatibility for existing clients
          isbn:
            book.isbn ||
            toLegacyIsbn(
              book.isbn10 as string | undefined,
              book.isbn13 as string | undefined,
            ),
        })),
      },
    };
  }
}

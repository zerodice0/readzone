import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SearchBooksDto } from './dto/search-books.dto';
import { GetBookDto } from './dto/get-book.dto';

@Injectable()
export class BooksService {
  constructor(private readonly prismaService: PrismaService) {}

  async searchBooks(searchBooksDto: SearchBooksDto) {
    const { query, page, size } = searchBooksDto;
    const skip = (page - 1) * size;

    const books = await this.prismaService.book.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { author: { contains: query, mode: 'insensitive' } },
          { isbn: { contains: query, mode: 'insensitive' } },
        ],
      },
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
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { author: { contains: query, mode: 'insensitive' } },
          { isbn: { contains: query, mode: 'insensitive' } },
        ],
      },
    });

    return {
      success: true,
      data: {
        books: books.map((book) => ({
          ...book,
          createdAt: book.createdAt.toISOString(),
          updatedAt: book.updatedAt.toISOString(),
        })),
        pagination: {
          page,
          size,
          total,
          totalPages: Math.ceil(total / size),
        },
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
        })),
      },
    };
  }
}

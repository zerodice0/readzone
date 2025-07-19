import { Request, Response } from 'express';
import axios from 'axios';
import { createError, asyncHandler } from '@/middleware/errorHandler';
import { prisma } from '@/config/database';
import { parsePaginationParams, createPaginationMeta } from '@/utils/pagination';
import type { AuthenticatedRequest } from '@/middleware/auth';

interface KakaoBookResponse {
  documents: KakaoBook[];
  meta: {
    total_count: number;
    pageable_count: number;
    is_end: boolean;
  };
}

interface KakaoBook {
  title: string;
  contents: string;
  url: string;
  isbn: string;
  datetime: string;
  authors: string[];
  publisher: string;
  translators: string[];
  price: number;
  sale_price: number;
  thumbnail: string;
  status: string;
}

// 카카오 API로 도서 검색
export const searchBooks = asyncHandler(async (req: Request, res: Response) => {
  const { q: query, page = 1, limit = 10 } = req.query;

  if (!query || typeof query !== 'string') {
    throw createError(400, 'VALIDATION_001', '검색어가 필요합니다.');
  }

  if (!process.env.KAKAO_API_KEY) {
    throw createError(500, 'SERVER_001', '카카오 API 키가 설정되지 않았습니다.');
  }

  try {
    const response = await axios.get<KakaoBookResponse>(
      'https://dapi.kakao.com/v3/search/book',
      {
        params: {
          query: query.trim(),
          page: Number(page),
          size: Math.min(Number(limit), 50), // 카카오 API 최대 50개 제한
        },
        headers: {
          Authorization: `KakaoAK ${process.env.KAKAO_API_KEY}`,
        },
        timeout: 10000,
      }
    );

    const { documents, meta } = response.data;

    // 응답 데이터 정규화
    const books = documents.map((book) => ({
      isbn: book.isbn,
      title: book.title,
      authors: book.authors,
      publisher: book.publisher,
      publishedDate: book.datetime ? new Date(book.datetime).toISOString() : null,
      description: book.contents,
      thumbnail: book.thumbnail,
      url: book.url,
      price: book.price,
      salePrice: book.sale_price,
      status: book.status,
      translators: book.translators,
    }));

    return res.json({
      success: true,
      data: {
        books,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: meta.total_count,
          totalPages: Math.ceil(meta.total_count / Number(limit)),
          hasNext: !meta.is_end,
        },
      },
    });
  } catch (error: any) {
    console.error('카카오 API 오류:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      throw createError(500, 'API_001', '카카오 API 인증에 실패했습니다.');
    }
    
    if (error.response?.status === 429) {
      throw createError(429, 'API_002', 'API 호출 한도를 초과했습니다.');
    }
    
    throw createError(500, 'API_003', '도서 검색 중 오류가 발생했습니다.');
  }
});

// 도서 상세 정보 조회 (DB에서)
export const getBookById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    throw createError(400, 'VALIDATION_001', '도서 ID가 필요합니다.');
  }

  const book = await prisma.book.findUnique({
    where: { id },
    include: {
      posts: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          },
        },
        where: {
          isPublic: true,
          isDeleted: false,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      },
      _count: {
        select: {
          posts: true,
          libraryBooks: true,
        },
      },
    },
  });

  if (!book) {
    throw createError(404, 'RESOURCE_001', '도서를 찾을 수 없습니다.');
  }

  return res.json({
    success: true,
    data: {
      ...book,
      stats: {
        postsCount: book._count.posts,
        libraryCount: book._count.libraryBooks,
      },
    },
  });
});

// 도서 정보 저장 (카카오 API에서 가져온 정보를 DB에 저장)
export const saveBook = asyncHandler(async (req: Request, res: Response) => {
  const {
    isbn,
    title,
    authors,
    publisher,
    publishedDate,
    description,
    thumbnail,
    url,
    price,
    salePrice,
    pageCount,
    categories,
  } = req.body;

  if (!isbn || !title || !authors || authors.length === 0) {
    throw createError(400, 'VALIDATION_001', '필수 도서 정보가 누락되었습니다.');
  }

  try {
    // 이미 존재하는 도서인지 확인
    const existingBook = await prisma.book.findUnique({
      where: { isbn },
    });

    if (existingBook) {
      return res.json({
        success: true,
        data: existingBook,
        message: '이미 등록된 도서입니다.',
      });
    }

    // 새 도서 생성
    const book = await prisma.book.create({
      data: {
        isbn,
        title,
        authors,
        publisher,
        publishedDate: publishedDate ? new Date(publishedDate) : null,
        description,
        thumbnail,
        url,
        price,
        salePrice,
        pageCount,
        categories: categories || [],
      },
    });

    return res.status(201).json({
      success: true,
      data: book,
      message: '도서가 성공적으로 등록되었습니다.',
    });
  } catch (error: any) {
    console.error('도서 저장 오류:', error);
    
    if (error.code === 'P2002') {
      throw createError(409, 'RESOURCE_002', '이미 등록된 도서입니다.');
    }
    
    throw createError(500, 'SERVER_001', '도서 저장 중 오류가 발생했습니다.');
  }
});

// 인기 도서 목록 조회
export const getPopularBooks = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = parsePaginationParams(req.query);

  const [books, total] = await Promise.all([
    prisma.book.findMany({
      include: {
        _count: {
          select: {
            posts: true,
            libraryBooks: true,
          },
        },
      },
      orderBy: [
        {
          posts: {
            _count: 'desc',
          },
        },
        {
          libraryBooks: {
            _count: 'desc',
          },
        },
      ],
      skip,
      take: limit,
    }),
    prisma.book.count(),
  ]);

  return res.json({
    success: true,
    data: {
      books: books.map((book) => ({
        ...book,
        stats: {
          postsCount: book._count.posts,
          libraryCount: book._count.libraryBooks,
        },
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
  });
});

// ISBN으로 도서 조회
export const getBookByIsbn = asyncHandler(async (req: Request, res: Response) => {
  const { isbn } = req.params;

  if (!isbn) {
    throw createError(400, 'VALIDATION_001', 'ISBN이 필요합니다.');
  }

  const book = await prisma.book.findUnique({
    where: { isbn },
    include: {
      _count: {
        select: {
          posts: {
            where: {
              isPublic: true,
              isDeleted: false,
            }
          },
          libraryBooks: true,
        },
      },
    },
  });

  if (!book) {
    throw createError(404, 'RESOURCE_001', '도서를 찾을 수 없습니다.');
  }

  return res.json({
    success: true,
    data: {
      ...book,
      stats: {
        postsCount: book._count.posts,
        libraryCount: book._count.libraryBooks,
      },
    },
  });
});

// 도서 관련 게시글 조회
export const getBookPosts = asyncHandler(async (req: Request, res: Response) => {
  const { isbn } = req.params;
  const { page, limit, skip } = parsePaginationParams(req.query);
  const currentUserId = (req as AuthenticatedRequest).user?.id;

  if (!isbn) {
    throw createError(400, 'VALIDATION_001', 'ISBN이 필요합니다.');
  }

  // 도서 존재 확인
  const book = await prisma.book.findUnique({
    where: { isbn },
    select: { id: true, title: true }
  });

  if (!book) {
    throw createError(404, 'RESOURCE_001', '도서를 찾을 수 없습니다.');
  }

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: {
        bookId: book.id,
        isPublic: true,
        isDeleted: false,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
        book: {
          select: {
            id: true,
            title: true,
            authors: true,
            thumbnail: true,
            isbn: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: {
              where: {
                isDeleted: false,
              },
            },
          },
        },
        ...(currentUserId && {
          likes: {
            where: {
              userId: currentUserId,
            },
            select: {
              id: true,
            },
          },
        }),
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    }),
    prisma.post.count({
      where: {
        bookId: book.id,
        isPublic: true,
        isDeleted: false,
      },
    }),
  ]);

  // 게시글 데이터 가공
  const postsWithStats = posts.map((post) => ({
    ...post,
    stats: {
      likesCount: post._count.likes,
      commentsCount: post._count.comments,
    },
    isLiked: currentUserId ? post.likes?.length > 0 : false,
    _count: undefined,
    likes: undefined,
  }));

  const pagination = createPaginationMeta(page, limit, total);

  return res.json({
    success: true,
    data: {
      book: {
        id: book.id,
        title: book.title,
      },
      posts: postsWithStats,
      pagination,
    },
  });
});
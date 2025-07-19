import { Response } from 'express';
import { createError, asyncHandler } from '@/middleware/errorHandler';
import { prisma } from '@/config/database';
import { parsePaginationParams, createPaginationMeta } from '@/utils/pagination';
import type { AuthenticatedRequest } from '@/middleware/auth';

// 도서 서재 상태 타입
export type LibraryStatus = 'want_to_read' | 'reading' | 'completed';

// 사용자 도서 서재 조회
export const getLibraryBooks = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { page, limit, skip } = parsePaginationParams(req.query);
  const { status, search } = req.query;

  const where: any = {
    userId,
  };

  // 상태 필터
  if (status && typeof status === 'string') {
    where.status = status;
  }

  // 검색 필터 (책 제목이나 작가로 검색)
  if (search && typeof search === 'string') {
    where.book = {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { authors: { has: search } },
      ],
    };
  }

  const [libraryBooks, total] = await Promise.all([
    prisma.libraryBook.findMany({
      where,
      include: {
        book: {
          select: {
            id: true,
            isbn: true,
            title: true,
            authors: true,
            publisher: true,
            publishedDate: true,
            description: true,
            thumbnail: true,
            categories: true,
            pageCount: true,
          },
        },
      },
      orderBy: [
        { updatedAt: 'desc' },
        { createdAt: 'desc' },
      ],
      skip,
      take: limit,
    }),
    prisma.libraryBook.count({ where }),
  ]);

  const pagination = createPaginationMeta(page, limit, total);

  res.json({
    success: true,
    data: {
      libraryBooks,
      pagination,
    },
  });
});

// 특정 도서의 서재 정보 조회
export const getLibraryBook = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { bookId } = req.params;

  if (!bookId) {
    throw createError(400, 'VALIDATION_001', '도서 ID가 필요합니다.');
  }

  const libraryBook = await prisma.libraryBook.findUnique({
    where: {
      userId_bookId: {
        userId,
        bookId,
      },
    },
    include: {
      book: {
        select: {
          id: true,
          isbn: true,
          title: true,
          authors: true,
          publisher: true,
          publishedDate: true,
          description: true,
          thumbnail: true,
          categories: true,
          pageCount: true,
        },
      },
    },
  });

  res.json({
    success: true,
    data: libraryBook,
  });
});

// 도서를 서재에 추가 또는 상태 업데이트
export const addOrUpdateLibraryBook = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { bookId } = req.params;
  const { status, currentPage, totalPages, notes, startedAt, finishedAt } = req.body;

  if (!bookId) {
    throw createError(400, 'VALIDATION_001', '도서 ID가 필요합니다.');
  }

  if (!status || !['want_to_read', 'reading', 'completed'].includes(status)) {
    throw createError(400, 'VALIDATION_002', '유효한 상태가 필요합니다. (want_to_read, reading, completed)');
  }

  // 도서 존재 확인
  const book = await prisma.book.findUnique({
    where: { id: bookId },
  });

  if (!book) {
    throw createError(404, 'RESOURCE_001', '도서를 찾을 수 없습니다.');
  }

  // 페이지 수 검증
  if (currentPage !== undefined && currentPage < 0) {
    throw createError(400, 'VALIDATION_003', '현재 페이지는 0 이상이어야 합니다.');
  }

  if (totalPages !== undefined && totalPages < 0) {
    throw createError(400, 'VALIDATION_004', '전체 페이지는 0 이상이어야 합니다.');
  }

  if (currentPage !== undefined && totalPages !== undefined && currentPage > totalPages) {
    throw createError(400, 'VALIDATION_005', '현재 페이지는 전체 페이지를 초과할 수 없습니다.');
  }

  // 날짜 검증
  const startDate = startedAt ? new Date(startedAt) : null;
  const finishDate = finishedAt ? new Date(finishedAt) : null;

  if (startDate && finishDate && startDate > finishDate) {
    throw createError(400, 'VALIDATION_006', '시작 날짜는 완료 날짜보다 이전이어야 합니다.');
  }

  const updateData: any = {
    status,
    currentPage: currentPage || 0,
    totalPages: totalPages || book.pageCount || null,
    notes: notes || null,
    startedAt: startDate,
    finishedAt: finishDate,
  };

  // 상태에 따른 자동 날짜 설정
  if (status === 'reading' && !startDate && !startedAt) {
    updateData.startedAt = new Date();
  }

  if (status === 'completed' && !finishDate && !finishedAt) {
    updateData.finishedAt = new Date();
    // 완료 시 현재 페이지를 전체 페이지로 설정
    if (updateData.totalPages && !currentPage) {
      updateData.currentPage = updateData.totalPages;
    }
  }

  // 서재에 추가하거나 업데이트
  const libraryBook = await prisma.libraryBook.upsert({
    where: {
      userId_bookId: {
        userId,
        bookId,
      },
    },
    update: updateData,
    create: {
      userId,
      bookId,
      ...updateData,
    },
    include: {
      book: {
        select: {
          id: true,
          isbn: true,
          title: true,
          authors: true,
          publisher: true,
          publishedDate: true,
          description: true,
          thumbnail: true,
          categories: true,
          pageCount: true,
        },
      },
    },
  });

  res.json({
    success: true,
    data: libraryBook,
    message: '도서 서재 정보가 업데이트되었습니다.',
  });
});

// 서재에서 도서 제거
export const removeLibraryBook = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { bookId } = req.params;

  if (!bookId) {
    throw createError(400, 'VALIDATION_001', '도서 ID가 필요합니다.');
  }

  const libraryBook = await prisma.libraryBook.findUnique({
    where: {
      userId_bookId: {
        userId,
        bookId,
      },
    },
  });

  if (!libraryBook) {
    throw createError(404, 'RESOURCE_001', '서재에서 해당 도서를 찾을 수 없습니다.');
  }

  await prisma.libraryBook.delete({
    where: {
      userId_bookId: {
        userId,
        bookId,
      },
    },
  });

  res.json({
    success: true,
    message: '도서가 서재에서 제거되었습니다.',
  });
});

// 서재 통계 조회
export const getLibraryStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  const [stats, recentlyRead, currentlyReading] = await Promise.all([
    // 상태별 도서 수 통계
    prisma.libraryBook.groupBy({
      by: ['status'],
      where: { userId },
      _count: {
        id: true,
      },
    }),
    // 최근 완료한 도서 (5권)
    prisma.libraryBook.findMany({
      where: {
        userId,
        status: 'completed',
        finishedAt: { not: null },
      },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            authors: true,
            thumbnail: true,
          },
        },
      },
      orderBy: { finishedAt: 'desc' },
      take: 5,
    }),
    // 현재 읽고 있는 도서 (5권)
    prisma.libraryBook.findMany({
      where: {
        userId,
        status: 'reading',
      },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            authors: true,
            thumbnail: true,
            pageCount: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    }),
  ]);

  // 통계 데이터 정리
  const statusCounts = {
    want_to_read: 0,
    reading: 0,
    completed: 0,
  };

  stats.forEach((stat) => {
    statusCounts[stat.status as LibraryStatus] = stat._count.id;
  });

  // 읽기 진행률 계산
  const readingProgress = currentlyReading.map((item) => ({
    ...item,
    progressPercentage: item.totalPages
      ? Math.round((item.currentPage / item.totalPages) * 100)
      : 0,
  }));

  res.json({
    success: true,
    data: {
      stats: statusCounts,
      recentlyCompleted: recentlyRead,
      currentlyReading: readingProgress,
      totalBooks: statusCounts.want_to_read + statusCounts.reading + statusCounts.completed,
    },
  });
});

// 읽기 진행률 업데이트
export const updateReadingProgress = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { bookId } = req.params;
  const { currentPage, notes } = req.body;

  if (!bookId) {
    throw createError(400, 'VALIDATION_001', '도서 ID가 필요합니다.');
  }

  if (currentPage === undefined || currentPage < 0) {
    throw createError(400, 'VALIDATION_002', '유효한 현재 페이지가 필요합니다.');
  }

  const libraryBook = await prisma.libraryBook.findUnique({
    where: {
      userId_bookId: {
        userId,
        bookId,
      },
    },
    include: {
      book: true,
    },
  });

  if (!libraryBook) {
    throw createError(404, 'RESOURCE_001', '서재에서 해당 도서를 찾을 수 없습니다.');
  }

  if (libraryBook.status !== 'reading') {
    throw createError(400, 'VALIDATION_003', '읽는 중인 도서만 진행률을 업데이트할 수 있습니다.');
  }

  const totalPages = libraryBook.totalPages || libraryBook.book.pageCount || 0;
  if (totalPages && currentPage > totalPages) {
    throw createError(400, 'VALIDATION_004', '현재 페이지는 전체 페이지를 초과할 수 없습니다.');
  }

  const updateData: any = {
    currentPage,
    updatedAt: new Date(),
  };

  if (notes !== undefined) {
    updateData.notes = notes;
  }

  // 완료 체크 (현재 페이지가 전체 페이지와 같으면 자동으로 완료 처리)
  if (totalPages && currentPage >= totalPages) {
    updateData.status = 'completed';
    updateData.finishedAt = new Date();
  }

  const updatedLibraryBook = await prisma.libraryBook.update({
    where: {
      userId_bookId: {
        userId,
        bookId,
      },
    },
    data: updateData,
    include: {
      book: {
        select: {
          id: true,
          isbn: true,
          title: true,
          authors: true,
          publisher: true,
          publishedDate: true,
          description: true,
          thumbnail: true,
          categories: true,
          pageCount: true,
        },
      },
    },
  });

  res.json({
    success: true,
    data: updatedLibraryBook,
    message: '읽기 진행률이 업데이트되었습니다.',
  });
});
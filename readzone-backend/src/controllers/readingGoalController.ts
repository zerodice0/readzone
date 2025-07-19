import { Response } from 'express';
import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import { createError, asyncHandler } from '@/middleware/errorHandler';
import { parsePaginationParams, createPaginationMeta } from '@/utils/pagination';
import type { AuthenticatedRequest } from '@/middleware/auth';

// 독서 목표 조회 (특정 연도)
export const getReadingGoal = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { year } = req.params;
  const userId = req.user!.id;
  
  if (!year || isNaN(Number(year))) {
    throw createError(400, 'VALIDATION_001', '유효한 연도를 입력해주세요.');
  }

  const yearNum = Number(year);
  if (yearNum < 2020 || yearNum > 2030) {
    throw createError(400, 'VALIDATION_002', '지원하는 연도 범위를 벗어났습니다.');
  }

  // 독서 목표 조회
  let readingGoal = await prisma.readingGoal.findUnique({
    where: {
      userId_year: {
        userId,
        year: yearNum
      }
    }
  });

  // 목표가 없으면 기본값으로 생성
  if (!readingGoal) {
    readingGoal = await prisma.readingGoal.create({
      data: {
        userId,
        year: yearNum,
        booksTarget: 12, // 기본값: 월 1권
        pagesTarget: 3000, // 기본값: 연 3000페이지
        booksRead: 0,
        pagesRead: 0
      }
    });
  }

  // 실제 읽은 책 수와 페이지 수 계산
  const readingStats = await calculateReadingStats(userId, yearNum);
  
  // 목표 업데이트
  if (readingGoal.booksRead !== readingStats.booksRead || 
      readingGoal.pagesRead !== readingStats.pagesRead) {
    readingGoal = await prisma.readingGoal.update({
      where: { id: readingGoal.id },
      data: {
        booksRead: readingStats.booksRead,
        pagesRead: readingStats.pagesRead
      }
    });
  }

  // 진행률 계산
  const booksProgress = readingGoal.booksTarget > 0 
    ? Math.round((readingGoal.booksRead / readingGoal.booksTarget) * 100)
    : 0;
  
  const pagesProgress = readingGoal.pagesTarget > 0 
    ? Math.round((readingGoal.pagesRead / readingGoal.pagesTarget) * 100)
    : 0;

  const goalWithProgress = {
    ...readingGoal,
    progress: {
      booksProgress,
      pagesProgress,
      overallProgress: Math.round((booksProgress + pagesProgress) / 2)
    }
  };

  res.json({
    success: true,
    data: goalWithProgress
  });
});

// 독서 목표 설정/업데이트
export const setReadingGoal = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { year } = req.params;
  const { booksTarget, pagesTarget } = req.body;
  const userId = req.user!.id;

  if (!year || isNaN(Number(year))) {
    throw createError(400, 'VALIDATION_001', '유효한 연도를 입력해주세요.');
  }

  const yearNum = Number(year);
  if (yearNum < 2020 || yearNum > 2030) {
    throw createError(400, 'VALIDATION_002', '지원하는 연도 범위를 벗어났습니다.');
  }

  if (booksTarget !== undefined && (booksTarget < 0 || booksTarget > 1000)) {
    throw createError(400, 'VALIDATION_003', '책 목표는 0~1000권 사이여야 합니다.');
  }

  if (pagesTarget !== undefined && (pagesTarget < 0 || pagesTarget > 100000)) {
    throw createError(400, 'VALIDATION_004', '페이지 목표는 0~100000페이지 사이여야 합니다.');
  }

  // 현재 읽은 책 수와 페이지 수 계산
  const readingStats = await calculateReadingStats(userId, yearNum);

  // 목표 업서트
  const readingGoal = await prisma.readingGoal.upsert({
    where: {
      userId_year: {
        userId,
        year: yearNum
      }
    },
    create: {
      userId,
      year: yearNum,
      booksTarget: booksTarget ?? 12,
      pagesTarget: pagesTarget ?? 3000,
      booksRead: readingStats.booksRead,
      pagesRead: readingStats.pagesRead
    },
    update: {
      booksTarget: booksTarget ?? undefined,
      pagesTarget: pagesTarget ?? undefined,
      booksRead: readingStats.booksRead,
      pagesRead: readingStats.pagesRead
    }
  });

  // 진행률 계산
  const booksProgress = readingGoal.booksTarget > 0 
    ? Math.round((readingGoal.booksRead / readingGoal.booksTarget) * 100)
    : 0;
  
  const pagesProgress = readingGoal.pagesTarget > 0 
    ? Math.round((readingGoal.pagesRead / readingGoal.pagesTarget) * 100)
    : 0;

  const goalWithProgress = {
    ...readingGoal,
    progress: {
      booksProgress,
      pagesProgress,
      overallProgress: Math.round((booksProgress + pagesProgress) / 2)
    }
  };

  logger.info(`독서 목표 설정: ${req.user?.username} - ${yearNum}년 책 ${booksTarget}권, 페이지 ${pagesTarget}페이지`);

  res.json({
    success: true,
    data: goalWithProgress,
    message: '독서 목표가 설정되었습니다.'
  });
});

// 사용자의 모든 독서 목표 조회
export const getReadingGoals = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { page, limit, skip } = parsePaginationParams(req.query);

  const [goals, total] = await Promise.all([
    prisma.readingGoal.findMany({
      where: { userId },
      orderBy: { year: 'desc' },
      skip,
      take: limit
    }),
    prisma.readingGoal.count({
      where: { userId }
    })
  ]);

  // 각 목표에 대한 진행률 계산
  const goalsWithProgress = goals.map(goal => {
    const booksProgress = goal.booksTarget > 0 
      ? Math.round((goal.booksRead / goal.booksTarget) * 100)
      : 0;
    
    const pagesProgress = goal.pagesTarget > 0 
      ? Math.round((goal.pagesRead / goal.pagesTarget) * 100)
      : 0;

    return {
      ...goal,
      progress: {
        booksProgress,
        pagesProgress,
        overallProgress: Math.round((booksProgress + pagesProgress) / 2)
      }
    };
  });

  const pagination = createPaginationMeta(page, limit, total);

  res.json({
    success: true,
    data: {
      items: goalsWithProgress,
      pagination
    }
  });
});

// 독서 목표 삭제
export const deleteReadingGoal = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { year } = req.params;
  const userId = req.user!.id;

  if (!year || isNaN(Number(year))) {
    throw createError(400, 'VALIDATION_001', '유효한 연도를 입력해주세요.');
  }

  const yearNum = Number(year);

  // 목표 존재 확인
  const existingGoal = await prisma.readingGoal.findUnique({
    where: {
      userId_year: {
        userId,
        year: yearNum
      }
    }
  });

  if (!existingGoal) {
    throw createError(404, 'RESOURCE_001', '독서 목표를 찾을 수 없습니다.');
  }

  // 목표 삭제
  await prisma.readingGoal.delete({
    where: { id: existingGoal.id }
  });

  logger.info(`독서 목표 삭제: ${req.user?.username} - ${yearNum}년`);

  res.json({
    success: true,
    message: '독서 목표가 삭제되었습니다.'
  });
});

// 독서 통계 계산 헬퍼 함수
async function calculateReadingStats(userId: string, year: number) {
  const startDate = new Date(year, 0, 1); // 1월 1일
  const endDate = new Date(year, 11, 31, 23, 59, 59); // 12월 31일

  // 완료된 책 수 계산 (LibraryBook에서 status가 'completed'인 것)
  const completedBooks = await prisma.libraryBook.count({
    where: {
      userId,
      status: 'completed',
      finishedAt: {
        gte: startDate,
        lte: endDate
      }
    }
  });

  // 읽은 페이지 수 계산 (완료된 책들의 totalPages 합계)
  const completedBooksWithPages = await prisma.libraryBook.findMany({
    where: {
      userId,
      status: 'completed',
      finishedAt: {
        gte: startDate,
        lte: endDate
      }
    },
    select: {
      totalPages: true
    }
  });

  const totalPagesRead = completedBooksWithPages.reduce((sum, book) => {
    return sum + (book.totalPages || 0);
  }, 0);

  return {
    booksRead: completedBooks,
    pagesRead: totalPagesRead
  };
}
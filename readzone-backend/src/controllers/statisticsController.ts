import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 독서 통계 조회
export const getReadingStatistics = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  const userId = req.user!.id;
  const { year, type = 'monthly' } = req.query;
  
  const currentYear = year ? parseInt(year as string) : new Date().getFullYear();
  
  try {
    // 기본 통계
    const [totalBooks, completedBooks, currentlyReading, wantToRead] = await Promise.all([
      prisma.libraryBook.count({
        where: { userId }
      }),
      prisma.libraryBook.count({
        where: { userId, status: 'completed' }
      }),
      prisma.libraryBook.count({
        where: { userId, status: 'reading' }
      }),
      prisma.libraryBook.count({
        where: { userId, status: 'want_to_read' }
      })
    ]);

    // 연도별 데이터
    if (type === 'yearly') {
      const yearlyData = await prisma.libraryBook.groupBy({
        by: ['finishedAt'],
        where: {
          userId,
          status: 'completed',
          finishedAt: {
            not: null
          }
        },
        _count: {
          id: true
        }
      });

      const yearlyStats = yearlyData.reduce((acc: Record<number, number>, item) => {
        if (item.finishedAt) {
          const year = item.finishedAt.getFullYear();
          acc[year] = (acc[year] || 0) + item._count.id;
        }
        return acc;
      }, {});

      return res.json({
        success: true,
        data: {
          summary: {
            totalBooks,
            completedBooks,
            currentlyReading,
            wantToRead
          },
          yearlyStats,
          type: 'yearly'
        }
      });
    }

    // 월별 데이터 (기본)
    const monthlyData = await prisma.libraryBook.findMany({
      where: {
        userId,
        status: 'completed',
        finishedAt: {
          gte: new Date(currentYear, 0, 1),
          lte: new Date(currentYear, 11, 31, 23, 59, 59)
        }
      },
      select: {
        finishedAt: true,
        book: {
          select: {
            title: true,
            authors: true,
            thumbnail: true
          }
        }
      }
    });

    // 월별 통계 생성
    const monthlyStats = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const booksInMonth = monthlyData.filter(book => 
        book.finishedAt && book.finishedAt.getMonth() === index
      );
      
      return {
        month,
        monthName: new Date(currentYear, index).toLocaleDateString('ko-KR', { month: 'long' }),
        count: booksInMonth.length,
        books: booksInMonth.map(book => ({
          title: book.book.title,
          authors: book.book.authors,
          thumbnail: book.book.thumbnail,
          finishedAt: book.finishedAt
        }))
      };
    });

    // 장르별 통계 (향후 구현 예정)
    // const genreStats = await prisma.libraryBook.groupBy({
    //   by: ['bookId'],
    //   where: {
    //     userId,
    //     status: 'completed',
    //     finishedAt: {
    //       gte: new Date(currentYear, 0, 1),
    //       lte: new Date(currentYear, 11, 31, 23, 59, 59)
    //     }
    //   },
    //   _count: {
    //     id: true
    //   }
    // });

    // 독서 목표 진행률
    const readingGoal = await prisma.readingGoal.findFirst({
      where: {
        userId,
        year: currentYear
      }
    });

    const goalProgress = readingGoal ? {
      target: readingGoal.booksTarget,
      completed: completedBooks,
      percentage: Math.round((completedBooks / readingGoal.booksTarget) * 100)
    } : null;

    res.json({
      success: true,
      data: {
        summary: {
          totalBooks,
          completedBooks,
          currentlyReading,
          wantToRead
        },
        monthlyStats,
        goalProgress,
        year: currentYear,
        type: 'monthly'
      }
    });

  } catch (error) {
    console.error('Error fetching reading statistics:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '독서 통계를 불러오는 중 오류가 발생했습니다.'
      }
    });
  }
};

// 독서 트렌드 분석
export const getReadingTrends = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  const userId = req.user!.id;
  const { period = '6months' } = req.query;
  
  try {
    let startDate: Date;
    const endDate = new Date();
    
    switch (period) {
      case '3months':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case '1year':
        startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case '6months':
      default:
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 6);
        break;
    }

    // 기간별 완독 도서
    const completedBooks = await prisma.libraryBook.findMany({
      where: {
        userId,
        status: 'completed',
        finishedAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        book: {
          select: {
            title: true,
            authors: true,
            thumbnail: true
          }
        }
      },
      orderBy: {
        finishedAt: 'desc'
      }
    });

    // 주간/월간 트렌드 계산
    const trends = [];
    const now = new Date();
    
    if (period === '3months' || period === '6months') {
      // 주간 트렌드
      for (let i = 0; i < (period === '3months' ? 12 : 24); i++) {
        const weekEnd = new Date(now);
        weekEnd.setDate(weekEnd.getDate() - (i * 7));
        const weekStart = new Date(weekEnd);
        weekStart.setDate(weekStart.getDate() - 6);
        
        const weekBooks = completedBooks.filter(book => 
          book.finishedAt && 
          book.finishedAt >= weekStart && 
          book.finishedAt <= weekEnd
        );
        
        trends.unshift({
          period: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
          count: weekBooks.length,
          books: weekBooks
        });
      }
    } else {
      // 월간 트렌드
      for (let i = 0; i < 12; i++) {
        const monthDate = new Date(now);
        monthDate.setMonth(monthDate.getMonth() - i);
        
        const monthBooks = completedBooks.filter(book => 
          book.finishedAt && 
          book.finishedAt.getMonth() === monthDate.getMonth() &&
          book.finishedAt.getFullYear() === monthDate.getFullYear()
        );
        
        trends.unshift({
          period: `${monthDate.getFullYear()}.${monthDate.getMonth() + 1}`,
          count: monthBooks.length,
          books: monthBooks
        });
      }
    }

    // 읽기 속도 분석 (페이지 수 기반)
    const readingSpeed = await prisma.libraryBook.findMany({
      where: {
        userId,
        status: 'completed',
        startedAt: { not: null },
        finishedAt: { not: null },
        totalPages: { not: null }
      },
      select: {
        startedAt: true,
        finishedAt: true,
        totalPages: true,
        book: {
          select: {
            title: true
          }
        }
      }
    });

    const speedAnalysis = readingSpeed
      .filter(book => book.startedAt && book.finishedAt && book.totalPages)
      .map(book => {
        const days = Math.ceil(
          (book.finishedAt!.getTime() - book.startedAt!.getTime()) / (1000 * 60 * 60 * 24)
        );
        const pagesPerDay = days > 0 ? Math.round(book.totalPages! / days) : 0;
        
        return {
          title: book.book.title,
          totalPages: book.totalPages,
          days,
          pagesPerDay
        };
      });

    const averagePagesPerDay = speedAnalysis.length > 0
      ? Math.round(speedAnalysis.reduce((sum, book) => sum + book.pagesPerDay, 0) / speedAnalysis.length)
      : 0;

    res.json({
      success: true,
      data: {
        trends,
        speedAnalysis: {
          averagePagesPerDay,
          books: speedAnalysis.slice(-10) // 최근 10권
        },
        period,
        totalCompleted: completedBooks.length
      }
    });

  } catch (error) {
    console.error('Error fetching reading trends:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '독서 트렌드를 불러오는 중 오류가 발생했습니다.'
      }
    });
  }
};
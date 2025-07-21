import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 도서 추천하기
export const createRecommendation = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const fromUserId = req.user!.id;
    const { toUserId, bookId, reason } = req.body;

    if (!toUserId || !bookId) {
      return res.status(400).json({
        success: false,
        error: { message: '받는 사람과 도서 정보가 필요합니다.' }
      });
    }

    if (fromUserId === toUserId) {
      return res.status(400).json({
        success: false,
        error: { message: '자신에게는 추천할 수 없습니다.' }
      });
    }

    // 이미 추천한 도서인지 확인
    const existingRecommendation = await prisma.bookRecommendation.findUnique({
      where: {
        fromUserId_toUserId_bookId: {
          fromUserId,
          toUserId,
          bookId
        }
      }
    });

    if (existingRecommendation) {
      return res.status(400).json({
        success: false,
        error: { message: '이미 추천한 도서입니다.' }
      });
    }

    // 도서와 사용자 존재 확인
    const [book, toUser] = await Promise.all([
      prisma.book.findUnique({ where: { id: bookId } }),
      prisma.user.findUnique({ where: { id: toUserId } })
    ]);

    if (!book) {
      return res.status(404).json({
        success: false,
        error: { message: '도서를 찾을 수 없습니다.' }
      });
    }

    if (!toUser) {
      return res.status(404).json({
        success: false,
        error: { message: '사용자를 찾을 수 없습니다.' }
      });
    }

    const recommendation = await prisma.bookRecommendation.create({
      data: {
        fromUserId,
        toUserId,
        bookId,
        reason: reason?.trim()
      },
      include: {
        fromUser: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatar: true
          }
        },
        book: {
          select: {
            id: true,
            title: true,
            authors: true,
            thumbnail: true
          }
        }
      }
    });

    // 알림 생성
    await prisma.notification.create({
      data: {
        recipientId: toUserId,
        senderId: fromUserId,
        type: 'recommendation',
        title: '새로운 도서 추천',
        content: `${req.user!.username}님이 "${book.title}"을 추천했습니다.`,
        relatedId: recommendation.id || null
      }
    });

    res.status(201).json({
      success: true,
      data: recommendation
    });
  } catch (error) {
    console.error('Error creating recommendation:', error);
    res.status(500).json({
      success: false,
      error: { message: '도서 추천 중 오류가 발생했습니다.' }
    });
  }
};

// 받은 추천 목록 조회
export const getReceivedRecommendations = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user!.id;
    const { page = 1, limit = 20, isRead } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereCondition: any = {
      toUserId: userId
    };

    if (isRead !== undefined) {
      whereCondition.isRead = isRead === 'true';
    }

    const [recommendations, total] = await Promise.all([
      prisma.bookRecommendation.findMany({
        where: whereCondition,
        include: {
          fromUser: {
            select: {
              id: true,
              username: true,
              nickname: true,
              avatar: true
            }
          },
          book: {
            select: {
              id: true,
              isbn: true,
              title: true,
              authors: true,
              thumbnail: true,
              description: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: Number(limit)
      }),
      prisma.bookRecommendation.count({ where: whereCondition })
    ]);

    res.json({
      success: true,
      data: {
        recommendations,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching received recommendations:', error);
    res.status(500).json({
      success: false,
      error: { message: '받은 추천 목록을 불러오는 중 오류가 발생했습니다.' }
    });
  }
};

// 보낸 추천 목록 조회
export const getSentRecommendations = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user!.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const [recommendations, total] = await Promise.all([
      prisma.bookRecommendation.findMany({
        where: { fromUserId: userId },
        include: {
          toUser: {
            select: {
              id: true,
              username: true,
              nickname: true,
              avatar: true
            }
          },
          book: {
            select: {
              id: true,
              isbn: true,
              title: true,
              authors: true,
              thumbnail: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: Number(limit)
      }),
      prisma.bookRecommendation.count({ where: { fromUserId: userId } })
    ]);

    res.json({
      success: true,
      data: {
        recommendations,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching sent recommendations:', error);
    res.status(500).json({
      success: false,
      error: { message: '보낸 추천 목록을 불러오는 중 오류가 발생했습니다.' }
    });
  }
};

// 추천 읽음 처리
export const markRecommendationAsRead = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: { message: '추천 ID가 필요합니다.' }
      });
    }

    const recommendation = await prisma.bookRecommendation.findUnique({
      where: { id }
    });

    if (!recommendation) {
      return res.status(404).json({
        success: false,
        error: { message: '추천을 찾을 수 없습니다.' }
      });
    }

    if (recommendation.toUserId !== userId) {
      return res.status(403).json({
        success: false,
        error: { message: '권한이 없습니다.' }
      });
    }

    await prisma.bookRecommendation.update({
      where: { id },
      data: { isRead: true }
    });

    res.json({
      success: true,
      message: '추천을 읽음 처리했습니다.'
    });
  } catch (error) {
    console.error('Error marking recommendation as read:', error);
    res.status(500).json({
      success: false,
      error: { message: '추천 읽음 처리 중 오류가 발생했습니다.' }
    });
  }
};

// 추천 피드백 작성
export const addRecommendationFeedback = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { rating, feedback } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: { message: '추천 ID가 필요합니다.' }
      });
    }

    const recommendation = await prisma.bookRecommendation.findUnique({
      where: { id }
    });

    if (!recommendation) {
      return res.status(404).json({
        success: false,
        error: { message: '추천을 찾을 수 없습니다.' }
      });
    }

    if (recommendation.toUserId !== userId) {
      return res.status(403).json({
        success: false,
        error: { message: '권한이 없습니다.' }
      });
    }

    const updatedRecommendation = await prisma.bookRecommendation.update({
      where: { id },
      data: {
        rating: rating ? Number(rating) : null,
        feedback: feedback?.trim(),
        isRead: true
      },
      include: {
        fromUser: {
          select: {
            id: true,
            username: true,
            nickname: true
          }
        },
        book: {
          select: {
            title: true
          }
        }
      }
    });

    // 피드백 알림 생성 (평점이나 피드백이 있는 경우)
    if (rating || feedback) {
      await prisma.notification.create({
        data: {
          recipientId: recommendation.fromUserId,
          senderId: userId,
          type: 'recommendation_feedback',
          title: '추천 피드백',
          content: `${req.user!.username}님이 추천에 피드백을 남겼습니다.`,
          relatedId: id || null
        }
      });
    }

    res.json({
      success: true,
      data: updatedRecommendation
    });
  } catch (error) {
    console.error('Error adding recommendation feedback:', error);
    res.status(500).json({
      success: false,
      error: { message: '피드백 작성 중 오류가 발생했습니다.' }
    });
  }
};

// 개인화된 도서 추천 (AI 기반)
export const getPersonalizedRecommendations = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user!.id;
    const { limit = 10 } = req.query;

    // 사용자의 독서 기록 분석
    const userLibrary = await prisma.libraryBook.findMany({
      where: {
        userId,
        status: 'completed'
      },
      include: {
        book: {
          select: {
            categories: true,
            authors: true
          }
        }
      }
    });

    // 선호 카테고리와 작가 분석
    const categoryCount: Record<string, number> = {};
    const authorCount: Record<string, number> = {};

    userLibrary.forEach(lib => {
      lib.book.categories.forEach(category => {
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      });
      lib.book.authors.forEach(author => {
        authorCount[author] = (authorCount[author] || 0) + 1;
      });
    });

    // 상위 선호 카테고리와 작가
    const topCategories = Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category]) => category);

    const topAuthors = Object.entries(authorCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([author]) => author);

    // 이미 읽은 책 ID 목록
    const readBookIds = userLibrary.map(lib => lib.bookId);

    // 추천 도서 찾기
    let recommendedBooks = await prisma.book.findMany({
      where: {
        AND: [
          { id: { notIn: readBookIds } },
          {
            OR: [
              { categories: { hasSome: topCategories } },
              { authors: { hasSome: topAuthors } }
            ]
          }
        ]
      },
      take: Number(limit) * 2
    });

    // 추천 점수 계산 및 정렬
    recommendedBooks = recommendedBooks
      .map(book => {
        let score = 0;
        
        // 카테고리 매칭 점수
        book.categories.forEach(category => {
          if (topCategories.includes(category)) {
            score += categoryCount[category] || 0;
          }
        });
        
        // 작가 매칭 점수
        book.authors.forEach(author => {
          if (topAuthors.includes(author)) {
            score += (authorCount[author] || 0) * 2; // 작가 가중치 높임
          }
        });

        return { ...book, recommendationScore: score };
      })
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, Number(limit));

    // 추천이 부족한 경우 인기 도서로 보완
    if (recommendedBooks.length < Number(limit)) {
      const popularBooks = await prisma.book.findMany({
        where: {
          id: { notIn: [...readBookIds, ...recommendedBooks.map(b => b.id)] }
        },
        take: Number(limit) - recommendedBooks.length,
        orderBy: {
          posts: {
            _count: 'desc'
          }
        }
      });

      recommendedBooks = [
        ...recommendedBooks,
        ...popularBooks.map(book => ({ ...book, recommendationScore: 0 }))
      ];
    }

    res.json({
      success: true,
      data: {
        recommendations: recommendedBooks,
        userPreferences: {
          topCategories,
          topAuthors,
          totalBooksRead: userLibrary.length
        }
      }
    });
  } catch (error) {
    console.error('Error getting personalized recommendations:', error);
    res.status(500).json({
      success: false,
      error: { message: '개인화 추천을 불러오는 중 오류가 발생했습니다.' }
    });
  }
};
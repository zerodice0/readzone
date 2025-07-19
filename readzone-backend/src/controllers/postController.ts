import { Request, Response } from 'express';
import { createError, asyncHandler } from '@/middleware/errorHandler';
import { prisma } from '@/config/database';
import { parsePaginationParams } from '@/utils/pagination';
import type { AuthenticatedRequest } from '@/middleware/auth';
import { createLikeNotification } from './notificationController';

// 게시글 작성
export const createPost = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { bookId, content, rating, readingProgress, tags, isPublic } = req.body;
  const userId = req.user!.id;

  if (!bookId || !content) {
    throw createError(400, 'VALIDATION_001', '도서 ID와 내용이 필요합니다.');
  }

  // 도서 존재 확인
  const book = await prisma.book.findUnique({
    where: { id: bookId },
  });

  if (!book) {
    throw createError(404, 'RESOURCE_001', '도서를 찾을 수 없습니다.');
  }

  // 평점 유효성 검사
  if (rating !== undefined && (rating < 1 || rating > 5)) {
    throw createError(400, 'VALIDATION_002', '평점은 1-5 사이의 값이어야 합니다.');
  }

  // 독서 진행률 유효성 검사
  if (readingProgress !== undefined && (readingProgress < 0 || readingProgress > 100)) {
    throw createError(400, 'VALIDATION_003', '독서 진행률은 0-100 사이의 값이어야 합니다.');
  }

  try {
    const post = await prisma.post.create({
      data: {
        userId,
        bookId,
        content,
        rating: rating || null,
        readingProgress: readingProgress || 0,
        tags: tags || [],
        isPublic: isPublic !== undefined ? isPublic : true,
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
            comments: true,
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      data: {
        ...post,
        stats: {
          likesCount: post._count.likes,
          commentsCount: post._count.comments,
        },
      },
      message: '독서 기록이 작성되었습니다.',
    });
  } catch (error: any) {
    console.error('게시글 작성 오류:', error);
    throw createError(500, 'SERVER_001', '독서 기록 작성 중 오류가 발생했습니다.');
  }
});

// 게시글 목록 조회 (공개 게시글)
export const getPosts = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = parsePaginationParams(req.query);
  const { userId, bookId, tags } = req.query;

  // 필터 조건 구성
  const where: any = {
    isPublic: true,
    isDeleted: false,
  };

  if (userId) {
    where.userId = userId as string;
  }

  if (bookId) {
    where.bookId = bookId as string;
  }

  if (tags) {
    const tagList = Array.isArray(tags) ? tags : [tags];
    where.tags = {
      hasSome: tagList,
    };
  }

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
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
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    }),
    prisma.post.count({ where }),
  ]);

  return res.json({
    success: true,
    data: {
      posts: posts.map((post) => ({
        ...post,
        stats: {
          likesCount: post._count.likes,
          commentsCount: post._count.comments,
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

// 게시글 상세 조회
export const getPostById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req as AuthenticatedRequest).user?.id;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ID',
        message: '게시글 ID가 필요합니다'
      }
    });
  }

  const post = await prisma.post.findUnique({
    where: { id },
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
          publisher: true,
        },
      },
      likes: userId ? {
        where: { userId },
        select: { id: true },
      } : false,
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
    },
  });

  if (!post) {
    throw createError(404, 'RESOURCE_001', '게시글을 찾을 수 없습니다.');
  }

  // 비공개 게시글 접근 권한 확인
  if (!post.isPublic && post.userId !== userId) {
    throw createError(403, 'AUTH_003', '비공개 게시글에 접근할 수 없습니다.');
  }

  // 삭제된 게시글 확인
  if (post.isDeleted) {
    throw createError(404, 'RESOURCE_001', '삭제된 게시글입니다.');
  }

  return res.json({
    success: true,
    data: {
      ...post,
      stats: {
        likesCount: post._count.likes,
        commentsCount: post._count.comments,
      },
      isLiked: userId ? post.likes.length > 0 : false,
    },
  });
});

// 게시글 수정
export const updatePost = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { content, rating, readingProgress, tags, isPublic } = req.body;
  const userId = req.user!.id;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ID',
        message: '게시글 ID가 필요합니다'
      }
    });
  }

  const post = await prisma.post.findUnique({
    where: { id },
  });

  if (!post) {
    throw createError(404, 'RESOURCE_001', '게시글을 찾을 수 없습니다.');
  }

  if (post.userId !== userId) {
    throw createError(403, 'AUTH_003', '게시글을 수정할 권한이 없습니다.');
  }

  if (post.isDeleted) {
    throw createError(404, 'RESOURCE_001', '삭제된 게시글입니다.');
  }

  // 평점 유효성 검사
  if (rating !== undefined && (rating < 1 || rating > 5)) {
    throw createError(400, 'VALIDATION_002', '평점은 1-5 사이의 값이어야 합니다.');
  }

  // 독서 진행률 유효성 검사
  if (readingProgress !== undefined && (readingProgress < 0 || readingProgress > 100)) {
    throw createError(400, 'VALIDATION_003', '독서 진행률은 0-100 사이의 값이어야 합니다.');
  }

  try {
    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        content: content || post.content,
        rating: rating !== undefined ? rating : post.rating,
        readingProgress: readingProgress !== undefined ? readingProgress : post.readingProgress,
        tags: tags !== undefined ? tags : post.tags,
        isPublic: isPublic !== undefined ? isPublic : post.isPublic,
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
            comments: true,
          },
        },
      },
    });

    return res.json({
      success: true,
      data: {
        ...updatedPost,
        stats: {
          likesCount: updatedPost._count.likes,
          commentsCount: updatedPost._count.comments,
        },
      },
      message: '독서 기록이 수정되었습니다.',
    });
  } catch (error: any) {
    console.error('게시글 수정 오류:', error);
    throw createError(500, 'SERVER_001', '독서 기록 수정 중 오류가 발생했습니다.');
  }
});

// 게시글 삭제
export const deletePost = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ID',
        message: '게시글 ID가 필요합니다'
      }
    });
  }

  const post = await prisma.post.findUnique({
    where: { id },
  });

  if (!post) {
    throw createError(404, 'RESOURCE_001', '게시글을 찾을 수 없습니다.');
  }

  if (post.userId !== userId) {
    throw createError(403, 'AUTH_003', '게시글을 삭제할 권한이 없습니다.');
  }

  if (post.isDeleted) {
    throw createError(404, 'RESOURCE_001', '이미 삭제된 게시글입니다.');
  }

  try {
    // 소프트 삭제
    await prisma.post.update({
      where: { id },
      data: {
        isDeleted: true,
        isPublic: false,
      },
    });

    return res.json({
      success: true,
      message: '독서 기록이 삭제되었습니다.',
    });
  } catch (error: any) {
    console.error('게시글 삭제 오류:', error);
    throw createError(500, 'SERVER_001', '독서 기록 삭제 중 오류가 발생했습니다.');
  }
});

// 게시글 좋아요
export const likePost = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ID',
        message: '게시글 ID가 필요합니다'
      }
    });
  }

  const post = await prisma.post.findUnique({
    where: { id },
  });

  if (!post) {
    throw createError(404, 'RESOURCE_001', '게시글을 찾을 수 없습니다.');
  }

  if (post.isDeleted) {
    throw createError(404, 'RESOURCE_001', '삭제된 게시글입니다.');
  }

  // 이미 좋아요한 게시글인지 확인
  const existingLike = await prisma.like.findUnique({
    where: {
      userId_postId: {
        userId,
        postId: id,
      },
    },
  });

  if (existingLike) {
    throw createError(409, 'RESOURCE_002', '이미 좋아요한 게시글입니다.');
  }

  try {
    await prisma.like.create({
      data: {
        userId,
        postId: id,
      },
    });

    // 알림 생성 (비동기로 처리하여 성능에 영향 주지 않음)
    createLikeNotification(id, userId).catch(error => {
      console.error('좋아요 알림 생성 오류:', error);
    });

    // 좋아요 수 조회
    const likesCount = await prisma.like.count({
      where: { postId: id },
    });

    return res.json({
      success: true,
      data: {
        likesCount,
      },
      message: '좋아요가 추가되었습니다.',
    });
  } catch (error: any) {
    console.error('좋아요 추가 오류:', error);
    throw createError(500, 'SERVER_001', '좋아요 추가 중 오류가 발생했습니다.');
  }
});

// 게시글 좋아요 취소
export const unlikePost = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ID',
        message: '게시글 ID가 필요합니다'
      }
    });
  }

  const like = await prisma.like.findUnique({
    where: {
      userId_postId: {
        userId,
        postId: id,
      },
    },
  });

  if (!like) {
    throw createError(404, 'RESOURCE_001', '좋아요를 찾을 수 없습니다.');
  }

  try {
    await prisma.like.delete({
      where: {
        userId_postId: {
          userId,
          postId: id,
        },
      },
    });

    // 좋아요 수 조회
    const likesCount = await prisma.like.count({
      where: { postId: id },
    });

    return res.json({
      success: true,
      data: {
        likesCount,
      },
      message: '좋아요가 취소되었습니다.',
    });
  } catch (error: any) {
    console.error('좋아요 취소 오류:', error);
    throw createError(500, 'SERVER_001', '좋아요 취소 중 오류가 발생했습니다.');
  }
});
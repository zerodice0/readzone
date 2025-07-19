import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { createError, asyncHandler } from '@/middleware/errorHandler';
import { AuthenticatedRequest } from '@/middleware/auth';
import { createCommentNotification } from './notificationController';

const prisma = new PrismaClient();

// 댓글 목록 조회
export const getComments = asyncHandler(async (req: Request, res: Response) => {
  const { postId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  if (!postId) {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_POST_ID',
        message: '게시글 ID가 필요합니다'
      }
    });
    return;
  }

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where: {
        postId,
        isDeleted: false
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true
          }
        },
        replies: {
          where: {
            isDeleted: false
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limitNum
    }),
    prisma.comment.count({
      where: {
        postId,
        isDeleted: false
      }
    })
  ]);

  const totalPages = Math.ceil(total / limitNum);

  res.json({
    success: true,
    data: {
      comments,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages
      }
    }
  });
});

// 댓글 작성
export const createComment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { postId } = req.params;
  const { content, parentId } = req.body;
  const userId = req.user!.id;

  if (!postId) {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_POST_ID',
        message: '게시글 ID가 필요합니다'
      }
    });
    return;
  }

  if (!content || content.trim().length === 0) {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_CONTENT',
        message: '댓글 내용이 필요합니다'
      }
    });
    return;
  }

  if (content.length > 500) {
    res.status(400).json({
      success: false,
      error: {
        code: 'CONTENT_TOO_LONG',
        message: '댓글은 500자를 초과할 수 없습니다'
      }
    });
    return;
  }

  // 게시글 존재 확인
  const post = await prisma.post.findUnique({
    where: { id: postId }
  });

  if (!post) {
    throw createError(404, 'RESOURCE_001', '게시글을 찾을 수 없습니다.');
  }

  // 부모 댓글 존재 확인 (대댓글인 경우)
  if (parentId) {
    const parentComment = await prisma.comment.findUnique({
      where: { id: parentId }
    });

    if (!parentComment) {
      res.status(400).json({
        success: false,
        error: {
          code: 'PARENT_COMMENT_NOT_FOUND',
          message: '부모 댓글을 찾을 수 없습니다'
        }
      });
      return;
    }
  }

  const comment = await prisma.comment.create({
    data: {
      postId,
      userId,
      content: content.trim(),
      parentId: parentId || null
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true
        }
      },
      replies: {
        where: {
          isDeleted: false
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      }
    }
  });

  // 알림 생성 (비동기로 처리)
  createCommentNotification(postId, userId, content.trim(), parentId).catch(error => {
    console.error('댓글 알림 생성 오류:', error);
  });

  res.status(201).json({
    success: true,
    data: comment
  });
});

// 댓글 수정
export const updateComment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { content } = req.body;
  const userId = req.user!.id;

  if (!id) {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ID',
        message: '댓글 ID가 필요합니다'
      }
    });
    return;
  }

  if (!content || content.trim().length === 0) {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_CONTENT',
        message: '댓글 내용이 필요합니다'
      }
    });
    return;
  }

  if (content.length > 500) {
    res.status(400).json({
      success: false,
      error: {
        code: 'CONTENT_TOO_LONG',
        message: '댓글은 500자를 초과할 수 없습니다'
      }
    });
    return;
  }

  const comment = await prisma.comment.findUnique({
    where: { id }
  });

  if (!comment) {
    throw createError(404, 'RESOURCE_001', '댓글을 찾을 수 없습니다.');
  }

  if (comment.userId !== userId) {
    throw createError(403, 'PERMISSION_001', '댓글을 수정할 권한이 없습니다.');
  }

  const updatedComment = await prisma.comment.update({
    where: { id },
    data: {
      content: content.trim()
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true
        }
      },
      replies: {
        where: {
          isDeleted: false
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      }
    }
  });

  res.json({
    success: true,
    data: updatedComment
  });
});

// 댓글 삭제
export const deleteComment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  if (!id) {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ID',
        message: '댓글 ID가 필요합니다'
      }
    });
    return;
  }

  const comment = await prisma.comment.findUnique({
    where: { id }
  });

  if (!comment) {
    throw createError(404, 'RESOURCE_001', '댓글을 찾을 수 없습니다.');
  }

  if (comment.userId !== userId) {
    throw createError(403, 'PERMISSION_001', '댓글을 삭제할 권한이 없습니다.');
  }

  // 실제로 삭제하지 않고 isDeleted 플래그만 설정
  await prisma.comment.update({
    where: { id },
    data: {
      isDeleted: true
    }
  });

  res.json({
    success: true,
    message: '댓글이 삭제되었습니다.'
  });
});
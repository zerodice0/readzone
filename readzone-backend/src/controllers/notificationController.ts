import { Response } from 'express';
import { createError, asyncHandler } from '@/middleware/errorHandler';
import { prisma } from '@/config/database';
import { parsePaginationParams, createPaginationMeta } from '@/utils/pagination';
import type { AuthenticatedRequest } from '@/middleware/auth';

// 알림 타입 정의
export type NotificationType = 'like' | 'comment' | 'follow' | 'mention';

// 알림 생성 유틸리티 함수
export const createNotification = async (
  recipientId: string,
  senderId: string | null,
  type: NotificationType,
  title: string,
  content: string,
  relatedId?: string
) => {
  // 자신에게 알림 보내지 않기
  if (recipientId === senderId) {
    return null;
  }

  try {
    return await prisma.notification.create({
      data: {
        recipientId,
        senderId,
        type,
        title,
        content,
        relatedId: relatedId || null,
      },
    });
  } catch (error) {
    console.error('알림 생성 오류:', error);
    return null;
  }
};

// 알림 목록 조회
export const getNotifications = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { page, limit, skip } = parsePaginationParams(req.query);
  const { type, isRead } = req.query;

  const where: any = {
    recipientId: userId,
  };

  if (type && typeof type === 'string') {
    where.type = type;
  }

  if (isRead === 'true' || isRead === 'false') {
    where.isRead = isRead === 'true';
  }

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where }),
  ]);

  const pagination = createPaginationMeta(page, limit, total);

  res.json({
    success: true,
    data: {
      notifications,
      pagination,
    },
  });
});

// 알림 읽음 처리
export const markAsRead = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { notificationId } = req.params;

  if (!notificationId) {
    throw createError(400, 'VALIDATION_001', '알림 ID가 필요합니다.');
  }

  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      recipientId: userId,
    },
  });

  if (!notification) {
    throw createError(404, 'NOTIFICATION_NOT_FOUND', '알림을 찾을 수 없습니다.');
  }

  const updatedNotification = await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
        },
      },
    },
  });

  res.json({
    success: true,
    data: updatedNotification,
  });
});

// 모든 알림 읽음 처리
export const markAllAsRead = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  await prisma.notification.updateMany({
    where: {
      recipientId: userId,
      isRead: false,
    },
    data: { isRead: true },
  });

  res.json({
    success: true,
    message: '모든 알림을 읽음 처리했습니다.',
  });
});

// 알림 삭제
export const deleteNotification = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { notificationId } = req.params;

  if (!notificationId) {
    throw createError(400, 'VALIDATION_001', '알림 ID가 필요합니다.');
  }

  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      recipientId: userId,
    },
  });

  if (!notification) {
    throw createError(404, 'NOTIFICATION_NOT_FOUND', '알림을 찾을 수 없습니다.');
  }

  await prisma.notification.delete({
    where: { id: notificationId },
  });

  res.json({
    success: true,
    message: '알림이 삭제되었습니다.',
  });
});

// 읽지 않은 알림 개수 조회
export const getUnreadCount = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  const count = await prisma.notification.count({
    where: {
      recipientId: userId,
      isRead: false,
    },
  });

  res.json({
    success: true,
    data: { count },
  });
});

// 좋아요 알림 생성 함수
export const createLikeNotification = async (
  postId: string,
  likerId: string
) => {
  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        user: { select: { id: true, username: true } },
        book: { select: { title: true } },
      },
    });

    if (!post) return null;

    const liker = await prisma.user.findUnique({
      where: { id: likerId },
      select: { username: true, displayName: true },
    });

    if (!liker) return null;

    const displayName = liker.displayName || liker.username;
    
    return await createNotification(
      post.userId,
      likerId,
      'like',
      '게시글에 좋아요가 달렸습니다',
      `${displayName}님이 "${post.book.title}" 독서 기록에 좋아요를 눌렀습니다.`,
      postId
    );
  } catch (error) {
    console.error('좋아요 알림 생성 오류:', error);
    return null;
  }
};

// 댓글 알림 생성 함수
export const createCommentNotification = async (
  postId: string,
  commenterId: string,
  content: string,
  parentCommentId?: string
) => {
  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        user: { select: { id: true, username: true } },
        book: { select: { title: true } },
      },
    });

    if (!post) return null;

    const commenter = await prisma.user.findUnique({
      where: { id: commenterId },
      select: { username: true, displayName: true },
    });

    if (!commenter) return null;

    const displayName = commenter.displayName || commenter.username;
    const shortContent = content.length > 50 ? content.substring(0, 50) + '...' : content;

    // 대댓글인 경우, 원댓글 작성자에게도 알림
    if (parentCommentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentCommentId },
        include: { user: { select: { id: true } } },
      });

      if (parentComment && parentComment.user.id !== commenterId) {
        await createNotification(
          parentComment.user.id,
          commenterId,
          'comment',
          '댓글에 답글이 달렸습니다',
          `${displayName}님이 회원님의 댓글에 답글을 달았습니다: "${shortContent}"`,
          postId
        );
      }
    }

    // 게시글 작성자에게 알림
    return await createNotification(
      post.userId,
      commenterId,
      'comment',
      '게시글에 댓글이 달렸습니다',
      `${displayName}님이 "${post.book.title}" 독서 기록에 댓글을 달았습니다: "${shortContent}"`,
      postId
    );
  } catch (error) {
    console.error('댓글 알림 생성 오류:', error);
    return null;
  }
};

// 팔로우 알림 생성 함수
export const createFollowNotification = async (
  followingId: string,
  followerId: string
) => {
  try {
    const follower = await prisma.user.findUnique({
      where: { id: followerId },
      select: { username: true, displayName: true },
    });

    if (!follower) return null;

    const displayName = follower.displayName || follower.username;

    return await createNotification(
      followingId,
      followerId,
      'follow',
      '새로운 팔로워가 생겼습니다',
      `${displayName}님이 회원님을 팔로우하기 시작했습니다.`,
      followerId
    );
  } catch (error) {
    console.error('팔로우 알림 생성 오류:', error);
    return null;
  }
};
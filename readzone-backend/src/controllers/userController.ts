import { Request, Response } from 'express';
import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import { createError, asyncHandler } from '@/middleware/errorHandler';
import { parsePaginationParams, createPaginationMeta } from '@/utils/pagination';
import type { AuthenticatedRequest } from '@/middleware/auth';
import { createFollowNotification } from './notificationController';

// 사용자 프로필 조회 (공개)
export const getUserProfile = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const currentUserId = (req as AuthenticatedRequest).user?.id;

  if (!userId) {
    throw createError(400, 'VALIDATION_001', '사용자 ID가 필요합니다.');
  }

  const user = await prisma.user.findUnique({
    where: { 
      id: userId,
      isActive: true,
    },
    select: {
      id: true,
      username: true,
      nickname: true,
      bio: true,
      avatar: true,
      isPublic: true,
      createdAt: true,
      _count: {
        select: {
          posts: {
            where: {
              isDeleted: false,
              isPublic: true,
            },
          },
          followers: true,
          follows: true,
        },
      },
    },
  });

  if (!user) {
    throw createError(404, 'RESOURCE_001', '사용자를 찾을 수 없습니다.');
  }

  // 팔로우 상태 확인 (로그인한 사용자의 경우)
  let isFollowing = false;
  if (currentUserId && currentUserId !== userId) {
    const followRelation = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: userId
        }
      }
    });
    isFollowing = !!followRelation;
  }

  // 비공개 프로필인 경우 제한된 정보만 반환
  if (!user.isPublic && currentUserId !== userId) {
    const limitedUser = {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      avatar: user.avatar,
      isPublic: false,
      isFollowing
    };

    return res.json({
      success: true,
      data: limitedUser,
    });
  }

  // 통계 정보 포함하여 반환
  const userProfile = {
    ...user,
    stats: {
      postsCount: user._count.posts,
      followersCount: user._count.followers,
      followingCount: user._count.follows,
    },
    isFollowing
  };

  // _count 제거
  const { _count, ...userWithoutCount } = userProfile;

  return res.json({
    success: true,
    data: userWithoutCount,
  });
});

// 사용자 게시글 목록 조회
export const getUserPosts = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { page, limit, skip } = parsePaginationParams(req.query);
  const currentUserId = (req as AuthenticatedRequest).user?.id;

  if (!userId) {
    throw createError(400, 'VALIDATION_001', '사용자 ID가 필요합니다.');
  }

  // 사용자 존재 확인
  const user = await prisma.user.findUnique({
    where: { 
      id: userId,
      isActive: true,
    },
    select: { isPublic: true }
  });

  if (!user) {
    throw createError(404, 'RESOURCE_001', '사용자를 찾을 수 없습니다.');
  }

  // 비공개 계정이고 본인이 아닌 경우
  if (!user.isPublic && currentUserId !== userId) {
    throw createError(403, 'AUTH_003', '비공개 계정입니다.');
  }

  const whereClause = {
    userId,
    isDeleted: false,
    ...(currentUserId !== userId && { isPublic: true })
  };

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: whereClause,
      include: {
        user: {
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
            thumbnail: true,
            isbn: true
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true
          }
        },
        likes: currentUserId ? {
          where: { userId: currentUserId },
          select: { id: true }
        } : false
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.post.count({
      where: whereClause
    })
  ]);

  const formattedPosts = posts.map(post => ({
    ...post,
    stats: {
      likesCount: post._count.likes,
      commentsCount: post._count.comments
    },
    isLiked: currentUserId ? post.likes.length > 0 : false,
    _count: undefined,
    likes: undefined
  }));

  const pagination = createPaginationMeta(page, limit, total);

  res.json({
    success: true,
    data: {
      items: formattedPosts,
      pagination
    }
  });
});

// 사용자 검색
export const searchUsers = asyncHandler(async (req: Request, res: Response) => {
  const { q } = req.query;
  const { page, limit, skip } = parsePaginationParams(req.query);

  if (!q || typeof q !== 'string') {
    throw createError(400, 'VALIDATION_001', '검색어를 입력해주세요.');
  }

  const searchQuery = q.trim();

  if (searchQuery.length < 2) {
    throw createError(400, 'VALIDATION_003', '검색어는 최소 2자 이상이어야 합니다.');
  }

  // 사용자 검색 (username, nickname에서 검색)
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              {
                username: {
                  contains: searchQuery,
                  mode: 'insensitive',
                },
              },
              {
                nickname: {
                  contains: searchQuery,
                  mode: 'insensitive',
                },
              },
            ],
          },
          {
            isActive: true,
            isPublic: true,
          },
        ],
      },
      select: {
        id: true,
        username: true,
        nickname: true,
        avatar: true,
        bio: true,
        _count: {
          select: {
            followers: true,
            posts: {
              where: {
                isDeleted: false,
                isPublic: true,
              },
            },
          },
        },
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    }),
    prisma.user.count({
      where: {
        AND: [
          {
            OR: [
              {
                username: {
                  contains: searchQuery,
                  mode: 'insensitive',
                },
              },
              {
                nickname: {
                  contains: searchQuery,
                  mode: 'insensitive',
                },
              },
            ],
          },
          {
            isActive: true,
            isPublic: true,
          },
        ],
      },
    }),
  ]);

  // 통계 정보 포함하여 변환
  const usersWithStats = users.map(user => ({
    ...user,
    stats: {
      followersCount: user._count.followers,
      postsCount: user._count.posts,
    },
    _count: undefined,
  }));

  const pagination = createPaginationMeta(page, limit, total);

  res.json({
    success: true,
    data: {
      items: usersWithStats,
      pagination,
    },
  });
});

// 팔로우
export const followUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { userId } = req.params;
  const currentUserId = req.user!.id;

  if (userId === currentUserId) {
    throw createError(400, 'VALIDATION_002', '자신을 팔로우할 수 없습니다.');
  }

  if (!userId) {
    throw createError(400, 'VALIDATION_001', '사용자 ID가 필요합니다.');
  }

  // 대상 사용자 존재 확인
  const targetUser = await prisma.user.findUnique({
    where: { 
      id: userId,
      isActive: true,
    },
  });

  if (!targetUser) {
    throw createError(404, 'RESOURCE_001', '사용자를 찾을 수 없습니다.');
  }

  // 이미 팔로우 중인지 확인
  const existingFollow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: currentUserId,
        followingId: userId,
      },
    },
  });

  if (existingFollow) {
    throw createError(409, 'RESOURCE_002', '이미 팔로우 중인 사용자입니다.');
  }

  // 팔로우 생성
  await prisma.follow.create({
    data: {
      followerId: currentUserId,
      followingId: userId,
    },
  });

  // 알림 생성 (비동기로 처리)
  createFollowNotification(userId, currentUserId).catch(error => {
    console.error('팔로우 알림 생성 오류:', error);
  });

  logger.info(`팔로우: ${req.user?.username} -> ${targetUser.username}`);

  res.status(201).json({
    success: true,
    message: '팔로우가 완료되었습니다.',
  });
});

// 언팔로우
export const unfollowUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { userId } = req.params;
  const currentUserId = req.user!.id;

  if (!userId) {
    throw createError(400, 'VALIDATION_001', '사용자 ID가 필요합니다.');
  }

  if (userId === currentUserId) {
    throw createError(400, 'VALIDATION_002', '자신을 언팔로우할 수 없습니다.');
  }

  // 팔로우 관계 확인
  const existingFollow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: currentUserId,
        followingId: userId,
      },
    },
  });

  if (!existingFollow) {
    throw createError(404, 'RESOURCE_001', '팔로우 관계를 찾을 수 없습니다.');
  }

  // 팔로우 삭제
  await prisma.follow.delete({
    where: {
      followerId_followingId: {
        followerId: currentUserId,
        followingId: userId,
      },
    },
  });

  logger.info(`언팔로우: ${req.user?.username} -> ${userId}`);

  res.json({
    success: true,
    message: '언팔로우가 완료되었습니다.',
  });
});

// 팔로워 목록
export const getFollowers = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { page, limit, skip } = parsePaginationParams(req.query);

  if (!userId) {
    throw createError(400, 'VALIDATION_001', '사용자 ID가 필요합니다.');
  }

  // 사용자 존재 및 공개 여부 확인
  const user = await prisma.user.findUnique({
    where: { 
      id: userId,
      isActive: true,
    },
    select: {
      isPublic: true,
    },
  });

  if (!user) {
    throw createError(404, 'RESOURCE_001', '사용자를 찾을 수 없습니다.');
  }

  if (!user.isPublic) {
    throw createError(403, 'AUTH_003', '비공개 프로필입니다.');
  }

  const [follows, total] = await Promise.all([
    prisma.follow.findMany({
      where: {
        followingId: userId,
      },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatar: true,
            isPublic: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    }),
    prisma.follow.count({
      where: {
        followingId: userId,
      },
    }),
  ]);

  const followers = follows.map(follow => follow.follower);
  const pagination = createPaginationMeta(page, limit, total);

  res.json({
    success: true,
    data: {
      items: followers,
      pagination,
    },
  });
});

// 팔로잉 목록
export const getFollowing = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { page, limit, skip } = parsePaginationParams(req.query);

  if (!userId) {
    throw createError(400, 'VALIDATION_001', '사용자 ID가 필요합니다.');
  }

  // 사용자 존재 및 공개 여부 확인
  const user = await prisma.user.findUnique({
    where: { 
      id: userId,
      isActive: true,
    },
    select: {
      isPublic: true,
    },
  });

  if (!user) {
    throw createError(404, 'RESOURCE_001', '사용자를 찾을 수 없습니다.');
  }

  if (!user.isPublic) {
    throw createError(403, 'AUTH_003', '비공개 프로필입니다.');
  }

  const [follows, total] = await Promise.all([
    prisma.follow.findMany({
      where: {
        followerId: userId,
      },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatar: true,
            isPublic: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    }),
    prisma.follow.count({
      where: {
        followerId: userId,
      },
    }),
  ]);

  const following = follows.map(follow => follow.following);
  const pagination = createPaginationMeta(page, limit, total);

  res.json({
    success: true,
    data: {
      items: following,
      pagination,
    },
  });
});
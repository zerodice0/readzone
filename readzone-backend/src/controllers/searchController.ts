import { Request, Response } from 'express';
import { createError, asyncHandler } from '@/middleware/errorHandler';
import { prisma } from '@/config/database';
import { parsePaginationParams, createPaginationMeta } from '@/utils/pagination';
import type { AuthenticatedRequest } from '@/middleware/auth';

// 통합 검색 (게시글, 사용자, 태그)
export const searchAll = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = parsePaginationParams(req.query);
  const { q: query, type = 'all' } = req.query;
  const currentUserId = (req as AuthenticatedRequest).user?.id;

  if (!query || typeof query !== 'string') {
    throw createError(400, 'VALIDATION_001', '검색어가 필요합니다.');
  }

  const searchQuery = query.trim();
  if (searchQuery.length < 2) {
    throw createError(400, 'VALIDATION_002', '검색어는 2자 이상이어야 합니다.');
  }

  const results: any = {
    posts: [],
    users: [],
    tags: [],
    pagination: createPaginationMeta(page, limit, 0)
  };

  // 게시글 검색
  if (type === 'all' || type === 'posts') {
    const [posts, postsTotal] = await Promise.all([
      prisma.post.findMany({
        where: {
          AND: [
            {
              OR: [
                { content: { contains: searchQuery, mode: 'insensitive' } },
                { tags: { has: searchQuery } },
                { book: { title: { contains: searchQuery, mode: 'insensitive' } } },
                { book: { authors: { has: searchQuery } } }
              ]
            },
            { isPublic: true },
            { isDeleted: false }
          ]
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
                where: { isDeleted: false }
              }
            }
          },
          ...(currentUserId && {
            likes: {
              where: { userId: currentUserId },
              select: { id: true }
            }
          })
        },
        orderBy: { createdAt: 'desc' },
        skip: type === 'posts' ? skip : 0,
        take: type === 'posts' ? limit : 5
      }),
      prisma.post.count({
        where: {
          AND: [
            {
              OR: [
                { content: { contains: searchQuery, mode: 'insensitive' } },
                { tags: { has: searchQuery } },
                { book: { title: { contains: searchQuery, mode: 'insensitive' } } },
                { book: { authors: { has: searchQuery } } }
              ]
            },
            { isPublic: true },
            { isDeleted: false }
          ]
        }
      })
    ]);

    results.posts = posts.map(post => ({
      ...post,
      stats: {
        likesCount: post._count.likes,
        commentsCount: post._count.comments
      },
      isLiked: currentUserId ? post.likes?.length > 0 : false,
      _count: undefined,
      likes: undefined
    }));

    if (type === 'posts') {
      results.pagination = createPaginationMeta(page, limit, postsTotal);
    }
  }

  // 사용자 검색
  if (type === 'all' || type === 'users') {
    const [users, usersTotal] = await Promise.all([
      prisma.user.findMany({
        where: {
          AND: [
            {
              OR: [
                { username: { contains: searchQuery, mode: 'insensitive' } },
                { displayName: { contains: searchQuery, mode: 'insensitive' } },
                { bio: { contains: searchQuery, mode: 'insensitive' } }
              ]
            },
            { isActive: true }
          ]
        },
        select: {
          id: true,
          username: true,
          displayName: true,
          bio: true,
          avatar: true,
          isPublic: true,
          createdAt: true,
          _count: {
            select: {
              posts: {
                where: {
                  isPublic: true,
                  isDeleted: false
                }
              },
              followers: true,
              follows: true
            }
          },
          ...(currentUserId && {
            followers: {
              where: { followerId: currentUserId },
              select: { id: true }
            }
          })
        },
        orderBy: [
          { followers: { _count: 'desc' } },
          { createdAt: 'desc' }
        ],
        skip: type === 'users' ? skip : 0,
        take: type === 'users' ? limit : 5
      }),
      prisma.user.count({
        where: {
          AND: [
            {
              OR: [
                { username: { contains: searchQuery, mode: 'insensitive' } },
                { displayName: { contains: searchQuery, mode: 'insensitive' } },
                { bio: { contains: searchQuery, mode: 'insensitive' } }
              ]
            },
            { isActive: true }
          ]
        }
      })
    ]);

    results.users = users.map(user => ({
      ...user,
      stats: {
        postsCount: user._count.posts,
        followersCount: user._count.followers,
        followingCount: user._count.follows
      },
      isFollowing: currentUserId ? user.followers?.length > 0 : false,
      _count: undefined,
      followers: undefined
    }));

    if (type === 'users') {
      results.pagination = createPaginationMeta(page, limit, usersTotal);
    }
  }

  // 태그 검색
  if (type === 'all' || type === 'tags') {
    const tagResults = await prisma.post.groupBy({
      by: ['tags'],
      where: {
        AND: [
          { isPublic: true },
          { isDeleted: false },
          { tags: { isEmpty: false } }
        ]
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: type === 'tags' ? limit : 10
    });

    // 태그 배열을 평탄화하고 검색어와 매칭
    const flatTags: { tag: string; count: number }[] = [];
    tagResults.forEach(result => {
      result.tags.forEach(tag => {
        if (tag.toLowerCase().includes(searchQuery.toLowerCase())) {
          const existingTag = flatTags.find(t => t.tag === tag);
          if (existingTag) {
            existingTag.count += result._count.id;
          } else {
            flatTags.push({ tag, count: result._count.id });
          }
        }
      });
    });

    results.tags = flatTags
      .sort((a, b) => b.count - a.count)
      .slice(0, type === 'tags' ? limit : 10);

    if (type === 'tags') {
      results.pagination = createPaginationMeta(page, limit, flatTags.length);
    }
  }

  res.json({
    success: true,
    data: results
  });
});

// 태그별 게시글 조회
export const getPostsByTag = asyncHandler(async (req: Request, res: Response) => {
  const { tag } = req.params;
  const { page, limit, skip } = parsePaginationParams(req.query);
  const currentUserId = (req as AuthenticatedRequest).user?.id;

  if (!tag) {
    throw createError(400, 'VALIDATION_001', '태그가 필요합니다.');
  }

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: {
        AND: [
          { tags: { has: tag } },
          { isPublic: true },
          { isDeleted: false }
        ]
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
              where: { isDeleted: false }
            }
          }
        },
        ...(currentUserId && {
          likes: {
            where: { userId: currentUserId },
            select: { id: true }
          }
        })
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.post.count({
      where: {
        AND: [
          { tags: { has: tag } },
          { isPublic: true },
          { isDeleted: false }
        ]
      }
    })
  ]);

  const postsWithStats = posts.map(post => ({
    ...post,
    stats: {
      likesCount: post._count.likes,
      commentsCount: post._count.comments
    },
    isLiked: currentUserId ? post.likes?.length > 0 : false,
    _count: undefined,
    likes: undefined
  }));

  const pagination = createPaginationMeta(page, limit, total);

  res.json({
    success: true,
    data: {
      tag,
      posts: postsWithStats,
      pagination
    }
  });
});

// 인기 태그 조회
export const getPopularTags = asyncHandler(async (req: Request, res: Response) => {
  const { limit: queryLimit } = req.query;
  const limit = Math.min(Number(queryLimit) || 20, 50);

  const tagResults = await prisma.post.groupBy({
    by: ['tags'],
    where: {
      AND: [
        { isPublic: true },
        { isDeleted: false },
        { tags: { isEmpty: false } },
        { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } // 최근 30일
      ]
    },
    _count: {
      id: true
    },
    orderBy: {
      _count: {
        id: 'desc'
      }
    },
    take: 100 // 더 많이 가져와서 평탄화 후 제한
  });

  // 태그 배열을 평탄화하고 카운트 집계
  const flatTags: { tag: string; count: number }[] = [];
  tagResults.forEach(result => {
    result.tags.forEach(tag => {
      const existingTag = flatTags.find(t => t.tag === tag);
      if (existingTag) {
        existingTag.count += result._count.id;
      } else {
        flatTags.push({ tag, count: result._count.id });
      }
    });
  });

  const popularTags = flatTags
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);

  res.json({
    success: true,
    data: {
      tags: popularTags
    }
  });
});
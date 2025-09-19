import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  UserSearchDto,
  UserSearchResult,
  UserSearchResponse,
} from './dto/user-search.dto';
import { Prisma } from '@prisma/client';

// Define the exact type that our query returns
type UserWithRelations = Prisma.UserGetPayload<{
  include: {
    reviews: {
      select: {
        id: true;
        createdAt: true;
      };
      orderBy: {
        createdAt: 'desc';
      };
      take: 1;
    };
    _count: {
      select: {
        reviews: true;
        followers: true;
        following: true;
        likes: true;
      };
    };
  };
}>;

@Injectable()
export class UserSearchService {
  constructor(private readonly prismaService: PrismaService) {}

  async searchUsers(
    searchDto: UserSearchDto,
    currentUserId?: string,
  ): Promise<UserSearchResponse> {
    const {
      query,
      hasAvatar,
      minFollowers,
      sort,
      cursor,
      limit = 20,
    } = searchDto;

    // Build search conditions
    const searchConditions: Prisma.UserWhereInput[] = [
      { nickname: { contains: query, mode: Prisma.QueryMode.insensitive } },
      { userid: { contains: query, mode: Prisma.QueryMode.insensitive } },
      { bio: { contains: query, mode: Prisma.QueryMode.insensitive } },
    ];

    const whereCondition: Prisma.UserWhereInput = {
      OR: searchConditions,
    };

    // Apply filters
    if (hasAvatar) {
      whereCondition.profileImage = { not: null };
    }

    if (minFollowers && minFollowers > 0) {
      // This is a simplified version - in production you might want to use a having clause
      whereCondition.followers = {
        some: {},
      };
    }

    // Cursor-based pagination
    const cursorCondition: Prisma.UserFindManyArgs = {};
    if (cursor) {
      cursorCondition.cursor = { id: cursor };
      cursorCondition.skip = 1; // Skip the cursor item
    }

    // Sort order
    let orderBy: Prisma.UserOrderByWithRelationInput = {};
    switch (sort) {
      case 'followers':
        orderBy = { followers: { _count: 'desc' } };
        break;
      case 'reviews':
        orderBy = { reviews: { _count: 'desc' } };
        break;
      case 'activity':
        orderBy = { updatedAt: 'desc' };
        break;
      case 'relevance':
      default:
        // For relevance, prioritize exact matches and active users
        orderBy = { createdAt: 'desc' };
        break;
    }

    // Get users with relations
    const users = await this.prismaService.user.findMany({
      where: whereCondition,
      include: {
        reviews: {
          select: {
            id: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
        _count: {
          select: {
            reviews: true,
            followers: true,
            following: true,
            likes: true,
          },
        },
      },
      orderBy,
      take: limit + 1, // Get one extra to check if there's more
      ...cursorCondition,
    });

    // Check if current user follows these users (separate query if needed)
    const followingMap: Map<string, boolean> = new Map();
    if (currentUserId) {
      const userIds = users.map((u) => u.id);
      const follows = await this.prismaService.follow.findMany({
        where: {
          followerId: currentUserId,
          followingId: { in: userIds },
        },
        select: {
          followingId: true,
        },
      });
      follows.forEach((f) => followingMap.set(f.followingId, true));
    }

    // Check if there are more results
    const hasMore = users.length > limit;
    const userResults = users.slice(0, limit) as UserWithRelations[];

    // Transform to UserSearchResult
    const transformedUsers: UserSearchResult[] = userResults.map((user) => {
      const highlights = this.generateHighlights(user, query);
      const lastReview = user.reviews[0];

      return {
        id: user.id,
        username: user.nickname || user.userid,
        bio: user.bio ?? undefined,
        profileImage: user.profileImage ?? undefined,
        stats: {
          reviewCount: user._count.reviews,
          followerCount: user._count.followers,
          followingCount: user._count.following,
          likesReceived: user._count.likes,
        },
        recentActivity: {
          lastReviewAt: lastReview?.createdAt.toISOString(),
          lastActiveAt:
            user.updatedAt?.toISOString() || user.createdAt.toISOString(),
        },
        isFollowing: currentUserId
          ? followingMap.get(user.id) || false
          : undefined,
        highlights,
      };
    });

    // Get total count
    const total = await this.prismaService.user.count({
      where: whereCondition,
    });

    return {
      users: transformedUsers,
      pagination: {
        nextCursor: hasMore
          ? userResults[userResults.length - 1].id
          : undefined,
        hasMore,
        total,
      },
    };
  }

  /**
   * Generate highlighted text for matching fields
   */
  private generateHighlights(
    user: Pick<UserWithRelations, 'nickname' | 'userid' | 'bio'>,
    query: string,
  ): { username?: string; bio?: string } {
    const highlights: { username?: string; bio?: string } = {};

    if (!query) return highlights;

    const queryLower = query.toLowerCase();

    // Highlight username match
    const username = user.nickname || user.userid;
    if (username.toLowerCase().includes(queryLower)) {
      highlights.username = this.highlightText(username, query);
    }

    // Highlight bio match
    if (user.bio && user.bio.toLowerCase().includes(queryLower)) {
      highlights.bio = this.highlightText(user.bio, query, 150);
    }

    return highlights;
  }

  /**
   * Highlight matching text
   */
  private highlightText(
    text: string,
    query: string,
    maxLength?: number,
  ): string {
    const queryLower = query.toLowerCase();
    const textLower = text.toLowerCase();
    const index = textLower.indexOf(queryLower);

    if (index === -1) return text;

    // If text is too long, extract around the match
    if (maxLength && text.length > maxLength) {
      const start = Math.max(0, index - 50);
      const end = Math.min(text.length, index + query.length + 50);
      const snippet = text.substring(start, end);
      return (
        (start > 0 ? '...' : '') + snippet + (end < text.length ? '...' : '')
      );
    }

    // For short text, just return it
    return text;
  }
}

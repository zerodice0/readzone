import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Badge, UserBadge, BadgeTier, Prisma } from '@prisma/client';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface BadgeCondition {
  type: 'review_count' | 'likes_received' | 'streak_days' | 'books_read' | 'followers_count' | 'early_bird' | 'social_butterfly' | 'consistent_reader';
  threshold?: number;
  operator?: 'gte' | 'eq' | 'lte';
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all_time';
  metadata?: any;
}

export interface BadgeWithProgress extends Badge {
  isEarned: boolean;
  earnedAt?: string;
  progress?: {
    current: number;
    required: number;
    percentage: number;
  };
}

export interface BadgeResponse {
  success: boolean;
  data: {
    badges: BadgeWithProgress[];
    totalBadges: number;
    earnedBadges: number;
    nextMilestone?: BadgeWithProgress;
  };
}

@Injectable()
export class BadgeService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * 배지 시스템 초기화 - 기본 배지들을 생성
   */
  async initializeBadges(): Promise<void> {
    const defaultBadges = this.getDefaultBadges();

    for (const badgeData of defaultBadges) {
      try {
        await this.prismaService.badge.upsert({
          where: { name: badgeData.name },
          update: {
            description: badgeData.description,
            icon: badgeData.icon,
            tier: badgeData.tier,
            condition: badgeData.condition as Prisma.InputJsonValue,
            isActive: true,
          },
          create: {
            ...badgeData,
            condition: badgeData.condition as Prisma.InputJsonValue,
          },
        });
      } catch (error) {
        console.error(`Failed to create badge ${badgeData.name}:`, error);
      }
    }
  }

  /**
   * 사용자의 모든 배지 조회 (진행률 포함)
   */
  async getUserBadges(userId: string): Promise<BadgeResponse> {
    // 1. 사용자 존재 확인
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // 2. 모든 활성 배지 조회
    const allBadges = await this.prismaService.badge.findMany({
      where: { isActive: true },
      orderBy: [
        { tier: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    // 3. 사용자가 획득한 배지 조회
    const userBadges = await this.prismaService.userBadge.findMany({
      where: { userId },
      include: { badge: true },
    });

    const earnedBadgeIds = new Set(userBadges.map(ub => ub.badgeId));

    // 4. 사용자 통계 조회 (진행률 계산용)
    const userStats = await this.getUserStats(userId);

    // 5. 배지별 진행률 계산
    const badgesWithProgress: BadgeWithProgress[] = allBadges.map(badge => {
      const userBadge = userBadges.find(ub => ub.badgeId === badge.id);
      const isEarned = earnedBadgeIds.has(badge.id);

      const progress = isEarned ?
        { current: 1, required: 1, percentage: 100 } :
        this.calculateBadgeProgress(badge, userStats);

      return {
        ...badge,
        isEarned,
        earnedAt: userBadge?.earnedAt?.toISOString(),
        progress,
      };
    });

    // 6. 다음 획득 가능한 배지 찾기
    const unearnedBadges = badgesWithProgress
      .filter(b => !b.isEarned)
      .sort((a, b) => (b.progress?.percentage || 0) - (a.progress?.percentage || 0));

    const nextMilestone = unearnedBadges[0];

    return {
      success: true,
      data: {
        badges: badgesWithProgress,
        totalBadges: allBadges.length,
        earnedBadges: userBadges.length,
        nextMilestone,
      },
    };
  }

  /**
   * 사용자의 배지 획득 자격 확인 및 자동 수여
   */
  async checkAndAwardBadges(userId: string): Promise<{ newBadges: Badge[]; totalBadges: number }> {
    // 1. 사용자 통계 조회
    const userStats = await this.getUserStats(userId);

    // 2. 활성 배지 중 미획득 배지들 조회
    const unearned = await this.prismaService.badge.findMany({
      where: {
        isActive: true,
        NOT: {
          userBadges: {
            some: { userId },
          },
        },
      },
    });

    const newBadges: Badge[] = [];

    // 3. 각 배지별 획득 조건 확인
    for (const badge of unearned) {
      if (this.checkBadgeCondition(badge, userStats)) {
        try {
          // 배지 수여
          await this.prismaService.userBadge.create({
            data: {
              userId,
              badgeId: badge.id,
            },
          });

          newBadges.push(badge);

          // 알림 생성 (Phase 5에서 구현)
          // await this.notificationService.createBadgeNotification(userId, badge);
        } catch (error) {
          console.error(`Failed to award badge ${badge.name} to user ${userId}:`, error);
        }
      }
    }

    // 4. 총 배지 수 계산
    const totalBadges = await this.prismaService.userBadge.count({
      where: { userId },
    });

    return { newBadges, totalBadges };
  }

  /**
   * 특정 배지 상세 정보 조회
   */
  async getBadgeDetails(badgeId: string, userId?: string): Promise<any> {
    const badge = await this.prismaService.badge.findUnique({
      where: { id: badgeId },
      include: {
        _count: {
          select: {
            userBadges: true,
          },
        },
      },
    });

    if (!badge) {
      throw new NotFoundException('배지를 찾을 수 없습니다.');
    }

    let userBadge: UserBadge | null = null;
    if (userId) {
      userBadge = await this.prismaService.userBadge.findUnique({
        where: {
          userId_badgeId: {
            userId,
            badgeId,
          },
        },
      });
    }

    return {
      success: true,
      data: {
        badge: {
          ...badge,
          holdersCount: badge._count.userBadges,
          isEarned: !!userBadge,
          earnedAt: userBadge?.earnedAt?.toISOString(),
        },
      },
    };
  }

  /**
   * 배지 리더보드 조회
   */
  async getBadgeLeaderboard(badgeId: string, limit = 50): Promise<any> {
    const badge = await this.prismaService.badge.findUnique({
      where: { id: badgeId },
    });

    if (!badge) {
      throw new NotFoundException('배지를 찾을 수 없습니다.');
    }

    const holders = await this.prismaService.userBadge.findMany({
      where: { badgeId },
      include: {
        user: {
          select: {
            id: true,
            userid: true,
            nickname: true,
            profileImage: true,
            isVerified: true,
          },
        },
      },
      orderBy: { earnedAt: 'asc' },
      take: limit,
    });

    return {
      success: true,
      data: {
        badge,
        holders: holders.map((holder, index) => ({
          rank: index + 1,
          user: holder.user,
          earnedAt: holder.earnedAt.toISOString(),
        })),
        totalHolders: holders.length,
      },
    };
  }

  /**
   * 정기적으로 모든 사용자의 배지 획득 자격 확인 (매일 자정)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkAllUsersBadges(): Promise<void> {
    console.log('Starting daily badge check for all users...');

    try {
      // 활성 사용자들만 체크 (최근 30일 내 활동)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const activeUsers = await this.prismaService.user.findMany({
        where: {
          OR: [
            { reviews: { some: { createdAt: { gte: thirtyDaysAgo } } } },
            { likes: { some: { createdAt: { gte: thirtyDaysAgo } } } },
            { comments: { some: { createdAt: { gte: thirtyDaysAgo } } } },
          ],
        },
        select: { id: true },
      });

      let totalNewBadges = 0;

      for (const user of activeUsers) {
        try {
          const { newBadges } = await this.checkAndAwardBadges(user.id);
          totalNewBadges += newBadges.length;
        } catch (error) {
          console.error(`Failed to check badges for user ${user.id}:`, error);
        }
      }

      console.log(`Daily badge check completed. ${totalNewBadges} new badges awarded to ${activeUsers.length} users.`);
    } catch (error) {
      console.error('Failed to complete daily badge check:', error);
    }
  }

  /**
   * 사용자 통계 조회 (배지 조건 계산용)
   */
  private async getUserStats(userId: string) {
    const [
      reviewCount,
      likesReceived,
      followerCount,
      followingCount,
      streakDays,
      booksRead,
      joinDate,
    ] = await Promise.all([
      this.prismaService.review.count({
        where: { userId, isPublic: true },
      }),
      this.prismaService.like.count({
        where: {
          review: {
            userId,
            isPublic: true,
          },
        },
      }),
      this.prismaService.follow.count({ where: { followingId: userId } }),
      this.prismaService.follow.count({ where: { followerId: userId } }),
      this.calculateStreakDays(userId),
      this.prismaService.book.count({
        where: {
          reviews: {
            some: {
              userId,
              isPublic: true,
            },
          },
        },
      }),
      this.prismaService.user.findUnique({
        where: { id: userId },
        select: { createdAt: true },
      }),
    ]);

    return {
      reviewCount,
      likesReceived,
      followerCount,
      followingCount,
      streakDays,
      booksRead,
      accountAge: Math.floor((Date.now() - joinDate!.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
    };
  }

  /**
   * 연속 독후감 작성 일수 계산
   */
  private async calculateStreakDays(userId: string): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const reviews = await this.prismaService.review.findMany({
      where: {
        userId,
        isPublic: true,
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    if (reviews.length === 0) return 0;

    const reviewDates = new Set(
      reviews.map(
        (review) => new Date(review.createdAt).toISOString().split('T')[0],
      ),
    );

    let streakDays = 0;
    const today = new Date();

    for (let i = 0; i <= 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];

      if (reviewDates.has(dateStr)) {
        streakDays++;
      } else if (streakDays > 0) {
        break;
      }
    }

    return streakDays;
  }

  /**
   * 배지 획득 조건 확인
   */
  private checkBadgeCondition(badge: Badge, userStats: any): boolean {
    const condition = badge.condition as unknown as BadgeCondition;

    switch (condition.type) {
      case 'review_count':
        return this.checkThreshold(userStats.reviewCount, condition);
      case 'likes_received':
        return this.checkThreshold(userStats.likesReceived, condition);
      case 'streak_days':
        return this.checkThreshold(userStats.streakDays, condition);
      case 'books_read':
        return this.checkThreshold(userStats.booksRead, condition);
      case 'followers_count':
        return this.checkThreshold(userStats.followerCount, condition);
      case 'early_bird':
        return userStats.accountAge <= (condition.threshold || 7);
      case 'social_butterfly':
        return userStats.followerCount >= 10 && userStats.followingCount >= 10;
      case 'consistent_reader':
        return userStats.streakDays >= 7 && userStats.reviewCount >= 10;
      default:
        return false;
    }
  }

  /**
   * 임계값 조건 확인
   */
  private checkThreshold(value: number, condition: BadgeCondition): boolean {
    const threshold = condition.threshold || 0;
    const operator = condition.operator || 'gte';

    switch (operator) {
      case 'gte':
        return value >= threshold;
      case 'eq':
        return value === threshold;
      case 'lte':
        return value <= threshold;
      default:
        return false;
    }
  }

  /**
   * 배지 진행률 계산
   */
  private calculateBadgeProgress(badge: Badge, userStats: any): { current: number; required: number; percentage: number } {
    const condition = badge.condition as unknown as BadgeCondition;
    let current = 0;
    let required = condition.threshold || 1;

    switch (condition.type) {
      case 'review_count':
        current = userStats.reviewCount;
        break;
      case 'likes_received':
        current = userStats.likesReceived;
        break;
      case 'streak_days':
        current = userStats.streakDays;
        break;
      case 'books_read':
        current = userStats.booksRead;
        break;
      case 'followers_count':
        current = userStats.followerCount;
        break;
      case 'early_bird':
        current = Math.max(0, (condition.threshold || 7) - userStats.accountAge);
        required = condition.threshold || 7;
        break;
      case 'social_butterfly':
        current = Math.min(userStats.followerCount, 10) + Math.min(userStats.followingCount, 10);
        required = 20;
        break;
      case 'consistent_reader':
        current = Math.min(userStats.streakDays, 7) + Math.min(userStats.reviewCount, 10);
        required = 17;
        break;
    }

    const percentage = Math.min(100, Math.floor((current / required) * 100));

    return { current, required, percentage };
  }

  /**
   * 공개 배지 목록 조회 (로그인하지 않은 사용자용)
   */
  async getPublicBadges(): Promise<any> {
    const badges = await this.prismaService.badge.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        icon: true,
        tier: true,
        _count: {
          select: {
            userBadges: true,
          },
        },
      },
      orderBy: [
        { tier: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    return {
      success: true,
      data: {
        badges: badges.map(badge => ({
          ...badge,
          holdersCount: badge._count.userBadges,
        })),
        totalBadges: badges.length,
      },
    };
  }

  /**
   * 사용자가 획득한 배지만 조회 (타인의 프로필용)
   */
  async getUserEarnedBadges(userId: string): Promise<any> {
    const userBadges = await this.prismaService.userBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' },
    });

    const totalBadges = await this.prismaService.badge.count({
      where: { isActive: true },
    });

    return {
      success: true,
      data: {
        badges: userBadges.map(ub => ({
          ...ub.badge,
          isEarned: true,
          earnedAt: ub.earnedAt.toISOString(),
        })),
        stats: {
          totalBadges,
          earnedBadges: userBadges.length,
          completionRate: totalBadges > 0 ? (userBadges.length / totalBadges) * 100 : 0,
          tierCounts: userBadges.reduce((acc, ub) => {
            acc[ub.badge.tier] = (acc[ub.badge.tier] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
        },
      },
    };
  }

  /**
   * 사용자 배지 통계 조회
   */
  async getUserBadgeStats(userId: string): Promise<any> {
    const [totalBadges, earnedBadges, tierStats] = await Promise.all([
      this.prismaService.badge.count({ where: { isActive: true } }),
      this.prismaService.userBadge.count({ where: { userId } }),
      this.prismaService.userBadge.groupBy({
        by: ['badgeId'],
        where: { userId },
        _count: true,
      }),
    ]);

    // 티어별 통계 계산
    const badges = await this.prismaService.userBadge.findMany({
      where: { userId },
      include: { badge: { select: { tier: true } } },
    });

    const tierCounts = badges.reduce((acc, ub) => {
      acc[ub.badge.tier] = (acc[ub.badge.tier] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      success: true,
      data: {
        totalBadges,
        earnedBadges,
        completionRate: Math.round((earnedBadges / totalBadges) * 100),
        tierBreakdown: tierCounts,
      },
    };
  }

  /**
   * 인기 배지 목록 조회 (많은 사용자가 획득한 순)
   */
  async getPopularBadges(limit: number): Promise<any> {
    const badges = await this.prismaService.badge.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            userBadges: true,
          },
        },
      },
      orderBy: {
        userBadges: {
          _count: 'desc',
        },
      },
      take: limit,
    });

    return {
      success: true,
      data: {
        badges: badges.map(badge => ({
          ...badge,
          holdersCount: badge._count.userBadges,
        })),
      },
    };
  }

  /**
   * 최근 획득된 배지 목록 조회
   */
  async getRecentBadges(limit: number): Promise<any> {
    const recentAwards = await this.prismaService.userBadge.findMany({
      include: {
        badge: true,
        user: {
          select: {
            id: true,
            userid: true,
            nickname: true,
            profileImage: true,
            isVerified: true,
          },
        },
      },
      orderBy: { earnedAt: 'desc' },
      take: limit,
    });

    return {
      success: true,
      data: {
        awards: recentAwards.map(award => ({
          id: award.id,
          earnedAt: award.earnedAt.toISOString(),
          user: award.user,
          badge: award.badge,
        })),
      },
    };
  }

  /**
   * 기본 배지 정의
   */
  private getDefaultBadges(): Omit<Badge, 'id' | 'createdAt'>[] {
    return [
      // 독후감 작성 배지
      {
        name: '첫 발자국',
        description: '첫 번째 독후감을 작성했습니다',
        icon: '👶',
        tier: BadgeTier.BRONZE,
        condition: { type: 'review_count', threshold: 1, operator: 'gte' } as any,
        isActive: true,
      },
      {
        name: '열정적인 독서가',
        description: '10개의 독후감을 작성했습니다',
        icon: '📚',
        tier: BadgeTier.BRONZE,
        condition: { type: 'review_count', threshold: 10, operator: 'gte' } as any,
        isActive: true,
      },
      {
        name: '독후감 전문가',
        description: '50개의 독후감을 작성했습니다',
        icon: '✍️',
        tier: BadgeTier.SILVER,
        condition: { type: 'review_count', threshold: 50, operator: 'gte' } as any,
        isActive: true,
      },
      {
        name: '독후감 마스터',
        description: '100개의 독후감을 작성했습니다',
        icon: '🏆',
        tier: BadgeTier.GOLD,
        condition: { type: 'review_count', threshold: 100, operator: 'gte' } as any,
        isActive: true,
      },

      // 좋아요 받기 배지
      {
        name: '첫 공감',
        description: '첫 번째 좋아요를 받았습니다',
        icon: '❤️',
        tier: BadgeTier.BRONZE,
        condition: { type: 'likes_received', threshold: 1, operator: 'gte' } as any,
        isActive: true,
      },
      {
        name: '인기 작가',
        description: '100개의 좋아요를 받았습니다',
        icon: '⭐',
        tier: BadgeTier.SILVER,
        condition: { type: 'likes_received', threshold: 100, operator: 'gte' } as any,
        isActive: true,
      },
      {
        name: '베스트셀러 작가',
        description: '500개의 좋아요를 받았습니다',
        icon: '🌟',
        tier: BadgeTier.GOLD,
        condition: { type: 'likes_received', threshold: 500, operator: 'gte' } as any,
        isActive: true,
      },

      // 연속 활동 배지
      {
        name: '꾸준한 독서가',
        description: '7일 연속 독후감을 작성했습니다',
        icon: '🔥',
        tier: BadgeTier.SILVER,
        condition: { type: 'streak_days', threshold: 7, operator: 'gte' } as any,
        isActive: true,
      },
      {
        name: '독서 마라토너',
        description: '30일 연속 독후감을 작성했습니다',
        icon: '🏃',
        tier: BadgeTier.GOLD,
        condition: { type: 'streak_days', threshold: 30, operator: 'gte' } as any,
        isActive: true,
      },

      // 도서 수 배지
      {
        name: '책벌레',
        description: '50권의 책을 읽었습니다',
        icon: '🐛',
        tier: BadgeTier.SILVER,
        condition: { type: 'books_read', threshold: 50, operator: 'gte' } as any,
        isActive: true,
      },
      {
        name: '도서관장',
        description: '200권의 책을 읽었습니다',
        icon: '📖',
        tier: BadgeTier.GOLD,
        condition: { type: 'books_read', threshold: 200, operator: 'gte' } as any,
        isActive: true,
      },

      // 팔로워 배지
      {
        name: '인플루언서',
        description: '100명의 팔로워를 보유했습니다',
        icon: '👥',
        tier: BadgeTier.GOLD,
        condition: { type: 'followers_count', threshold: 100, operator: 'gte' } as any,
        isActive: true,
      },

      // 특별 배지
      {
        name: '얼리버드',
        description: '서비스 초기 가입자입니다',
        icon: '🐦',
        tier: BadgeTier.PLATINUM,
        condition: { type: 'early_bird', threshold: 7, operator: 'lte' } as any,
        isActive: true,
      },
      {
        name: '소셜 나비',
        description: '활발한 소셜 활동을 하고 있습니다',
        icon: '🦋',
        tier: BadgeTier.SILVER,
        condition: { type: 'social_butterfly' } as any,
        isActive: true,
      },
      {
        name: '꾸준한 독서왕',
        description: '지속적이고 활발한 독서 활동을 하고 있습니다',
        icon: '👑',
        tier: BadgeTier.DIAMOND,
        condition: { type: 'consistent_reader' } as any,
        isActive: true,
      },
    ];
  }
}
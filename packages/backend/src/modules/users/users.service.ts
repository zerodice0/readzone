import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GetUserProfileDto } from './dto/get-user-profile.dto';
import {
  UserProfileResponse,
  UserStats,
  UserRelationship,
  RecentActivity,
  SocialLinks,
} from './dto/user-profile.dto';
import {
  UserReviewsQueryDto,
  UserLikesQueryDto,
  UserBooksQueryDto,
  UserFollowsQueryDto,
  UserReviewsResponse,
  UserLikesResponse,
  UserBooksResponse,
  UserFollowsResponse,
  UserReviewSummary,
  UserLikeSummary,
  UserBookSummary,
  UserFollowSummary,
} from './dto/user-content.dto';
import { FollowUserResponse } from './dto/follow.dto';
import {
  PrivacySettingsDto,
  UpdateProfileDto,
  UpdateProfileResponse,
  UseridCheckResponse,
} from './dto/update-profile.dto';
import { InternalServerErrorException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async getUserProfile(
    dto: GetUserProfileDto,
    currentUserId?: string,
  ): Promise<{ success: boolean; data: UserProfileResponse }> {
    try {
      // 사용자 기본 정보 조회
      const user = await this.prismaService.user.findUnique({
        where: { userid: dto.userid },
        select: {
          id: true,
          userid: true,
          nickname: true,
          email: true,
          profileImage: true,
          bio: true,
          isVerified: true,
          privacy: true,
          socialLinks: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              reviews: true,
              likes: true,
              followers: true,
              following: true,
            },
          },
        },
      });

      if (!user) {
        throw new NotFoundException('사용자를 찾을 수 없습니다');
      }

      // privacy 설정 파싱
      let privacySettings: PrivacySettingsDto;
      try {
        privacySettings = user.privacy
          ? (JSON.parse(user.privacy as string) as PrivacySettingsDto)
          : {};
      } catch {
        privacySettings = {};
      }

      // 프로필 접근 권한 확인
      if (currentUserId !== user.id) {
        if (privacySettings.activityVisible === 'none') {
          throw new ForbiddenException('비공개 계정입니다');
        }

        if (privacySettings.activityVisible === 'followers') {
          const isFollowing = currentUserId
            ? await this.prismaService.follow.findFirst({
                where: {
                  followerId: currentUserId,
                  followingId: user.id,
                },
              })
            : null;

          if (!isFollowing) {
            throw new ForbiddenException('팔로워만 볼 수 있는 계정입니다');
          }
        }
      }

      // 사용자가 리뷰를 작성한 고유 도서 수 계산
      const booksWithReviews = await this.prismaService.review.findMany({
        where: { userId: user.id },
        select: { bookId: true },
        distinct: ['bookId'],
      });

      // 통계 정보
      const stats: UserStats = {
        reviewCount: user._count.reviews,
        likesReceived: user._count.likes,
        followerCount: user._count.followers,
        followingCount: user._count.following,
        booksRead: booksWithReviews.length, // 실제 읽은 책 수 (리뷰를 작성한 고유 도서 수)
      };

      // 관계 정보 (로그인한 사용자가 있는 경우)
      let relationship: UserRelationship | undefined;
      if (currentUserId && currentUserId !== user.id) {
        const [isFollowing, isFollowed] = await Promise.all([
          this.prismaService.follow.findFirst({
            where: {
              followerId: currentUserId,
              followingId: user.id,
            },
          }),
          this.prismaService.follow.findFirst({
            where: {
              followerId: user.id,
              followingId: currentUserId,
            },
          }),
        ]);

        relationship = {
          isFollowing: !!isFollowing,
          isFollowedBy: !!isFollowed,
          isMutualFollow: !!isFollowing && !!isFollowed,
        };
      }

      // 최근 활동 (공개 계정이거나 팔로우 중인 경우)
      let recentActivity: RecentActivity | undefined;
      if (
        privacySettings.activityVisible === 'all' ||
        currentUserId === user.id ||
        (privacySettings.activityVisible === 'followers' &&
          relationship?.isFollowing)
      ) {
        const latestReview = await this.prismaService.review.findFirst({
          where: {
            userId: user.id,
            isPublic: true,
          },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        });

        recentActivity = {
          lastReviewAt: latestReview?.createdAt.toISOString(),
          lastActiveAt: user.updatedAt.toISOString(),
          streakDays: 0, // TODO: 실제 연속 활동일 계산 로직 필요
        };
      }

      // 소셜 링크 파싱
      let socialLinks: SocialLinks | undefined;
      if (user.socialLinks) {
        try {
          socialLinks = JSON.parse(user.socialLinks as string) as SocialLinks;
        } catch {
          socialLinks = undefined;
        }
      }

      return {
        success: true,
        data: {
          user: {
            id: user.id,
            userid: user.userid,
            nickname: user.nickname,
            bio: user.bio || undefined,
            profileImage: user.profileImage || undefined,
            socialLinks,
            joinedAt: user.createdAt.toISOString(),
            stats,
            recentActivity: recentActivity || {
              lastActiveAt: user.updatedAt.toISOString(),
              streakDays: 0,
            },
            isVerified: user.isVerified,
          },
          relationship,
          isOwner: currentUserId === user.id,
        },
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        '프로필 조회 중 오류가 발생했습니다',
      );
    }
  }

  async getUserReviews(
    userid: string,
    query: UserReviewsQueryDto,
    currentUserId?: string,
  ): Promise<{ success: boolean; data: UserReviewsResponse }> {
    try {
      // 사용자 존재 확인
      const user = await this.prismaService.user.findUnique({
        where: { userid },
        select: {
          id: true,
          privacy: true,
        },
      });

      if (!user) {
        throw new NotFoundException('사용자를 찾을 수 없습니다');
      }

      // privacy 설정 파싱
      let privacySettings: PrivacySettingsDto;
      try {
        privacySettings = user.privacy
          ? (JSON.parse(user.privacy as string) as PrivacySettingsDto)
          : {};
      } catch {
        privacySettings = {};
      }

      // 비공개 계정 접근 권한 확인
      if (currentUserId !== user.id) {
        if (privacySettings.activityVisible === 'none') {
          throw new ForbiddenException('비공개 계정의 독후감을 볼 수 없습니다');
        }

        if (privacySettings.activityVisible === 'followers') {
          const isFollowing = currentUserId
            ? await this.prismaService.follow.findFirst({
                where: {
                  followerId: currentUserId,
                  followingId: user.id,
                },
              })
            : null;

          if (!isFollowing) {
            throw new ForbiddenException('팔로워만 볼 수 있는 독후감입니다');
          }
        }
      }

      // 쿼리 조건 구성
      const whereCondition: Prisma.ReviewWhereInput = {
        userId: user.id,
      };

      // 본인이 아닌 경우 공개 독후감만 조회
      if (currentUserId !== user.id) {
        whereCondition.isPublic = true;
      }

      if (query.cursor) {
        whereCondition.createdAt = { lt: new Date(query.cursor) };
      }

      // 독후감 조회
      const reviews = await this.prismaService.review.findMany({
        where: whereCondition,
        include: {
          book: {
            select: {
              id: true,
              title: true,
              author: true,
              thumbnail: true,
            },
          },
          user: {
            select: {
              id: true,
              userid: true,
              nickname: true,
              profileImage: true,
              isVerified: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: (query.limit || 10) + 1,
      });

      const hasMore = reviews.length > (query.limit || 10);
      if (hasMore) {
        reviews.pop();
      }

      const nextCursor = hasMore
        ? reviews[reviews.length - 1]?.createdAt.toISOString()
        : undefined;

      // 좋아요 상태 확인 (로그인한 사용자가 있는 경우)
      // const reviewIds = reviews.map((review) => review.id);
      // const likedReviews = currentUserId
      //   ? await this.prismaService.like.findMany({
      //       where: {
      //         userId: currentUserId,
      //         reviewId: { in: reviewIds },
      //       },
      //       select: { reviewId: true },
      //     })
      //   : [];

      // const likedReviewIds = new Set(likedReviews.map((like) => like.reviewId));

      const reviewSummaries: UserReviewSummary[] = reviews.map((review) => ({
        id: review.id,
        title: review.title,
        content: review.content,
        rating: review.rating,
        tags: review.tags,
        createdAt: review.createdAt.toISOString(),
        isPublic: review.isPublic,
        book: {
          id: review.book?.id || '',
          title: review.book?.title || '',
          author: review.book?.author || '',
          thumbnail: review.book?.thumbnail || null,
        },
        stats: {
          likes: review._count.likes,
          comments: review._count.comments,
          shares: 0,
        },
      }));

      return {
        success: true,
        data: {
          reviews: reviewSummaries,
          pagination: {
            nextCursor,
            hasMore,
            total: await this.prismaService.review.count({
              where: whereCondition,
            }),
          },
        },
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        '독후감 목록 조회 중 오류가 발생했습니다',
      );
    }
  }

  async getUserLikes(
    userid: string,
    query: UserLikesQueryDto,
    currentUserId?: string,
  ): Promise<{ success: boolean; data: UserLikesResponse }> {
    try {
      // 사용자 존재 확인
      const user = await this.prismaService.user.findUnique({
        where: { userid },
        select: {
          id: true,
          privacy: true,
        },
      });

      if (!user) {
        throw new NotFoundException('사용자를 찾을 수 없습니다');
      }

      // privacy 설정 파싱
      let privacySettings: PrivacySettingsDto;
      try {
        privacySettings = user.privacy
          ? (JSON.parse(user.privacy as string) as PrivacySettingsDto)
          : {};
      } catch {
        privacySettings = {};
      }

      // 비공개 계정 접근 권한 확인
      if (currentUserId !== user.id) {
        if (privacySettings.likesVisible === 'none') {
          throw new ForbiddenException(
            '비공개 계정의 좋아요 목록을 볼 수 없습니다',
          );
        }

        if (privacySettings.likesVisible === 'followers') {
          const isFollowing = currentUserId
            ? await this.prismaService.follow.findFirst({
                where: {
                  followerId: currentUserId,
                  followingId: user.id,
                },
              })
            : null;

          if (!isFollowing) {
            throw new ForbiddenException(
              '팔로워만 볼 수 있는 좋아요 목록입니다',
            );
          }
        }
      }

      // 쿼리 조건 구성
      const whereCondition: Prisma.LikeWhereInput = {
        userId: user.id,
      };

      if (query.cursor) {
        whereCondition.createdAt = { lt: new Date(query.cursor) };
      }

      // 좋아요 목록 조회
      const likes = await this.prismaService.like.findMany({
        where: whereCondition,
        include: {
          review: {
            include: {
              book: {
                select: {
                  id: true,
                  title: true,
                  author: true,
                  thumbnail: true,
                },
              },
              user: {
                select: {
                  id: true,
                  userid: true,
                  nickname: true,
                  profileImage: true,
                  isVerified: true,
                },
              },
              _count: {
                select: {
                  likes: true,
                  comments: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: (query.limit || 20) + 1,
      });

      const hasMore = likes.length > (query.limit || 20);
      if (hasMore) {
        likes.pop();
      }

      const nextCursor = hasMore
        ? likes[likes.length - 1]?.createdAt.toISOString()
        : undefined;

      // 현재 사용자의 좋아요 상태 확인
      // const reviewIds = likes.map((like) => like.reviewId);
      // const currentUserLikes = currentUserId
      //   ? await this.prismaService.like.findMany({
      //       where: {
      //         userId: currentUserId,
      //         reviewId: { in: reviewIds },
      //       },
      //       select: { reviewId: true },
      //     })
      //   : [];

      // const currentUserLikedIds = new Set(
      //   currentUserLikes.map((like) => like.reviewId),
      // );

      const likeSummaries: UserLikeSummary[] = likes.map((like) => ({
        id: like.id,
        likedAt: like.createdAt.toISOString(),
        review: {
          id: like.review.id,
          title: like.review.title,
          content: like.review.content,
          rating: like.review.rating,
          tags: like.review.tags,
          createdAt: like.review.createdAt.toISOString(),
          isPublic: like.review.isPublic,
          book: {
            id: like.review.book?.id || '',
            title: like.review.book?.title || '',
            author: like.review.book?.author || '',
            thumbnail: like.review.book?.thumbnail || null,
          },
          stats: {
            likes: like.review._count.likes,
            comments: like.review._count.comments,
            shares: 0,
          },
        },
      }));

      return {
        success: true,
        data: {
          reviews: likeSummaries,
          pagination: {
            nextCursor,
            hasMore,
            total: await this.prismaService.like.count({
              where: whereCondition,
            }),
          },
        },
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        '좋아요 목록 조회 중 오류가 발생했습니다',
      );
    }
  }

  async getUserBooks(
    userid: string,
    query: UserBooksQueryDto,
    currentUserId?: string,
  ): Promise<{ success: boolean; data: UserBooksResponse }> {
    try {
      // 사용자 존재 확인
      const user = await this.prismaService.user.findUnique({
        where: { userid },
        select: {
          id: true,
          privacy: true,
        },
      });

      if (!user) {
        throw new NotFoundException('사용자를 찾을 수 없습니다');
      }

      // privacy 설정 파싱
      let privacySettings: PrivacySettingsDto;
      try {
        privacySettings = user.privacy
          ? (JSON.parse(user.privacy as string) as PrivacySettingsDto)
          : {};
      } catch {
        privacySettings = {};
      }

      // 비공개 계정 접근 권한 확인
      if (currentUserId !== user.id) {
        if (privacySettings.activityVisible === 'none') {
          throw new ForbiddenException(
            '비공개 계정의 도서 목록을 볼 수 없습니다',
          );
        }

        if (privacySettings.activityVisible === 'followers') {
          const isFollowing = currentUserId
            ? await this.prismaService.follow.findFirst({
                where: {
                  followerId: currentUserId,
                  followingId: user.id,
                },
              })
            : null;

          if (!isFollowing) {
            throw new ForbiddenException('팔로워만 볼 수 있는 도서 목록입니다');
          }
        }
      }

      // 독후감을 통해 읽은 책 목록 조회
      const whereCondition: Prisma.ReviewWhereInput = {
        userId: user.id,
      };

      // 본인이 아닌 경우 공개 독후감만 조회
      if (currentUserId !== user.id) {
        whereCondition.isPublic = true;
      }

      if (query.cursor) {
        whereCondition.id = { lt: query.cursor };
      }

      const reviews = await this.prismaService.review.findMany({
        where: whereCondition,
        include: {
          book: {
            select: {
              id: true,
              title: true,
              author: true,
              publisher: true,
              publishedAt: true,
              thumbnail: true,
              isbn: true,
              description: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: (query.limit || 20) + 1,
      });

      const hasMore = reviews.length > (query.limit || 10);
      if (hasMore) {
        reviews.pop();
      }

      const nextCursor = hasMore ? reviews[reviews.length - 1]?.id : undefined;

      // 중복 제거를 위해 Map 사용
      const booksMap = new Map();
      const bookSummaries: UserBookSummary[] = [];

      for (const review of reviews) {
        if (review.book && !booksMap.has(review.book.id)) {
          booksMap.set(review.book.id, true);

          // 해당 도서에 대한 사용자의 모든 독후감 수 조회
          // const reviewCount = await this.prismaService.review.count({
          //   where: {
          //     userId: user.id,
          //     bookId: review.book.id,
          //     ...(currentUserId !== user.id ? { isPublic: true } : {}),
          //   },
          // });

          // 최근 독후감 날짜
          const latestReview = await this.prismaService.review.findFirst({
            where: {
              userId: user.id,
              bookId: review.book.id,
              ...(currentUserId !== user.id ? { isPublic: true } : {}),
            },
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true },
          });

          bookSummaries.push({
            id: review.book.id,
            status: 'read', // 독후감이 있으면 읽은 상태
            rating: review.rating,
            readAt:
              latestReview?.createdAt.toISOString() ||
              review.createdAt.toISOString(),
            addedAt: review.createdAt.toISOString(),
            book: {
              id: review.book.id,
              title: review.book.title,
              author: review.book.author,
              thumbnail: review.book.thumbnail,
              publishedAt: review.book.publishedAt,
            },
            reviewId: review.id,
          });
        }
      }

      const totalBooks = bookSummaries.length;

      return {
        success: true,
        data: {
          books: bookSummaries,
          pagination: {
            nextCursor,
            hasMore,
            total: await this.prismaService.review
              .groupBy({
                by: ['bookId'],
                where: whereCondition,
              })
              .then((result) => result.length),
          },
          summary: {
            totalBooks,
            readBooks: totalBooks, // 독후감이 있는 책들은 모두 read 상태
            readingBooks: 0,
            wantToReadBooks: 0,
          },
        },
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        '도서 목록 조회 중 오류가 발생했습니다',
      );
    }
  }

  async getUserFollows(
    userid: string,
    query: UserFollowsQueryDto,
    currentUserId?: string,
  ): Promise<{ success: boolean; data: UserFollowsResponse }> {
    try {
      // 사용자 존재 확인
      const user = await this.prismaService.user.findUnique({
        where: { userid },
        select: {
          id: true,
          privacy: true,
        },
      });

      if (!user) {
        throw new NotFoundException('사용자를 찾을 수 없습니다');
      }

      // privacy 설정 파싱
      let privacySettings: PrivacySettingsDto;
      try {
        privacySettings = user.privacy
          ? (JSON.parse(user.privacy as string) as PrivacySettingsDto)
          : {};
      } catch {
        privacySettings = {};
      }

      // 비공개 계정 접근 권한 확인
      if (currentUserId !== user.id) {
        if (privacySettings.followersVisible === false) {
          throw new ForbiddenException(
            '비공개 계정의 팔로우 목록을 볼 수 없습니다',
          );
        }

        if (privacySettings.activityVisible === 'followers') {
          const isFollowing = currentUserId
            ? await this.prismaService.follow.findFirst({
                where: {
                  followerId: currentUserId,
                  followingId: user.id,
                },
              })
            : null;

          if (!isFollowing) {
            throw new ForbiddenException(
              '팔로워만 볼 수 있는 팔로우 목록입니다',
            );
          }
        }
      }

      // 쿼리 조건 구성
      const whereCondition: Prisma.FollowWhereInput = {};
      const userSelect = {
        id: true,
        userid: true,
        nickname: true,
        profileImage: true,
        isVerified: true,
      };

      // 팔로워 또는 팔로잉에 따라 다른 쿼리 구성
      if (query.cursor) {
        whereCondition.id = { lt: query.cursor };
      }

      type FollowWithRelations = Prisma.FollowGetPayload<{
        include: {
          follower: {
            select: {
              id: true;
              userid: true;
              nickname: true;
              profileImage: true;
              isVerified: true;
            };
          };
          following: {
            select: {
              id: true;
              userid: true;
              nickname: true;
              profileImage: true;
              isVerified: true;
            };
          };
        };
      }>;

      let follows: FollowWithRelations[];

      if (query.type === 'followers') {
        whereCondition.followingId = user.id;
        follows = await this.prismaService.follow.findMany({
          where: whereCondition,
          include: {
            follower: {
              select: userSelect,
            },
            following: {
              select: userSelect,
            },
          },
          orderBy: { createdAt: 'desc' },
          take: query.limit! + 1,
        });
      } else {
        whereCondition.followerId = user.id;
        follows = await this.prismaService.follow.findMany({
          where: whereCondition,
          include: {
            follower: {
              select: userSelect,
            },
            following: {
              select: userSelect,
            },
          },
          orderBy: { createdAt: 'desc' },
          take: query.limit! + 1,
        });
      }

      const hasMore = follows.length > query.limit!;
      if (hasMore) {
        follows.pop();
      }

      const nextCursor = hasMore ? follows[follows.length - 1]?.id : undefined;

      const followSummaries: UserFollowSummary[] = follows.map((follow) => {
        const targetUser =
          query.type === 'followers' ? follow.follower : follow.following;
        return {
          id: follow.id,
          followedAt: follow.createdAt.toISOString(),
          user: {
            id: targetUser.id,
            userid: targetUser.userid,
            nickname: targetUser.nickname,
            profileImage: targetUser.profileImage,
            isVerified: targetUser.isVerified,
          },
        };
      });

      return {
        success: true,
        data: {
          users: followSummaries,
          pagination: {
            nextCursor,
            hasMore,
            total: await this.prismaService.follow.count({
              where:
                query.type === 'followers'
                  ? { followingId: user.id }
                  : { followerId: user.id },
            }),
          },
        },
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        '팔로우 목록 조회 중 오류가 발생했습니다',
      );
    }
  }

  async toggleFollow(
    followerId: string,
    followingId: string,
    action: 'follow' | 'unfollow',
  ): Promise<FollowUserResponse> {
    if (action === 'follow') {
      return this.followUser(followerId, followingId);
    } else {
      return this.unfollowUser(followerId, followingId);
    }
  }

  async followUser(
    followerId: string,
    followingId: string,
  ): Promise<FollowUserResponse> {
    try {
      // 자기 자신을 팔로우하는 경우
      if (followerId === followingId) {
        throw new BadRequestException('자기 자신을 팔로우할 수 없습니다');
      }

      // 팔로우할 사용자 존재 확인
      const targetUser = await this.prismaService.user.findUnique({
        where: { id: followingId },
        select: { id: true, userid: true, nickname: true },
      });

      if (!targetUser) {
        throw new NotFoundException('팔로우할 사용자를 찾을 수 없습니다');
      }

      // 이미 팔로우 중인지 확인
      const existingFollow = await this.prismaService.follow.findFirst({
        where: {
          followerId,
          followingId,
        },
      });

      if (existingFollow) {
        throw new ConflictException('이미 팔로우 중인 사용자입니다');
      }

      // 팔로우 관계 생성
      await this.prismaService.follow.create({
        data: {
          followerId,
          followingId,
        },
      });

      // 팔로우 후 관계 정보 조회
      const followerCount = await this.prismaService.follow.count({
        where: { followingId },
      });

      return {
        success: true,
        relationship: {
          isFollowing: true,
          isFollowedBy: false, // 새로 팔로우한 경우이므로 상대방이 나를 팔로우하는지는 별도 확인 필요
          isMutualFollow: false,
        },
        followerCount,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        '팔로우 처리 중 오류가 발생했습니다',
      );
    }
  }

  async unfollowUser(
    followerId: string,
    followingId: string,
  ): Promise<FollowUserResponse> {
    try {
      // 자기 자신을 언팔로우하는 경우
      if (followerId === followingId) {
        throw new BadRequestException('잘못된 요청입니다');
      }

      // 언팔로우할 사용자 존재 확인
      const targetUser = await this.prismaService.user.findUnique({
        where: { id: followingId },
        select: { id: true, userid: true, nickname: true },
      });

      if (!targetUser) {
        throw new NotFoundException('사용자를 찾을 수 없습니다');
      }

      // 팔로우 관계 확인
      const existingFollow = await this.prismaService.follow.findFirst({
        where: {
          followerId,
          followingId,
        },
      });

      if (!existingFollow) {
        throw new NotFoundException('팔로우 관계가 존재하지 않습니다');
      }

      // 팔로우 관계 삭제
      await this.prismaService.follow.delete({
        where: { id: existingFollow.id },
      });

      // 언팔로우 후 관계 정보 조회
      const followerCount = await this.prismaService.follow.count({
        where: { followingId },
      });

      return {
        success: true,
        relationship: {
          isFollowing: false,
          isFollowedBy: false, // 언팔로우한 경우이므로 상대방이 나를 팔로우하는지는 별도 확인 필요
          isMutualFollow: false,
        },
        followerCount,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        '언팔로우 처리 중 오류가 발생했습니다',
      );
    }
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<UpdateProfileResponse> {
    try {
      // 현재 사용자 정보 조회
      const currentUser = await this.prismaService.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          userid: true,
          nickname: true,
          email: true,
          profileImage: true,
          bio: true,
          privacy: true,
          socialLinks: true,
        },
      });

      if (!currentUser) {
        throw new NotFoundException('사용자를 찾을 수 없습니다');
      }

      // userid 중복 확인 (변경하는 경우에만)
      if (dto.userid && dto.userid !== currentUser.userid) {
        const existingUser = await this.prismaService.user.findUnique({
          where: { userid: dto.userid },
        });

        if (existingUser) {
          throw new ConflictException('이미 사용 중인 사용자 ID입니다');
        }
      }

      // nickname 중복 확인 (변경하는 경우에만)
      if (dto.nickname && dto.nickname !== currentUser.nickname) {
        const existingUser = await this.prismaService.user.findFirst({
          where: { nickname: dto.nickname },
        });

        if (existingUser) {
          throw new ConflictException('이미 사용 중인 닉네임입니다');
        }
      }

      // 업데이트할 데이터 구성
      const updateData: Prisma.UserUpdateInput = {};

      if (dto.userid !== undefined) updateData.userid = dto.userid;
      if (dto.nickname !== undefined) updateData.nickname = dto.nickname;
      if (dto.bio !== undefined) updateData.bio = dto.bio;

      // 소셜 링크 처리
      updateData.socialLinks = dto.socialLinks
        ? (dto.socialLinks as Prisma.InputJsonValue)
        : Prisma.JsonNull;

      // 개인정보 설정 처리
      updateData.privacy = dto.privacy
        ? (dto.privacy as Prisma.InputJsonValue)
        : Prisma.JsonNull;

      // 프로필 업데이트
      const updatedUser = await this.prismaService.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          userid: true,
          nickname: true,
          email: true,
          profileImage: true,
          bio: true,
          isVerified: true,
          privacy: true,
          socialLinks: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // 소셜 링크 파싱
      let socialLinks: SocialLinks | undefined;
      if (updatedUser.socialLinks) {
        try {
          socialLinks = JSON.parse(
            updatedUser.socialLinks as string,
          ) as SocialLinks;
        } catch {
          socialLinks = undefined;
        }
      }

      // 개인정보 설정 파싱
      let privacySettings: PrivacySettingsDto | undefined;
      if (updatedUser.privacy) {
        try {
          privacySettings = JSON.parse(
            updatedUser.privacy as string,
          ) as PrivacySettingsDto;
        } catch {
          privacySettings = undefined;
        }
      }

      return {
        success: true,
        user: {
          id: updatedUser.id,
          userid: updatedUser.userid,
          nickname: updatedUser.nickname,
          bio: updatedUser.bio || undefined,
          socialLinks,
          privacy: privacySettings,
        },
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        '프로필 업데이트 중 오류가 발생했습니다',
      );
    }
  }

  async checkUseridAvailability(userid: string): Promise<UseridCheckResponse> {
    try {
      const existingUser = await this.prismaService.user.findUnique({
        where: { userid },
        select: { id: true },
      });

      return {
        available: !existingUser,
        message: existingUser
          ? '이미 사용 중인 사용자 ID입니다'
          : '사용 가능한 사용자 ID입니다',
      };
    } catch {
      throw new InternalServerErrorException(
        '사용자 ID 확인 중 오류가 발생했습니다',
      );
    }
  }
}

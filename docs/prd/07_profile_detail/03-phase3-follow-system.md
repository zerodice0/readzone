# Phase 3: 팔로우 시스템

## 📋 Phase 개요

- **기간**: 1-2주
- **우선순위**: 높음 (Phase 1,2 완료 후)
- **목표**: 사용자 간 팔로우 관계 구축 및 소셜 상호작용 활성화

## 🎯 구현 목표

1. **팔로우/언팔로우** 기능 구현
2. **상호 팔로우** 감지 및 표시
3. **낙관적 업데이트**로 UX 개선
4. **팔로워/팔로잉** 목록 표시 및 관리

## 🗄️ Backend 구현사항

### 1. 데이터베이스 스키마 확장

**Follow 모델 추가:**

```prisma
// packages/backend/prisma/schema.prisma
model Follow {
  id          String   @id @default(cuid())
  followerId  String   // 팔로우하는 사용자
  followingId String   // 팔로우당하는 사용자
  createdAt   DateTime @default(now())

  // 관계
  follower    User @relation("UserFollowing", fields: [followerId], references: [id], onDelete: Cascade)
  following   User @relation("UserFollowers", fields: [followingId], references: [id], onDelete: Cascade)

  // 인덱스 및 제약 조건
  @@unique([followerId, followingId]) // 중복 팔로우 방지
  @@index([followerId]) // 팔로잉 목록 조회 성능
  @@index([followingId]) // 팔로워 목록 조회 성능
  @@index([createdAt]) // 시간순 정렬 성능
  @@map("follows")
}

// User 모델 관계 추가 (기존 모델에 추가)
model User {
  // 기존 필드들...

  // 팔로우 관계
  following   Follow[] @relation("UserFollowing")  // 내가 팔로우하는 사람들
  followers   Follow[] @relation("UserFollowers")  // 나를 팔로우하는 사람들

  @@map("users")
}
```

### 2. API 엔드포인트 구현

#### POST `/api/users/:userId/follow` - 팔로우/언팔로우

**Controller:**

```typescript
// packages/backend/src/modules/user/user.controller.ts
@Post(':userId/follow')
@UseGuards(JwtAuthGuard)
async toggleFollow(
  @Param('userId') userId: string,
  @Body() body: FollowUserDto,
  @Req() req: AuthRequest,
): Promise<FollowUserResponse> {
  return this.userService.toggleFollow(req.user.id, userId, body.action);
}
```

**DTO 정의:**

```typescript
// packages/backend/src/modules/user/dto/follow.dto.ts
import { IsEnum } from 'class-validator';

export class FollowUserDto {
  @IsEnum(['follow', 'unfollow'])
  action: 'follow' | 'unfollow';
}

export interface FollowUserResponse {
  success: boolean;
  relationship: {
    isFollowing: boolean;
    isFollowedBy: boolean;
    isMutualFollow: boolean;
  };
  followerCount: number;
}
```

**Service 구현:**

```typescript
// packages/backend/src/modules/user/user.service.ts
async toggleFollow(
  currentUserId: string,
  targetUserId: string,
  action: 'follow' | 'unfollow'
): Promise<FollowUserResponse> {
  // 1. 자기 자신 팔로우 방지
  if (currentUserId === targetUserId) {
    throw new BadRequestException('자기 자신을 팔로우할 수 없습니다.');
  }

  // 2. 대상 사용자 존재 확인
  const targetUser = await this.prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true }
  });

  if (!targetUser) {
    throw new NotFoundException('사용자를 찾을 수 없습니다.');
  }

  // 3. 현재 팔로우 상태 확인
  const existingFollow = await this.prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: currentUserId,
        followingId: targetUserId,
      }
    }
  });

  let isFollowing: boolean;

  // 4. 팔로우/언팔로우 처리
  if (action === 'follow') {
    if (existingFollow) {
      throw new ConflictException('이미 팔로우 중인 사용자입니다.');
    }

    await this.prisma.follow.create({
      data: {
        followerId: currentUserId,
        followingId: targetUserId,
      }
    });

    isFollowing = true;

    // 팔로우 알림 생성 (Phase 5에서 구현)
    // await this.notificationService.createFollowNotification(currentUserId, targetUserId);
  } else {
    if (!existingFollow) {
      throw new ConflictException('팔로우하지 않은 사용자입니다.');
    }

    await this.prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUserId,
        }
      }
    });

    isFollowing = false;
  }

  // 5. 최신 관계 상태 및 통계 조회
  const [relationship, followerCount] = await Promise.all([
    this.getFollowRelationship(currentUserId, targetUserId),
    this.prisma.follow.count({
      where: { followingId: targetUserId }
    })
  ]);

  return {
    success: true,
    relationship: {
      isFollowing,
      isFollowedBy: relationship?.isFollowedBy || false,
      isMutualFollow: isFollowing && (relationship?.isFollowedBy || false),
    },
    followerCount,
  };
}

async getFollowRelationship(
  currentUserId: string,
  targetUserId: string
): Promise<UserRelationship | null> {
  if (!currentUserId || currentUserId === targetUserId) {
    return null;
  }

  const [isFollowing, isFollowedBy] = await Promise.all([
    this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUserId,
        }
      }
    }).then(follow => !!follow),
    this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: targetUserId,
          followingId: currentUserId,
        }
      }
    }).then(follow => !!follow),
  ]);

  return {
    isFollowing,
    isFollowedBy,
    isMutualFollow: isFollowing && isFollowedBy,
  };
}
```

#### GET `/api/users/:userId/follows` - 팔로워/팔로잉 목록

**Controller:**

```typescript
@Get(':userId/follows')
@UseGuards(OptionalAuthGuard)
async getUserFollows(
  @Param('userId') userId: string,
  @Query() query: UserFollowsQueryDto,
  @Req() req: OptionalAuthRequest,
): Promise<UserFollowsResponse> {
  return this.userService.getUserFollows(userId, query, req.user?.id);
}
```

**Service 구현:**

```typescript
async getUserFollows(
  userId: string,
  query: UserFollowsQueryDto,
  currentUserId?: string,
): Promise<UserFollowsResponse> {
  // 1. 권한 확인
  const canAccess = await this.canAccessUserFollows(userId, currentUserId);
  if (!canAccess) {
    throw new ForbiddenException('이 사용자의 팔로우 목록을 볼 권한이 없습니다.');
  }

  // 2. 조회 조건 설정
  const whereCondition = query.type === 'followers'
    ? { followingId: userId }  // 나를 팔로우하는 사람들
    : { followerId: userId };  // 내가 팔로우하는 사람들

  if (query.cursor) {
    whereCondition.id = { lt: query.cursor };
  }

  // 3. 데이터 조회
  const follows = await this.prisma.follow.findMany({
    where: whereCondition,
    include: {
      ...(query.type === 'followers' ? {
        follower: {
          select: {
            id: true,
            username: true,
            profileImage: true,
            bio: true,
            _count: {
              select: {
                reviews: true,
                followers: true,
              }
            }
          }
        }
      } : {
        following: {
          select: {
            id: true,
            username: true,
            profileImage: true,
            bio: true,
            _count: {
              select: {
                reviews: true,
                followers: true,
              }
            }
          }
        }
      })
    },
    orderBy: { createdAt: 'desc' },
    take: query.limit + 1,
  });

  // 4. 페이지네이션 처리
  const hasMore = follows.length > query.limit;
  if (hasMore) {
    follows.pop();
  }

  const nextCursor = hasMore ? follows[follows.length - 1]?.id : undefined;

  // 5. 사용자별 관계 정보 조회 (로그인한 경우만)
  const users = follows.map(follow =>
    query.type === 'followers' ? follow.follower : follow.following
  );

  let usersWithRelationship = users;
  if (currentUserId) {
    const relationshipsPromises = users.map(user =>
      user.id === currentUserId
        ? Promise.resolve(null)
        : this.getFollowRelationship(currentUserId, user.id)
    );

    const relationships = await Promise.all(relationshipsPromises);

    usersWithRelationship = users.map((user, index) => ({
      ...user,
      followedAt: follows[index].createdAt.toISOString(),
      stats: {
        reviewCount: user._count.reviews,
        followerCount: user._count.followers,
      },
      relationship: relationships[index],
    }));
  } else {
    usersWithRelationship = users.map((user, index) => ({
      ...user,
      followedAt: follows[index].createdAt.toISOString(),
      stats: {
        reviewCount: user._count.reviews,
        followerCount: user._count.followers,
      },
    }));
  }

  return {
    users: usersWithRelationship,
    pagination: {
      nextCursor,
      hasMore,
      total: await this.prisma.follow.count({ where: whereCondition }),
    }
  };
}

private async canAccessUserFollows(
  targetUserId: string,
  currentUserId?: string
): Promise<boolean> {
  // 본인 팔로우 목록은 항상 접근 가능
  if (currentUserId === targetUserId) {
    return true;
  }

  // 사용자의 팔로우 목록 공개 설정 확인
  const targetUser = await this.prisma.user.findUnique({
    where: { id: targetUserId },
    select: { privacy: true }
  });

  if (!targetUser?.privacy) {
    return true; // 기본값: 공개
  }

  const privacy = targetUser.privacy as any;
  const followersVisible = privacy.followersVisible ?? true;

  if (!followersVisible) {
    return false;
  }

  return true;
}
```

## 🎨 Frontend 구현사항

### 1. 팔로우 버튼 컴포넌트

```typescript
// packages/frontend/src/components/profile/FollowButton.tsx
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/Button';
import { followUser } from '../../lib/api/user';
import { toast } from '../../lib/toast';

interface FollowButtonProps {
  userId: string;
  isFollowing: boolean;
  followerCount: number;
  isMutualFollow?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const FollowButton: React.FC<FollowButtonProps> = ({
  userId,
  isFollowing,
  followerCount,
  isMutualFollow = false,
  disabled = false,
  size = 'md'
}) => {
  const queryClient = useQueryClient();
  const [optimisticState, setOptimisticState] = useState({
    isFollowing,
    followerCount,
  });

  const followMutation = useMutation({
    mutationFn: (action: 'follow' | 'unfollow') => followUser(userId, action),
    onMutate: async (action) => {
      // 낙관적 업데이트
      const newFollowState = action === 'follow';
      const newCount = newFollowState
        ? optimisticState.followerCount + 1
        : optimisticState.followerCount - 1;

      setOptimisticState({
        isFollowing: newFollowState,
        followerCount: newCount,
      });

      // 기존 쿼리 취소
      await queryClient.cancelQueries({ queryKey: ['user', 'profile', userId] });

      // 기존 데이터 백업
      const previousData = queryClient.getQueryData(['user', 'profile', userId]);

      // 낙관적 업데이트 적용
      queryClient.setQueryData(['user', 'profile', userId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          relationship: {
            ...old.relationship,
            isFollowing: newFollowState,
            isMutualFollow: newFollowState && old.relationship?.isFollowedBy,
          },
          user: {
            ...old.user,
            stats: {
              ...old.user.stats,
              followerCount: newCount,
            }
          }
        };
      });

      return { previousData };
    },
    onError: (error, variables, context) => {
      // 실패 시 롤백
      if (context?.previousData) {
        queryClient.setQueryData(['user', 'profile', userId], context.previousData);
      }
      setOptimisticState({ isFollowing, followerCount });

      toast.error(
        variables === 'follow'
          ? '팔로우 처리 중 오류가 발생했습니다.'
          : '언팔로우 처리 중 오류가 발생했습니다.'
      );
    },
    onSuccess: (data) => {
      // 서버 응답으로 최종 상태 업데이트
      setOptimisticState({
        isFollowing: data.relationship.isFollowing,
        followerCount: data.followerCount,
      });

      // 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['user', 'profile', userId] });
      queryClient.invalidateQueries({ queryKey: ['user', 'follows', userId] });
    },
  });

  const handleFollowClick = () => {
    const action = optimisticState.isFollowing ? 'unfollow' : 'follow';
    followMutation.mutate(action);
  };

  const buttonText = optimisticState.isFollowing ? '언팔로우' : '팔로우';
  const buttonVariant = optimisticState.isFollowing ? 'outline' : 'default';

  return (
    <div className="flex flex-col items-center space-y-1">
      <Button
        variant={buttonVariant}
        size={size}
        onClick={handleFollowClick}
        disabled={disabled || followMutation.isPending}
        className="min-w-[100px]"
      >
        {followMutation.isPending ? '처리중...' : buttonText}
      </Button>

      {/* 상호 팔로우 표시 */}
      {isMutualFollow && optimisticState.isFollowing && (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          서로 팔로우
        </span>
      )}

      {/* 팔로워 수 표시 */}
      <span className="text-sm text-gray-500 dark:text-gray-400">
        팔로워 {optimisticState.followerCount.toLocaleString()}명
      </span>
    </div>
  );
};
```

### 2. 팔로우 목록 컴포넌트

```typescript
// packages/frontend/src/components/profile/content/FollowsList.tsx
import React from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { getUserFollowsQueryOptions } from '../../../lib/api/user';
import { UserCard } from '../../user/UserCard';
import { UserCardSkeleton } from '../../user/UserCardSkeleton';
import { useInfiniteScroll } from '../../../hooks/useInfiniteScroll';

interface FollowsListProps {
  userId: string;
  type: 'followers' | 'following';
}

export const FollowsList: React.FC<FollowsListProps> = ({ userId, type }) => {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    ...getUserFollowsQueryOptions(userId, { type }),
    getNextPageParam: (lastPage) => lastPage.pagination.nextCursor,
  });

  const sentinelRef = useInfiniteScroll({
    onLoadMore: fetchNextPage,
    hasMore: hasNextPage || false,
    isLoading: isFetchingNextPage,
  });

  const allUsers = data?.pages.flatMap(page => page.users) || [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <UserCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400">
          {type === 'followers' ? '팔로워' : '팔로잉'} 목록을 불러오는 중 오류가 발생했습니다.
        </p>
      </div>
    );
  }

  if (allUsers.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">
          {type === 'followers'
            ? '아직 팔로워가 없습니다.'
            : '아직 팔로우하는 사용자가 없습니다.'
          }
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-4">
        {allUsers.map((user) => (
          <UserCard
            key={user.id}
            user={user}
            showFollowButton={true}
            showStats={true}
          />
        ))}
      </div>

      {/* 무한 스크롤 센티넬 */}
      <div ref={sentinelRef} className="h-10 flex items-center justify-center">
        {isFetchingNextPage && (
          <div className="flex items-center space-x-2 text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span className="text-sm">더 불러오는 중...</span>
          </div>
        )}
      </div>
    </div>
  );
};
```

### 3. 사용자 카드 컴포넌트

```typescript
// packages/frontend/src/components/user/UserCard.tsx
import React from 'react';
import { Link } from '@tanstack/react-router';
import { Avatar } from '../ui/Avatar';
import { FollowButton } from '../profile/FollowButton';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface User {
  id: string;
  username: string;
  profileImage?: string;
  bio?: string;
  followedAt: string;
  stats: {
    reviewCount: number;
    followerCount: number;
  };
  relationship?: {
    isFollowing: boolean;
    isFollowedBy: boolean;
  };
}

interface UserCardProps {
  user: User;
  showFollowButton?: boolean;
  showStats?: boolean;
}

export const UserCard: React.FC<UserCardProps> = ({
  user,
  showFollowButton = true,
  showStats = true
}) => {
  const followedAt = formatDistanceToNow(new Date(user.followedAt), {
    addSuffix: true,
    locale: ko,
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <Link
            to="/profile/$userId"
            params={{ userId: user.id }}
            className="flex-shrink-0"
          >
            <Avatar
              src={user.profileImage}
              alt={`${user.username}의 프로필`}
              size="md"
              fallback={user.username[0]?.toUpperCase()}
            />
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <Link
                to="/profile/$userId"
                params={{ userId: user.id }}
                className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
              >
                {user.username}
              </Link>

              {user.relationship?.isMutualFollow && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  서로 팔로우
                </span>
              )}
            </div>

            {user.bio && (
              <p className="text-gray-600 dark:text-gray-300 text-sm mt-1 line-clamp-2">
                {user.bio}
              </p>
            )}

            {showStats && (
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                <span>독후감 {user.stats.reviewCount}개</span>
                <span>팔로워 {user.stats.followerCount.toLocaleString()}명</span>
                <span>{followedAt}</span>
              </div>
            )}
          </div>
        </div>

        {showFollowButton && user.relationship && (
          <div className="ml-4">
            <FollowButton
              userId={user.id}
              isFollowing={user.relationship.isFollowing}
              followerCount={user.stats.followerCount}
              isMutualFollow={user.relationship.isFollowing && user.relationship.isFollowedBy}
              size="sm"
            />
          </div>
        )}
      </div>
    </div>
  );
};
```

### 4. API 클라이언트

```typescript
// packages/frontend/src/lib/api/user.ts
export const followUser = async (userId: string, action: 'follow' | 'unfollow') => {
  const response = await apiClient.post(`/users/${userId}/follow`, { action });
  return response.data;
};

export const getUserFollowsQueryOptions = (
  userId: string,
  params: {
    type: 'followers' | 'following';
    cursor?: string;
    limit?: number;
  }
) =>
  infiniteQueryOptions({
    queryKey: ['user', 'follows', userId, params.type],
    queryFn: async ({ pageParam }: { pageParam?: string }) => {
      const searchParams = new URLSearchParams();
      searchParams.set('type', params.type);
      if (params.limit) searchParams.set('limit', params.limit.toString());
      if (pageParam) searchParams.set('cursor', pageParam);

      const response = await apiClient.get(`/users/${userId}/follows?${searchParams}`);
      return response.data;
    },
    initialPageParam: undefined,
    staleTime: 1000 * 60 * 3, // 3분
    gcTime: 1000 * 60 * 15, // 15분
  });
```

## 🧪 테스트 계획

### Backend 테스트

```typescript
// packages/backend/test/follow.e2e-spec.ts
describe('Follow System (e2e)', () => {
  describe('POST /users/:userId/follow', () => {
    it('사용자 팔로우', async () => {
      const response = await request(app.getHttpServer())
        .post(`/users/${targetUser.id}/follow`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ action: 'follow' })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.relationship.isFollowing).toBe(true);
      expect(response.body.followerCount).toBeGreaterThan(0);
    });

    it('사용자 언팔로우', async () => {
      // 먼저 팔로우
      await request(app.getHttpServer())
        .post(`/users/${targetUser.id}/follow`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ action: 'follow' });

      // 언팔로우
      const response = await request(app.getHttpServer())
        .post(`/users/${targetUser.id}/follow`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ action: 'unfollow' })
        .expect(201);

      expect(response.body.relationship.isFollowing).toBe(false);
    });

    it('자기 자신 팔로우 시도 시 오류', async () => {
      await request(app.getHttpServer())
        .post(`/users/${testUser.id}/follow`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ action: 'follow' })
        .expect(400);
    });

    it('중복 팔로우 시도 시 오류', async () => {
      // 첫 번째 팔로우
      await request(app.getHttpServer())
        .post(`/users/${targetUser.id}/follow`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ action: 'follow' });

      // 중복 팔로우 시도
      await request(app.getHttpServer())
        .post(`/users/${targetUser.id}/follow`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ action: 'follow' })
        .expect(409);
    });
  });

  describe('GET /users/:userId/follows', () => {
    it('팔로워 목록 조회', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${testUser.id}/follows?type=followers`)
        .expect(200);

      expect(response.body).toHaveProperty('users');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.users).toBeInstanceOf(Array);
    });

    it('팔로잉 목록 조회', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${testUser.id}/follows?type=following`)
        .expect(200);

      expect(response.body.users).toBeInstanceOf(Array);
    });
  });
});
```

### Frontend 테스트

```typescript
// packages/frontend/src/components/profile/__tests__/FollowButton.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FollowButton } from '../FollowButton';

describe('FollowButton', () => {
  it('팔로우 버튼이 정상 동작한다', async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <FollowButton
          userId="1"
          isFollowing={false}
          followerCount={10}
        />
      </QueryClientProvider>
    );

    const followButton = screen.getByRole('button', { name: '팔로우' });
    expect(followButton).toBeInTheDocument();

    await user.click(followButton);

    // 낙관적 업데이트 확인
    await waitFor(() => {
      expect(screen.getByText('처리중...')).toBeInTheDocument();
    });
  });

  it('상호 팔로우 표시가 정상 동작한다', () => {
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <FollowButton
          userId="1"
          isFollowing={true}
          followerCount={10}
          isMutualFollow={true}
        />
      </QueryClientProvider>
    );

    expect(screen.getByText('서로 팔로우')).toBeInTheDocument();
  });
});
```

## 📊 성능 최적화

### 1. 데이터베이스 최적화

```sql
-- 팔로우 관계 조회 최적화를 위한 인덱스
CREATE INDEX CONCURRENTLY idx_follows_follower_id ON follows(follower_id);
CREATE INDEX CONCURRENTLY idx_follows_following_id ON follows(following_id);
CREATE INDEX CONCURRENTLY idx_follows_created_at ON follows(created_at);

-- 복합 인덱스로 조회 성능 향상
CREATE INDEX CONCURRENTLY idx_follows_follower_following ON follows(follower_id, following_id);
CREATE INDEX CONCURRENTLY idx_follows_following_created ON follows(following_id, created_at);
```

### 2. 캐싱 전략

- **팔로우 관계**: 짧은 캐시 시간 (3분) - 실시간성 중요
- **팔로우 목록**: 중간 캐시 시간 (15분) - 변경 빈도 낮음
- **팔로워 수**: Redis 카운터 캐싱 (추후 Phase 5에서 구현)

### 3. 낙관적 업데이트

- **즉시 UI 반영**: 서버 응답 전 상태 변경
- **에러 시 롤백**: 실패 시 이전 상태로 복원
- **서버 동기화**: 성공 시 서버 데이터로 최종 업데이트

## ✅ 완료 기준

### Backend
- [ ] Follow 모델 및 관계 설정 완료
- [ ] 팔로우/언팔로우 API 구현 완료
- [ ] 팔로워/팔로잉 목록 API 구현 완료
- [ ] 상호 팔로우 감지 로직 구현
- [ ] 권한 처리 및 개인정보 보호 설정 반영
- [ ] E2E 테스트 모든 시나리오 통과

### Frontend
- [ ] FollowButton 컴포넌트 구현 완료
- [ ] FollowsList 컴포넌트 구현 완료
- [ ] UserCard 컴포넌트 구현 완료
- [ ] 낙관적 업데이트 적용 완료
- [ ] 상호 팔로우 표시 기능 완료
- [ ] 무한 스크롤 적용

### 통합
- [ ] 팔로우 버튼 응답 시간 < 500ms
- [ ] UI 상태 동기화 정상 동작
- [ ] 에러 처리 및 사용자 피드백 완료
- [ ] 접근성 표준 준수

## 🔄 다음 Phase 연결

Phase 3 완료 후 Phase 4(프로필 편집 시스템)로 진행:
- Phase 1에서 구현한 ProfileHeader에 실제 편집 기능 연결
- 프로필 정보 수정 API 구현
- 프로필 사진 업로드/크롭 시스템 구현
- 개인정보 공개 범위 설정 연결

---

**예상 소요 시간**: 1-2주
**의존성**: Phase 1,2 완료, User 모델
**다음 Phase**: Phase 4 - 프로필 편집 시스템
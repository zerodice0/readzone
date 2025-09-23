# Phase 2: 콘텐츠 탭 시스템

## 📋 Phase 개요

- **기간**: 1-2주
- **우선순위**: 높음 (Phase 1 완료 후)
- **목표**: 사용자별 콘텐츠를 탭 형태로 분류하여 표시하는 시스템 구현

## 🎯 구현 목표

1. **4개 주요 탭** 구현: 독후감, 좋아요, 서재, 팔로우
2. **무한 스크롤** 및 **페이지네이션** 적용
3. **권한별 접근 제어** (공개/비공개/팔로워 전용)
4. **성능 최적화** (가상화, 캐싱, 지연 로딩)

## 🗄️ Backend 구현사항

### 1. API 엔드포인트 구현

#### GET `/api/users/:userId/reviews` - 사용자 독후감 목록

**Controller:**

```typescript
// packages/backend/src/modules/user/user.controller.ts
@Get(':userId/reviews')
@UseGuards(OptionalAuthGuard)
async getUserReviews(
  @Param('userId') userId: string,
  @Query() query: UserReviewsQueryDto,
  @Req() req: OptionalAuthRequest,
): Promise<UserReviewsResponse> {
  return this.userService.getUserReviews(userId, query, req.user?.id);
}
```

**DTO 정의:**

```typescript
// packages/backend/src/modules/user/dto/user-content.dto.ts
import { IsOptional, IsEnum, IsString, IsNumber, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class UserReviewsQueryDto {
  @IsOptional()
  @IsEnum(['newest', 'oldest', 'popular'])
  sort?: 'newest' | 'oldest' | 'popular' = 'newest';

  @IsOptional()
  @IsEnum(['public', 'followers', 'private'])
  visibility?: 'public' | 'followers' | 'private';

  @IsOptional()
  @IsString()
  cursor?: string; // 마지막 항목의 ID

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 20;
}

export class UserLikesQueryDto {
  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 20;
}

export class UserBooksQueryDto {
  @IsOptional()
  @IsEnum(['read', 'reading', 'want_to_read'])
  status?: 'read' | 'reading' | 'want_to_read';

  @IsOptional()
  @IsEnum(['recent', 'title', 'rating'])
  sort?: 'recent' | 'title' | 'rating' = 'recent';

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 20;
}

export class UserFollowsQueryDto {
  @IsEnum(['followers', 'following'])
  type: 'followers' | 'following';

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 20;
}
```

**Service 구현:**

```typescript
// packages/backend/src/modules/user/user.service.ts
async getUserReviews(
  userId: string,
  query: UserReviewsQueryDto,
  currentUserId?: string,
): Promise<UserReviewsResponse> {
  // 1. 권한 확인
  const canAccess = await this.canAccessUserContent(userId, currentUserId, 'reviews');
  if (!canAccess) {
    throw new ForbiddenException('이 사용자의 독후감을 볼 권한이 없습니다.');
  }

  // 2. 정렬 조건 설정
  const orderBy = this.getReviewOrderBy(query.sort);

  // 3. 조건부 필터링
  const whereCondition: any = {
    authorId: userId,
  };

  // 공개 범위 필터링
  if (query.visibility) {
    whereCondition.visibility = query.visibility;
  } else if (currentUserId !== userId) {
    // 본인이 아닌 경우 공개 게시물만 표시
    const relationship = await this.getFollowRelationship(currentUserId, userId);
    whereCondition.visibility = {
      in: relationship?.isFollowedBy ? ['public', 'followers'] : ['public']
    };
  }

  // 커서 기반 페이지네이션
  if (query.cursor) {
    whereCondition.id = { lt: query.cursor };
  }

  // 4. 데이터 조회
  const reviews = await this.prisma.review.findMany({
    where: whereCondition,
    include: {
      book: {
        select: {
          id: true,
          title: true,
          author: true,
          coverImage: true,
        }
      },
      _count: {
        select: {
          likes: true,
          comments: true,
        }
      }
    },
    orderBy,
    take: query.limit + 1, // 다음 페이지 존재 여부 확인용
  });

  // 5. 페이지네이션 처리
  const hasMore = reviews.length > query.limit;
  if (hasMore) {
    reviews.pop(); // 마지막 항목 제거
  }

  const nextCursor = hasMore ? reviews[reviews.length - 1]?.id : undefined;

  // 6. 응답 데이터 변환
  const reviewSummaries = reviews.map(review => ({
    id: review.id,
    content: review.content.slice(0, 150) + (review.content.length > 150 ? '...' : ''),
    rating: review.rating,
    tags: review.tags,
    createdAt: review.createdAt.toISOString(),
    visibility: review.visibility,
    book: review.book,
    stats: {
      likes: review._count.likes,
      comments: review._count.comments,
      shares: 0, // 추후 구현
    }
  }));

  return {
    reviews: reviewSummaries,
    pagination: {
      nextCursor,
      hasMore,
      total: await this.prisma.review.count({ where: { authorId: userId } }),
    }
  };
}

private getReviewOrderBy(sort: string) {
  switch (sort) {
    case 'oldest':
      return { createdAt: 'asc' as const };
    case 'popular':
      return [
        { likes: { _count: 'desc' as const } },
        { createdAt: 'desc' as const }
      ];
    case 'newest':
    default:
      return { createdAt: 'desc' as const };
  }
}

async getUserLikes(
  userId: string,
  query: UserLikesQueryDto,
  currentUserId?: string,
): Promise<UserLikesResponse> {
  // 좋아요한 독후감은 본인만 볼 수 있음
  if (currentUserId !== userId) {
    throw new ForbiddenException('본인의 좋아요 목록만 볼 수 있습니다.');
  }

  const whereCondition: any = {
    userId,
  };

  if (query.cursor) {
    whereCondition.id = { lt: query.cursor };
  }

  const likes = await this.prisma.like.findMany({
    where: whereCondition,
    include: {
      review: {
        include: {
          book: {
            select: {
              id: true,
              title: true,
              author: true,
              coverImage: true,
            }
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: query.limit + 1,
  });

  const hasMore = likes.length > query.limit;
  if (hasMore) {
    likes.pop();
  }

  const nextCursor = hasMore ? likes[likes.length - 1]?.id : undefined;

  return {
    reviews: likes.map(like => ({
      id: like.id,
      likedAt: like.createdAt.toISOString(),
      review: {
        id: like.review.id,
        content: like.review.content.slice(0, 150) + (like.review.content.length > 150 ? '...' : ''),
        rating: like.review.rating,
        tags: like.review.tags,
        createdAt: like.review.createdAt.toISOString(),
        visibility: like.review.visibility,
        book: like.review.book,
        stats: {
          likes: like.review._count.likes,
          comments: like.review._count.comments,
          shares: 0,
        }
      }
    })),
    pagination: {
      nextCursor,
      hasMore,
      total: await this.prisma.like.count({ where: { userId } }),
    }
  };
}
```

#### GET `/api/users/:userId/books` - 사용자 서재

```typescript
async getUserBooks(
  userId: string,
  query: UserBooksQueryDto,
  currentUserId?: string,
): Promise<UserBooksResponse> {
  const canAccess = await this.canAccessUserContent(userId, currentUserId, 'books');
  if (!canAccess) {
    throw new ForbiddenException('이 사용자의 서재를 볼 권한이 없습니다.');
  }

  const whereCondition: any = { userId };

  if (query.status) {
    whereCondition.status = query.status;
  }

  if (query.cursor) {
    whereCondition.id = { lt: query.cursor };
  }

  const orderBy = this.getBookOrderBy(query.sort);

  const userBooks = await this.prisma.userBook.findMany({
    where: whereCondition,
    include: {
      book: {
        select: {
          id: true,
          title: true,
          author: true,
          coverImage: true,
          publishedDate: true,
        }
      },
      review: {
        select: {
          id: true,
        }
      }
    },
    orderBy,
    take: query.limit + 1,
  });

  const hasMore = userBooks.length > query.limit;
  if (hasMore) {
    userBooks.pop();
  }

  const nextCursor = hasMore ? userBooks[userBooks.length - 1]?.id : undefined;

  // 통계 정보 계산
  const summary = await this.getUserBooksSummary(userId);

  return {
    books: userBooks.map(userBook => ({
      id: userBook.id,
      status: userBook.status,
      rating: userBook.rating,
      readAt: userBook.readAt?.toISOString(),
      addedAt: userBook.createdAt.toISOString(),
      book: userBook.book,
      reviewId: userBook.review?.id,
    })),
    pagination: {
      nextCursor,
      hasMore,
      total: await this.prisma.userBook.count({ where: { userId } }),
    },
    summary,
  };
}

private async getUserBooksSummary(userId: string) {
  const counts = await this.prisma.userBook.groupBy({
    by: ['status'],
    where: { userId },
    _count: { status: true },
  });

  const summary = {
    totalBooks: 0,
    readBooks: 0,
    readingBooks: 0,
    wantToReadBooks: 0,
  };

  counts.forEach(count => {
    summary.totalBooks += count._count.status;
    switch (count.status) {
      case 'read':
        summary.readBooks = count._count.status;
        break;
      case 'reading':
        summary.readingBooks = count._count.status;
        break;
      case 'want_to_read':
        summary.wantToReadBooks = count._count.status;
        break;
    }
  });

  return summary;
}
```

### 2. 권한 처리 로직

```typescript
// packages/backend/src/modules/user/user.service.ts
private async canAccessUserContent(
  targetUserId: string,
  currentUserId?: string,
  contentType: 'reviews' | 'books' | 'likes'
): Promise<boolean> {
  // 본인 콘텐츠는 항상 접근 가능
  if (currentUserId === targetUserId) {
    return true;
  }

  // 좋아요 목록은 본인만 접근 가능
  if (contentType === 'likes') {
    return false;
  }

  // 사용자의 개인정보 설정 확인
  const targetUser = await this.prisma.user.findUnique({
    where: { id: targetUserId },
    select: { privacy: true }
  });

  if (!targetUser?.privacy) {
    return true; // 기본값: 공개
  }

  const privacy = targetUser.privacy as any;
  const activityVisible = privacy.activityVisible || 'all';

  switch (activityVisible) {
    case 'all':
      return true;
    case 'followers':
      if (!currentUserId) return false;
      const relationship = await this.getFollowRelationship(currentUserId, targetUserId);
      return relationship?.isFollowedBy || false;
    case 'none':
      return false;
    default:
      return true;
  }
}
```

## 🎨 Frontend 구현사항

### 1. 탭 네비게이션 컴포넌트

```typescript
// packages/frontend/src/components/profile/ProfileTabs.tsx
import React from 'react';
import { cn } from '../../lib/utils';

interface ProfileTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  counts: {
    reviews: number;
    likes: number;
    books: number;
    followers: number;
    following: number;
  };
  isOwner: boolean;
}

export const ProfileTabs: React.FC<ProfileTabsProps> = ({
  activeTab,
  onTabChange,
  counts,
  isOwner
}) => {
  const tabs = [
    { id: 'reviews', label: '독후감', count: counts.reviews, visible: true },
    { id: 'likes', label: '좋아요', count: counts.likes, visible: isOwner },
    { id: 'books', label: '서재', count: counts.books, visible: true },
    { id: 'followers', label: '팔로워', count: counts.followers, visible: true },
    { id: 'following', label: '팔로잉', count: counts.following, visible: true },
  ].filter(tab => tab.visible);

  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <nav className="-mb-px flex space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors',
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            )}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`${tab.id}-panel`}
            id={`${tab.id}-tab`}
          >
            <span>{tab.label}</span>
            <span className={cn(
              'rounded-full px-2 py-1 text-xs',
              activeTab === tab.id
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
            )}>
              {tab.count.toLocaleString()}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
};
```

### 2. 콘텐츠 표시 컴포넌트

```typescript
// packages/frontend/src/components/profile/ProfileContent.tsx
import React from 'react';
import { ReviewsList } from './content/ReviewsList';
import { LikedReviewsList } from './content/LikedReviewsList';
import { BooksList } from './content/BooksList';
import { FollowsList } from './content/FollowsList';

interface ProfileContentProps {
  activeTab: string;
  userId: string;
  isOwner: boolean;
}

export const ProfileContent: React.FC<ProfileContentProps> = ({
  activeTab,
  userId,
  isOwner
}) => {
  const renderContent = () => {
    switch (activeTab) {
      case 'reviews':
        return <ReviewsList userId={userId} isOwner={isOwner} />;
      case 'likes':
        return isOwner ? <LikedReviewsList userId={userId} /> : null;
      case 'books':
        return <BooksList userId={userId} isOwner={isOwner} />;
      case 'followers':
        return <FollowsList userId={userId} type="followers" />;
      case 'following':
        return <FollowsList userId={userId} type="following" />;
      default:
        return null;
    }
  };

  return (
    <div
      role="tabpanel"
      id={`${activeTab}-panel`}
      aria-labelledby={`${activeTab}-tab`}
      className="mt-6"
    >
      {renderContent()}
    </div>
  );
};
```

### 3. 무한 스크롤 훅

```typescript
// packages/frontend/src/hooks/useInfiniteScroll.ts
import { useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollOptions {
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
  threshold?: number;
}

export const useInfiniteScroll = ({
  onLoadMore,
  hasMore,
  isLoading,
  threshold = 100
}: UseInfiniteScrollOptions) => {
  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    if (entry.isIntersecting && hasMore && !isLoading) {
      onLoadMore();
    }
  }, [onLoadMore, hasMore, isLoading]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(handleIntersection, {
      rootMargin: `${threshold}px`,
    });

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [handleIntersection, threshold]);

  return sentinelRef;
};
```

### 4. 독후감 목록 컴포넌트

```typescript
// packages/frontend/src/components/profile/content/ReviewsList.tsx
import React, { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { getUserReviewsQueryOptions } from '../../../lib/api/user';
import { ReviewCard } from '../../review/ReviewCard';
import { ReviewSkeleton } from '../../review/ReviewSkeleton';
import { useInfiniteScroll } from '../../../hooks/useInfiniteScroll';

interface ReviewsListProps {
  userId: string;
  isOwner: boolean;
}

export const ReviewsList: React.FC<ReviewsListProps> = ({ userId, isOwner }) => {
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'popular'>('newest');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'public' | 'followers' | 'private'>('all');

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    ...getUserReviewsQueryOptions(userId, { sort: sortBy, visibility: visibilityFilter === 'all' ? undefined : visibilityFilter }),
    getNextPageParam: (lastPage) => lastPage.pagination.nextCursor,
  });

  const sentinelRef = useInfiniteScroll({
    onLoadMore: fetchNextPage,
    hasMore: hasNextPage || false,
    isLoading: isFetchingNextPage,
  });

  const allReviews = data?.pages.flatMap(page => page.reviews) || [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <ReviewSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400">
          독후감을 불러오는 중 오류가 발생했습니다.
        </p>
      </div>
    );
  }

  if (allReviews.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">
          아직 작성한 독후감이 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* 필터 및 정렬 옵션 */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex items-center space-x-2">
          <label htmlFor="sort-select" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            정렬:
          </label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="newest">최신순</option>
            <option value="oldest">오래된순</option>
            <option value="popular">인기순</option>
          </select>
        </div>

        {isOwner && (
          <div className="flex items-center space-x-2">
            <label htmlFor="visibility-select" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              공개범위:
            </label>
            <select
              id="visibility-select"
              value={visibilityFilter}
              onChange={(e) => setVisibilityFilter(e.target.value as any)}
              className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">전체</option>
              <option value="public">공개</option>
              <option value="followers">팔로워 전용</option>
              <option value="private">비공개</option>
            </select>
          </div>
        )}
      </div>

      {/* 독후감 목록 */}
      <div className="space-y-6">
        {allReviews.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            showAuthor={false} // 프로필 페이지에서는 작성자 표시 안함
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

### 5. TanStack Query 설정

```typescript
// packages/frontend/src/lib/api/user.ts
export const getUserReviewsQueryOptions = (
  userId: string,
  params?: {
    sort?: 'newest' | 'oldest' | 'popular';
    visibility?: 'public' | 'followers' | 'private';
    cursor?: string;
    limit?: number;
  }
) =>
  infiniteQueryOptions({
    queryKey: ['user', 'reviews', userId, params],
    queryFn: async ({ pageParam }: { pageParam?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.sort) searchParams.set('sort', params.sort);
      if (params?.visibility) searchParams.set('visibility', params.visibility);
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (pageParam) searchParams.set('cursor', pageParam);

      const response = await apiClient.get(`/users/${userId}/reviews?${searchParams}`);
      return response.data;
    },
    initialPageParam: undefined,
    staleTime: 1000 * 60 * 2, // 2분
    gcTime: 1000 * 60 * 10, // 10분
  });

export const getUserBooksQueryOptions = (
  userId: string,
  params?: {
    status?: 'read' | 'reading' | 'want_to_read';
    sort?: 'recent' | 'title' | 'rating';
    cursor?: string;
    limit?: number;
  }
) =>
  infiniteQueryOptions({
    queryKey: ['user', 'books', userId, params],
    queryFn: async ({ pageParam }: { pageParam?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.set('status', params.status);
      if (params?.sort) searchParams.set('sort', params.sort);
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (pageParam) searchParams.set('cursor', pageParam);

      const response = await apiClient.get(`/users/${userId}/books?${searchParams}`);
      return response.data;
    },
    initialPageParam: undefined,
    staleTime: 1000 * 60 * 5, // 5분
    gcTime: 1000 * 60 * 30, // 30분
  });
```

## 🧪 테스트 계획

### Backend 테스트

```typescript
// packages/backend/test/user-content.e2e-spec.ts
describe('User Content (e2e)', () => {
  describe('GET /users/:userId/reviews', () => {
    it('공개 독후감 목록 조회', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${testUser.id}/reviews`)
        .expect(200);

      expect(response.body).toHaveProperty('reviews');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toHaveProperty('hasMore');
    });

    it('정렬 옵션 적용', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${testUser.id}/reviews?sort=popular`)
        .expect(200);

      const reviews = response.body.reviews;
      expect(reviews).toBeInstanceOf(Array);
    });

    it('권한이 없는 사용자 독후감 접근 제한', async () => {
      await request(app.getHttpServer())
        .get(`/users/${privateUser.id}/reviews`)
        .expect(403);
    });
  });

  describe('GET /users/:userId/likes', () => {
    it('본인 좋아요 목록 조회', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${testUser.id}/likes`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('reviews');
    });

    it('타인 좋아요 목록 접근 제한', async () => {
      await request(app.getHttpServer())
        .get(`/users/${otherUser.id}/likes`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });
  });
});
```

### Frontend 테스트

```typescript
// packages/frontend/src/components/profile/content/__tests__/ReviewsList.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReviewsList } from '../ReviewsList';

describe('ReviewsList', () => {
  it('독후감 목록을 정확히 표시한다', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ReviewsList userId="1" isOwner={false} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('테스트 독후감')).toBeInTheDocument();
    });
  });

  it('정렬 옵션이 정상 동작한다', async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <ReviewsList userId="1" isOwner={true} />
      </QueryClientProvider>
    );

    const sortSelect = screen.getByLabelText('정렬:');
    await user.selectOptions(sortSelect, 'popular');

    expect(sortSelect).toHaveValue('popular');
  });
});
```

## 📊 성능 최적화

### 1. 무한 스크롤 최적화

- **Intersection Observer** 사용으로 스크롤 이벤트 대비 성능 향상
- **Threshold 조정**으로 사용자 경험 최적화 (100px 미리 로딩)
- **가상화**: 아이템이 100개 이상일 때 react-window 적용 고려

### 2. 데이터 캐싱 전략

- **TanStack Query**: 탭별 독립적인 캐시 관리
- **Stale Time**: 콘텐츠 유형별 차등 적용 (독후감 2분, 서재 5분)
- **GC Time**: 메모리 효율성을 위한 적절한 가비지 컬렉션

### 3. API 최적화

- **커서 기반 페이지네이션**: OFFSET보다 성능 우수
- **선택적 필드 로딩**: include/select 최적화
- **배치 요청**: 통계 데이터 배치 계산

## ✅ 완료 기준

### Backend
- [ ] 4개 콘텐츠 API 엔드포인트 구현 완료
- [ ] 권한 처리 로직 구현 완료
- [ ] 커서 기반 페이지네이션 적용
- [ ] E2E 테스트 모든 시나리오 통과

### Frontend
- [ ] ProfileTabs, ProfileContent 컴포넌트 구현
- [ ] 4개 탭별 리스트 컴포넌트 구현
- [ ] 무한 스크롤 및 필터링 기능 구현
- [ ] TanStack Query Infinite Queries 설정
- [ ] 성능 목표 달성 (탭 전환 < 300ms)

### 통합
- [ ] 권한별 콘텐츠 접근 제어 정상 동작
- [ ] 로딩/에러 상태 처리 완료
- [ ] 접근성 표준 준수 (ARIA, 키보드 네비게이션)
- [ ] 모바일 반응형 UI 적용

## 🔄 다음 Phase 연결

Phase 2 완료 후 Phase 3(팔로우 시스템)로 진행:
- Follow 모델 및 관계 테이블 생성
- 팔로우/언팔로우 API 구현
- 팔로워/팔로잉 탭에 실제 데이터 연결
- 상호 팔로우 감지 및 표시

---

**예상 소요 시간**: 1-2주
**의존성**: Phase 1 완료, 기존 Review/Book 모델
**다음 Phase**: Phase 3 - 팔로우 시스템
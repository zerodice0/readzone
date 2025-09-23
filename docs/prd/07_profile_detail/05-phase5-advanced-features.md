# Phase 5: 고급 기능 및 최적화

## 📋 Phase 개요

- **기간**: 1-2주
- **우선순위**: 중간 (Phase 1-4 완료 후)
- **목표**: 사용자 경험 향상을 위한 고급 기능 구현 및 성능 최적화

## 🎯 구현 목표

1. **배지 시스템** 구현 및 표시
2. **접근성 개선** (ARIA, 스크린리더 지원)
3. **성능 최적화** (캐싱, 가상화, 레이지 로딩)
4. **SEO 및 소셜 공유** 최적화
5. **추가 보안 강화** 및 **모니터링**

## 🏆 배지 시스템 구현

### 1. 데이터베이스 스키마

```prisma
// packages/backend/prisma/schema.prisma
model Badge {
  id          String   @id @default(cuid())
  name        String   @unique
  description String
  icon        String   // 이모지 또는 아이콘 클래스
  tier        BadgeTier
  condition   Json     // 획득 조건
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())

  // 관계
  userBadges  UserBadge[]

  @@map("badges")
}

model UserBadge {
  id       String   @id @default(cuid())
  userId   String
  badgeId  String
  earnedAt DateTime @default(now())

  // 관계
  user     User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  badge    Badge @relation(fields: [badgeId], references: [id], onDelete: Cascade)

  @@unique([userId, badgeId]) // 중복 획득 방지
  @@index([userId]) // 사용자별 배지 조회 성능
  @@map("user_badges")
}

enum BadgeTier {
  BRONZE
  SILVER
  GOLD
  PLATINUM
  DIAMOND
}

// User 모델에 관계 추가
model User {
  // 기존 필드들...

  userBadges UserBadge[]

  @@map("users")
}
```

### 2. 배지 서비스 구현

```typescript
// packages/backend/src/modules/badge/badge.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BadgeTier } from '@prisma/client';

interface BadgeCondition {
  type: 'review_count' | 'likes_received' | 'streak_days' | 'books_read' | 'followers_count';
  threshold: number;
  operator?: 'gte' | 'eq'; // >= 또는 ==
}

@Injectable()
export class BadgeService {
  constructor(private prisma: PrismaService) {}

  private readonly BADGE_DEFINITIONS = [
    {
      name: 'first_review',
      description: '첫 번째 독후감을 작성했습니다',
      icon: '📝',
      tier: BadgeTier.BRONZE,
      condition: { type: 'review_count', threshold: 1, operator: 'gte' }
    },
    {
      name: 'reviewer_novice',
      description: '독후감 5개를 작성했습니다',
      icon: '📚',
      tier: BadgeTier.BRONZE,
      condition: { type: 'review_count', threshold: 5, operator: 'gte' }
    },
    {
      name: 'reviewer_expert',
      description: '독후감 25개를 작성했습니다',
      icon: '✍️',
      tier: BadgeTier.SILVER,
      condition: { type: 'review_count', threshold: 25, operator: 'gte' }
    },
    {
      name: 'reviewer_master',
      description: '독후감 100개를 작성했습니다',
      icon: '🏆',
      tier: BadgeTier.GOLD,
      condition: { type: 'review_count', threshold: 100, operator: 'gte' }
    },
    {
      name: 'popular_writer',
      description: '좋아요 50개를 받았습니다',
      icon: '⭐',
      tier: BadgeTier.SILVER,
      condition: { type: 'likes_received', threshold: 50, operator: 'gte' }
    },
    {
      name: 'influential_writer',
      description: '좋아요 500개를 받았습니다',
      icon: '🌟',
      tier: BadgeTier.GOLD,
      condition: { type: 'likes_received', threshold: 500, operator: 'gte' }
    },
    {
      name: 'bookworm',
      description: '50권의 책을 읽었습니다',
      icon: '🐛',
      tier: BadgeTier.SILVER,
      condition: { type: 'books_read', threshold: 50, operator: 'gte' }
    },
    {
      name: 'reading_champion',
      description: '200권의 책을 읽었습니다',
      icon: '🏅',
      tier: BadgeTier.GOLD,
      condition: { type: 'books_read', threshold: 200, operator: 'gte' }
    },
    {
      name: 'social_butterfly',
      description: '팔로워 100명을 달성했습니다',
      icon: '🦋',
      tier: BadgeTier.SILVER,
      condition: { type: 'followers_count', threshold: 100, operator: 'gte' }
    },
  ];

  async initializeBadges(): Promise<void> {
    for (const badgeData of this.BADGE_DEFINITIONS) {
      await this.prisma.badge.upsert({
        where: { name: badgeData.name },
        update: {
          description: badgeData.description,
          icon: badgeData.icon,
          tier: badgeData.tier,
          condition: badgeData.condition,
        },
        create: {
          name: badgeData.name,
          description: badgeData.description,
          icon: badgeData.icon,
          tier: badgeData.tier,
          condition: badgeData.condition,
        },
      });
    }
  }

  async checkAndAwardBadges(userId: string): Promise<Badge[]> {
    const userStats = await this.getUserStats(userId);
    const eligibleBadges = await this.getEligibleBadges(userStats);
    const existingBadges = await this.getUserBadges(userId);

    const existingBadgeIds = new Set(existingBadges.map(ub => ub.badgeId));
    const newBadges = eligibleBadges.filter(badge => !existingBadgeIds.has(badge.id));

    // 새로운 배지 획득 처리
    const awardedBadges: Badge[] = [];
    for (const badge of newBadges) {
      try {
        await this.prisma.userBadge.create({
          data: {
            userId,
            badgeId: badge.id,
          },
        });
        awardedBadges.push(badge);

        // 배지 획득 알림 생성 (추후 알림 시스템 구현 시)
        // await this.notificationService.createBadgeNotification(userId, badge);
      } catch (error) {
        // 중복 생성 방지를 위한 에러 처리
        if (error.code !== 'P2002') {
          console.error('Badge award error:', error);
        }
      }
    }

    return awardedBadges;
  }

  private async getUserStats(userId: string) {
    const [reviewCount, likesReceived, booksRead, followerCount] = await Promise.all([
      this.prisma.review.count({ where: { authorId: userId } }),
      this.prisma.like.count({
        where: { review: { authorId: userId } }
      }),
      this.prisma.userBook.count({
        where: { userId, status: 'read' }
      }),
      this.prisma.follow.count({ where: { followingId: userId } }),
    ]);

    return {
      review_count: reviewCount,
      likes_received: likesReceived,
      books_read: booksRead,
      followers_count: followerCount,
    };
  }

  private async getEligibleBadges(userStats: Record<string, number>): Promise<Badge[]> {
    const allBadges = await this.prisma.badge.findMany({
      where: { isActive: true }
    });

    return allBadges.filter(badge => {
      const condition = badge.condition as BadgeCondition;
      const userValue = userStats[condition.type] || 0;

      switch (condition.operator || 'gte') {
        case 'gte':
          return userValue >= condition.threshold;
        case 'eq':
          return userValue === condition.threshold;
        default:
          return false;
      }
    });
  }

  async getUserBadges(userId: string): Promise<UserBadge[]> {
    return this.prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' }
    });
  }

  async getBadgeProgress(userId: string): Promise<any[]> {
    const userStats = await this.getUserStats(userId);
    const allBadges = await this.prisma.badge.findMany({
      where: { isActive: true },
      orderBy: [{ tier: 'asc' }, { name: 'asc' }]
    });

    const userBadges = await this.getUserBadges(userId);
    const earnedBadgeIds = new Set(userBadges.map(ub => ub.badgeId));

    return allBadges.map(badge => {
      const condition = badge.condition as BadgeCondition;
      const currentValue = userStats[condition.type] || 0;
      const isEarned = earnedBadgeIds.has(badge.id);
      const progress = Math.min((currentValue / condition.threshold) * 100, 100);

      return {
        ...badge,
        isEarned,
        progress,
        currentValue,
        targetValue: condition.threshold,
        earnedAt: userBadges.find(ub => ub.badgeId === badge.id)?.earnedAt,
      };
    });
  }
}
```

### 3. 배지 표시 컴포넌트

```typescript
// packages/frontend/src/components/profile/ProfileBadges.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge, BadgeProgress } from '../../types/badge';
import { getBadgeProgress } from '../../lib/api/badge';
import { BadgeItem } from './BadgeItem';
import { BadgeProgressModal } from './BadgeProgressModal';

interface ProfileBadgesProps {
  userId: string;
  isOwner: boolean;
}

export const ProfileBadges: React.FC<ProfileBadgesProps> = ({ userId, isOwner }) => {
  const [showProgressModal, setShowProgressModal] = useState(false);

  const { data: badgeProgress, isLoading } = useQuery({
    queryKey: ['badge-progress', userId],
    queryFn: () => getBadgeProgress(userId),
    staleTime: 1000 * 60 * 5, // 5분
  });

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="flex space-x-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          ))}
        </div>
      </div>
    );
  }

  const earnedBadges = badgeProgress?.filter(badge => badge.isEarned) || [];
  const nextBadges = badgeProgress?.filter(badge => !badge.isEarned && badge.progress > 0) || [];

  return (
    <div className="space-y-4">
      {/* 획득한 배지 */}
      {earnedBadges.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              배지 ({earnedBadges.length})
            </h3>
            {isOwner && (
              <button
                onClick={() => setShowProgressModal(true)}
                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
              >
                전체 보기
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {earnedBadges.slice(0, 6).map((badge) => (
              <BadgeItem
                key={badge.id}
                badge={badge}
                size="md"
                showTooltip
              />
            ))}
            {earnedBadges.length > 6 && (
              <button
                onClick={() => setShowProgressModal(true)}
                className="flex items-center justify-center w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                +{earnedBadges.length - 6}
              </button>
            )}
          </div>
        </div>
      )}

      {/* 진행 중인 배지 (본인만) */}
      {isOwner && nextBadges.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">
            진행 중인 배지
          </h4>
          <div className="flex flex-wrap gap-2">
            {nextBadges.slice(0, 3).map((badge) => (
              <BadgeItem
                key={badge.id}
                badge={badge}
                size="sm"
                showProgress
                showTooltip
              />
            ))}
          </div>
        </div>
      )}

      {/* 배지가 없는 경우 */}
      {earnedBadges.length === 0 && (
        <div className="text-center py-6">
          <div className="text-gray-400 text-4xl mb-2">🏆</div>
          <p className="text-gray-500 dark:text-gray-400">
            {isOwner ? '아직 획득한 배지가 없습니다.' : '획득한 배지가 없습니다.'}
          </p>
          {isOwner && (
            <button
              onClick={() => setShowProgressModal(true)}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
            >
              배지 획득 조건 보기
            </button>
          )}
        </div>
      )}

      {/* 전체 진행 상황 모달 */}
      {showProgressModal && (
        <BadgeProgressModal
          badgeProgress={badgeProgress || []}
          isOpen={showProgressModal}
          onClose={() => setShowProgressModal(false)}
        />
      )}
    </div>
  );
};
```

## ♿ 접근성 개선

### 1. ARIA 및 시맨틱 HTML

```typescript
// packages/frontend/src/components/profile/AccessibleProfilePage.tsx
import React from 'react';
import { UserProfileData } from '../../types/user';

interface AccessibleProfilePageProps {
  profile: UserProfileData;
  children: React.ReactNode;
}

export const AccessibleProfilePage: React.FC<AccessibleProfilePageProps> = ({
  profile,
  children
}) => {
  return (
    <main
      role="main"
      aria-labelledby="profile-title"
      className="min-h-screen bg-gray-50 dark:bg-gray-900"
    >
      {/* 스킵 링크 */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded z-50"
      >
        메인 콘텐츠로 건너뛰기
      </a>

      {/* 페이지 제목 */}
      <h1 id="profile-title" className="sr-only">
        {profile.user.username}님의 프로필 페이지
      </h1>

      {/* 프로필 정보 요약 (스크린 리더용) */}
      <div className="sr-only">
        <h2>프로필 정보</h2>
        <p>
          사용자명: {profile.user.username}
          {profile.user.bio && `, 자기소개: ${profile.user.bio}`}
        </p>
        <p>
          독후감 {profile.user.stats.reviewCount}개,
          팔로워 {profile.user.stats.followerCount}명,
          팔로잉 {profile.user.stats.followingCount}명
        </p>
      </div>

      <div id="main-content" tabIndex={-1}>
        {children}
      </div>
    </main>
  );
};
```

### 2. 키보드 네비게이션

```typescript
// packages/frontend/src/hooks/useKeyboardNavigation.ts
import { useEffect, useRef } from 'react';

export const useKeyboardNavigation = (
  isOpen: boolean,
  onClose: () => void,
  trapFocus = true
) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // 이전 포커스 요소 저장
    previousActiveElement.current = document.activeElement as HTMLElement;

    const container = containerRef.current;
    if (!container) return;

    // 첫 번째 포커스 가능한 요소에 포커스
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

    if (firstFocusable) {
      firstFocusable.focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (!trapFocus || event.key !== 'Tab') return;

      // Tab 트래핑
      if (event.shiftKey) {
        if (document.activeElement === firstFocusable) {
          event.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          event.preventDefault();
          firstFocusable?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);

      // 이전 포커스 복원
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, onClose, trapFocus]);

  return containerRef;
};
```

### 3. 스크린 리더 지원

```typescript
// packages/frontend/src/components/profile/ScreenReaderProfileStats.tsx
import React from 'react';
import { UserStats } from '../../types/user';

interface ScreenReaderProfileStatsProps {
  stats: UserStats;
  username: string;
}

export const ScreenReaderProfileStats: React.FC<ScreenReaderProfileStatsProps> = ({
  stats,
  username
}) => {
  return (
    <div className="sr-only">
      <h3>{username}님의 활동 통계</h3>
      <ul>
        <li>작성한 독후감: {stats.reviewCount}개</li>
        <li>받은 좋아요: {stats.likesReceived}개</li>
        <li>팔로워: {stats.followerCount}명</li>
        <li>팔로잉: {stats.followingCount}명</li>
        <li>읽은 책: {stats.booksRead}권</li>
      </ul>
    </div>
  );
};

// 동적 콘텐츠 알림
export const useScreenReaderAlert = () => {
  const announceToScreenReader = (message: string) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  return { announceToScreenReader };
};
```

## ⚡ 성능 최적화

### 1. React Query 캐싱 최적화

```typescript
// packages/frontend/src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5분
      gcTime: 1000 * 60 * 30, // 30분
      retry: (failureCount, error: any) => {
        // 404는 재시도하지 않음
        if (error?.status === 404) return false;
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
    },
  },
});

// 프로필 관련 쿼리 사전 캐싱
export const prefetchProfileData = async (userId: string) => {
  const promises = [
    queryClient.prefetchQuery(userProfileQueryOptions(userId)),
    queryClient.prefetchQuery(getUserReviewsQueryOptions(userId, { limit: 10 })),
    queryClient.prefetchQuery(getUserBadgesQueryOptions(userId)),
  ];

  await Promise.allSettled(promises);
};
```

### 2. 이미지 최적화

```typescript
// packages/frontend/src/components/ui/OptimizedImage.tsx
import React, { useState } from 'react';

interface OptimizedImageProps {
  src?: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  fallback?: React.ReactNode;
  priority?: boolean;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className,
  fallback,
  priority = false
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-200 dark:bg-gray-700`}>
        {fallback}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* 로딩 스켈레톤 */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-full" />
      )}

      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`${className} transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
};
```

### 3. 가상화 적용

```typescript
// packages/frontend/src/components/profile/VirtualizedList.tsx
import React from 'react';
import { FixedSizeList as List } from 'react-window';
import { useResizeObserver } from '../../hooks/useResizeObserver';

interface VirtualizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight: number;
  height?: number;
  overscan?: number;
}

export function VirtualizedList<T>({
  items,
  renderItem,
  itemHeight,
  height = 400,
  overscan = 5
}: VirtualizedListProps<T>) {
  const containerRef = useResizeObserver();

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      {renderItem(items[index], index)}
    </div>
  );

  // 아이템이 적으면 가상화하지 않음
  if (items.length < 20) {
    return (
      <div ref={containerRef}>
        {items.map((item, index) => (
          <div key={index}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div ref={containerRef}>
      <List
        height={height}
        itemCount={items.length}
        itemSize={itemHeight}
        overscanCount={overscan}
      >
        {Row}
      </List>
    </div>
  );
}
```

## 🔍 SEO 및 소셜 공유 최적화

### 1. 메타 태그 최적화

```typescript
// packages/frontend/src/components/profile/ProfileMetaTags.tsx
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { UserProfileData } from '../../types/user';

interface ProfileMetaTagsProps {
  profile: UserProfileData;
}

export const ProfileMetaTags: React.FC<ProfileMetaTagsProps> = ({ profile }) => {
  const { user } = profile;

  const title = `${user.username} - ReadZone 프로필`;
  const description = user.bio
    ? `${user.username}님의 프로필: ${user.bio.slice(0, 150)}${user.bio.length > 150 ? '...' : ''}`
    : `${user.username}님은 ReadZone에서 ${user.stats.reviewCount}개의 독후감을 작성했습니다.`;

  const imageUrl = user.profileImage || '/images/default-profile.png';
  const canonicalUrl = `https://readzone.app/profile/${user.id}`;

  return (
    <Helmet>
      {/* 기본 메타 태그 */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:type" content="profile" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content="ReadZone" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />

      {/* 프로필 전용 메타 데이터 */}
      <meta property="profile:username" content={user.username} />
      {user.bio && <meta property="profile:bio" content={user.bio} />}

      {/* 구조화된 데이터 */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: user.username,
          ...(user.bio && { description: user.bio }),
          ...(user.profileImage && { image: user.profileImage }),
          url: canonicalUrl,
          sameAs: [
            user.socialLinks?.blog,
            user.socialLinks?.twitter,
            user.socialLinks?.instagram,
          ].filter(Boolean),
          interactionStatistic: [
            {
              '@type': 'InteractionCounter',
              interactionType: 'https://schema.org/FollowAction',
              userInteractionCount: user.stats.followerCount,
            },
            {
              '@type': 'InteractionCounter',
              interactionType: 'https://schema.org/WriteAction',
              userInteractionCount: user.stats.reviewCount,
            },
          ],
        })}
      </script>
    </Helmet>
  );
};
```

### 2. 소셜 공유 컴포넌트

```typescript
// packages/frontend/src/components/profile/SocialShareButton.tsx
import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { toast } from '../../lib/toast';

interface SocialShareButtonProps {
  profile: {
    username: string;
    bio?: string;
    profileImage?: string;
  };
  profileUrl: string;
}

export const SocialShareButton: React.FC<SocialShareButtonProps> = ({
  profile,
  profileUrl
}) => {
  const [showModal, setShowModal] = useState(false);

  const shareText = `${profile.username}님의 ReadZone 프로필을 확인해보세요!`;
  const fullUrl = `https://readzone.app${profileUrl}`;

  const shareOptions = [
    {
      name: 'Twitter',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(fullUrl)}`,
      icon: '🐦',
    },
    {
      name: 'Facebook',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`,
      icon: '📘',
    },
    {
      name: 'LinkedIn',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullUrl)}`,
      icon: '💼',
    },
    {
      name: '링크 복사',
      action: () => {
        navigator.clipboard.writeText(fullUrl);
        toast.success('링크가 복사되었습니다!');
        setShowModal(false);
      },
      icon: '🔗',
    },
  ];

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile.username} - ReadZone 프로필`,
          text: shareText,
          url: fullUrl,
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          setShowModal(true);
        }
      }
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleNativeShare}
        className="flex items-center space-x-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
        </svg>
        <span>공유</span>
      </Button>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">프로필 공유하기</h3>

          <div className="grid grid-cols-2 gap-3">
            {shareOptions.map((option) => (
              <button
                key={option.name}
                onClick={() => {
                  if (option.action) {
                    option.action();
                  } else {
                    window.open(option.url, '_blank', 'width=600,height=400');
                  }
                }}
                className="flex items-center justify-center space-x-2 p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="text-xl">{option.icon}</span>
                <span>{option.name}</span>
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </>
  );
};
```

## 🛡️ 보안 강화

### 1. CSP (Content Security Policy) 설정

```typescript
// packages/frontend/public/_headers
/*
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://res.cloudinary.com; font-src 'self' data:; connect-src 'self' https://api.readzone.app; frame-ancestors 'none'; base-uri 'self'; form-action 'self';
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### 2. 입력 검증 및 살균

```typescript
// packages/frontend/src/lib/sanitize.ts
import DOMPurify from 'dompurify';

export const sanitizeUserInput = (input: string): string => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // HTML 태그 모두 제거
    ALLOWED_ATTR: [],
  });
};

export const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u'],
    ALLOWED_ATTR: [],
  });
};

// URL 검증
export const isValidUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
};
```

## 📊 모니터링 및 분석

### 1. 성능 모니터링

```typescript
// packages/frontend/src/lib/performance.ts
export const measurePerformance = (name: string, fn: () => void) => {
  const start = performance.now();
  fn();
  const end = performance.now();

  if (process.env.NODE_ENV === 'development') {
    console.log(`${name}: ${end - start}ms`);
  }

  // 프로덕션에서는 분석 서비스로 전송
  if (process.env.NODE_ENV === 'production') {
    // Google Analytics 또는 기타 분석 도구로 전송
    gtag('event', 'timing_complete', {
      name: name,
      value: Math.round(end - start),
    });
  }
};

// Core Web Vitals 측정
export const measureWebVitals = () => {
  if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
    // LCP 측정
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log('LCP:', lastEntry.startTime);
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // FID 측정
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        console.log('FID:', entry.processingStart - entry.startTime);
      }
    }).observe({ entryTypes: ['first-input'] });

    // CLS 측정
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!entry.hadRecentInput) {
          console.log('CLS:', entry.value);
        }
      }
    }).observe({ entryTypes: ['layout-shift'] });
  }
};
```

## ✅ 완료 기준

### Backend
- [ ] 배지 시스템 완전 구현 (모델, 서비스, API)
- [ ] 자동 배지 획득 로직 구현
- [ ] 성능 최적화 (인덱스, 쿼리 최적화)
- [ ] 보안 강화 (입력 검증, Rate Limiting)

### Frontend
- [ ] 배지 표시 및 진행 상황 UI 구현
- [ ] 접근성 개선 (ARIA, 키보드 네비게이션)
- [ ] 성능 최적화 (가상화, 이미지 최적화)
- [ ] SEO 메타 태그 및 구조화된 데이터
- [ ] 소셜 공유 기능 구현

### 통합
- [ ] Core Web Vitals 목표 달성 (LCP < 2.5s, FID < 100ms, CLS < 0.1)
- [ ] 접근성 표준 준수 (WCAG 2.1 AA)
- [ ] 보안 검사 통과 (XSS, CSRF 방지)
- [ ] 성능 모니터링 설정 완료

## 🎉 프로젝트 완료

Phase 5 완료로 프로필 페이지 구현이 완료됩니다:

### 주요 성과
1. **완전한 프로필 시스템** - 정보 표시부터 편집까지
2. **소셜 기능** - 팔로우 시스템 및 상호작용
3. **사용자 경험** - 직관적이고 접근 가능한 인터페이스
4. **성능 최적화** - 빠르고 효율적인 로딩
5. **확장성** - 미래 기능 추가를 위한 견고한 구조

### 다음 단계 제안
- **알림 시스템**: 팔로우, 배지 획득 알림
- **검색 개선**: 사용자 검색 및 추천 시스템
- **모바일 앱**: PWA 또는 네이티브 앱 개발
- **고급 분석**: 사용자 행동 분석 및 개인화

---

**예상 소요 시간**: 1-2주
**의존성**: Phase 1-4 완료
**결과**: 완전한 프로필 페이지 시스템
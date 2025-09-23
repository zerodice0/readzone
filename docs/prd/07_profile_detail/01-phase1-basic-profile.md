# Phase 1: 기본 프로필 구조

## 📋 Phase 개요

- **기간**: 1-2주
- **우선순위**: 최우선 (다른 Phase들의 기반)
- **목표**: 프로필 페이지의 핵심 골격 구현 및 기본 정보 표시

## 🎯 구현 목표

1. 사용자 프로필 데이터 모델 확장
2. 프로필 조회 API 구현
3. 기본 프로필 페이지 UI 구현
4. 권한 처리 및 라우팅 설정

## 🗄️ Backend 구현사항

### 1. Prisma 스키마 확장

**기존 User 모델에 추가할 필드:**

```prisma
model User {
  // 기존 필드들...
  id          String   @id @default(cuid())
  email       String   @unique
  username    String   @unique
  password    String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // 새로 추가할 필드들
  bio            String?    // 자기소개 (최대 500자)
  profileImage   String?    // 프로필 이미지 URL (Cloudinary)
  joinedAt       DateTime   @default(now()) // 가입일 (createdAt과 동일하지만 명시적)

  // 소셜 링크 (JSON으로 저장)
  socialLinks    Json?      // { blog?: string, twitter?: string, instagram?: string }

  // 활동 통계 (computed fields - 실시간 계산)
  reviews        Review[]   @relation("UserReviews")
  likes          Like[]     @relation("UserLikes")
  comments       Comment[]  @relation("UserComments")

  // 팔로우 관계 (Phase 3에서 구현)
  following      Follow[]   @relation("UserFollowing")
  followers      Follow[]   @relation("UserFollowers")

  @@map("users")
}
```

### 2. API 엔드포인트 구현

#### GET `/api/users/:userId`

**Controller**: `UserController.getProfile()`

```typescript
// packages/backend/src/modules/user/user.controller.ts
@Controller('users')
export class UserController {
  @Get(':userId')
  @UseGuards(OptionalAuthGuard) // 비로그인도 접근 가능, 로그인 시 추가 정보
  async getProfile(
    @Param('userId') userId: string,
    @Req() req: OptionalAuthRequest,
  ): Promise<UserProfileResponse> {
    return this.userService.getProfile(userId, req.user?.id);
  }
}
```

**Service**: `UserService.getProfile()`

```typescript
// packages/backend/src/modules/user/user.service.ts
async getProfile(userId: string, currentUserId?: string): Promise<UserProfileResponse> {
  // 1. 사용자 기본 정보 조회
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      bio: true,
      profileImage: true,
      socialLinks: true,
      joinedAt: true,
      // 통계 계산을 위한 관계 데이터
      _count: {
        select: {
          reviews: true,
          likes: true,
          following: true,
          followers: true,
        }
      }
    }
  });

  if (!user) {
    throw new NotFoundException('사용자를 찾을 수 없습니다.');
  }

  // 2. 활동 통계 계산
  const stats = await this.calculateUserStats(userId);

  // 3. 팔로우 관계 확인 (로그인한 경우만)
  let relationship: UserRelationship | undefined;
  if (currentUserId && currentUserId !== userId) {
    relationship = await this.getFollowRelationship(currentUserId, userId);
  }

  // 4. 최근 활동 정보
  const recentActivity = await this.getRecentActivity(userId);

  return {
    user: {
      ...user,
      socialLinks: user.socialLinks as SocialLinks,
      stats,
      recentActivity,
    },
    relationship,
    isOwner: currentUserId === userId,
  };
}

private async calculateUserStats(userId: string): Promise<UserStats> {
  const [reviewCount, likesReceived, followerCount, followingCount, booksRead] = await Promise.all([
    this.prisma.review.count({ where: { authorId: userId } }),
    this.prisma.like.count({
      where: { review: { authorId: userId } }
    }),
    this.prisma.follow.count({ where: { followingId: userId } }),
    this.prisma.follow.count({ where: { followerId: userId } }),
    this.prisma.userBook.count({
      where: { userId, status: 'read' }
    }),
  ]);

  return {
    reviewCount,
    likesReceived,
    followerCount,
    followingCount,
    booksRead,
  };
}
```

**DTO 정의:**

```typescript
// packages/backend/src/modules/user/dto/user-profile.dto.ts
export interface SocialLinks {
  blog?: string;
  twitter?: string;
  instagram?: string;
}

export interface UserStats {
  reviewCount: number;
  likesReceived: number;
  followerCount: number;
  followingCount: number;
  booksRead: number;
}

export interface UserRelationship {
  isFollowing: boolean;
  isFollowedBy: boolean;
  isMutualFollow: boolean;
}

export interface RecentActivity {
  lastReviewAt?: string;
  lastActiveAt: string;
  streakDays: number;
}

export interface UserProfileResponse {
  user: {
    id: string;
    username: string;
    bio?: string;
    profileImage?: string;
    socialLinks?: SocialLinks;
    joinedAt: string;
    stats: UserStats;
    recentActivity: RecentActivity;
  };
  relationship?: UserRelationship;
  isOwner: boolean;
}
```

### 3. 권한 처리

**OptionalAuthGuard 구현:**

```typescript
// packages/backend/src/common/guards/optional-auth.guard.ts
@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      // 토큰이 없어도 계속 진행 (비로그인 접근 허용)
      return true;
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      request.user = payload;
    } catch {
      // 토큰이 유효하지 않아도 계속 진행
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
```

## 🎨 Frontend 구현사항

### 1. 라우팅 설정

**TanStack Router 라우트 정의:**

```typescript
// packages/frontend/src/routes/profile.$userId.tsx
import { createFileRoute } from '@tanstack/react-router';
import { ProfilePage } from '../components/profile/ProfilePage';
import { userProfileQueryOptions } from '../lib/api/user';

export const Route = createFileRoute('/profile/$userId')({
  component: ProfilePageComponent,
  loader: ({ context, params }) => {
    // 프로필 데이터 프리로딩
    return context.queryClient.ensureQueryData(
      userProfileQueryOptions(params.userId)
    );
  },
});

function ProfilePageComponent() {
  const { userId } = Route.useParams();
  return <ProfilePage userId={userId} />;
}
```

### 2. API 클라이언트

**TanStack Query 설정:**

```typescript
// packages/frontend/src/lib/api/user.ts
import { queryOptions } from '@tanstack/react-query';
import { apiClient } from './client';

export interface UserProfileData {
  user: {
    id: string;
    username: string;
    bio?: string;
    profileImage?: string;
    socialLinks?: {
      blog?: string;
      twitter?: string;
      instagram?: string;
    };
    joinedAt: string;
    stats: {
      reviewCount: number;
      likesReceived: number;
      followerCount: number;
      followingCount: number;
      booksRead: number;
    };
    recentActivity: {
      lastReviewAt?: string;
      lastActiveAt: string;
      streakDays: number;
    };
  };
  relationship?: {
    isFollowing: boolean;
    isFollowedBy: boolean;
    isMutualFollow: boolean;
  };
  isOwner: boolean;
}

export const userProfileQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ['user', 'profile', userId],
    queryFn: async (): Promise<UserProfileData> => {
      const response = await apiClient.get(`/users/${userId}`);
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5분
    gcTime: 1000 * 60 * 30, // 30분
  });
```

### 3. 상태 관리

**Zustand Store:**

```typescript
// packages/frontend/src/store/profileStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface ProfileState {
  // 상태
  currentProfile: UserProfileData | null;
  profileCache: Map<string, UserProfileData>;
  isLoading: boolean;
  error: string | null;

  // 액션
  setCurrentProfile: (profile: UserProfileData) => void;
  clearCurrentProfile: () => void;
  updateProfileCache: (userId: string, profile: UserProfileData) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useProfileStore = create<ProfileState>()(
  devtools(
    (set, get) => ({
      // 초기 상태
      currentProfile: null,
      profileCache: new Map(),
      isLoading: false,
      error: null,

      // 액션
      setCurrentProfile: (profile) =>
        set({ currentProfile: profile }, false, 'setCurrentProfile'),

      clearCurrentProfile: () =>
        set({ currentProfile: null }, false, 'clearCurrentProfile'),

      updateProfileCache: (userId, profile) =>
        set((state) => {
          const newCache = new Map(state.profileCache);
          newCache.set(userId, profile);
          return { profileCache: newCache };
        }, false, 'updateProfileCache'),

      setLoading: (loading) =>
        set({ isLoading: loading }, false, 'setLoading'),

      setError: (error) =>
        set({ error }, false, 'setError'),
    }),
    { name: 'profile-store' }
  )
);
```

### 4. 메인 컴포넌트

**ProfilePage 컴포넌트:**

```typescript
// packages/frontend/src/components/profile/ProfilePage.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { userProfileQueryOptions } from '../../lib/api/user';
import { ProfileHeader } from './ProfileHeader';
import { ProfileSkeleton } from './ProfileSkeleton';
import { ProfileError } from './ProfileError';

interface ProfilePageProps {
  userId: string;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ userId }) => {
  const {
    data: profileData,
    isLoading,
    error,
    refetch,
  } = useQuery(userProfileQueryOptions(userId));

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (error) {
    return <ProfileError error={error} onRetry={() => refetch()} />;
  }

  if (!profileData) {
    return <ProfileError error={new Error('프로필을 찾을 수 없습니다.')} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <ProfileHeader
          profile={profileData}
          onProfileUpdate={(updatedProfile) => {
            // 프로필 업데이트 처리 (Phase 4에서 구현)
          }}
        />

        {/* 프로필 탭 영역 - Phase 2에서 구현 */}
        <div className="mt-8">
          <div className="text-center text-gray-500">
            콘텐츠 탭은 Phase 2에서 구현됩니다.
          </div>
        </div>
      </div>
    </div>
  );
};
```

**ProfileHeader 컴포넌트:**

```typescript
// packages/frontend/src/components/profile/ProfileHeader.tsx
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { UserProfileData } from '../../lib/api/user';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { ProfileStats } from './ProfileStats';

interface ProfileHeaderProps {
  profile: UserProfileData;
  onProfileUpdate?: (profile: UserProfileData) => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  onProfileUpdate
}) => {
  const { user, isOwner } = profile;

  const joinedDate = formatDistanceToNow(new Date(user.joinedAt), {
    addSuffix: true,
    locale: ko,
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* 프로필 이미지 및 기본 정보 */}
        <div className="flex flex-col items-center md:items-start">
          <Avatar
            src={user.profileImage}
            alt={`${user.username}의 프로필`}
            size="lg"
            fallback={user.username[0]?.toUpperCase()}
          />

          {isOwner && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => {
                // 프로필 편집 - Phase 4에서 구현
                console.log('프로필 편집');
              }}
            >
              프로필 편집
            </Button>
          )}
        </div>

        {/* 사용자 정보 */}
        <div className="flex-1">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {user.username}
              </h1>

              <p className="text-gray-600 dark:text-gray-300 mt-1">
                {joinedDate} 가입
              </p>

              {user.bio && (
                <p className="text-gray-700 dark:text-gray-200 mt-3 whitespace-pre-wrap">
                  {user.bio}
                </p>
              )}
            </div>

            {/* 팔로우 버튼 - Phase 3에서 구현 */}
            {!isOwner && (
              <Button
                disabled
                className="opacity-50"
              >
                팔로우 (Phase 3에서 구현)
              </Button>
            )}
          </div>

          {/* 소셜 링크 */}
          {user.socialLinks && (
            <div className="flex gap-3 mt-4">
              {user.socialLinks.blog && (
                <a
                  href={user.socialLinks.blog}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                >
                  블로그
                </a>
              )}
              {user.socialLinks.twitter && (
                <a
                  href={user.socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                >
                  Twitter
                </a>
              )}
              {user.socialLinks.instagram && (
                <a
                  href={user.socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                >
                  Instagram
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 활동 통계 */}
      <ProfileStats stats={user.stats} className="mt-6" />
    </div>
  );
};
```

**ProfileStats 컴포넌트:**

```typescript
// packages/frontend/src/components/profile/ProfileStats.tsx
import React from 'react';
import { cn } from '../../lib/utils';

interface ProfileStatsProps {
  stats: {
    reviewCount: number;
    likesReceived: number;
    followerCount: number;
    followingCount: number;
    booksRead: number;
  };
  className?: string;
}

export const ProfileStats: React.FC<ProfileStatsProps> = ({
  stats,
  className
}) => {
  const statItems = [
    { label: '독후감', value: stats.reviewCount },
    { label: '받은 좋아요', value: stats.likesReceived },
    { label: '팔로워', value: stats.followerCount },
    { label: '팔로잉', value: stats.followingCount },
    { label: '읽은 책', value: stats.booksRead },
  ];

  return (
    <div className={cn('grid grid-cols-5 gap-4', className)}>
      {statItems.map((item) => (
        <div key={item.label} className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {item.value.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
};
```

## 🧪 테스트 계획

### Backend 테스트

**E2E 테스트:**

```typescript
// packages/backend/test/profile.e2e-spec.ts
describe('Profile (e2e)', () => {
  it('GET /users/:userId - 공개 프로필 조회', async () => {
    const response = await request(app.getHttpServer())
      .get(`/users/${testUser.id}`)
      .expect(200);

    expect(response.body).toHaveProperty('user');
    expect(response.body.user).toHaveProperty('username');
    expect(response.body.user).toHaveProperty('stats');
    expect(response.body).toHaveProperty('isOwner', false);
  });

  it('GET /users/:userId - 본인 프로필 조회 (로그인)', async () => {
    const response = await request(app.getHttpServer())
      .get(`/users/${testUser.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.isOwner).toBe(true);
  });

  it('GET /users/:userId - 존재하지 않는 사용자', async () => {
    await request(app.getHttpServer())
      .get('/users/nonexistent')
      .expect(404);
  });
});
```

### Frontend 테스트

**Component 테스트:**

```typescript
// packages/frontend/src/components/profile/__tests__/ProfilePage.test.tsx
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProfilePage } from '../ProfilePage';

const mockProfileData = {
  user: {
    id: '1',
    username: 'testuser',
    bio: '테스트 사용자입니다.',
    joinedAt: '2024-01-01T00:00:00Z',
    stats: {
      reviewCount: 5,
      likesReceived: 10,
      followerCount: 3,
      followingCount: 7,
      booksRead: 12,
    },
  },
  isOwner: false,
};

describe('ProfilePage', () => {
  it('프로필 정보를 정확히 표시한다', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ProfilePage userId="1" />
      </QueryClientProvider>
    );

    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByText('테스트 사용자입니다.')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // 독후감 수
  });
});
```

## 📊 성능 최적화

### 1. 데이터베이스 최적화

```sql
-- 사용자 조회 성능을 위한 인덱스
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_created_at ON users(created_at);

-- 통계 계산을 위한 인덱스
CREATE INDEX idx_reviews_author_id ON reviews(author_id);
CREATE INDEX idx_likes_review_author ON likes(review_id) WHERE review.author_id = ?;
```

### 2. 캐싱 전략

- **TanStack Query**: 5분 stale time, 30분 gc time
- **프로필 이미지**: Cloudinary CDN 캐싱
- **통계 데이터**: Redis 캐싱 (추후 Phase 5에서 구현)

### 3. 로딩 최적화

- **코드 스플리팅**: 라우트 레벨에서 dynamic import 사용
- **이미지 최적화**: Cloudinary 자동 포맷 변환 및 압축
- **프리페칭**: 라우터에서 데이터 미리 로딩

## ✅ 완료 기준

### Backend
- [ ] Prisma 스키마 업데이트 및 마이그레이션 완료
- [ ] GET `/api/users/:userId` API 구현 완료
- [ ] OptionalAuthGuard 구현 완료
- [ ] E2E 테스트 통과

### Frontend
- [ ] `/profile/:userId` 라우트 설정 완료
- [ ] ProfilePage, ProfileHeader, ProfileStats 컴포넌트 구현
- [ ] TanStack Query 설정 완료
- [ ] 프로필 데이터 조회 및 표시 정상 동작
- [ ] 로딩/에러 상태 처리 완료
- [ ] Component 테스트 통과

### 통합
- [ ] TypeScript 타입 에러 0개
- [ ] ESLint 경고 0개
- [ ] 성능 목표 달성 (LCP < 2.5s)
- [ ] 접근성 기본 요구사항 충족

## 🔄 다음 Phase 연결

Phase 1 완료 후 Phase 2(콘텐츠 탭 시스템)로 진행:
- ProfilePage에 탭 영역 추가
- 사용자별 콘텐츠 조회 API 구현
- 무한 스크롤 및 페이지네이션 적용

---

**예상 소요 시간**: 1-2주
**의존성**: 기존 User/Review/Book 모델
**다음 Phase**: Phase 2 - 콘텐츠 탭 시스템
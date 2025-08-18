# 07. 프로필 페이지 구현 요구사항

## 페이지 정보
- **경로**: `/profile/[userId]`
- **우선순위**: 2순위 (Core Features)
- **설명**: 사용자 프로필 정보, 활동 통계, 팔로우 기능
- **인증**: 비로그인 접근 가능, 상호작용 시 로그인 필요

## 📋 참조 문서

### 사용자 플로우
- **[프로필 관리](../user-flows/profile-management.md)** - 프로필 편집, 프로필 사진, 계정 삭제
- **[소셜 상호작용](../user-flows/social-interaction.md)** - 팔로우, 언팔로우, 프로필 탐색
- **[오류 처리](../user-flows/error-handling.md)** - 프로필 로딩 실패, 권한 오류

### 프로젝트 구조
- **[구현 페이지 목록](../implementation-pages.md)** - 프로필의 사용자 관리 체인
- **[사용자 흐름도 개요](../user-flows.md)** - 프로필 및 활동 관리 흐름

### 관련 PRD 문서
- **[설정 페이지](./08-settings.md)** - 프로필 편집과 계정 설정
- **[독후감 상세 페이지](./05-review-detail.md)** - 작성자 프로필 연결
- **[메인 피드 페이지](./01-main-feed.md)** - 사용자 프로필 클릭 진입점
- **[알림 페이지](./10-notifications.md)** - 팔로우 알림 시스템
- **[신고/차단 관리 페이지](./13-moderation.md)** - 사용자 차단 기능

## 핵심 기능

### 1. 프로필 정보 표시
- **기본 정보**: 프로필 사진, 닉네임, 자기소개, 가입일
- **활동 통계**: 독후감 수, 좋아요 받은 수, 팔로워/팔로잉 수
- **소셜 링크**: 개인 블로그, SNS 계정 (선택사항)
- **배지 시스템**: 활동 수준별 배지 표시

### 2. 콘텐츠 탭 시스템
- **독후감 탭**: 작성한 독후감 목록 (최신순/인기순)
- **좋아요 탭**: 좋아요한 독후감 목록 (본인만 볼 수 있음)
- **서재 탭**: 읽은 책 목록과 평가
- **팔로잉/팔로워 탭**: 팔로우 관계 목록

### 3. 팔로우 시스템
- **팔로우/언팔로우 버튼**: 실시간 상태 업데이트
- **상호 팔로우 표시**: "서로 팔로우" 배지
- **팔로우 추천**: 유사한 취향 사용자 추천
- **본인 프로필**: 수정하기 버튼 표시

### 4. 프로필 편집 (본인만)
- **기본 정보 수정**: 닉네임, 자기소개, 소셜 링크
- **프로필 사진 변경**: 업로드, 크롭, 편집
- **개인정보 설정**: 이메일 공개/비공개, 활동 공개 범위

## 필요한 API

### GET `/api/users/[userId]`
```typescript
interface UserProfileRequest {
  userId: string;
  includeStats?: boolean;
  includeActivity?: boolean;
}

interface UserProfileResponse {
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
    
    badges: Array<{
      id: string;
      name: string;
      description: string;
      icon: string;
      earnedAt: string;
    }>;
    
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
  }; // 로그인 사용자만
  
  isOwner: boolean;
}
```

### GET `/api/users/[userId]/reviews`
```typescript
interface UserReviewsRequest {
  userId: string;
  sort?: 'newest' | 'oldest' | 'popular';
  visibility?: 'public' | 'followers' | 'private';
  cursor?: string;
  limit?: number;
}

interface UserReviewsResponse {
  reviews: ReviewSummary[];
  pagination: {
    nextCursor?: string;
    hasMore: boolean;
    total: number;
  };
}

interface ReviewSummary {
  id: string;
  content: string; // 미리보기 150자
  rating: 'recommend' | 'not_recommend';
  tags: string[];
  createdAt: string;
  visibility: 'public' | 'followers' | 'private';
  
  book: {
    id: string;
    title: string;
    author: string;
    coverImage?: string;
  };
  
  stats: {
    likes: number;
    comments: number;
    shares: number;
  };
}
```

### GET `/api/users/[userId]/likes`
```typescript
interface UserLikesRequest {
  userId: string;
  cursor?: string;
  limit?: number;
}

interface UserLikesResponse {
  reviews: Array<{
    id: string;
    likedAt: string;
    review: ReviewSummary;
  }>;
  pagination: {
    nextCursor?: string;
    hasMore: boolean;
    total: number;
  };
}
```

### GET `/api/users/[userId]/books`
```typescript
interface UserBooksRequest {
  userId: string;
  status?: 'read' | 'reading' | 'want_to_read';
  sort?: 'recent' | 'title' | 'rating';
  cursor?: string;
  limit?: number;
}

interface UserBooksResponse {
  books: Array<{
    id: string;
    status: 'read' | 'reading' | 'want_to_read';
    rating?: 'recommend' | 'not_recommend';
    readAt?: string;
    addedAt: string;
    
    book: {
      id: string;
      title: string;
      author: string;
      coverImage?: string;
      publishedDate: string;
    };
    
    reviewId?: string; // 독후감 작성한 경우
  }>;
  
  pagination: {
    nextCursor?: string;
    hasMore: boolean;
    total: number;
  };
  
  summary: {
    totalBooks: number;
    readBooks: number;
    readingBooks: number;
    wantToReadBooks: number;
  };
}
```

### GET `/api/users/[userId]/follows`
```typescript
interface UserFollowsRequest {
  userId: string;
  type: 'followers' | 'following';
  cursor?: string;
  limit?: number;
}

interface UserFollowsResponse {
  users: Array<{
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
    }; // 로그인 사용자만
  }>;
  
  pagination: {
    nextCursor?: string;
    hasMore: boolean;
    total: number;
  };
}
```

### POST `/api/users/[userId]/follow`
```typescript
interface FollowUserRequest {
  action: 'follow' | 'unfollow';
}

interface FollowUserResponse {
  success: boolean;
  relationship: {
    isFollowing: boolean;
    isFollowedBy: boolean;
    isMutualFollow: boolean;
  };
  followerCount: number;
}
```

### PUT `/api/users/[userId]/profile`
```typescript
interface UpdateProfileRequest {
  username?: string;
  bio?: string;
  socialLinks?: {
    blog?: string;
    twitter?: string;
    instagram?: string;
  };
  privacy?: {
    emailVisible: boolean;
    activityVisible: 'all' | 'followers' | 'none';
    followersVisible: boolean;
  };
}

interface UpdateProfileResponse {
  success: boolean;
  user: UserProfile;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}
```

### POST `/api/users/[userId]/avatar`
```typescript
interface UpdateAvatarRequest {
  image: File;
  cropData?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface UpdateAvatarResponse {
  success: boolean;
  profileImage: string;
  sizes: {
    thumbnail: string; // 50x50
    small: string;     // 100x100
    medium: string;    // 200x200
    large: string;     // 400x400
  };
}
```

## 컴포넌트 구조

### 1. ProfilePage (메인 컴포넌트)
```typescript
interface ProfilePageProps {
  userId: string;
}

// 상태 관리
- user: UserProfile | null
- activeTab: 'reviews' | 'likes' | 'books' | 'followers' | 'following'
- isFollowing: boolean
- isLoading: boolean
- isOwner: boolean
```

### 2. ProfileHeader (프로필 헤더)
```typescript
interface ProfileHeaderProps {
  user: UserProfile;
  relationship?: UserRelationship;
  isOwner: boolean;
  onFollow: () => Promise<void>;
  onEdit: () => void;
}

// 하위 컴포넌트
- ProfileAvatar: 프로필 사진
- ProfileInfo: 기본 정보
- ProfileStats: 활동 통계
- FollowButton: 팔로우 버튼
- EditButton: 수정 버튼 (본인만)
```

### 3. ProfileTabs (탭 네비게이션)
```typescript
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
```

### 4. ProfileContent (탭 콘텐츠)
```typescript
interface ProfileContentProps {
  activeTab: string;
  userId: string;
  isOwner: boolean;
}

// 탭별 컴포넌트
- ReviewsList: 독후감 목록
- LikedReviewsList: 좋아요한 독후감 (본인만)
- BooksList: 서재 (읽은 책 목록)
- FollowsList: 팔로워/팔로잉 목록
```

### 5. ProfileEditModal (프로필 편집)
```typescript
interface ProfileEditModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: UpdateProfileRequest) => Promise<void>;
}

// 편집 가능 항목
- 닉네임
- 자기소개
- 소셜 링크
- 개인정보 공개 설정
```

### 6. AvatarEditModal (프로필 사진 편집)
```typescript
interface AvatarEditModalProps {
  currentImage?: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (file: File, cropData?: CropData) => Promise<void>;
}

// 기능
- 이미지 업로드 (드래그앤드롭)
- 이미지 크롭
- 미리보기
- 여러 크기 자동 생성
```

## 상태 관리 (Zustand)

### ProfileStore
```typescript
interface ProfileState {
  // 상태
  currentProfile: UserProfile | null;
  profileCache: Map<string, UserProfile>; // 사용자별 캐시
  isLoading: boolean;
  error: string | null;
  
  // 액션
  loadProfile: (userId: string) => Promise<void>;
  followUser: (userId: string) => Promise<void>;
  unfollowUser: (userId: string) => Promise<void>;
  updateProfile: (userId: string, data: UpdateProfileRequest) => Promise<void>;
  updateAvatar: (userId: string, file: File, cropData?: CropData) => Promise<void>;
  
  // 콘텐츠 로딩
  loadUserReviews: (userId: string, options?: UserReviewsRequest) => Promise<ReviewSummary[]>;
  loadUserLikes: (userId: string, options?: UserLikesRequest) => Promise<any[]>;
  loadUserBooks: (userId: string, options?: UserBooksRequest) => Promise<any[]>;
  loadUserFollows: (userId: string, type: 'followers' | 'following') => Promise<any[]>;
  
  // 유틸리티
  clearProfile: () => void;
  updateFollowStatus: (userId: string, isFollowing: boolean, followerCount: number) => void;
}
```

## 팔로우 시스템

### 팔로우 버튼 상태 관리
```typescript
const FollowButton: React.FC<{
  userId: string;
  isFollowing: boolean;
  followerCount: number;
  onFollow: (userId: string) => Promise<void>;
}> = ({ userId, isFollowing, followerCount, onFollow }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [optimisticFollow, setOptimisticFollow] = useState(isFollowing);
  const [optimisticCount, setOptimisticCount] = useState(followerCount);
  
  const handleFollow = async () => {
    setIsLoading(true);
    
    // 낙관적 업데이트
    const newFollowState = !optimisticFollow;
    setOptimisticFollow(newFollowState);
    setOptimisticCount(prev => newFollowState ? prev + 1 : prev - 1);
    
    try {
      await onFollow(userId);
    } catch (error) {
      // 실패 시 롤백
      setOptimisticFollow(isFollowing);
      setOptimisticCount(followerCount);
      showError('팔로우 처리 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };
  
  const buttonText = optimisticFollow ? '언팔로우' : '팔로우';
  const buttonStyle = optimisticFollow 
    ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' 
    : 'bg-blue-600 text-white hover:bg-blue-700';
  
  return (
    <button
      onClick={handleFollow}
      disabled={isLoading}
      className={`px-4 py-2 rounded-lg font-medium transition-colors ${buttonStyle}`}
    >
      {isLoading ? '처리중...' : buttonText}
    </button>
  );
};
```

### 상호 팔로우 감지
```typescript
const MutualFollowBadge: React.FC<{
  relationship: UserRelationship;
}> = ({ relationship }) => {
  if (!relationship.isMutualFollow) return null;
  
  return (
    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      서로 팔로우
    </span>
  );
};
```

## 프로필 편집 시스템

### 닉네임 중복 확인
```typescript
const useUsernameValidation = (currentUsername: string) => {
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [message, setMessage] = useState('');
  
  const checkUsername = useCallback(
    debounce(async (username: string) => {
      if (username === currentUsername) {
        setIsAvailable(true);
        setMessage('현재 닉네임입니다');
        return;
      }
      
      if (username.length < 2) {
        setIsAvailable(false);
        setMessage('최소 2자 이상 입력해주세요');
        return;
      }
      
      setIsChecking(true);
      try {
        const result = await api.checkUsernameAvailability(username);
        setIsAvailable(result.available);
        setMessage(result.available ? '사용 가능한 닉네임입니다' : '이미 사용 중인 닉네임입니다');
      } catch (error) {
        setIsAvailable(null);
        setMessage('확인 중 오류가 발생했습니다');
      } finally {
        setIsChecking(false);
      }
    }, 500),
    [currentUsername]
  );
  
  return { isChecking, isAvailable, message, checkUsername };
};
```

### 프로필 사진 크롭
```typescript
const AvatarCropper: React.FC<{
  imageFile: File;
  onCropComplete: (croppedImage: File, cropData: CropData) => void;
}> = ({ imageFile, onCropComplete }) => {
  const [crop, setCrop] = useState<CropData>({
    x: 0,
    y: 0,
    width: 200,
    height: 200
  });
  
  const [imageSrc, setImageSrc] = useState<string>('');
  
  useEffect(() => {
    const reader = new FileReader();
    reader.onload = () => setImageSrc(reader.result as string);
    reader.readAsDataURL(imageFile);
  }, [imageFile]);
  
  const handleCropComplete = async () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const image = new Image();
    
    image.onload = () => {
      canvas.width = crop.width;
      canvas.height = crop.height;
      
      ctx?.drawImage(
        image,
        crop.x, crop.y, crop.width, crop.height,
        0, 0, crop.width, crop.height
      );
      
      canvas.toBlob((blob) => {
        if (blob) {
          const croppedFile = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
          onCropComplete(croppedFile, crop);
        }
      }, 'image/jpeg', 0.9);
    };
    
    image.src = imageSrc;
  };
  
  return (
    <div className="space-y-4">
      <ReactCrop
        crop={crop}
        onChange={setCrop}
        aspect={1} // 정사각형 비율
      >
        <img src={imageSrc} alt="Crop preview" />
      </ReactCrop>
      
      <button
        onClick={handleCropComplete}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg"
      >
        크롭 완료
      </button>
    </div>
  );
};
```

## 배지 시스템

### 배지 종류 및 조건
```typescript
interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: BadgeCondition;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

interface BadgeCondition {
  type: 'review_count' | 'likes_received' | 'streak_days' | 'books_read';
  threshold: number;
}

const BADGES: Badge[] = [
  {
    id: 'first_review',
    name: '첫 독후감',
    description: '첫 번째 독후감을 작성했습니다',
    icon: '📝',
    condition: { type: 'review_count', threshold: 1 },
    tier: 'bronze'
  },
  {
    id: 'reviewer_10',
    name: '리뷰어',
    description: '독후감 10개를 작성했습니다',
    icon: '📚',
    condition: { type: 'review_count', threshold: 10 },
    tier: 'silver'
  },
  {
    id: 'popular_writer',
    name: '인기 작가',
    description: '좋아요 100개를 받았습니다',
    icon: '⭐',
    condition: { type: 'likes_received', threshold: 100 },
    tier: 'gold'
  },
  {
    id: 'bookworm',
    name: '책벌레',
    description: '100권의 책을 읽었습니다',
    icon: '🐛',
    condition: { type: 'books_read', threshold: 100 },
    tier: 'platinum'
  }
];

const checkBadgeEligibility = (userStats: UserStats): Badge[] => {
  return BADGES.filter(badge => {
    switch (badge.condition.type) {
      case 'review_count':
        return userStats.reviewCount >= badge.condition.threshold;
      case 'likes_received':
        return userStats.likesReceived >= badge.condition.threshold;
      case 'books_read':
        return userStats.booksRead >= badge.condition.threshold;
      case 'streak_days':
        return userStats.streakDays >= badge.condition.threshold;
      default:
        return false;
    }
  });
};
```

## 개인정보 보호

### 공개 범위 설정
```typescript
interface PrivacySettings {
  emailVisible: boolean; // 이메일 주소 공개
  activityVisible: 'all' | 'followers' | 'none'; // 활동 내역 공개 범위
  followersVisible: boolean; // 팔로워 목록 공개
  likesVisible: 'all' | 'followers' | 'none'; // 좋아요한 독후감 공개 범위
}

const PrivacySettingsForm: React.FC<{
  settings: PrivacySettings;
  onSave: (settings: PrivacySettings) => void;
}> = ({ settings, onSave }) => {
  const [formData, setFormData] = useState(settings);
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">개인정보 공개 설정</h3>
        <p className="text-gray-600">다른 사용자에게 공개할 정보를 선택하세요</p>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <label className="font-medium">이메일 주소</label>
            <p className="text-sm text-gray-600">프로필에서 이메일 주소 표시</p>
          </div>
          <input
            type="checkbox"
            checked={formData.emailVisible}
            onChange={(e) => setFormData({
              ...formData,
              emailVisible: e.target.checked
            })}
          />
        </div>
        
        <div>
          <label className="font-medium">활동 내역 공개 범위</label>
          <p className="text-sm text-gray-600">독후감, 댓글 등의 활동 내역</p>
          <select
            value={formData.activityVisible}
            onChange={(e) => setFormData({
              ...formData,
              activityVisible: e.target.value as 'all' | 'followers' | 'none'
            })}
            className="mt-2 block w-full rounded-md border-gray-300"
          >
            <option value="all">전체 공개</option>
            <option value="followers">팔로워만</option>
            <option value="none">비공개</option>
          </select>
        </div>
      </div>
      
      <button
        onClick={() => onSave(formData)}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg"
      >
        설정 저장
      </button>
    </div>
  );
};
```

## 성능 최적화

### 무한 스크롤 구현
```typescript
const useInfiniteUserContent = <T>(
  userId: string,
  contentType: 'reviews' | 'likes' | 'books' | 'followers' | 'following',
  options?: any
) => {
  const [items, setItems] = useState<T[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [cursor, setCursor] = useState<string>();
  
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    
    setIsLoading(true);
    try {
      const response = await api.getUserContent(userId, contentType, {
        ...options,
        cursor
      });
      
      setItems(prev => [...prev, ...response.items]);
      setCursor(response.pagination.nextCursor);
      setHasMore(response.pagination.hasMore);
    } catch (error) {
      console.error('Failed to load user content:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, contentType, cursor, isLoading, hasMore, options]);
  
  // 초기 로드
  useEffect(() => {
    setItems([]);
    setCursor(undefined);
    setHasMore(true);
    loadMore();
  }, [userId, contentType]);
  
  return { items, hasMore, isLoading, loadMore };
};
```

## 에러 처리

### 프로필 접근 권한 처리
```typescript
const ProfileAccessGuard: React.FC<{
  user: UserProfile;
  currentUser?: User;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ user, currentUser, children, fallback }) => {
  // 본인 프로필이거나 공개 프로필인 경우
  if (currentUser?.id === user.id || user.privacy.activityVisible === 'all') {
    return <>{children}</>;
  }
  
  // 팔로워만 공개이고 팔로워인 경우
  if (user.privacy.activityVisible === 'followers' && 
      user.relationship?.isFollowedBy) {
    return <>{children}</>;
  }
  
  // 접근 권한 없음
  return fallback || (
    <div className="text-center py-8">
      <p className="text-gray-600">비공개 프로필입니다</p>
    </div>
  );
};
```

## 접근성

### 스크린 리더 지원
```typescript
// ARIA 라벨링
<section role="main" aria-labelledby="profile-title">
  <h1 id="profile-title" className="sr-only">
    {user.username}님의 프로필
  </h1>
  
  <div role="tablist" aria-label="프로필 콘텐츠">
    <button
      role="tab"
      aria-selected={activeTab === 'reviews'}
      aria-controls="reviews-panel"
      id="reviews-tab"
    >
      독후감 {reviewCount}개
    </button>
  </div>
  
  <div
    role="tabpanel"
    id="reviews-panel"
    aria-labelledby="reviews-tab"
    hidden={activeTab !== 'reviews'}
  >
    {/* 독후감 목록 */}
  </div>
</section>
```

## 성능 목표

### Core Web Vitals
- **LCP**: < 2.5초 (프로필 정보 로딩)
- **FID**: < 100ms (탭 전환, 팔로우 버튼)
- **CLS**: < 0.1 (콘텐츠 로딩 시 레이아웃 변경 최소화)

### 사용자 경험 지표
- 프로필 초기 로딩: < 1.5초
- 팔로우 버튼 응답: < 500ms
- 탭 전환: < 300ms
- 무한 스크롤 로딩: < 1초
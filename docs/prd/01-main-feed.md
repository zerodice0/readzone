# 01. 메인 피드 페이지 구현 요구사항

## 페이지 정보
- **경로**: `/`
- **우선순위**: 1순위 (MVP)
- **설명**: Threads 스타일 무한 스크롤 피드
- **인증**: 비로그인 접근 가능 (읽기 전용)

## 📋 참조 문서

### 사용자 플로우
- **[소셜 상호작용 플로우](../user-flows/social-interaction.md)** - 피드 탐색, 무한 스크롤, 좋아요/댓글 상호작용 흐름
- **[신규 사용자 여정](../user-flows/onboarding.md)** - 비로그인 사용자의 피드 접근 및 로그인 유도 흐름
- **[오류 처리](../user-flows/error-handling.md)** - 네트워크 오류, 로딩 실패 시 대응 방안

### 프로젝트 구조
- **[구현 페이지 목록](../implementation-pages.md)** - 메인 피드의 전체 페이지 연결 관계 및 우선순위
- **[사용자 흐름도 개요](../user-flows.md)** - 메인 피드 중심의 사용자 여정 요약

### 관련 PRD 문서
- **[독후감 상세 페이지](./05-review-detail.md)** - 피드에서 클릭 시 이동하는 상세 페이지
- **[프로필 페이지](./07-profile.md)** - 작성자 프로필 클릭 시 이동 페이지
- **[로그인 페이지](./02-login.md)** - 상호작용 시 유도되는 로그인 페이지
- **[독후감 작성 페이지](./04-write.md)** - 피드에서 작성 버튼 클릭 시 이동 페이지
- **[알림 페이지](./10-notifications.md)** - 좋아요, 댓글 시 생성되는 알림 시스템

## 핵심 기능

### 1. 피드 탭 시스템
- **추천 탭** (기본): 알고리즘 기반 인기 독후감
- **최신 탭**: 작성 시간 기준 시간순 정렬
- **팔로잉 탭**: 팔로우한 사용자 독후감 (로그인 사용자만)

### 2. 무한 스크롤
- 페이지당 20개 독후감 로드
- 가상 스크롤 최적화 적용
- 스크롤 하단 도달 시 자동 로딩
- 로딩 스피너 및 에러 처리

### 3. 독후감 카드 UI
- 작성자 정보 (프로필 사진, 닉네임)
- 도서 정보 (표지, 제목, 저자)
- 독후감 내용 미리보기 (150자 제한)
- 상호작용 버튼 (좋아요, 댓글, 공유)
- 작성 시간 표시

### 4. 상호작용 처리
- **비로그인 사용자**: 상호작용 시 로그인 유도
- **로그인 사용자**: 즉시 처리 및 알림 생성
- 좋아요 토글 애니메이션
- 실시간 카운트 업데이트

## 필요한 API

### GET `/api/reviews/feed`
```typescript
interface FeedRequest {
  tab: 'recommended' | 'latest' | 'following';
  cursor?: string;
  limit: number; // 기본값: 20
}

interface FeedResponse {
  reviews: ReviewCard[];
  nextCursor: string | null;
  hasMore: boolean;
}

interface ReviewCard {
  id: string;
  content: string; // 미리보기 (150자)
  createdAt: string;
  author: {
    id: string;
    username: string;
    profileImage?: string;
  };
  book: {
    id: string;
    title: string;
    author: string;
    cover?: string;
  };
  stats: {
    likes: number;
    comments: number;
    shares: number;
  };
  userInteraction: {
    isLiked: boolean;
    isBookmarked: boolean;
  } | null; // 비로그인시 null
}
```

### POST `/api/reviews/:id/like`
```typescript
interface LikeRequest {
  action: 'like' | 'unlike';
}

interface LikeResponse {
  success: boolean;
  likesCount: number;
  isLiked: boolean;
}
```

## 추천 알고리즘 (서버 내부 구현)

추천 탭의 정렬은 서버에서 다음 공식으로 계산됩니다:

```typescript
// 서버 내부 추천 점수 계산 로직
function calculateRecommendationScore(review: Review, user?: User): number {
  // 1. 품질 점수 (상호작용 기반)
  const qualityScore = (review.likes * 3) + 
                      (review.comments * 2) + 
                      (review.views * 0.1) + 
                      (review.shares * 5);
  
  // 2. 시간 가중치 (최신성 반영)
  const daysAgo = (Date.now() - review.createdAt.getTime()) / (1000 * 60 * 60 * 24);
  const timeWeight = 1 / (1 + daysAgo * 0.5);
  
  // 3. 다양성 보너스 (중복 방지)
  const diversityBonus = isDuplicateBookOrAuthor(review) ? 0.7 : 1.0;
  
  // 4. 개인화 점수 (로그인 사용자만)
  const personalScore = user ? calculatePersonalScore(review, user) : 0;
  
  return (qualityScore * timeWeight * diversityBonus) + personalScore;
}
```

## 컴포넌트 구조

### 1. MainFeed (메인 컴포넌트)
```typescript
interface MainFeedProps {
  initialTab?: 'recommended' | 'latest' | 'following';
}

// 상태 관리
- activeTab: string
- reviews: ReviewCard[]
- isLoading: boolean
- hasMore: boolean
- error: string | null
```

### 2. FeedTabs (탭 네비게이션)
```typescript
interface FeedTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isAuthenticated: boolean;
}
```

### 3. ReviewCard (독후감 카드)
```typescript
interface ReviewCardProps {
  review: ReviewCard;
  onLike: (reviewId: string) => void;
  onComment: (reviewId: string) => void;
  onShare: (reviewId: string) => void;
  onProfileClick: (userId: string) => void;
  onBookClick: (bookId: string) => void;
}
```

### 4. InfiniteScroll (무한 스크롤)
```typescript
interface InfiniteScrollProps {
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  children: React.ReactNode;
}
```

## 상태 관리 (Zustand)

### FeedStore
```typescript
interface FeedState {
  // 상태
  activeTab: 'recommended' | 'latest' | 'following';
  reviews: Map<string, ReviewCard[]>; // 탭별 캐시
  isLoading: boolean;
  hasMore: boolean;
  error: string | null;
  
  // 액션
  setActiveTab: (tab: string) => void;
  loadReviews: (tab: string, cursor?: string) => Promise<void>;
  likeReview: (reviewId: string) => Promise<void>;
  updateReviewStats: (reviewId: string, stats: Partial<ReviewCard['stats']>) => void;
  clearFeed: () => void;
}
```

## 성능 최적화

### 1. 가상 스크롤
- `react-window` 또는 `@tanstack/react-virtual` 사용
- 뷰포트 외부 컴포넌트 언마운트
- 스크롤 성능 향상

### 2. 이미지 최적화
- Cloudinary 자동 최적화 활용
- 지연 로딩 (Intersection Observer)
- WebP/AVIF 형식 자동 변환

### 3. 캐싱 전략
- TanStack Query로 API 응답 캐싱
- 탭별 독립적인 캐시 관리
- stale-while-revalidate 패턴

## 접근성 고려사항

### 키보드 네비게이션
- Tab 키로 카드 간 이동
- Enter/Space로 상호작용
- 스크린 리더 호환 aria-label

### 모바일 최적화
- 터치 제스처 지원
- 스와이프로 탭 전환
- 반응형 그리드 레이아웃

## 에러 처리

### 네트워크 오류
- 자동 재시도 (지수 백오프)
- 오프라인 모드 감지
- 캐시된 데이터 표시

### 로딩 상태
- 스켈레톤 UI
- 부드러운 로딩 애니메이션
- 에러 메시지 및 재시도 버튼

## 추가 기능

### 필터링 (고급 기능)
- 장르별 필터 (소설, 에세이, 자기계발 등)
- 평점 필터 (추천/비추천)
- 작성 기간 필터

### 공유 기능
- 링크 복사
- 카카오톡 공유
- X(Twitter) 공유
- 메타 태그 최적화

## 성능 목표

### Core Web Vitals
- **LCP**: < 2.5초
- **FID**: < 100ms  
- **CLS**: < 0.1

### 사용자 경험 지표
- 첫 독후감 로딩: < 1초
- 무한 스크롤 응답: < 500ms
- 좋아요 애니메이션: 즉시 반응
# Quickstart Guide: 독후감 메인 피드

**Feature**: 002-feature
**Date**: 2025-11-09
**Status**: Ready for Implementation

## Overview

이 가이드는 독후감 메인 피드 기능을 빠르게 이해하고 구현을 시작하는 데 필요한 핵심 정보를 제공합니다.

## What You're Building

사용자들이 작성한 독후감을 시간순으로 탐색하는 메인 피드입니다:

- ✅ 최신순 정렬
- ✅ 무한 스크롤 (하단 800px 트리거)
- ✅ 비로그인 사용자 조회 가능
- ✅ 로그인 사용자 상호작용 (좋아요/북마크/공유)
- ✅ SPA 방식 전환 (부드러운 UX)

## Quick Start

### 1. Prerequisites

```bash
# Node.js 20+
node --version

# pnpm 8+
pnpm --version

# PostgreSQL running
psql --version
```

### 2. Database Setup

```bash
cd packages/backend

# 1. Prisma schema 업데이트 (data-model.md 참고)
# schema.prisma에 Book, Review, Like, Bookmark 모델 추가

# 2. Migration 생성
pnpm prisma migrate dev --name add-review-feed-entities

# 3. Prisma Client 재생성
pnpm prisma generate

# 4. (선택) 시드 데이터 생성
pnpm db:seed
```

### 3. Backend Setup

```bash
cd packages/backend

# 1. 의존성 설치 (이미 설치되어 있으면 스킵)
pnpm install

# 2. 환경 변수 설정
# .env 파일에 다음 추가:
# GOOGLE_BOOKS_API_KEY=your_api_key
# ALADIN_API_KEY=your_api_key

# 3. 개발 서버 시작
pnpm dev
```

**구현할 모듈**:

- `src/reviews/` - 독후감 CRUD 및 피드 조회
- `src/books/` - 책 검색 및 정보 관리
- `src/likes/` - 좋아요 토글
- `src/bookmarks/` - 북마크 토글 및 조회

### 4. Frontend Setup

```bash
cd packages/frontend

# 1. 의존성 설치
pnpm add zustand  # 상태 관리
pnpm add -D @types/node  # TypeScript 타입

# 2. shadcn/ui 초기화 (아직 설정되지 않은 경우)
npx shadcn-ui@latest init

# 3. 필요한 shadcn/ui 컴포넌트 추가
npx shadcn-ui@latest add card
npx shadcn-ui@latest add button
npx shadcn-ui@latest add skeleton

# 4. 개발 서버 시작
pnpm dev
```

**구현할 컴포넌트**:

- `src/pages/Feed/FeedPage.tsx` - 메인 피드 페이지
- `src/components/ReviewCard/ReviewCard.tsx` - 독후감 카드
- `src/components/InfiniteScroll/InfiniteScroll.tsx` - 무한 스크롤
- `src/stores/feedStore.ts` - 피드 상태 관리 (Zustand)
- `src/services/api/reviews.ts` - 독후감 API 클라이언트

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (React)                    │
│  ┌────────────┐  ┌────────────┐  ┌─────────────────┐  │
│  │ FeedPage   │  │ ReviewCard │  │ InfiniteScroll  │  │
│  └──────┬─────┘  └──────┬─────┘  └────────┬────────┘  │
│         │                │                  │           │
│  ┌──────▼────────────────▼──────────────────▼────────┐ │
│  │           Zustand Store (feedStore)               │ │
│  └──────────────────────┬────────────────────────────┘ │
│                         │                               │
│  ┌──────────────────────▼────────────────────────────┐ │
│  │         API Client (axios)                        │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────┬───────────────────────────────┘
                          │ REST API
┌─────────────────────────▼───────────────────────────────┐
│                   Backend (NestJS)                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────────┐   │
│  │ Reviews    │  │ Books      │  │ Likes/         │   │
│  │ Controller │  │ Controller │  │ Bookmarks      │   │
│  └──────┬─────┘  └──────┬─────┘  │ Controller     │   │
│         │                │        └────────┬───────┘   │
│  ┌──────▼────────────────▼─────────────────▼────────┐  │
│  │              Services Layer                      │  │
│  └──────────────────────┬───────────────────────────┘  │
│                         │                               │
│  ┌──────────────────────▼───────────────────────────┐  │
│  │         Prisma ORM + PostgreSQL                  │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Data Flow

### Feed Loading (비로그인 사용자)

```
1. FeedPage 마운트
   ↓
2. feedStore.loadFeed() 호출
   ↓
3. GET /api/reviews/feed?page=0&limit=20
   ↓
4. Backend: Prisma query (status=PUBLISHED, orderBy publishedAt DESC)
   ↓
5. Backend: include user, book (N+1 방지)
   ↓
6. Frontend: feedStore에 데이터 저장
   ↓
7. ReviewCard 렌더링
   ↓
8. InfiniteScroll 컴포넌트가 하단 800px 감지
   ↓
9. feedStore.loadMore() → page=1로 다음 페이지 로드
```

### Feed Loading (로그인 사용자)

```
1-6. 위와 동일
   ↓
7. Backend: 사용자별 좋아요/북마크 상태 조회 (join)
   ↓
8. Frontend: isLikedByMe, isBookmarkedByMe 포함된 데이터 렌더링
   ↓
9. 무한 스크롤 동작
```

### Like Toggle

```
1. ReviewCard에서 좋아요 버튼 클릭
   ↓
2. feedStore.toggleLike(reviewId) 호출
   ↓
3. POST /api/reviews/:id/like
   ↓
4. Backend: 트랜잭션 시작
   ↓
5. Backend: Like 레코드 생성/삭제
   ↓
6. Backend: Review.likeCount 증가/감소
   ↓
7. Backend: 트랜잭션 커밋
   ↓
8. Frontend: feedStore 상태 업데이트 (낙관적 업데이트)
   ↓
9. ReviewCard 리렌더링 (새로운 likeCount 표시)
```

## Key Implementation Steps

### Phase 1: Database & Backend Core (Day 1-2)

**Priority: P0 (Critical)**

1. ✅ Prisma schema 업데이트 (`data-model.md` 참고)
2. ✅ Migration 실행
3. 📝 Reviews module 구현
   - `ReviewsController`: 피드 조회, 상세 조회, CRUD
   - `ReviewsService`: 비즈니스 로직, Prisma 쿼리
4. 📝 Books module 구현
   - `BooksController`: 검색, 조회
   - `BooksService`: 외부 API 통합, 캐싱
   - `BookApiService`: Google Books/Aladin API 클라이언트
5. 📝 Likes module 구현
   - `LikesController`: 좋아요 토글
   - `LikesService`: 트랜잭션 처리
6. 📝 Bookmarks module 구현
   - `BookmarksController`: 북마크 토글 및 조회
   - `BookmarksService`: 트랜잭션 처리

**Testing**: API 엔드포인트 수동 테스트 (Postman/Insomnia)

### Phase 2: Frontend Core (Day 3-4)

**Priority: P0 (Critical)**

1. 📝 Feed Store (Zustand)

   ```typescript
   interface FeedState {
     reviews: Review[];
     page: number;
     hasMore: boolean;
     isLoading: boolean;
     loadFeed: () => Promise<void>;
     loadMore: () => Promise<void>;
     toggleLike: (reviewId: string) => Promise<void>;
     toggleBookmark: (reviewId: string) => Promise<void>;
   }
   ```

2. 📝 ReviewCard 컴포넌트
   - 책 표지 이미지
   - 제목, 저자, 독후감 내용 (150자)
   - 좋아요/북마크/공유 버튼
   - 추천/비추천 아이콘

3. 📝 InfiniteScroll 컴포넌트
   - Intersection Observer API
   - 하단 800px 트리거
   - Loading state

4. 📝 FeedPage
   - ReviewCard 목록 렌더링
   - InfiniteScroll 통합
   - Empty state, Error state

**Testing**: 프론트엔드 컴포넌트 단위 테스트 (Vitest)

### Phase 3: Integration & Polish (Day 5-6)

**Priority: P1 (High)**

1. 📝 E2E 테스트
   - 피드 로딩
   - 무한 스크롤
   - 좋아요/북마크 토글

2. 📝 성능 최적화
   - API 응답 시간 측정
   - 프론트엔드 렌더링 최적화
   - 이미지 lazy loading

3. 📝 에러 핸들링
   - 네트워크 에러
   - 타임아웃
   - 빈 데이터

4. 📝 접근성
   - 키보드 네비게이션
   - 스크린 리더 지원
   - ARIA 속성

**Testing**: 수동 QA 및 성능 테스트

### Phase 4: Additional Features (Day 7+)

**Priority: P2 (Medium)**

1. 📝 독후감 상세 페이지 (`ReviewDetailPage`)
2. 📝 공유 링크 생성
3. 📝 북마크 목록 페이지
4. 📝 책 상세 페이지

## API Endpoints Reference

### Core Endpoints (MVP)

```typescript
// 피드 조회
GET /api/reviews/feed?page=0&limit=20

// 독후감 상세
GET /api/reviews/:id

// 좋아요 토글
POST /api/reviews/:id/like

// 북마크 토글
POST /api/reviews/:id/bookmark

// 책 검색
GET /api/books/search?q=검색어

// 책 저장
POST /api/books
```

**자세한 API 명세는 `contracts/` 디렉토리 참고**

## Code Examples

### Backend: Feed Query (NestJS + Prisma)

```typescript
async getFeed(page: number, limit: number, userId?: string) {
  const reviews = await this.prisma.review.findMany({
    where: {
      status: 'PUBLISHED',
      deletedAt: null,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          profileImage: true,
        },
      },
      book: {
        select: {
          id: true,
          title: true,
          author: true,
          coverImageUrl: true,
        },
      },
      ...(userId && {
        likes: {
          where: { userId },
          select: { id: true },
        },
        bookmarks: {
          where: { userId },
          select: { id: true },
        },
      }),
    },
    orderBy: {
      publishedAt: 'desc',
    },
    skip: page * limit,
    take: limit,
  });

  return reviews.map(review => ({
    ...review,
    content: review.content.substring(0, 150),
    isLikedByMe: userId ? review.likes.length > 0 : undefined,
    isBookmarkedByMe: userId ? review.bookmarks.length > 0 : undefined,
  }));
}
```

### Frontend: Feed Store (Zustand)

```typescript
import { create } from 'zustand';

interface FeedState {
  reviews: Review[];
  page: number;
  hasMore: boolean;
  isLoading: boolean;
  loadFeed: () => Promise<void>;
  loadMore: () => Promise<void>;
  toggleLike: (reviewId: string) => Promise<void>;
}

export const useFeedStore = create<FeedState>((set, get) => ({
  reviews: [],
  page: 0,
  hasMore: true,
  isLoading: false,

  loadFeed: async () => {
    set({ isLoading: true });
    const response = await axios.get('/api/reviews/feed', {
      params: { page: 0, limit: 20 },
    });
    set({
      reviews: response.data.data,
      page: 0,
      hasMore: response.data.meta.hasMore,
      isLoading: false,
    });
  },

  loadMore: async () => {
    const { page, hasMore, isLoading } = get();
    if (!hasMore || isLoading) return;

    set({ isLoading: true });
    const nextPage = page + 1;
    const response = await axios.get('/api/reviews/feed', {
      params: { page: nextPage, limit: 20 },
    });
    set({
      reviews: [...get().reviews, ...response.data.data],
      page: nextPage,
      hasMore: response.data.meta.hasMore,
      isLoading: false,
    });
  },

  toggleLike: async (reviewId: string) => {
    // Optimistic update
    set((state) => ({
      reviews: state.reviews.map((r) =>
        r.id === reviewId
          ? {
              ...r,
              isLikedByMe: !r.isLikedByMe,
              likeCount: r.isLikedByMe ? r.likeCount - 1 : r.likeCount + 1,
            }
          : r
      ),
    }));

    try {
      await axios.post(`/api/reviews/${reviewId}/like`);
    } catch (error) {
      // Rollback on error
      set((state) => ({
        reviews: state.reviews.map((r) =>
          r.id === reviewId
            ? {
                ...r,
                isLikedByMe: !r.isLikedByMe,
                likeCount: r.isLikedByMe ? r.likeCount + 1 : r.likeCount - 1,
              }
            : r
        ),
      }));
      throw error;
    }
  },
}));
```

### Frontend: InfiniteScroll Component

```typescript
import { useEffect, useRef } from 'react';

interface InfiniteScrollProps {
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
}

export const InfiniteScroll: React.FC<InfiniteScrollProps> = ({
  onLoadMore,
  hasMore,
  isLoading,
}) => {
  const observerRef = useRef<IntersectionObserver>();
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore || isLoading) return;

    observerRef.current = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      {
        rootMargin: '800px',
      }
    );

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoading, onLoadMore]);

  return <div ref={sentinelRef} />;
};
```

## Common Pitfalls

### ❌ N+1 Query Problem

**Bad**:

```typescript
// 각 review마다 user와 book을 별도로 조회
const reviews = await prisma.review.findMany();
for (const review of reviews) {
  review.user = await prisma.user.findUnique({ where: { id: review.userId } });
  review.book = await prisma.book.findUnique({ where: { id: review.bookId } });
}
```

**Good**:

```typescript
// include로 한 번에 조회
const reviews = await prisma.review.findMany({
  include: {
    user: true,
    book: true,
  },
});
```

### ❌ Missing Transaction

**Bad**:

```typescript
// Like 레코드와 likeCount 업데이트가 분리됨
await prisma.like.create({ data: { userId, reviewId } });
await prisma.review.update({
  where: { id: reviewId },
  data: { likeCount: { increment: 1 } },
});
```

**Good**:

```typescript
// 트랜잭션으로 원자적 처리
await prisma.$transaction([
  prisma.like.create({ data: { userId, reviewId } }),
  prisma.review.update({
    where: { id: reviewId },
    data: { likeCount: { increment: 1 } },
  }),
]);
```

### ❌ No Error Handling

**Bad**:

```typescript
const response = await axios.get('/api/reviews/feed');
setReviews(response.data.data);
```

**Good**:

```typescript
try {
  const response = await axios.get('/api/reviews/feed');
  setReviews(response.data.data);
} catch (error) {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED') {
      showError('네트워크 타임아웃. 다시 시도해주세요.');
    } else {
      showError('데이터를 불러오는 데 실패했습니다.');
    }
  }
}
```

## Testing Strategy

### Backend Tests

1. **Unit Tests** (Vitest)
   - Service 로직 테스트
   - 비즈니스 규칙 검증

2. **Integration Tests** (Supertest)
   - API 엔드포인트 테스트
   - 데이터베이스 통합 테스트

### Frontend Tests

1. **Component Tests** (Vitest + Testing Library)
   - ReviewCard 렌더링
   - 사용자 상호작용 테스트

2. **Store Tests** (Vitest)
   - Zustand store 로직 테스트
   - 상태 변화 검증

### E2E Tests

1. **User Flows** (Playwright or Cypress)
   - 피드 로딩 → 무한 스크롤
   - 좋아요 토글
   - 북마크 토글
   - 독후감 상세 페이지 이동

## Performance Targets

| Metric                | Target | Critical |
| --------------------- | ------ | -------- |
| 피드 첫 로딩          | <2초   | <3초     |
| 무한 스크롤 추가 로딩 | <3초   | <5초     |
| API 응답 시간 (p95)   | <200ms | <500ms   |
| 스크롤 FPS            | 60fps  | 30fps    |
| 동시 사용자           | 500명  | 100명    |

## Troubleshooting

### Issue: 피드가 로딩되지 않음

**Check**:

1. Backend 서버가 실행 중인지 확인
2. 데이터베이스 연결 확인
3. Migration이 적용되었는지 확인
4. 브라우저 콘솔에서 네트워크 에러 확인

### Issue: 무한 스크롤이 작동하지 않음

**Check**:

1. IntersectionObserver API 지원 확인 (최신 브라우저)
2. `rootMargin: '800px'` 설정 확인
3. `hasMore` 상태가 올바른지 확인
4. `isLoading` 상태로 중복 요청 방지 확인

### Issue: 좋아요/북마크 토글이 느림

**Check**:

1. 낙관적 업데이트 적용 확인
2. 트랜잭션 처리 확인
3. 인덱스 설정 확인 (userId, reviewId)
4. 네트워크 지연 확인

## Next Steps

1. ✅ Phase 1 완료 후 → Backend API 테스트
2. ✅ Phase 2 완료 후 → Frontend 통합 테스트
3. ✅ Phase 3 완료 후 → E2E 테스트 및 성능 측정
4. → Production 배포 준비 (환경 변수, 모니터링, 로깅)

## Resources

- [spec.md](./spec.md) - 기능 명세
- [research.md](./research.md) - 기술 결정 및 근거
- [data-model.md](./data-model.md) - 데이터 모델 상세
- [contracts/](./contracts/) - API 계약서
- [plan.md](./plan.md) - 구현 계획

## Support

문제가 발생하거나 질문이 있는 경우:

1. 이 가이드의 Troubleshooting 섹션 확인
2. API contracts 문서 확인
3. 팀 채널에 질문
4. GitHub Issues에 버그 리포트

---

**Happy Coding! 🚀**

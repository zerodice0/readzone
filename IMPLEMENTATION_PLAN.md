# ReadZone 구현 계획서

**작성일:** 2025-01-15
**최종 업데이트:** 2025-01-16
**프로젝트:** ReadZone - 독후감 공유 플랫폼

---

## 📋 목차

1. [프로젝트 현황](#프로젝트-현황)
2. [Phase 3: 네비게이션 및 기본 UX](#phase-3-네비게이션-및-기본-ux-긴급)
3. [Phase 4: 독후감 작성 기능](#phase-4-독후감-작성-기능-핵심)
4. [Phase 5: 책 관리 기능](#phase-5-책-관리-기능-중요)
5. [Phase 6: 사용자 콘텐츠 관리](#phase-6-사용자-콘텐츠-관리)
6. [Phase 7: 검색 및 필터링](#phase-7-검색-및-필터링)
7. [Phase 8: 폴리싱 및 최적화](#phase-8-폴리싱-및-최적화)
8. [Phase 9: 배포 준비](#phase-9-배포-준비)

---

## 프로젝트 현황

### ✅ 완료된 작업 (Phase 1-8)

**Phase 1: Convex + Clerk 통합**

- [x] Convex 프로젝트 초기화
- [x] Clerk 계정 설정 및 통합
- [x] 환경변수 설정
- [x] 개발 환경 통합 (concurrently)
- [x] JWT Template 설정
- [x] 인증 연동 완료

**Phase 2: Frontend 페이지 마이그레이션**

- [x] FeedPage → Convex queries 사용
- [x] ReviewDetailPage → Convex queries 사용
- [x] ProfilePage → Clerk user data 사용
- [x] DashboardPage → Convex queries 사용
- [x] TypeScript 타입 안정성 에러 수정 (57개 → 0개)

**Phase 2.5: UI/UX 디자인 시스템**

- [x] 디자인 계획 문서화
- [x] 색상 시스템 구현 (warm amber/orange palette)
- [x] PostCSS + Tailwind CSS 설정
- [x] shadcn/ui 컴포넌트 통합
- [x] 모든 페이지 디자인 적용

**Phase 3: 네비게이션 및 기본 UX**

- [x] Header 컴포넌트 구현
- [x] Layout 컴포넌트 생성
- [x] 모바일 반응형 메뉴
- [x] Clerk UserButton 통합
- [x] 로그인 유도 UX
- [x] Convex 샘플 데이터 추가

**Phase 4: 독후감 작성 기능**

- [x] 책 검색 API 구현
- [x] 책 검색 UI 컴포넌트
- [x] 리뷰 작성 폼 (2단계 워크플로우)
- [x] 리뷰 수정/삭제 기능
- [x] 별점 UI 컴포넌트
- [x] 미리보기 기능
- [x] 초안 저장/발행 기능

**Phase 5: 책 관리 기능**

- [x] 책 목록 페이지 (BooksPage)
- [x] 책 상세 페이지 (BookDetailPage)
- [x] BookCard 컴포넌트
- [x] 책 통계 (평균 평점, 리뷰 개수)
- [x] Infinite scroll 페이지네이션

**Phase 6: 사용자 콘텐츠 관리**

- [x] 내 독후감 페이지 (MyReviewsPage)
- [x] 북마크 페이지 (BookmarksPage)
- [x] 상태 필터링 (전체/발행/초안)
- [x] 정렬 기능 (최신순/인기순)

**Phase 7: 검색 및 필터링**

- [x] 피드 검색 기능 (제목/책/저자)
- [x] Debounced 검색 입력
- [x] FeedFilters 컴포넌트
- [x] 정렬 옵션 (최신순/인기순/평점순)
- [x] 추천 필터 (전체/추천/비추천)

**Phase 8: 폴리싱 및 최적화**

- [x] 반응형 디자인 검증
- [x] Code splitting (lazy loading)
- [x] 성능 최적화
- [x] 접근성 개선 (ARIA 속성)

### 🎉 현재 상태

**완료된 핵심 기능:**

1. ✅ **네비게이션**: Header, Layout, 모바일 메뉴 구현 완료
2. ✅ **독후감 작성**: 2단계 워크플로우, 수정/삭제 기능
3. ✅ **책 관리**: 책 목록, 검색, 상세 페이지 구현
4. ✅ **샘플 데이터**: 10개 책 + 다수 리뷰 시드 데이터
5. ✅ **사용자 경험**: 검색, 필터링, 정렬, 로그인 유도 UI

**다음 단계:**

- Phase 9: 배포 준비 (프로덕션 환경 설정)

---

## Phase 3: 네비게이션 및 기본 UX (긴급)

**목표:** 사용자가 앱을 즉시 사용할 수 있도록 기본 네비게이션 구현

**예상 소요 시간:** 4-6시간

### Task 3.1: Header 컴포넌트 구현 (2시간)

**파일:**

- `packages/frontend/src/components/layout/Header.tsx`
- `packages/frontend/src/components/layout/Layout.tsx`

**요구사항:**

- [ ] Header 컴포넌트 생성
  - [ ] 로고 (ReadZone) 및 홈 링크
  - [ ] 메인 네비게이션 (피드, 책 목록)
  - [ ] 반응형 모바일 메뉴 (햄버거)
  - [ ] 로그인/회원가입 버튼 (비로그인 시)
  - [ ] 사용자 메뉴 (로그인 시 - Clerk UserButton)

- [ ] Layout 컴포넌트 생성
  - [ ] Header + children 구조
  - [ ] Sticky header (스크롤 시 고정)
  - [ ] 컨테이너 최대 너비 설정

**세부 구현:**

```tsx
// Header.tsx 구조
- 로고: Link to "/"
- 데스크톱 네비게이션:
  * "피드" → /feed
  * "책 목록" → /books
- 우측:
  * <SignedOut>: "로그인" + "회원가입" 버튼
  * <SignedIn>: <UserButton afterSignOutUrl="/feed" />
- 모바일: 햄버거 메뉴 (Sheet 컴포넌트 사용)
```

**체크리스트:**

- [ ] Header 컴포넌트 파일 생성
- [ ] Layout 컴포넌트 파일 생성
- [ ] router.tsx에 Layout 적용
- [ ] 모바일 반응형 테스트
- [ ] 로그인/로그아웃 동작 테스트
- [ ] 네비게이션 링크 동작 확인

---

### Task 3.2: 사용자 드롭다운 메뉴 (1시간)

**파일:**

- `packages/frontend/src/components/layout/UserMenu.tsx`

**요구사항:**

- [ ] Clerk의 `<UserButton>` 컴포넌트 사용
- [ ] 커스텀 메뉴 항목 추가 (선택사항)
  - [ ] "내 독후감" → /my-reviews
  - [ ] "북마크" → /my-bookmarks
  - [ ] "대시보드" → /dashboard
  - [ ] "설정" → /settings

**체크리스트:**

- [ ] UserButton 통합 및 스타일링
- [ ] 드롭다운 메뉴 동작 확인
- [ ] 로그아웃 후 리디렉션 테스트

---

### Task 3.3: 로그인 유도 UX 개선 (1시간)

**파일:**

- `packages/frontend/src/components/LoginPrompt.tsx` (기존)
- `packages/frontend/src/pages/Feed/FeedPage.tsx` (수정)

**요구사항:**

- [ ] 비로그인 사용자 피드 접근 허용 (현재 가능)
- [ ] "독후감 작성하기" CTA 버튼 추가
  - [ ] 비로그인 시: 로그인 프롬프트 모달 표시
  - [ ] 로그인 시: /reviews/new로 이동
- [ ] 좋아요/북마크 클릭 시 로그인 프롬프트 (현재 구현됨)

**체크리스트:**

- [ ] CTA 버튼 디자인 및 배치
- [ ] 로그인 프롬프트 동작 확인
- [ ] 로그인 후 원래 페이지 복귀 확인

---

### Task 3.4: Convex 샘플 데이터 추가 (1시간)

**파일:**

- `convex/_seed.ts` (새로 생성)

**요구사항:**

- [ ] 샘플 책 10권 추가
  - [ ] 한국 문학 5권
  - [ ] 외국 문학 3권
  - [ ] 비문학 2권
- [ ] 각 책마다 샘플 리뷰 2-3개
  - [ ] 다양한 평점 (1-5)
  - [ ] 추천/비추천 혼합
  - [ ] 읽기 상태 다양화

**샘플 책 목록:**

1. 클린 코드 - 로버트 C. 마틴
2. 리팩터링 2판 - 마틴 파울러
3. 이펙티브 타입스크립트 - 댄 밴더캄
4. 데미안 - 헤르만 헤세
5. 1984 - 조지 오웰
6. 채식주의자 - 한강
7. 82년생 김지영 - 조남주
8. 미드나잇 라이브러리 - 맷 헤이그
9. 코스모스 - 칼 세이건
10. 사피엔스 - 유발 하라리

**체크리스트:**

- [ ] Seed 스크립트 작성
- [ ] 샘플 데이터 실행 및 확인
- [ ] 피드 페이지에서 샘플 리뷰 표시 확인

---

## Phase 4: 독후감 작성 기능 (핵심)

**목표:** 사용자가 독후감을 작성하고 발행할 수 있는 완전한 워크플로우 구현

**예상 소요 시간:** 8-12시간

### Task 4.1: 책 검색 API 구현 (2시간)

**파일:**

- `convex/books.ts` (기존 파일 수정)

**요구사항:**

- [ ] 책 검색 쿼리 추가
  - [ ] 제목 검색 (부분 일치)
  - [ ] 저자 검색 (부분 일치)
  - [ ] 페이지네이션 지원
- [ ] 책 생성 mutation 추가 (사용자가 직접 추가 가능)

**Convex 함수:**

```typescript
// convex/books.ts
export const search = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // 제목 또는 저자에서 검색
    // paginationOptsValidator 추가 고려
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    author: v.string(),
    description: v.optional(v.string()),
    isbn: v.optional(v.string()),
    coverImageUrl: v.optional(v.string()),
    publishedYear: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // 중복 체크 (ISBN 또는 제목+저자)
    // 책 생성
  },
});
```

**체크리스트:**

- [ ] search 쿼리 구현
- [ ] create mutation 구현
- [ ] 중복 체크 로직 추가
- [ ] Convex Dashboard에서 테스트

---

### Task 4.2: 책 검색 UI 컴포넌트 (3시간)

**파일:**

- `packages/frontend/src/components/review/BookSearch.tsx`
- `packages/frontend/src/components/review/BookSearchResult.tsx`

**요구사항:**

- [ ] 검색 입력 필드
  - [ ] 실시간 검색 (debounce 500ms)
  - [ ] 로딩 상태 표시
- [ ] 검색 결과 목록
  - [ ] 책 표지 이미지
  - [ ] 제목, 저자, 출판 연도
  - [ ] "선택" 버튼
- [ ] 책 직접 추가 옵션
  - [ ] "찾는 책이 없나요?" 링크
  - [ ] 책 추가 모달/폼

**체크리스트:**

- [ ] BookSearch 컴포넌트 생성
- [ ] debounce 훅 구현
- [ ] 검색 결과 표시
- [ ] 책 선택 기능
- [ ] 책 추가 모달 구현

---

### Task 4.3: 리뷰 작성 폼 구현 (4시간)

**파일:**

- `packages/frontend/src/pages/ReviewNew/ReviewNewPage.tsx`
- `packages/frontend/src/components/review/ReviewForm.tsx`
- `packages/frontend/src/components/review/ReviewPreview.tsx`

**요구사항:**

- [ ] 2단계 워크플로우
  - [ ] 1단계: 책 검색 및 선택
  - [ ] 2단계: 리뷰 작성
- [ ] 리뷰 폼 필드
  - [ ] 제목 (선택)
  - [ ] 내용 (필수, textarea)
  - [ ] 평점 (1-5, 별점 UI)
  - [ ] 추천 여부 (라디오 버튼)
  - [ ] 읽기 상태 (읽는 중/완독/중단)
- [ ] 미리보기 기능
  - [ ] 작성 중인 리뷰 실시간 미리보기
  - [ ] 모달 또는 사이드 패널
- [ ] 저장 옵션
  - [ ] "초안 저장" (DRAFT)
  - [ ] "발행" (PUBLISHED)

**체크리스트:**

- [ ] ReviewNewPage 라우트 추가 (/reviews/new)
- [ ] 2단계 워크플로우 상태 관리
- [ ] ReviewForm 컴포넌트 구현
- [ ] 별점 UI 컴포넌트 (StarRating)
- [ ] 미리보기 기능 구현
- [ ] 초안 저장 기능
- [ ] 발행 기능
- [ ] 폼 검증 (필수 필드, 평점 범위)
- [ ] 성공 시 리디렉션 (/reviews/:id)

---

### Task 4.4: 리뷰 수정/삭제 기능 (2시간)

**파일:**

- `packages/frontend/src/pages/ReviewEdit/ReviewEditPage.tsx`
- ReviewDetailPage에 수정/삭제 버튼 추가

**요구사항:**

- [ ] ReviewEditPage 구현 (/reviews/:id/edit)
  - [ ] 기존 리뷰 데이터 로드
  - [ ] ReviewForm 재사용
  - [ ] 수정 권한 체크 (본인만)
- [ ] ReviewDetailPage 수정
  - [ ] "수정" 버튼 (본인 리뷰인 경우만)
  - [ ] "삭제" 버튼 (본인 리뷰인 경우만)
  - [ ] 삭제 확인 모달

**체크리스트:**

- [ ] ReviewEditPage 라우트 추가
- [ ] 기존 리뷰 로드 및 폼 채우기
- [ ] 수정 기능 구현
- [ ] 삭제 기능 구현
- [ ] 권한 체크 로직
- [ ] 삭제 확인 모달

---

## Phase 5: 책 관리 기능 (중요)

**목표:** 책 목록 및 상세 페이지 구현으로 책 중심 탐색 기능 제공

**예상 소요 시간:** 6-8시간

### Task 5.1: 책 목록 페이지 (3시간)

**파일:**

- `packages/frontend/src/pages/Books/BooksPage.tsx`
- `packages/frontend/src/components/book/BookCard.tsx`

**요구사항:**

- [ ] Convex 쿼리: 모든 책 목록 (페이지네이션)
- [ ] 책 카드 레이아웃
  - [ ] 표지 이미지
  - [ ] 제목, 저자
  - [ ] 리뷰 개수
  - [ ] 평균 평점
- [ ] Infinite scroll
- [ ] 검색 필터 (제목/저자)

**Convex 함수:**

```typescript
// convex/books.ts
export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    // 모든 책 조회 + 리뷰 개수, 평균 평점 포함
  },
});
```

**체크리스트:**

- [ ] BooksPage 컴포넌트 생성
- [ ] BookCard 컴포넌트 생성
- [ ] Convex list 쿼리 구현
- [ ] 페이지네이션 구현
- [ ] 검색 기능 추가
- [ ] 라우트 추가 (/books)

---

### Task 5.2: 책 상세 페이지 (3시간)

**파일:**

- `packages/frontend/src/pages/BookDetail/BookDetailPage.tsx`
- `convex/books.ts` (쿼리 추가)

**요구사항:**

- [ ] 책 정보 표시
  - [ ] 표지 이미지
  - [ ] 제목, 저자, 출판 연도
  - [ ] 설명
  - [ ] ISBN
- [ ] 리뷰 통계
  - [ ] 평균 평점
  - [ ] 리뷰 개수
  - [ ] 추천/비추천 비율
- [ ] 해당 책의 리뷰 목록
  - [ ] ReviewCard 재사용
  - [ ] 정렬 옵션 (최신순/평점순)

**Convex 함수:**

```typescript
// convex/books.ts
export const getDetail = query({
  args: {
    id: v.id('books'),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 책 정보 + 리뷰 목록 + 통계
  },
});
```

**체크리스트:**

- [ ] BookDetailPage 컴포넌트 생성
- [ ] Convex getDetail 쿼리 구현
- [ ] 책 정보 표시
- [ ] 리뷰 통계 계산 및 표시
- [ ] 리뷰 목록 표시
- [ ] 라우트 추가 (/books/:id)

---

## Phase 6: 사용자 콘텐츠 관리

**목표:** 사용자가 자신의 독후감, 북마크, 좋아요를 관리할 수 있는 기능 구현

**예상 소요 시간:** 6-8시간

### Task 6.1: 내 독후감 페이지 (3시간)

**파일:**

- `packages/frontend/src/pages/MyReviews/MyReviewsPage.tsx`
- `convex/reviews.ts` (쿼리 수정)

**요구사항:**

- [ ] 내가 작성한 리뷰 목록
  - [ ] 발행된 리뷰
  - [ ] 초안 리뷰
- [ ] 필터/탭
  - [ ] "전체" / "발행" / "초안"
- [ ] 각 리뷰 카드에 액션 버튼
  - [ ] "수정"
  - [ ] "삭제"
  - [ ] "발행" (초안인 경우)

**Convex 함수:**

```typescript
// convex/reviews.ts의 listByUser 활용
// 현재 사용자의 리뷰만 조회
```

**체크리스트:**

- [ ] MyReviewsPage 컴포넌트 생성
- [ ] 탭/필터 UI 구현
- [ ] 리뷰 목록 표시
- [ ] 액션 버튼 구현
- [ ] 라우트 추가 (/my-reviews)
- [ ] DashboardPage에서 링크 추가

---

### Task 6.2: 북마크 페이지 (2시간)

**파일:**

- `packages/frontend/src/pages/MyBookmarks/MyBookmarksPage.tsx`
- `convex/bookmarks.ts` (쿼리 추가)

**요구사항:**

- [ ] 내가 북마크한 리뷰 목록
- [ ] ReviewCard 재사용
- [ ] 북마크 해제 버튼

**Convex 함수:**

```typescript
// convex/bookmarks.ts
export const listByUser = query({
  args: {
    userId: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    // 사용자의 북마크 + 리뷰 정보 포함
  },
});
```

**체크리스트:**

- [ ] MyBookmarksPage 컴포넌트 생성
- [ ] Convex listByUser 쿼리 구현
- [ ] 북마크 목록 표시
- [ ] 북마크 해제 기능
- [ ] 라우트 추가 (/my-bookmarks)

---

### Task 6.3: 좋아요한 리뷰 페이지 (2시간)

**파일:**

- `packages/frontend/src/pages/MyLikes/MyLikesPage.tsx`
- `convex/likes.ts` (쿼리 추가)

**요구사항:**

- [ ] 내가 좋아요한 리뷰 목록
- [ ] ReviewCard 재사용
- [ ] 좋아요 해제 버튼

**Convex 함수:**

```typescript
// convex/likes.ts
export const listByUser = query({
  args: {
    userId: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    // 사용자의 좋아요 + 리뷰 정보 포함
  },
});
```

**체크리스트:**

- [ ] MyLikesPage 컴포넌트 생성
- [ ] Convex listByUser 쿼리 구현
- [ ] 좋아요 목록 표시
- [ ] 좋아요 해제 기능
- [ ] 라우트 추가 (/my-likes)

---

## Phase 7: 검색 및 필터링

**목표:** 사용자가 원하는 콘텐츠를 쉽게 찾을 수 있도록 검색 및 필터 기능 제공

**예상 소요 시간:** 4-6시간

### Task 7.1: 피드 검색 기능 (2시간)

**파일:**

- `packages/frontend/src/pages/Feed/FeedPage.tsx` (수정)
- `convex/reviews.ts` (검색 쿼리 추가)

**요구사항:**

- [ ] 검색 바 추가
  - [ ] 리뷰 제목 검색
  - [ ] 책 제목 검색
  - [ ] 저자 검색
- [ ] 검색 결과 표시
- [ ] 검색어 하이라이트

**Convex 함수:**

```typescript
// convex/reviews.ts
export const search = query({
  args: {
    query: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    // 리뷰 제목, 책 제목, 저자에서 검색
  },
});
```

**체크리스트:**

- [ ] 검색 바 UI 추가
- [ ] Convex search 쿼리 구현
- [ ] 검색 결과 표시
- [ ] 검색 상태 관리

---

### Task 7.2: 피드 필터링 및 정렬 (2시간)

**파일:**

- `packages/frontend/src/pages/Feed/FeedPage.tsx` (수정)
- `packages/frontend/src/components/feed/FeedFilters.tsx`

**요구사항:**

- [ ] 정렬 옵션
  - [ ] 최신순 (기본)
  - [ ] 인기순 (좋아요 많은 순)
  - [ ] 평점 높은 순
- [ ] 필터 옵션
  - [ ] 추천/비추천
  - [ ] 평점 범위
  - [ ] 읽기 상태

**체크리스트:**

- [ ] FeedFilters 컴포넌트 생성
- [ ] 정렬 옵션 UI
- [ ] 필터 옵션 UI
- [ ] Convex 쿼리에 정렬/필터 파라미터 추가
- [ ] 필터 상태 관리

---

## Phase 8: 폴리싱 및 최적화

**목표:** 사용자 경험 개선 및 성능 최적화

**예상 소요 시간:** 6-8시간

### Task 8.1: 반응형 디자인 개선 (3시간)

**파일:**

- 모든 페이지 컴포넌트

**요구사항:**

- [ ] 모바일 메뉴 개선
  - [ ] Sheet 컴포넌트 사용
  - [ ] 부드러운 애니메이션
- [ ] 테블릿 레이아웃 최적화
  - [ ] 그리드 레이아웃 조정
  - [ ] 터치 인터랙션 개선
- [ ] 이미지 반응형
  - [ ] srcSet 사용
  - [ ] 적절한 크기 로드

**체크리스트:**

- [ ] 모바일 (<768px) 테스트
- [ ] 태블릿 (768px-1024px) 테스트
- [ ] 데스크톱 (>1024px) 테스트
- [ ] 터치 제스처 테스트

---

### Task 8.2: 성능 최적화 (3시간)

**파일:**

- 전체 프로젝트

**요구사항:**

- [ ] 이미지 최적화
  - [ ] lazy loading 구현
  - [ ] 적절한 포맷 사용 (WebP)
  - [ ] 압축 최적화
- [ ] 코드 스플리팅 확대
  - [ ] 추가 lazy loading (더 많은 페이지)
  - [ ] Dynamic imports
- [ ] Convex 쿼리 최적화
  - [ ] 불필요한 쿼리 제거
  - [ ] 쿼리 결과 캐싱 활용
- [ ] Bundle 크기 최적화
  - [ ] tree-shaking 확인
  - [ ] 불필요한 dependencies 제거

**체크리스트:**

- [ ] Lighthouse 스코어 측정 (목표: 90+)
- [ ] Bundle analyzer 실행
- [ ] 로딩 시간 측정
- [ ] Real-time 업데이트 성능 확인

---

### Task 8.3: 접근성 개선 (2시간)

**파일:**

- 모든 컴포넌트

**요구사항:**

- [ ] ARIA 속성 추가
  - [ ] 버튼 label
  - [ ] 폼 label 연결
  - [ ] 랜드마크 역할 (nav, main, etc.)
- [ ] 키보드 네비게이션
  - [ ] Tab 순서 확인
  - [ ] Escape 키 처리 (모달 닫기)
  - [ ] Enter 키 처리 (폼 제출)
- [ ] 색상 대비
  - [ ] WCAG AA 기준 (4.5:1)
  - [ ] 중요 텍스트 대비 확인

**체크리스트:**

- [ ] 스크린 리더 테스트
- [ ] 키보드만으로 전체 탐색 테스트
- [ ] 색상 대비 도구로 검증
- [ ] axe DevTools 실행

---

## Phase 9: 배포 준비

**목표:** 프로덕션 환경 배포 준비 및 모니터링 설정

**예상 소요 시간:** 4-6시간

### Task 9.1: 환경 설정 (1시간)

**파일:**

- `.env.production`
- `convex` production settings

**요구사항:**

- [ ] Production 환경변수 설정
  - [ ] Convex production deployment
  - [ ] Clerk production keys
- [ ] Convex production 배포
  - [ ] `npx convex deploy --prod`
- [ ] 환경변수 문서화

**체크리스트:**

- [ ] .env.production 파일 생성
- [ ] Convex production 배포
- [ ] Clerk production 앱 생성
- [ ] 환경변수 README 업데이트

---

### Task 9.2: Railway 배포 (2시간)

**파일:**

- `railway.json` (또는 Vercel 설정)

**요구사항:**

- [ ] Railway 프로젝트 생성
- [ ] Frontend 배포 설정
  - [ ] Build 명령어: `pnpm build`
  - [ ] Start 명령어: `pnpm preview`
- [ ] 환경변수 설정
- [ ] 도메인 설정

**체크리스트:**

- [ ] Railway 계정 생성
- [ ] 프로젝트 연결
- [ ] 환경변수 입력
- [ ] 배포 성공 확인
- [ ] 도메인 연결 (선택사항)

---

### Task 9.3: 모니터링 및 분석 (2시간)

**파일:**

- PostHog 또는 Google Analytics 설정

**요구사항:**

- [ ] PostHog 통합 (선택사항)
  - [ ] 이벤트 트래킹
  - [ ] 페이지뷰
  - [ ] 사용자 행동 분석
- [ ] 에러 모니터링 (Sentry 등)
- [ ] 성능 모니터링

**체크리스트:**

- [ ] PostHog 계정 생성
- [ ] 이벤트 트래킹 구현
- [ ] 에러 모니터링 설정
- [ ] 대시보드 확인

---

## 📊 전체 진행 상황

### Phase 별 진행도

| Phase     | 상태    | 진행률 | 예상 시간 | 실제 시간 |
| --------- | ------- | ------ | --------- | --------- |
| Phase 1-2 | ✅ 완료 | 100%   | -         | -         |
| Phase 2.5 | ✅ 완료 | 100%   | -         | -         |
| Phase 3   | ✅ 완료 | 100%   | 4-6h      | ~5h       |
| Phase 4   | ✅ 완료 | 100%   | 8-12h     | ~10h      |
| Phase 5   | ✅ 완료 | 100%   | 6-8h      | ~7h       |
| Phase 6   | ✅ 완료 | 100%   | 6-8h      | ~6h       |
| Phase 7   | ✅ 완료 | 100%   | 4-6h      | ~4h       |
| Phase 8   | ✅ 완료 | 100%   | 6-8h      | ~5h       |
| Phase 9   | ⏳ 대기 | 0%     | 4-6h      | -         |

**총 예상 시간:** 38-54시간
**총 실제 시간:** ~37시간 (Phase 1-8)

---

## 🎯 우선순위 가이드

### 긴급 (즉시 구현 필요)

- **Phase 3:** 네비게이션 및 기본 UX
  - 사용자가 앱을 사용할 수 있게 만드는 최소 기능

### 핵심 (MVP 완성을 위한 필수)

- **Phase 4:** 독후감 작성 기능
  - 플랫폼의 핵심 가치 제공

### 중요 (사용자 경험 향상)

- **Phase 5:** 책 관리 기능
- **Phase 6:** 사용자 콘텐츠 관리

### 선택 (추가 기능)

- **Phase 7:** 검색 및 필터링
- **Phase 8:** 폴리싱 및 최적화

### 배포 (최종 단계)

- **Phase 9:** 배포 준비

---

## 📝 다음 단계

**추천 실행 순서:**

1. **Week 1:** Phase 3 (네비게이션) + Phase 4 시작 (책 검색 API)
2. **Week 2:** Phase 4 완료 (독후감 작성) + Phase 5 시작 (책 목록)
3. **Week 3:** Phase 5 완료 + Phase 6 (사용자 콘텐츠)
4. **Week 4:** Phase 7-8 (검색, 최적화) + Phase 9 (배포)

---

**문서 업데이트 이력:**

- 2025-01-15: 초안 작성
- 2025-01-16: Phase 3-8 완료 반영 (네비게이션, 독후감 작성, 책 관리, 사용자 콘텐츠 관리, 검색/필터링, 폴리싱)

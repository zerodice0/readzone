# ReadZone Convex + Clerk 마이그레이션 가이드

## 🎯 마이그레이션 개요

**기존 스택:**

- NestJS + Prisma + PostgreSQL + Redis
- Passport (JWT + Google/GitHub OAuth)
- 커스텀 MFA, 세션 관리

**새로운 스택:**

- Convex (Backend-as-a-Service)
- Clerk (Authentication-as-a-Service)
- PostHog (Analytics)
- AxiomFM (Logging)

**결과:**

- ✅ 80% 코드 감소
- ✅ 배포 복잡도 제거
- ✅ 실시간 기능 무료 제공
- ✅ 100% 타입 안정성

---

## 📋 현재 진행 상황

### ✅ 완료된 작업

1. **Convex 프로젝트 초기화** ✅
   - `convex/` 폴더 생성 및 파일 작성 완료
   - Schema 정의 (books, reviews, likes, bookmarks)
   - Functions 작성 (모든 CRUD 작업)
   - `convex/tsconfig.json`에 `"noEmit": true` 설정 (번들링 에러 방지)
   - Convex 계정 생성 및 프로젝트 연결 완료

2. **Clerk 통합** ✅
   - `@clerk/clerk-react` 설치 완료
   - App.tsx에 ClerkProvider + ConvexProviderWithClerk 설정 완료
   - Clerk 계정 생성 및 API Key 발급 완료

3. **환경변수 설정** ✅
   - `.env.example` 파일 작성 완료
   - `packages/frontend/.env.local` 설정 완료 (Convex URL + Clerk Key)
   - `.env.local` (루트) Convex 배포 정보 설정 완료

4. **개발 환경 통합** ✅
   - `concurrently` 패키지 설치
   - `pnpm dev` 명령어로 Convex + Frontend 동시 실행 가능
   - 색상 구분 로그 출력 지원

5. **Phase 1: 인증 연동 완성** ✅
   - ✅ Clerk Dashboard에서 JWT Template 설정
   - ✅ Convex Dashboard에서 CLERK_ISSUER_DOMAIN 환경변수 설정
   - ✅ 개발 서버 실행 및 회원가입/로그인 테스트 완료
   - ✅ Convex와 Clerk 인증 완전 연동 확인

### ✅ Phase 2: Frontend 페이지 마이그레이션 완료

**Phase 2 목표:** 기존 페이지들을 Convex + Clerk로 마이그레이션

완료된 작업:

- ✅ FeedPage → Convex queries 사용
- ✅ ReviewDetailPage → Convex queries 사용
- ✅ ProfilePage → Clerk user data 사용
- ✅ DashboardPage → Convex queries 사용
- ✅ TypeScript 타입 안정성 에러 수정 완료 (57개 → 0개)

### ✅ Phase 2.5: UI/UX 디자인 시스템 완료

**Phase 2.5 목표:** 모든 페이지에 일관된 디자인 시스템 적용

**디자인 방향:** 모던 북 플랫폼 (따뜻하고 초대하는 분위기)

완료된 작업:

- ✅ 디자인 계획 문서화 (`docs/plans/2025-01-15-ui-design-system.md`)
- ✅ 색상 시스템 구현 (따뜻한 앰버/오렌지 팔레트)
  - Warm amber/orange primary colors (#f59e0b)
  - Stone neutral colors for text and backgrounds
  - Beige background (#fafaf9) for paper-like feel
- ✅ PostCSS 설정 및 Tailwind CSS 컴파일 파이프라인 구성
- ✅ shadcn/ui 컴포넌트 추가 (badge, avatar, separator, sonner)
- ✅ 모든 페이지 스타일링 적용
  - FeedPage: 따뜻한 색상, 개선된 카드 디자인, 빈 상태 개선
  - ReviewDetailPage: Badge 컴포넌트, 따뜻한 색상, 개선된 레이아웃
  - DashboardPage: 아이콘 추가, 프로필 정보 카드 개선
  - ProfilePage: Gradient 헤더, Badge 컴포넌트, 일관된 스타일
- ✅ ReviewCard 컴포넌트: 호버 효과, Badge, 따뜻한 색상
- ✅ 디자인 개선사항
  - 미묘한 배경 텍스처 추가 (종이 느낌)
  - 버튼 호버 효과 개선 (scale, shadow)
  - 카드 호버 효과 개선 (amber 강조)

**Phase 3.4-3.6: 애니메이션 시스템 및 마이크로 인터랙션 (2025-01-17)**

- ✅ **Phase 3.4: 페이지 전환 애니메이션**
  - `animations.ts` 파일 생성 (15+ 프로페셔널 애니메이션 variants)
  - pageVariants, fadeInUpVariants, scaleInVariants 구현
  - FeedPage, ReviewNewPage, ReviewDetailPage 페이지 전환 적용
  - 모달/백드롭 애니메이션 (modalVariants, backdropVariants)
  - AnimatePresence를 활용한 exit 애니메이션

- ✅ **Phase 3.5: 마이크로 인터랙션**
  - Like 버튼: Heart beat 애니메이션 (likeVariants)
  - Bookmark 버튼: Bounce 애니메이션 (bookmarkVariants)
  - FeedFilters: 버튼 press 효과 및 아이콘 회전/스케일
  - Header: 로고 wiggle 애니메이션 (hover 시)
  - 검색 바: 아이콘 360도 회전 및 스케일 효과
  - 네비게이션 링크: 순차적 fade-in 및 hover lift
  - ReviewCard: 3D tilt 효과 (preserve-3d, perspective 1000)

- ✅ **Phase 3.6: 디자인 시스템 문서화**
  - DESIGN_SYSTEM.md 종합 문서 작성
  - 색상 팔레트, 타이포그래피, 간격, 애니메이션 가이드 포함

**애니메이션 기술 스택:**

- Framer Motion 12.23.24
- Motion values & transforms (useMotionValue, useTransform)
- Custom easing: `[0.25, 0.1, 0.25, 1]` (smooth, professional feel)
- Staggered animations with delayChildren
- 3D CSS transforms (rotateX, rotateY, perspective)

**상세 계획:** `docs/plans/2025-01-15-ui-design-system.md` 참고

### ✅ Phase 3-8 완료 (2025-01-16)

**Phase 3: 네비게이션 및 기본 UX**

- ✅ Header 및 Layout 컴포넌트 구현
- ✅ 모바일 반응형 메뉴
- ✅ Clerk UserButton 통합
- ✅ 로그인 유도 UX 개선
- ✅ Convex 샘플 데이터 추가

**Phase 4: 독후감 작성 기능**

- ✅ 책 검색 API 및 UI 구현
- ✅ 리뷰 작성 폼 (2단계 워크플로우)
- ✅ 리뷰 수정/삭제 기능
- ✅ 별점 UI, 미리보기, 초안 저장

**Phase 5: 책 관리 기능**

- ✅ 책 목록 페이지 (BooksPage)
- ✅ 책 상세 페이지 (BookDetailPage)
- ✅ 책 통계 및 리뷰 목록

**Phase 6: 사용자 콘텐츠 관리**

- ✅ 내 독후감 페이지 (MyReviewsPage)
- ✅ 북마크 페이지 (BookmarksPage)
- ✅ 상태 필터링 및 정렬

**Phase 7: 검색 및 필터링**

- ✅ 피드 검색 기능 (제목/책/저자)
- ✅ Debounced 검색 입력
- ✅ FeedFilters 컴포넌트
- ✅ 정렬 옵션 (최신순/인기순/평점순)
- ✅ 추천 필터 (전체/추천/비추천)

**Phase 8: 폴리싱 및 최적화**

- ✅ 반응형 디자인 검증
- ✅ Code splitting (lazy loading for BooksPage, BookDetailPage)
- ✅ 접근성 개선 (ARIA 속성, semantic HTML)

### ✅ **Backend 패키지 완전 삭제 (2025-01-16)**

**작업 완료:**

- ✅ `packages/backend/` 디렉토리 삭제
- ✅ `docker-compose.yml` 삭제 (PostgreSQL + Redis)
- ✅ `package.json` 정리 (`dev:all` 스크립트 제거)
- ✅ Frontend TypeScript 타입 에러 수정 (39개 → 0개)
- ✅ 프로젝트 구조 단순화 완료

**타입 에러 수정:**

- `ReviewCard.tsx`: Convex mutation 타입 캐스팅 제거
- `ReviewDetailPage.tsx`: Convex mutation 타입 캐스팅 제거
- `FeedPage.tsx`: usePaginatedQuery 타입 캐스팅 제거

### 📌 다음 단계

**Phase 9 구현 계획:**

- 📄 **[IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)** - 전체 구현 로드맵

**다음 우선순위:**

1. **Phase 9:** 배포 준비 (프로덕션 환경 설정)

---

## 🔒 보안 체크리스트

### 환경변수 보안

- ✅ `.gitignore`에 `.env`, `.env.local`, `.env.*.local` 포함 확인됨
- ✅ Git에 환경변수 파일이 커밋되지 않도록 설정됨
- ⚠️ **주의**: `.env.example` 파일에는 실제 키를 절대 넣지 마세요

### API 키 관리

- ✅ Clerk Publishable Key는 프론트엔드에 노출 가능 (public key)
- ⚠️ **절대 커밋 금지**: Clerk Secret Key (백엔드용, 현재 미사용)
- ✅ Convex URL은 public (프론트엔드에서 사용)
- ⚠️ **Convex Dashboard 환경변수**: CLERK_ISSUER_DOMAIN은 Dashboard에서만 설정

### 권장 보안 설정

1. **Clerk Dashboard → Security 설정:**
   - Email verification 활성화 권장
   - OAuth 허용 도메인 설정 (프로덕션 시)
   - Session lifetime 설정 검토

2. **Convex Dashboard → Settings:**
   - Production 환경변수는 별도로 설정
   - Development와 Production 분리 유지
   - Environment Variables 접근 권한 관리

3. **Git 보안:**

   ```bash
   # 실수로 커밋된 환경변수가 있는지 확인
   git log --all --full-history -- "*/.env*"

   # 만약 발견되면 히스토리에서 제거 필요
   # (git filter-branch 또는 BFG Repo-Cleaner 사용)
   ```

### PostHog Analytics (선택사항)

- PostHog Key는 프론트엔드 노출 가능 (공개 키)
- 민감한 데이터 수집 시 GDPR/개인정보보호법 준수 필요
- 사용자 동의 획득 권장

---

## 🚀 Step 1: Clerk 계정 설정 (5분)

### 1.1 Clerk 회원가입

```bash
# 브라우저에서 방문
https://dashboard.clerk.com/sign-up
```

### 1.2 새 Application 생성

1. Dashboard에서 "Create Application" 클릭
2. Application name: `ReadZone`
3. Authentication methods 선택:
   - ✅ Email
   - ✅ Google (OAuth)
   - ✅ GitHub (OAuth)
4. "Create Application" 클릭

### 1.3 API Keys 복사

```bash
# Frontend에서 사용
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxx

# Convex에서 사용 (나중에)
CLERK_SECRET_KEY=sk_test_xxxxxxxxx
```

**중요:** Publishable Key만 복사해서 임시 저장!

---

## 🚀 Step 2: Convex 계정 설정 (5분)

### 2.1 Convex 회원가입

```bash
# 브라우저에서 방문
https://dashboard.convex.dev/signup
```

### 2.2 새 Project 생성

1. "Create a project" 클릭
2. Project name: `readzone`
3. "Create" 클릭

### 2.3 Development 환경 초기화

```bash
# 프로젝트 루트에서 실행
npx convex dev

# 🎉 브라우저가 자동으로 열리면서 인증 진행
# 완료되면 터미널에 Deployment URL이 표시됨:
# → Deployment URL: https://your-deployment.convex.cloud
```

**중요:** 이 URL을 복사해서 임시 저장!

---

## 🚀 Step 3: 환경변수 설정 (2분)

### 3.1 Frontend 환경변수

```bash
cd packages/frontend
cp .env.example .env.local
```

`.env.local` 파일을 열어서 수정:

```bash
# Convex URL (Step 2.3에서 복사한 URL)
VITE_CONVEX_URL=https://your-deployment.convex.cloud

# Clerk Publishable Key (Step 1.3에서 복사한 Key)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxx
```

### 3.2 Root 환경변수 (선택사항)

```bash
# 프로젝트 루트에서
cp .env.example .env
```

`.env` 파일을 열어서 수정:

```bash
CLERK_ISSUER_DOMAIN=https://your-clerk-domain.clerk.accounts.dev
```

**Clerk Issuer Domain 찾기:**

1. Clerk Dashboard → API Keys
2. "Advanced" 섹션 → "Issuer Domain" 복사

---

## 🚀 Step 4: Clerk + Convex 연동 (3분)

### 4.1 Clerk에서 JWT Template 설정

1. Clerk Dashboard → "JWT Templates"
2. "New template" → "Convex" 선택
3. Template name: `convex`
4. "Apply changes"

### 4.2 Convex에 Clerk 설정

```bash
# 프로젝트 루트에서
npx convex dev
```

Convex Dashboard에서:

1. "Settings" → "Environment Variables"
2. 다음 변수 추가:
   ```
   CLERK_ISSUER_DOMAIN=https://your-clerk-domain.clerk.accounts.dev
   ```

---

## 🚀 Step 5: 개발 서버 실행 (1분)

### 5.1 개발 서버 실행 (단일 명령어)

```bash
# 프로젝트 루트에서 실행
pnpm dev

# ✅ Convex와 Frontend가 동시에 실행됩니다
# ✅ [convex] 로그는 파란색으로 표시
# ✅ [frontend] 로그는 초록색으로 표시
# ✅ Watching for file changes in convex/
# ✅ Local: http://localhost:5173
```

**예상 출력:**

```
[convex]   ✔ Watching for file changes in convex/
[convex]   ✔ Functions are live at https://your-deployment.convex.cloud
[frontend] VITE v5.1.3 ready in 342 ms
[frontend] ➜ Local: http://localhost:5173/
```

**참고:**

- 모든 서버를 종료하려면 `Ctrl+C` 한 번만 누르면 됩니다
- 첫 실행 시 Convex 인증이 필요한 경우 `npx convex dev`를 먼저 실행하세요
- Deprecated 백엔드 포함 실행: `pnpm dev:all` (테스트용)

---

## 🎉 Step 6: 테스트 (5분)

### 6.1 회원가입 테스트

1. 브라우저에서 `http://localhost:5173` 방문
2. `/sign-up` 경로로 이동
3. 이메일로 회원가입 or Google/GitHub OAuth 사용
4. ✅ 성공 시 자동으로 `/feed`로 리디렉션

### 6.2 Convex Dashboard에서 확인

1. https://dashboard.convex.dev 방문
2. "Data" 탭 클릭
3. 아직 데이터 없음 (정상!)

### 6.3 첫 번째 책 생성 테스트

Convex Dashboard → "Functions" 탭:

```javascript
// books.create 함수 테스트
{
  "title": "클린 코드",
  "author": "로버트 C. 마틴",
  "description": "애자일 소프트웨어 장인 정신"
}
```

---

## 📁 프로젝트 구조 (최종)

```
readzone/
├── convex/                    # Convex 백엔드
│   ├── schema.ts             # 데이터베이스 스키마
│   ├── books.ts              # 책 API
│   ├── reviews.ts            # 리뷰 API
│   ├── likes.ts              # 좋아요 API
│   ├── bookmarks.ts          # 북마크 API
│   └── auth.config.ts        # Clerk 인증 설정
│
├── packages/
│   ├── frontend/             # React 프론트엔드
│   │   ├── src/
│   │   │   ├── App.tsx       # Clerk + Convex Provider
│   │   │   ├── pages/        # 페이지 컴포넌트
│   │   │   ├── components/   # 재사용 컴포넌트
│   │   │   └── ...
│   │   └── .env.local        # 환경변수
│   │
│   └── shared/               # 공유 타입 및 유틸리티
│       └── ...
│
└── .env                      # 루트 환경변수
```

**변경 사항 (2025-01-16):**

- ✅ `packages/backend/` 삭제 완료
- ✅ `docker-compose.yml` 삭제 완료
- ✅ 프로젝트 구조 단순화

---

## 🗑️ ~~삭제할 파일들~~ ✅ 삭제 완료 (2025-01-16)

**마이그레이션 완료 후 삭제된 파일들:**

```bash
# ✅ Backend 전체 (NestJS) - 삭제 완료
packages/backend/

# ✅ Docker 설정 - 삭제 완료
docker-compose.yml           # PostgreSQL + Redis

# ℹ️ Frontend auth 관련 - Clerk로 대체됨
# (이미 사용되지 않음, 필요시 개별 정리 가능)
packages/frontend/src/lib/auth-context.tsx
packages/frontend/src/components/ProtectedRoute.tsx
packages/frontend/src/features/auth/
```

---

## 🔧 트러블슈팅

### 문제: `VITE_CONVEX_URL is not defined`

**해결:**

```bash
cd packages/frontend
# .env.local 파일 확인
cat .env.local
# VITE_CONVEX_URL이 있는지 확인
# 없으면 Step 3.1 다시 진행
```

### 문제: `Missing Clerk Publishable Key`

**해결:**

```bash
# packages/frontend/.env.local 파일 확인
cat .env.local
# VITE_CLERK_PUBLISHABLE_KEY가 있는지 확인
# pk_test로 시작하는지 확인
```

### 문제: Convex functions not working

**해결:**

```bash
# Convex dev 서버가 실행 중인지 확인
npx convex dev

# 에러 로그 확인
# Clerk 설정이 올바른지 Convex Dashboard에서 확인
```

### 문제: `Two output files share the same path but have different contents`

**원인:** TypeScript 컴파일러가 `convex/` 디렉토리에 `.js` 파일을 자동 생성하여 Convex 번들러와 충돌

**영구적 해결책 (권장):**

```bash
# 1. convex/tsconfig.json에 "noEmit": true 추가
# compilerOptions 섹션에 다음 줄 추가:
# "noEmit": true,

# 2. 기존 .js 파일 삭제
rm convex/*.js convex/*.js.map 2>/dev/null || true

# 3. 확인
npx convex dev
```

**왜 이 해결책이 영구적인가:**

- `"noEmit": true`는 TypeScript에게 "타입 체킹만 하고 .js 파일은 절대 생성하지 마라"고 지시합니다
- VS Code나 다른 도구가 자동으로 TypeScript를 컴파일하더라도 .js 파일이 생성되지 않습니다
- Convex는 자체 컴파일러로 TypeScript를 처리하므로 .js 파일이 필요 없습니다

**임시 해결책 (파일만 삭제):**

```bash
# 이 방법은 근본 원인을 해결하지 못해 문제가 반복됩니다
rm convex/*.js convex/*.js.map 2>/dev/null || true
npx convex dev
```

**문제가 반복되는 이유:**

- VS Code의 TypeScript 언어 서비스가 파일 저장 시 자동 컴파일
- IDE 확장 프로그램이나 빌드 도구가 백그라운드에서 tsc 실행
- `convex/tsconfig.json`에 `"noEmit": true`가 없으면 계속 .js 파일 생성

---

## 📊 Phase 2: Frontend 페이지 마이그레이션 (상세 계획)

### 🎯 Phase 2 목표

기존 NestJS Backend + Custom Auth를 사용하는 페이지들을 **Convex + Clerk**로 완전히 마이그레이션합니다.

**마이그레이션 범위:**

- DashboardPage
- ProfilePage
- ReviewDetailPage
- FeedPage

**예상 총 소요 시간:** 12-16시간

---

### 📋 현재 상태 분석

**기존 구조:**

- **인증:** Custom auth context (localStorage + JWT)
- **데이터 fetching:** Axios 기반 API 서비스
- **상태 관리:** Zustand stores (feedStore)
- **사용자 관리:** Custom user API

**새로운 구조:**

- **인증:** Clerk hooks (`useUser`, `useClerkAuth`)
- **데이터 fetching:** Convex `useQuery`, `useMutation`
- **상태 관리:** Convex real-time subscriptions
- **사용자 관리:** Clerk user management

**제거될 파일들:**

```bash
packages/frontend/src/lib/auth-context.tsx
packages/frontend/src/stores/feedStore.ts
packages/frontend/src/services/api/reviews.ts
packages/frontend/src/services/api/likes.ts
packages/frontend/src/services/api/bookmarks.ts
```

---

### 🔧 사전 준비 작업

#### Step 0.1: 필수 Convex 쿼리 추가

**위치:** `convex/reviews.ts`

**추가할 쿼리 1: `getFeed` (페이지네이션 피드)**

```typescript
import { paginationOptsValidator } from 'convex/server';

/**
 * 페이지네이션된 피드 조회 (enriched data 포함)
 * - Book 정보 포함
 * - 현재 사용자의 좋아요/북마크 상태 포함
 */
export const getFeed = query({
  args: {
    paginationOpts: paginationOptsValidator,
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query('reviews')
      .withIndex('by_status', (q) => q.eq('status', 'PUBLISHED'))
      .order('desc')
      .paginate(args.paginationOpts);

    // 각 리뷰에 book 데이터와 interaction 상태 추가
    const enrichedReviews = await Promise.all(
      results.page.map(async (review) => {
        const book = await ctx.db.get(review.bookId);

        let isLikedByMe = false;
        let isBookmarkedByMe = false;

        if (args.userId) {
          const like = await ctx.db
            .query('likes')
            .withIndex('by_user_review', (q) =>
              q.eq('userId', args.userId).eq('reviewId', review._id)
            )
            .unique();
          isLikedByMe = !!like;

          const bookmark = await ctx.db
            .query('bookmarks')
            .withIndex('by_user_review', (q) =>
              q.eq('userId', args.userId).eq('reviewId', review._id)
            )
            .unique();
          isBookmarkedByMe = !!bookmark;
        }

        return {
          ...review,
          book,
          isLikedByMe,
          isBookmarkedByMe,
        };
      })
    );

    return {
      ...results,
      page: enrichedReviews,
    };
  },
});
```

**추가할 쿼리 2: `getDetail` (단일 리뷰 상세)**

```typescript
/**
 * 리뷰 상세 조회 (enriched data 포함)
 * - Book 정보 포함
 * - 현재 사용자의 좋아요/북마크 상태 포함
 */
export const getDetail = query({
  args: {
    id: v.id('reviews'),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const review = await ctx.db.get(args.id);
    if (!review || review.status !== 'PUBLISHED') {
      return null;
    }

    // Book 데이터 가져오기
    const book = await ctx.db.get(review.bookId);

    // 현재 사용자의 interaction 상태 확인
    let isLikedByMe = false;
    let isBookmarkedByMe = false;

    if (args.userId) {
      const like = await ctx.db
        .query('likes')
        .withIndex('by_user_review', (q) =>
          q.eq('userId', args.userId).eq('reviewId', args.id)
        )
        .unique();
      isLikedByMe = !!like;

      const bookmark = await ctx.db
        .query('bookmarks')
        .withIndex('by_user_review', (q) =>
          q.eq('userId', args.userId).eq('reviewId', args.id)
        )
        .unique();
      isBookmarkedByMe = !!bookmark;
    }

    return {
      ...review,
      book,
      isLikedByMe,
      isBookmarkedByMe,
    };
  },
});
```

**체크리스트:**

- [ ] `convex/reviews.ts`에 `getFeed` 쿼리 추가
- [ ] `convex/reviews.ts`에 `getDetail` 쿼리 추가
- [ ] Convex dev 서버에서 에러 없이 컴파일되는지 확인
- [ ] Convex Dashboard에서 쿼리가 표시되는지 확인

---

### 📄 Step 1: DashboardPage 마이그레이션 (30분)

**난이도:** ⭐ 쉬움
**파일:** `packages/frontend/src/pages/DashboardPage.tsx`

**현재 코드:**

```typescript
import { useAuth } from '../lib/auth-context';

const { user, isAuthenticated, logout } = useAuth();
```

**변경 후:**

```typescript
import { useUser, useClerk } from '@clerk/clerk-react';

const { user, isLoaded } = useUser();
const { signOut } = useClerk();
```

**상세 변경 사항:**

1. **Import 교체:**

   ```typescript
   // BEFORE
   import { useAuth } from '../lib/auth-context';

   // AFTER
   import { useUser, useClerk } from '@clerk/clerk-react';
   ```

2. **Hook 사용 변경:**

   ```typescript
   // BEFORE
   const { user, logout } = useAuth();

   // AFTER
   const { user, isLoaded } = useUser();
   const { signOut } = useClerk();
   ```

3. **User 속성 접근 변경:**

   ```typescript
   // BEFORE
   <h1>Welcome, {user.name}!</h1>
   <p>{user.email}</p>

   // AFTER
   <h1>Welcome, {user?.fullName}!</h1>
   <p>{user?.primaryEmailAddress?.emailAddress}</p>
   ```

4. **Logout 함수 변경:**

   ```typescript
   // BEFORE
   onClick={logout}

   // AFTER
   onClick={() => signOut()}
   ```

5. **Loading 상태 처리:**
   ```typescript
   if (!isLoaded) {
     return <LoadingSpinner />;
   }
   ```

**체크리스트:**

- [ ] Import 문 교체 완료
- [ ] `useUser()`, `useClerk()` hook 사용
- [ ] User 속성 접근 방식 변경 (fullName, primaryEmailAddress 등)
- [ ] Logout 버튼을 `signOut()` 사용하도록 변경
- [ ] Loading 상태 처리 추가
- [ ] 페이지 정상 렌더링 확인
- [ ] Logout 기능 테스트

---

### 📄 Step 2: ProfilePage 마이그레이션 (1-2시간)

**난이도:** ⭐⭐ 쉬움-중간
**파일:**

- `packages/frontend/src/features/user/pages/ProfilePage.tsx`
- `packages/frontend/src/features/user/components/EditProfileForm.tsx`

**변경 사항 요약:**

- Auth context → Clerk `useUser()`
- Custom profile API → Clerk user update methods
- Profile image upload → Clerk's `setProfileImage()`

**ProfilePage.tsx 변경:**

```typescript
// BEFORE
import { useAuth } from '../../../lib/auth-context';
const { user } = useAuth();

// AFTER
import { useUser } from '@clerk/clerk-react';
const { user, isLoaded } = useUser();

// User 정보 표시
<div>
  <img src={user?.imageUrl} alt="Profile" />
  <h2>{user?.fullName}</h2>
  <p>{user?.primaryEmailAddress?.emailAddress}</p>
</div>
```

**EditProfileForm.tsx 변경:**

```typescript
// BEFORE
import apiClient from '../../../lib/api-client';

const handleSubmit = async (data) => {
  await apiClient.patch('/users/me', data);
};

// AFTER
import { useUser } from '@clerk/clerk-react';

const { user } = useUser();

const handleSubmit = async (data) => {
  await user?.update({
    firstName: data.firstName,
    lastName: data.lastName,
  });
};

// Profile image upload
const handleImageUpload = async (file: File) => {
  await user?.setProfileImage({ file });
};
```

**주의사항:**

- Clerk는 email 변경 시 자동으로 verification 이메일 발송
- MFA 설정은 Clerk의 `<UserProfile>` 컴포넌트 사용 권장
- Custom fields가 필요하면 Clerk의 user metadata 사용

**체크리스트:**

- [ ] ProfilePage에서 `useUser()` 사용
- [ ] User 정보 표시 (이름, 이메일, 프로필 이미지)
- [ ] EditProfileForm에서 Clerk user update 사용
- [ ] 이름 변경 기능 테스트
- [ ] 프로필 이미지 업로드 기능 구현 (선택사항)
- [ ] Email 변경 시 verification 플로우 확인
- [ ] 에러 처리 추가

---

### 📄 Step 3: ReviewDetailPage 마이그레이션 (2-3시간)

**난이도:** ⭐⭐⭐ 중간
**파일:** `packages/frontend/src/pages/ReviewDetail/ReviewDetailPage.tsx`

**변경 사항 요약:**

- Axios API 호출 → Convex `useQuery`
- Manual state management → Convex automatic updates
- Like/Bookmark API → Convex mutations
- Auth context → Clerk hooks

**현재 코드 구조:**

```typescript
const [review, setReview] = useState<Review | null>(null);
const [isLiked, setIsLiked] = useState(false);
const [isBookmarked, setIsBookmarked] = useState(false);
const { isAuthenticated } = useAuth();

useEffect(() => {
  loadReview(id);
}, [id]);

const loadReview = async (reviewId: string) => {
  const response = await reviewsService.getReview(reviewId);
  setReview(response.data);
};

const handleLike = async () => {
  await likesService.toggleLike(id);
  setIsLiked(!isLiked);
};
```

**변경 후:**

```typescript
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useUser } from '@clerk/clerk-react';
import { Id } from '../../convex/_generated/dataModel';

const { user } = useUser();
const reviewId = id as Id<'reviews'>;

// 자동 loading, error handling, real-time updates
const review = useQuery(api.reviews.getDetail, {
  id: reviewId,
  userId: user?.id,
});

const toggleLike = useMutation(api.likes.toggle);
const toggleBookmark = useMutation(api.bookmarks.toggle);

const handleLike = () => {
  if (!user) {
    showLoginPrompt();
    return;
  }
  toggleLike({ reviewId });
};

const handleBookmark = () => {
  if (!user) {
    showLoginPrompt();
    return;
  }
  toggleBookmark({ reviewId });
};
```

**상태 처리:**

```typescript
// Convex는 자동으로 loading/error 처리
if (review === undefined) {
  return <LoadingState />;
}

if (review === null) {
  return <NotFoundState />;
}

// review 데이터 사용 가능
return (
  <div>
    <h1>{review.title}</h1>
    <p>Book: {review.book?.title}</p>
    <button onClick={handleLike}>
      {review.isLikedByMe ? 'Unlike' : 'Like'}
    </button>
  </div>
);
```

**체크리스트:**

- [ ] Import 교체 (Convex hooks, Clerk hooks)
- [ ] `useQuery(api.reviews.getDetail)` 사용
- [ ] `useMutation` for like/bookmark
- [ ] Manual state 제거 (isLiked, isBookmarked 등)
- [ ] Loading/Error 상태 처리
- [ ] 인증되지 않은 사용자 처리 (LoginPrompt)
- [ ] Like 버튼 동작 테스트
- [ ] Bookmark 버튼 동작 테스트
- [ ] Real-time 업데이트 확인 (다른 탭에서 like 토글 시)

---

### 📄 Step 4: FeedPage 마이그레이션 (4-6시간)

**난이도:** ⭐⭐⭐⭐ 어려움
**파일:**

- `packages/frontend/src/pages/Feed/FeedPage.tsx`
- `packages/frontend/src/components/ReviewCard/ReviewCard.tsx`

**변경 사항 요약:**

- Zustand store 제거 → Convex `usePaginatedQuery`
- Manual pagination → Convex cursor-based pagination
- Optimistic updates → Convex automatic optimistic updates
- Real-time subscriptions 자동 적용

**FeedPage.tsx 변경:**

**현재 코드:**

```typescript
import { useFeedStore } from '../../stores/feedStore';

const { reviews, isLoading, hasMore, error, loadFeed, loadMore, reset } =
  useFeedStore();

useEffect(() => {
  reset();
  void loadFeed();
}, []);

const handleLoadMore = () => {
  void loadMore();
};
```

**변경 후:**

```typescript
import { usePaginatedQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useUser } from '@clerk/clerk-react';

const { user } = useUser();

const {
  results, // 현재 로드된 리뷰들
  status, // "LoadingFirstPage" | "CanLoadMore" | "LoadingMore" | "Exhausted"
  loadMore, // 더 불러오기 함수
} = usePaginatedQuery(
  api.reviews.getFeed,
  { userId: user?.id },
  { initialNumItems: 20 }
);

// Infinite scroll
const handleLoadMore = () => {
  loadMore(10); // 10개씩 추가 로드
};

// 상태 체크
const isLoading = status === 'LoadingFirstPage';
const hasMore = status === 'CanLoadMore' || status === 'LoadingMore';
```

**ReviewCard.tsx 변경:**

**현재 코드:**

```typescript
import { useFeedStore } from '../../stores/feedStore';

const toggleLike = useFeedStore((state) => state.toggleLike);
const toggleBookmark = useFeedStore((state) => state.toggleBookmark);

const handleLike = () => {
  void toggleLike(review.id);
};
```

**변경 후:**

```typescript
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useUser } from '@clerk/clerk-react';

const { user } = useUser();
const toggleLike = useMutation(api.likes.toggle);
const toggleBookmark = useMutation(api.bookmarks.toggle);

const handleLike = () => {
  if (!user) {
    showLoginPrompt();
    return;
  }
  toggleLike({ reviewId: review._id });
};

const handleBookmark = () => {
  if (!user) {
    showLoginPrompt();
    return;
  }
  toggleBookmark({ reviewId: review._id });
};
```

**Real-time Updates:**

```typescript
// Convex는 자동으로 real-time 업데이트 제공
// 다른 사용자가 리뷰를 추가하면 자동으로 피드에 표시
// 별도의 polling이나 WebSocket 코드 불필요
```

**체크리스트:**

- [ ] `usePaginatedQuery` 사용
- [ ] Zustand store import 제거
- [ ] Loading states 처리 (LoadingFirstPage, LoadingMore)
- [ ] Infinite scroll 구현 (hasMore 체크)
- [ ] ReviewCard에서 mutations 사용
- [ ] 인증 체크 추가 (like/bookmark 전)
- [ ] Empty state 처리
- [ ] Error state 처리
- [ ] Real-time 업데이트 동작 확인
- [ ] Pagination 동작 테스트
- [ ] Like/Bookmark 토글 테스트

---

### 🗑️ Step 5: 정리 작업 (1-2시간)

**삭제할 파일들:**

```bash
# Auth context
packages/frontend/src/lib/auth-context.tsx

# Zustand stores
packages/frontend/src/stores/feedStore.ts
packages/frontend/src/stores/loginPromptStore.ts  # 확인 후 삭제

# API services
packages/frontend/src/services/api/reviews.ts
packages/frontend/src/services/api/likes.ts
packages/frontend/src/services/api/bookmarks.ts
packages/frontend/src/services/api/books.ts  # 확인 후 삭제
packages/frontend/src/lib/api-client.ts  # 다른 곳에서 사용 중인지 확인

# Protected Route (Clerk로 대체)
packages/frontend/src/components/ProtectedRoute.tsx  # Clerk <SignedIn> 사용
```

**Package 정리:**

```bash
# package.json에서 제거
pnpm remove axios zustand  # 다른 곳에서 사용하지 않는다면
```

**Import 정리:**

전체 프로젝트에서 삭제된 파일을 import하는 곳이 있는지 검색:

```bash
grep -r "auth-context" packages/frontend/src
grep -r "feedStore" packages/frontend/src
grep -r "services/api" packages/frontend/src
```

**체크리스트:**

- [ ] 모든 마이그레이션 완료 확인
- [ ] 삭제할 파일 목록 확인
- [ ] 파일 삭제 실행
- [ ] 사용되지 않는 패키지 제거
- [ ] Import 에러 없는지 확인 (`pnpm type-check`)
- [ ] Lint 에러 없는지 확인 (`pnpm lint`)
- [ ] Build 성공하는지 확인 (`pnpm build`)

---

### ✅ 최종 테스트 체크리스트

**기능 테스트:**

- [ ] DashboardPage 로딩 및 표시
- [ ] DashboardPage Logout 동작
- [ ] ProfilePage 사용자 정보 표시
- [ ] ProfilePage 프로필 수정 기능
- [ ] ReviewDetailPage 단일 리뷰 표시
- [ ] ReviewDetailPage Like/Bookmark 토글
- [ ] FeedPage 피드 로딩
- [ ] FeedPage Infinite scroll
- [ ] FeedPage Like/Bookmark 토글
- [ ] 인증되지 않은 사용자 처리 (LoginPrompt)

**Real-time 테스트:**

- [ ] 두 개의 브라우저 탭 열기
- [ ] 한 탭에서 Like 토글 → 다른 탭에서 자동 업데이트 확인
- [ ] 한 탭에서 Bookmark 토글 → 다른 탭에서 자동 업데이트 확인
- [ ] 새 리뷰 추가 → 피드에 자동 표시 확인

**성능 테스트:**

- [ ] 초기 로딩 속도 확인
- [ ] Infinite scroll 부드러움 확인
- [ ] Like/Bookmark 반응 속도 확인
- [ ] 페이지 전환 속도 확인

**에러 처리 테스트:**

- [ ] 존재하지 않는 리뷰 ID → NotFound 표시
- [ ] 네트워크 에러 → Error state 표시
- [ ] 인증 만료 → Clerk 자동 재인증

---

### ⚠️ 주의사항 및 Best Practices

**1. User ID 형식 변경**

- 기존: UUID (PostgreSQL)
- 새로운: Clerk User ID (예: `user_2abc...`)
- **주의:** 기존 데이터와 연결 불가 (새로 시작)

**2. 인증 상태 체크**

```typescript
// ❌ 잘못된 방법
if (user) {
  // user가 null이 아니어도 loading 중일 수 있음
}

// ✅ 올바른 방법
const { user, isLoaded } = useUser();
if (!isLoaded) return <Loading />;
if (!user) return <SignIn />;
// 이제 user 사용 가능
```

**3. Convex Query 최적화**

```typescript
// ❌ 불필요한 재실행
useQuery(api.reviews.get, { id: reviewId });
useQuery(api.likes.check, { userId, reviewId });
useQuery(api.bookmarks.check, { userId, reviewId });

// ✅ 하나의 쿼리로 모든 데이터 가져오기
useQuery(api.reviews.getDetail, { id: reviewId, userId });
```

**4. Optimistic Updates**

```typescript
// Convex는 자동으로 optimistic updates 제공
// 수동 상태 관리 불필요
const toggleLike = useMutation(api.likes.toggle);

// 클릭 시 즉시 UI 업데이트, 에러 시 자동 롤백
onClick={() => toggleLike({ reviewId })}
```

**5. Error Handling**

```typescript
// useQuery는 undefined/null/data 반환
const review = useQuery(api.reviews.get, { id });

if (review === undefined) {
  // 로딩 중
  return <Skeleton />;
}

if (review === null) {
  // 데이터 없음 (쿼리에서 null 반환)
  return <NotFound />;
}

// review는 항상 존재
return <ReviewDisplay review={review} />;
```

**6. Type Safety**

```typescript
// Convex는 자동 타입 생성
import { Id } from '../convex/_generated/dataModel';

// ✅ 타입 안전한 ID 사용
const reviewId: Id<'reviews'> = '...' as Id<'reviews'>;

// ❌ 문자열로 사용하면 타입 에러
const reviewId: string = '...'; // 타입 에러!
```

---

### 📊 Phase 2 완료 후 다음 단계

**Phase 3: PostHog Analytics 추가**

- [ ] PostHog 계정 생성
- [ ] Frontend에 PostHog 통합
- [ ] 이벤트 트래킹 추가 (페이지뷰, Like, Bookmark 등)

**Phase 4: 배포**

- [ ] Railway에 Frontend 배포
- [ ] Convex Production 배포
- [ ] 환경변수 설정 (Production)

---

## 💡 유용한 링크

- [Convex Dashboard](https://dashboard.convex.dev)
- [Convex Docs](https://docs.convex.dev)
- [Clerk Dashboard](https://dashboard.clerk.com)
- [Clerk Docs](https://clerk.com/docs)
- [Convex + Clerk Integration](https://docs.convex.dev/auth/clerk)

---

## 🆘 도움이 필요하면?

1. Convex Discord: https://convex.dev/community
2. Clerk Discord: https://clerk.com/discord
3. GitHub Issues: 이 프로젝트의 Issues 탭

---

**Happy Coding! 🚀**

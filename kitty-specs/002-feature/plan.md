# Implementation Plan: 독후감 메인 피드

_Path: [templates/plan-template.md](templates/plan-template.md)_

**Branch**: `002-feature` | **Date**: 2025-11-09 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/kitty-specs/002-feature/spec.md`

**Note**: This template is filled in by the `/spec-kitty.plan` command. See `.kittify/templates/commands/plan.md` for the execution workflow.

The planner will not begin until all planning questions have been answered—capture those answers in this document before progressing to later phases.

## Summary

사용자들이 작성한 독후감을 시간순(최신순)으로 탐색할 수 있는 메인 피드를 구현합니다. 비로그인 사용자도 조회 가능하며, 로그인 사용자는 좋아요/북마크/공유 등의 상호작용이 가능합니다. 무한 스크롤과 SPA 방식의 부드러운 UX를 제공합니다.

**Technical Approach**: React + Zustand를 활용한 프론트엔드, NestJS + Prisma를 활용한 REST API, 외부 API 검색 후 내부 DB 캐싱을 통한 책 정보 관리, Intersection Observer 기반 무한 스크롤 (하단 800px 트리거).

## Technical Context

**Language/Version**:

- Frontend: TypeScript 5.3.3 + React 18.2.0
- Backend: TypeScript 5.3.3 + Node.js 20+

**Primary Dependencies**:

- Frontend: Vite 5.1.3, React Router 6.22.1, Zustand (TBD), Tailwind CSS 3.4.1, shadcn/ui (TBD), Axios 1.6.7
- Backend: NestJS 10.0.0, Prisma 6.19.0, Passport (JWT/Local/OAuth), Helmet, Rate Limiting (Throttler)
- Validation: Zod 3.22.4 (both frontend and backend)

**Storage**:

- Database: PostgreSQL (via Prisma ORM)
- Session: Redis 4.6.13
- Images: Local filesystem (`/uploads` directory)
- Book Covers: External CDN URLs (cached from external APIs)

**Testing**:

- Unit/Integration: Vitest 1.3.1 (both frontend and backend)
- E2E: TBD (Playwright or Cypress)
- API Testing: Supertest 7.1.4

**Target Platform**:

- Web application (desktop and mobile browsers)
- Server: Linux/Docker containers

**Project Type**: Web application (monorepo with separate frontend and backend packages)

**Performance Goals**:

- 피드 첫 로딩: <2초 (10개 독후감)
- 무한 스크롤 추가 로딩: <3초
- 스크롤 성능: 60fps 이상
- API 응답: <200ms (p95)
- 동시 사용자: 500명 지원

**Constraints**:

- 네트워크 타임아웃: 10초
- 외부 API 호출 최소화 (비용 절감을 위한 DB 캐싱)
- 비로그인 사용자 피드 조회 허용
- 모바일 환경 고려 (반응형 디자인)

**Scale/Scope**:

- 초기 MVP: 단일 피드 뷰, 기본 CRUD 작업
- 예상 사용자: 초기 100-1000명
- 독후감 수: 초기 수백-수천 건
- 확장 가능한 아키텍처 (무한 스크롤, 캐싱, 인덱싱)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

**Status**: ✅ PASSED

이 기능은 기존 아키텍처와 패턴을 준수하며, 새로운 복잡성을 최소화합니다:

- ✅ 기존 모노레포 구조 유지 (`packages/frontend`, `packages/backend`)
- ✅ 기존 기술 스택 활용 (React, NestJS, Prisma, PostgreSQL)
- ✅ 기존 인증/인가 시스템 재사용
- ✅ REST API 패턴 준수
- ✅ 새로운 엔티티는 기존 User 엔티티와 명확한 관계 설정
- ✅ 성능 최적화를 위한 인덱싱과 캐싱 전략 포함
- ✅ 보안 고려사항 (인증, 입력 검증, XSS 방지)

**복잡성 추가 없음**: 이 기능은 표준 CRUD 패턴과 페이지네이션 패턴을 따르며, 추가적인 아키텍처 패턴이나 새로운 기술 도입이 필요하지 않습니다.

## Project Structure

### Documentation (this feature)

```
kitty-specs/[###-feature]/
├── plan.md              # This file (/spec-kitty.plan command output)
├── research.md          # Phase 0 output (/spec-kitty.plan command)
├── data-model.md        # Phase 1 output (/spec-kitty.plan command)
├── quickstart.md        # Phase 1 output (/spec-kitty.plan command)
├── contracts/           # Phase 1 output (/spec-kitty.plan command)
└── tasks.md             # Phase 2 output (/spec-kitty.tasks command - NOT created by /spec-kitty.plan)
```

### Source Code (repository root)

```
packages/
├── backend/
│   ├── src/
│   │   ├── auth/                 # 기존 인증 모듈
│   │   ├── reviews/              # 신규: 독후감 모듈
│   │   │   ├── reviews.controller.ts
│   │   │   ├── reviews.service.ts
│   │   │   ├── reviews.module.ts
│   │   │   └── dto/
│   │   │       ├── create-review.dto.ts
│   │   │       ├── update-review.dto.ts
│   │   │       └── review-response.dto.ts
│   │   ├── books/                # 신규: 책 검색/관리 모듈
│   │   │   ├── books.controller.ts
│   │   │   ├── books.service.ts
│   │   │   ├── books.module.ts
│   │   │   └── external/
│   │   │       └── book-api.service.ts
│   │   ├── likes/                # 신규: 좋아요 모듈
│   │   │   ├── likes.controller.ts
│   │   │   ├── likes.service.ts
│   │   │   └── likes.module.ts
│   │   └── bookmarks/            # 신규: 북마크 모듈
│   │       ├── bookmarks.controller.ts
│   │       ├── bookmarks.service.ts
│   │       └── bookmarks.module.ts
│   ├── prisma/
│   │   ├── schema.prisma         # 수정: 새 엔티티 추가
│   │   ├── migrations/           # 새로운 마이그레이션
│   │   └── seed.ts               # 수정: 시드 데이터
│   └── test/
│       ├── reviews.e2e-spec.ts   # 신규
│       └── feed.e2e-spec.ts      # 신규
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── Feed/              # 신규: 피드 페이지
    │   │   │   ├── index.tsx
    │   │   │   ├── FeedPage.tsx
    │   │   │   └── FeedPage.test.tsx
    │   │   └── ReviewDetail/      # 신규: 독후감 상세 페이지
    │   │       ├── index.tsx
    │   │       └── ReviewDetailPage.tsx
    │   ├── components/
    │   │   ├── ReviewCard/        # 신규: 독후감 카드
    │   │   │   ├── ReviewCard.tsx
    │   │   │   ├── ReviewCard.test.tsx
    │   │   │   └── ReviewCard.stories.tsx
    │   │   ├── InfiniteScroll/    # 신규: 무한 스크롤
    │   │   │   └── InfiniteScroll.tsx
    │   │   └── ui/                # shadcn/ui 컴포넌트
    │   │       ├── button.tsx
    │   │       ├── card.tsx
    │   │       └── skeleton.tsx
    │   ├── stores/
    │   │   ├── feedStore.ts       # 신규: 피드 상태 관리
    │   │   └── authStore.ts       # 기존: 인증 상태
    │   ├── services/
    │   │   ├── api/
    │   │   │   ├── reviews.ts     # 신규: 독후감 API
    │   │   │   ├── likes.ts       # 신규: 좋아요 API
    │   │   │   └── bookmarks.ts   # 신규: 북마크 API
    │   │   └── hooks/
    │   │       ├── useFeed.ts     # 신규: 피드 데이터 훅
    │   │       └── useInfiniteScroll.ts # 신규: 무한 스크롤 훅
    │   └── types/
    │       ├── review.ts          # 신규: 독후감 타입
    │       └── book.ts            # 신규: 책 타입
    └── test/
        └── feed.test.tsx          # 신규: 피드 통합 테스트
```

**Structure Decision**:

이 프로젝트는 pnpm 워크스페이스 기반 모노레포 구조를 사용합니다:

- **Backend** (`packages/backend`): NestJS 모듈 시스템을 따르며, 각 도메인(reviews, books, likes, bookmarks)을 독립적인 모듈로 구성합니다. Prisma를 통해 데이터베이스 스키마와 마이그레이션을 관리합니다.

- **Frontend** (`packages/frontend`): React + Vite 구조를 따르며, 페이지 중심 라우팅과 재사용 가능한 컴포넌트 라이브러리를 구축합니다. Zustand를 통해 글로벌 상태를 관리하고, React Router로 SPA 내비게이션을 처리합니다.

- **공통 사항**: 두 패키지 모두 TypeScript와 Zod를 활용하여 타입 안정성을 보장하며, Vitest로 단위/통합 테스트를 수행합니다.

## Complexity Tracking

_Fill ONLY if Constitution Check has violations that must be justified_

**N/A** - Constitution Check 통과, 복잡성 위반 사항 없음

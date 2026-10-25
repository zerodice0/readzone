# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
# Development - starts Convex backend + Vite frontend
pnpm dev

# Build all packages (uses Turborepo)
pnpm build

# Build frontend only
pnpm --filter @readzone/frontend build

# Deploy backend to Convex
pnpm --filter @readzone/backend build

# Type checking
pnpm type-check

# Linting
pnpm lint

# Format code
pnpm format

# Run tests
pnpm --filter @readzone/frontend test
pnpm --filter @readzone/backend test
```

### Convex Commands

**중요: Convex CLI는 반드시 프로젝트 루트에서 실행해야 합니다.**

프로젝트 루트에 `convex.json`과 `.env.local`(CONVEX_DEPLOYMENT 포함)이 있으며,
`convex.json`의 `functions` 필드가 `packages/backend/convex`를 가리킵니다.

```bash
# Convex dev server (프로젝트 루트에서 실행)
npx convex dev

# Convex 프로덕션 배포 (프로젝트 루트에서 실행)
npx convex deploy
# 또는 pnpm 스크립트 사용
pnpm --filter @readzone/backend build

# Generate Convex types after schema changes (프로젝트 루트에서 실행)
npx convex codegen
# 또는 pnpm 스크립트 사용
pnpm --filter @readzone/backend codegen
```

## Architecture Overview

### Tech Stack (Current - NOT what README says)

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Convex (serverless BaaS)
- **Auth**: Clerk (authentication SaaS)
- **Deployment**: Cloudflare Pages/Workers
- **UI Components**: Radix UI primitives + custom components

> Note: README.md describes a deprecated Fastify + PostgreSQL + Prisma architecture. The current stack uses Convex + Clerk.

### Project Structure

```
packages/
├── frontend/          # React SPA (Vite)
│   └── src/
│       ├── components/   # Shared UI components
│       │   └── ui/       # Base components (shadcn/ui style)
│       ├── features/     # Feature-specific modules (auth, user)
│       ├── pages/        # Route page components
│       ├── hooks/        # Custom React hooks
│       ├── stores/       # Zustand state stores
│       └── router.tsx    # React Router config with lazy loading
│
├── backend/           # Convex functions
│   └── convex/
│       ├── schema.ts     # Database schema definition
│       ├── books.ts      # Book queries/mutations
│       ├── reviews.ts    # Review queries/mutations
│       ├── users.ts      # User sync from Clerk
│       ├── bookSearch.ts # Book search (Kakao) + import with NLK enrichment (actions)
│       ├── lib/          # Pure helpers: genre mapping, external response parsers
│       └── http.ts       # HTTP endpoints (Clerk webhooks, OG API)
│
└── shared/            # Shared types (Zod schemas)
```

### Data Flow

1. **Authentication**: Clerk handles all auth → Clerk webhooks sync user data to Convex `users` table via `http.ts`
2. **Data**: Frontend uses Convex React hooks (`useQuery`, `useMutation`) directly
3. **Book Search**: `bookSearch.searchBooks` action calls Kakao Book Search. When a user picks a result, `bookSearch.importBook` looks up the ISBN in the National Library of Korea (NLK) ISBN API to fill KDC, page count and `genre`, then saves the book. Aladin OpenAPI was shut down on 2026-10-30 and is no longer used.

### Convex Schema (packages/backend/convex/schema.ts)

- `users`: Synced from Clerk via webhooks
- `books`: Book metadata (title, author, ISBN, `genre`, `kdc`). `aladinUrl`/`ebookUrl`/`category` exist only on books saved before the Aladin shutdown.
- `reviews`: User book reviews with like/bookmark counts
- `likes`: Review likes (user-review relation)
- `bookmarks`: Review bookmarks (user-review relation)

### Cloudflare Worker (worker.ts)

Handles OG meta tag injection for social media sharing:

- Detects bot User-Agents (Facebook, Twitter, Kakao, etc.)
- Returns HTML with OG tags for `/reviews/:id` routes
- Regular users get the SPA from static assets

### Key Patterns

- **Code Splitting**: Pages use `React.lazy()` for bundle optimization (see `router.tsx`)
- **Protected Routes**: Wrap with Clerk's `<SignedIn>` / `<SignedOut>` components
- **Convex Actions**: External API calls go in actions (see `bookSearch.ts`). The default runtime has `fetch`; add `'use node';` only when Node APIs are needed.
- **Genres**: Statistics and UI use the fixed list in `convex/lib/genre.ts`. Map any new source's categories into it instead of storing raw category strings.

## Environment Variables

### Frontend (.env or Cloudflare)

- `VITE_CLERK_PUBLISHABLE_KEY`: Clerk frontend key
- `VITE_CONVEX_URL`: Convex deployment URL

### Backend (Convex Dashboard)

- `CLERK_WEBHOOK_SECRET`: For Clerk webhook verification
- `KAKAO_REST_API_KEY`: Kakao REST API key for book search (required)
- `NLK_CERT_KEY`: National Library of Korea ISBN API key for KDC/page enrichment (optional; search and save still work without it)

### Cloudflare Worker

- `CONVEX_URL`: Convex HTTP endpoint URL (set via `wrangler secret`)

## Linear 가이드

### 이슈 생성

Linear에 이슈를 생성할 때는 다음 절차를 따른다:

1. **이슈 생성 전 확인 필수**: 이슈 구조(메인 이슈, 하위 이슈 등)를 먼저 보여주고 사용자 승인을 받은 후 생성
2. **구조화된 이슈 사용**: 큰 기능은 하나의 메인 이슈 + Phase별 sub-task로 구성
3. **이슈 설명 포함 사항**: 개요, 작업 내용, 수정 파일 목록

### 댓글 작성

- **이모지 사용 금지**: Linear 이슈/댓글 작성 시 이모지를 사용하지 않는다

## 코드 리뷰

### 구현 완료 후 검토

기능 구현이 완료되면 `code-simplifier` 서브 에이전트를 실행하여 코드를 검토한다:

- 코드 명확성 및 가독성 개선
- 일관성 있는 코딩 스타일 유지
- 불필요한 복잡성 제거
- 기능은 유지하면서 코드 단순화

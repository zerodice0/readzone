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

# Run frontend tests
pnpm --filter @readzone/frontend test
```

### Convex Commands

```bash
# Generate Convex types after schema changes
pnpm --filter @readzone/backend codegen

# Run Convex dev server (included in pnpm dev)
cd packages/backend && npx convex dev
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
│       ├── aladin.ts     # Aladin book API integration (action)
│       └── http.ts       # HTTP endpoints (Clerk webhooks, OG API)
│
└── shared/            # Shared types (Zod schemas)
```

### Data Flow

1. **Authentication**: Clerk handles all auth → Clerk webhooks sync user data to Convex `users` table via `http.ts`
2. **Data**: Frontend uses Convex React hooks (`useQuery`, `useMutation`) directly
3. **Book Search**: `aladin.ts` action calls Aladin API (Korean book database)

### Convex Schema (packages/backend/convex/schema.ts)

- `users`: Synced from Clerk via webhooks
- `books`: Book metadata (title, author, ISBN, Aladin URLs)
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
- **Convex Actions**: Use `'use node';` directive for external API calls (see `aladin.ts`)

## Environment Variables

### Frontend (.env or Cloudflare)

- `VITE_CLERK_PUBLISHABLE_KEY`: Clerk frontend key
- `VITE_CONVEX_URL`: Convex deployment URL

### Backend (Convex Dashboard)

- `CLERK_WEBHOOK_SECRET`: For Clerk webhook verification
- `ALADIN_TTB_KEY`: Aladin book API key

### Cloudflare Worker

- `CONVEX_URL`: Convex HTTP endpoint URL (set via `wrangler secret`)

# General Guidelines

- **Language**: Always provide answers in **Korean**.

<skills_system priority="1">

## Available Skills

<!-- SKILLS_TABLE_START -->
<usage>
When users ask you to perform tasks, check if any of the available skills below can help complete the task more effectively. Skills provide specialized capabilities and domain knowledge.

How to use skills:

- Invoke: Bash("openskills read <skill-name>")
- The skill content will load with detailed instructions on how to complete the task
- Base directory provided in output for resolving bundled resources (references/, scripts/, assets/)

Usage notes:

- Only use skills listed in <available_skills> below
- Do not invoke a skill that is already loaded in your context
- Each skill invocation is stateless
  </usage>

<available_skills>

<skill>
<name>claude-opus-4-5-migration</name>
<description>Migrate prompts and code from Claude Sonnet 4.0, Sonnet 4.5, or Opus 4.1 to Opus 4.5. Use when the user wants to update their codebase, prompts, or API calls to use Opus 4.5. Handles model string updates and prompt adjustments for known Opus 4.5 behavioral differences. Does NOT migrate Haiku 4.5.</description>
<location>global</location>
</skill>

<skill>
<name>frontend-design</name>
<description>Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, artifacts, posters, or applications (examples include websites, landing pages, dashboards, React components, HTML/CSS layouts, or when styling/beautifying any web UI). Generates creative, polished code and UI design that avoids generic AI aesthetics.</description>
<location>global</location>
</skill>

<skill>
<name>web-artifacts-builder</name>
<description>Suite of tools for creating elaborate, multi-component claude.ai HTML artifacts using modern frontend web technologies (React, Tailwind CSS, shadcn/ui). Use for complex artifacts requiring state management, routing, or shadcn/ui components - not for simple single-file HTML/JSX artifacts.</description>
<location>global</location>
</skill>

</available_skills>

<!-- SKILLS_TABLE_END -->

</skills_system>

---

# PROJECT KNOWLEDGE BASE

**Generated:** 2026-01-28
**Frameworks:** React 19, Convex, Clerk, TailwindCSS v4
**Type:** Monorepo (Turbo)

## BUILD & EXECUTION

| Command           | Description                                    |
| :---------------- | :--------------------------------------------- |
| `pnpm dev`        | Start development servers (Frontend + Backend) |
| `pnpm build`      | Build all packages (Turbo)                     |
| `pnpm type-check` | Run TypeScript validation across all packages  |
| `pnpm lint`       | Run ESLint across all packages                 |
| `pnpm format`     | Format code using Prettier                     |
| `pnpm test`       | Run tests (Vitest)                             |
| `npx convex dev`  | Run Convex backend directly                    |

### Testing Strategy

- **Framework**: Vitest (configured in `@readzone/frontend`)
- **Run Single Test**: `pnpm --filter @readzone/frontend test -- <filename>`
- **Example**: `pnpm --filter @readzone/frontend test -- Button.test.tsx`
- **Note**: Currently, test files are sparse. Add tests for new critical logic.

## CODE STYLE & CONVENTIONS

### 1. Formatting & Linting

- **Strict Compliance**: Never suppress linter errors (`eslint-disable`) without explicit user approval.
- **Prettier**: Single quotes, semicolons, trailing commas (ES5), 2-space indentation.
- **Imports**:
  - Disable `import/prefer-default-export`. Use named exports for better tree-shaking and consistency.
  - Group imports: External (React, libs) -> Internal (components, hooks) -> Styles/Types.

### 2. TypeScript & Types

- **Strict Mode**: Enabled. No `any` types allowed.
- **Zod**: Use Zod for runtime validation, especially for API boundaries and form data.
- **Shared Types**: Place shared Zod schemas in `packages/shared` (when active) or collocate with Convex schema.

### 3. Naming Conventions

- **Files**: `PascalCase.tsx` for components, `camelCase.ts` for utilities/hooks.
- **Variables**: `camelCase` for variables/functions, `UPPER_CASE` for constants.
- **User IDs**: `userId` always refers to the **Clerk ID** (string), not the Convex internal ID.
- **Event Handlers**: `handleEvent` (implementation) and `onEvent` (prop).

### 4. React & Frontend (React 19)

- **Components**: Functional components only. Use `shadcn/ui` patterns for UI elements.
- **State**: Use `zustand` for global state, `useState`/`useReducer` for local.
- **Data Fetching**: Use Convex hooks (`useQuery`, `useMutation`) directly in components.
- **Styling**: Tailwind CSS v4. Avoid raw CSS/SCSS files unless absolutely necessary.
- **Structure**:
  - `components/ui`: Reusable, generic UI components.
  - `features/`: Domain-specific components and logic.

### 5. Backend (Convex)

- **Actions vs Mutations**: Use `mutation` for DB writes. Use `action` (with `'use node'`) for external APIs (e.g., Aladin).
- **Security**: Never expose sensitive keys. Use `process.env` and Convex dashboard for secrets.
- **Schema**: Defined in `schema.ts`. Verify indexes for performance.

## ERROR HANDLING

- **API Errors**: Handle Convex exceptions gracefully in UI (toast notifications via `sonner`).
- **Boundaries**: Use Error Boundaries for React component sub-trees.
- **Async**: Always use `try/catch` in async functions/actions, especially external API calls.

## PROJECT ARCHITECTURE

```
readzone/
├── packages/
│   ├── backend/convex/     # Serverless functions (API & DB)
│   │   ├── schema.ts       # Database definition
│   │   ├── http.ts         # Webhooks (Clerk) & HTTP endpoints
│   │   └── *.ts            # Business logic (books, reviews)
│   ├── frontend/src/       # React 19 SPA
│   │   ├── components/ui/  # shadcn/ui components
│   │   └── pages/          # Route-based lazy-loaded pages
│   └── shared/             # Common Zod schemas (Future use)
├── worker.ts               # Cloudflare Worker for OG Meta Tags
└── turbo.json              # Build pipeline configuration
```

## KEY WORKFLOWS

1.  **Authentication**: Handled by Clerk. Webhooks sync user data to Convex `users` table.
2.  **Deployment**:
    - Frontend: Cloudflare Pages (via Vite build).
    - Backend: Convex Cloud.
    - OG Worker: Cloudflare Workers.
3.  **Soft Deletes**: Use `status: 'DELETED'` and `deletedAt` timestamp instead of row removal.

## ANTI-PATTERNS

- **Direct DB Access**: Never bypass Convex functions.
- **Secret Commits**: `.env` files are ignored; do not force add them.
- **Legacy Stack**: Do not refer to Fastify/Prisma (deprecated).
- **Type Casting**: Avoid `as Unknown` or `as Any`. Fix the underlying type definition.

# Repository Guidelines

## Project Structure & Module Organization
ReadZone is a Turborepo monorepo. Frontend code lives in `packages/frontend/src` (components, pages, hooks, Zustand stores, utilities) and its Playwright fixtures under `packages/frontend/tests`. Backend services are in `packages/backend/src` with NestJS modules, schedulers, and Prisma integration; API contracts and e2e specs reside in `packages/backend/test`. Shared design docs are gathered in `docs/`, including feature breakdowns in `docs/prd/` and flow references in `docs/user-flows*`; consult `docs/implementation-pages.md` before introducing or removing routes.

## Build, Test, and Development Commands
Install dependencies once at the repo root with `npm install`. Key workflows:

```bash
npm run dev           # turbo dev for both apps (Vite on :3000, Nest on :3001)
npm run dev:frontend  # focus the Vite frontend workspace
npm run dev:backend   # start NestJS in watch mode
npm run build         # turbo build across packages
npm run lint          # eslint via Turborepo, max-warnings 0
npm run type-check    # tsc in every workspace
npm run test          # aggregate Jest suites
```

Run package-specific tooling from each workspace when debugging (e.g., `npm run test:e2e` inside `packages/frontend`, `npm run test:cov` inside `packages/backend`).

## Coding Style & Naming Conventions
TypeScript strict mode is mandatory. Prettier (backend) and ESLint configs enforce two-space indentation, trailing commas, and semicolons; never bypass them. React components and NestJS providers use `PascalCase`, hooks use `useCamelCase`, and modules/services follow `*.module.ts` / `*.service.ts`. Keep imports sorted logically (external → internal) and avoid `any`; prefer shared types from `packages/*/src/types`.

## Testing Guidelines
Frontend unit tests (Jest + Testing Library) sit alongside components; name files `*.test.tsx`. Browser flows belong to Playwright specs under `packages/frontend/tests/e2e`. Backend relies on Jest unit specs (`*.spec.ts`) and `test/jest-e2e.json` for integration coverage; aim to keep regression-critical paths above 80% branch coverage. Use `npm run test` before pushing and cross-check flows against `docs/user-flows/` scenarios.

## Commit & Pull Request Guidelines
Adopt Conventional Commit prefixes (`feat`, `fix`, `chore`, optional scope) as seen in recent history (`feat(create-turbo): …`). Each PR should include a concise summary, linked Linear/Jira issue or GitHub issue, screenshots for UI changes, and references to affected docs when applicable. Ensure lint, type-check, and test commands pass locally before requesting review.

## Security & Configuration Tips
Environment variables belong in `.env.local` and must mirror the keys described in README security notes (JWT, Neon, Cloudinary, Resend, Kakao). Never commit secrets or generated Prisma clients. When adding external integrations, document required keys in `docs/prd/` and update onboarding steps in `docs/user-flows/onboarding.md`.

## Communication Preference
모든 답변은 한글로 작성해야 한다.

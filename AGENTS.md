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

**Generated:** 2026-01-05  
**Commit:** 5a1ef6a  
**Branch:** main

## OVERVIEW

ReadZone: 한국어 독후감 공유 플랫폼. React 19 + Convex + Clerk 기반 서버리스 풀스택.

## STRUCTURE

```
readzone/
├── packages/
│   ├── backend/convex/     # Convex 서버리스 함수 (→ AGENTS.md)
│   ├── frontend/src/       # React SPA (→ AGENTS.md)
│   └── shared/             # 공유 타입 (미사용 placeholder)
├── worker.ts               # Cloudflare Worker: OG 메타 태그 주입
├── wrangler.toml           # CF Workers 배포 설정
├── convex.json             # Convex 경로 매핑
└── turbo.json              # Monorepo 빌드 파이프라인
```

## WHERE TO LOOK

| Task           | Location                                        | Notes                      |
| -------------- | ----------------------------------------------- | -------------------------- |
| DB 스키마 변경 | `packages/backend/convex/schema.ts`             | 인덱스 정의 포함           |
| 새 API 추가    | `packages/backend/convex/*.ts`                  | query/mutation/action 구분 |
| 새 페이지 추가 | `packages/frontend/src/pages/` + `router.tsx`   | lazy loading 적용          |
| UI 컴포넌트    | `packages/frontend/src/components/ui/`          | shadcn/ui 스타일           |
| 인증 로직      | Clerk → `UserSync.tsx` → Convex `users`         | Webhook 동기화 병행        |
| OG 메타/SEO    | `worker.ts` + `packages/backend/convex/http.ts` | 봇 UA 감지                 |
| 환경변수       | Frontend: `.env`, Backend: Convex Dashboard     |                            |

## CONVENTIONS

- **Named exports only**: `import/prefer-default-export: off`
- **Strict TypeScript**: 모든 `strict` 옵션 활성화
- **Prettier**: `singleQuote`, `semi`, `trailingComma: es5`, `lf`
- **Husky**: pre-commit에서 prettier 자동 실행

## ANTI-PATTERNS (THIS PROJECT)

| 금지                       | 이유                                                           |
| -------------------------- | -------------------------------------------------------------- |
| 린터/설정 파일 수정        | eslint.config.\*, tsconfig.json, .prettierrc 절대 수정 금지    |
| `eslint-disable` 무단 추가 | 사용자 승인 필수                                               |
| README 아키텍처 참조       | **DEPRECATED** - Fastify/Prisma는 구 버전. 현재는 Convex+Clerk |
| 비밀키 커밋                | .env.example에 실제 값 금지                                    |

## UNIQUE STYLES

- **userId = Clerk ID (string)**: Convex 내부 ID 아닌 Clerk subject 사용
- **Soft Delete**: `status: 'DELETED'` + `deletedAt` 필드
- **Dual User Sync**: Clerk Webhook + `UserSync.tsx` 컴포넌트 병행
- **OG Tag Injection**: Cloudflare Worker에서 봇 UA 감지 후 동적 주입

## COMMANDS

```bash
pnpm dev              # Convex + Vite 개발 서버
pnpm build            # Turbo 전체 빌드
pnpm type-check       # TypeScript 검사
pnpm lint             # ESLint
pnpm format           # Prettier

npx convex dev        # Convex 개발 서버 (별도 터미널)
npx convex deploy     # Convex 프로덕션 배포

pnpm backup:prod-to-dev  # 프로덕션 → 개발 데이터 복사
```

## NOTES

- **CI 미구축**: `.github/workflows` 없음
- **테스트 미구현**: Vitest 설치됨, 테스트 파일 없음
- **packages/shared**: placeholder 상태, 공통 타입 이전 예정
- **Linear 이슈**: 생성 전 구조 승인 필수 (CLAUDE.md 참조)

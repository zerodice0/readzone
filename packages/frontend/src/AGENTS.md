# AGENTS.md

## OVERVIEW

React 19 + Vite + Tailwind CSS 4 기반의 ReadZone 프론트엔드. Convex 실시간 연동 및 Clerk 인증을 활용한 서버리스 아키텍처.

## STRUCTURE

```
src/
├── components/       # 재사용 UI 및 레이아웃
│   ├── ui/           # shadcn/ui 원자 컴포넌트
│   ├── layout/       # Header, Layout, Sidebar
│   ├── book/, review/, diary/  # 도메인별 컴포넌트
│   └── ReviewCard/, InfiniteScroll/ # 복잡한 독립 컴포넌트
├── pages/            # 라우트별 페이지 및 전용 components/
├── features/         # 비즈니스 로직 단위 (auth, user)
├── hooks/            # 커스텀 훅 (useBookSearch, useReducedMotion 등)
├── stores/           # Zustand 기반 전역 상태 (feed, loginPrompt)
├── lib/              # 외부 라이브러리 설정 (motion, utils)
└── router.tsx        # React Router 7 기반 라우팅 및 Lazy Loading
```

## CONVENTIONS

- **폴더 네이밍**: 도메인 폴더는 `lowercase` (예: `book/`), 컴포넌트 폴더는 `PascalCase` (예: `ReviewCard/`).
- **Re-export 패턴**: 폴더 단위 컴포넌트는 `index.ts`를 통해 깔끔하게 re-export.
- **로딩 상태 보장**: 주요 데이터 노출 컴포넌트는 반드시 `*Skeleton.tsx`를 동반함.
- **성능 최적화**: 리스트 아이템 컴포넌트(예: `BookCard`, `ReviewCard`)에 `React.memo` 적극 활용.
- **애니메이션**: `framer-motion` 사용 시 `lib/motion.ts`의 유틸리티와 `useReducedMotion` 훅을 필수로 적용.

## ANTI-PATTERNS

- **컴포넌트 위치**: 2개 이상의 페이지에서 쓰이는 컴포넌트를 `pages/*/components/`에 두지 말 것 (`components/`로 이동).
- **타입 안전성**: Convex API 호출 결과에 `any` 사용 금지. 자동 생성된 타입을 적극 활용할 것.
- **라우팅**: 새 페이지 추가 시 `router.tsx`에서 `lazy()` 로딩 및 `Suspense` 적용 누락 금지.

## WHERE TO LOOK

| Task                | Location                                                        |
| ------------------- | --------------------------------------------------------------- |
| 새 UI 컴포넌트 추가 | `components/ui/` (shadcn/ui 스타일 준수)                        |
| 새 페이지 추가      | `pages/[Name]/` 생성 후 `router.tsx` 등록                       |
| 전역 상태 관리      | `stores/*.ts` (Zustand)                                         |
| 인증/사용자 동기화  | `components/UserSync.tsx`, `components/ClerkLoadingWrapper.tsx` |
| 애니메이션 정의     | `lib/motion.ts`, `hooks/useReducedMotion.ts`                    |

## NOTES

- **UserSync.tsx**: Clerk의 인증 상태를 Convex 데이터베이스와 실시간으로 동기화하는 핵심 컴포넌트.
- **ClerkLoadingWrapper**: iOS Chrome 등 특정 환경의 쿠키 제한 이슈 대응을 위한 인증 로딩 처리기.
- **Redirects**: `/profile`, `/my-reviews`, `/bookmarks` 등 레거시 경로는 모두 `/dashboard`로 리다이렉트됨.

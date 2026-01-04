# AGENTS.md

## OVERVIEW

Convex 서버리스 백엔드: 스키마 정의, 실시간 쿼리/뮤테이션, 알라딘 API 연동 및 Clerk 인증 처리.

## STRUCTURE

- `schema.ts`: 데이터 모델(users, books, reviews 등) 및 인덱스 정의
- `reviews.ts`: 리뷰 CRUD, 페이지네이션 피드, N+1 방지 배칭 로직
- `books.ts`, `bookmarks.ts`, `likes.ts`, `readingDiaries.ts`: 도메인별 함수
- `users.ts`: 사용자 프로필 관리 및 Clerk 동기화
- `aladin.ts`: 외부 도서 검색 API (Action, Node.js 환경)
- `http.ts`: Clerk Webhook 수신 및 동적 OG 메타데이터/사이트맵 제공
- `_generated/`: Convex 자동 생성 파일 (수정 금지)

## CONVENTIONS

- **인증**: 클라이언트 호출 함수는 반드시 `ctx.auth.getUserIdentity()`로 권한 검증
- **식별자**: `userId`는 Clerk ID (string), `bookId/reviewId`는 Convex 고유 ID 타입 사용
- **데이터 검증**: 모든 함수 인자는 `v.*` (Convex values)로 엄격히 검증
- **N+1 방지**: 목록 조회 시 `Promise.all` 및 `getAuthorInfoBatch` 패턴으로 연관 데이터 배칭
- **Soft Delete**: `status: 'DELETED'` 필드를 사용하여 실제 데이터 삭제 지양

## ANTI-PATTERNS

- `_generated/` 폴더 내부 파일 직접 수정 금지 (자동 생성됨)
- `status: 'DELETED'` 체크 없이 보호된 데이터에 접근하거나 목록에 노출 금지
- 외부 API 호출을 Query/Mutation에서 직접 수행 금지 (반드시 Action 사용)
- 비밀번호 등 민감 정보를 `users` 테이블에 직접 저장 금지 (Clerk 위임)

## WHERE TO LOOK

| Task             | File                               |
| ---------------- | ---------------------------------- |
| DB 스키마/인덱스 | `schema.ts`                        |
| 피드/검색 로직   | `reviews.ts` (getFeed, searchFeed) |
| 도서 검색 API    | `aladin.ts`                        |
| 회원 동기화      | `http.ts` (webhook) & `users.ts`   |
| 독서 기록/일기   | `readingDiaries.ts`                |

## NOTES

- **환경변수**: `ALADIN_TTB_KEY`, `CLERK_WEBHOOK_SECRET`은 Convex Dashboard에서 관리
- **배칭**: `reviews.ts`의 `getAuthorInfoBatch`는 사용자 정보 중복 조회를 방지하는 핵심 패턴
- **HTTP**: `/og/reviews/:id` 엔드포인트는 Cloudflare Worker와 연동되어 SEO/공유 기능 수행

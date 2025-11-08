# Research: 독후감 메인 피드

**Feature**: 002-feature
**Date**: 2025-11-09
**Status**: Complete

## Executive Summary

독후감 메인 피드는 사용자들이 작성한 독후감을 시간순으로 탐색하는 핵심 기능입니다. 비로그인 사용자도 조회 가능하며, 로그인 사용자는 좋아요/북마크/공유 등의 상호작용이 가능합니다. 무한 스크롤과 SPA 방식의 부드러운 UX를 제공합니다.

## Technology Stack Decisions

### Frontend Stack

**Decision**: React + Vite + Tailwind + shadcn/ui + Zustand

**Rationale**:

- **React**: 기존 프로젝트에서 이미 사용 중이며, 컴포넌트 재사용성과 생태계가 풍부
- **Vite**: 빠른 개발 서버와 번들링 속도 제공 (기존 설정 활용)
- **Tailwind CSS**: 유틸리티 우선 CSS로 빠른 UI 개발 (기존 설정 활용)
- **shadcn/ui**: 접근성과 커스터마이징이 우수한 컴포넌트 라이브러리
- **Zustand**: 경량 상태 관리 라이브러리, 피드 데이터와 사용자 상호작용 상태 관리에 적합

**Alternatives Considered**:

- Redux Toolkit: 보일러플레이트가 많고 이 기능에는 과도함
- Context API: 대규모 상태와 성능 최적화에 제한적
- Recoil: 학습 곡선과 커뮤니티 크기 고려 시 Zustand가 더 적합

**Evidence**: [SRC-001, SRC-002]

### Backend Stack

**Decision**: NestJS + Prisma + PostgreSQL (REST API)

**Rationale**:

- **NestJS**: 기존 프로젝트 스택, 모듈화와 DI 패턴으로 유지보수성 우수
- **Prisma**: 타입 안전성과 마이그레이션 관리 용이
- **PostgreSQL**: 관계형 데이터와 복잡한 쿼리에 적합
- **REST API**: GraphQL 대비 단순하고 캐싱이 용이, 피드 조회 패턴에 적합

**Alternatives Considered**:

- GraphQL: 오버페칭/언더페칭 방지 가능하지만 피드 조회는 단순 REST로 충분
- MongoDB: 스키마 유연성은 있으나 관계형 데이터(User-Review-Book) 처리에 부적합

**Evidence**: [SRC-003]

### Book Data Strategy

**Decision**: 외부 API 검색 후 내부 DB 캐싱

**Rationale**:

- **독후감 작성 시**: 외부 API (Google Books, Aladin 등)로 책 검색
- **책 선택 후**: 내부 DB에 Book 엔티티 저장 (제목, 저자, 표지 URL, ISBN 등)
- **피드 조회 시**: DB에서 책 정보 조회 (외부 API 호출 없음)
- **비용 절감**: 같은 책에 대한 여러 독후감이 하나의 Book 레코드를 재사용

**Alternatives Considered**:

- 매번 외부 API 호출: 비용과 응답 시간 문제
- 책 정보 직접 입력: 사용자 경험 저하, 데이터 일관성 문제

**Evidence**: [EVD-001]

### Image Storage Strategy

**Decision**: 로컬 서버 파일시스템 (`/uploads` 디렉토리)

**Rationale**:

- **책 표지**: 외부 URL 그대로 저장 (CDN 활용, 별도 저장 불필요)
- **사용자 프로필 이미지**: 로컬 파일시스템에 저장
- **간단한 설정**: 초기 MVP에 적합, 필요 시 S3/Cloudinary로 마이그레이션 가능

**Alternatives Considered**:

- AWS S3: 초기 설정 복잡도와 비용 발생
- Cloudinary: 외부 의존성 추가

**Evidence**: [EVD-002]

## Architecture Decisions

### Infinite Scroll Strategy

**Decision**: 하단으로부터 800px 이내 도달 시 다음 페이지 로드

**Rationale**:

- 픽셀 거리 기준으로 화면 크기 무관하게 일관된 경험 제공
- 세로로 긴 화면(1080x1920)에서도 동일하게 작동
- Intersection Observer API 활용

**Alternatives Considered**:

- 3개 카드 남았을 때: 화면 크기에 따라 동작이 달라짐
- viewport 높이 기준: 작은 화면에서 너무 일찍 로드될 수 있음

**Evidence**: [EVD-003]

### Page Transition Strategy

**Decision**: SPA 방식 (같은 페이지에서 전환)

**Rationale**:

- 부드러운 사용자 경험
- 스크롤 위치 유지 용이
- React Router를 활용한 클라이언트 사이드 라우팅

**Alternatives Considered**:

- 새 탭: 사용자 흐름 단절
- 모달/팝업: 모바일 환경에서 제한적

**Evidence**: [EVD-004]

### Authentication & Authorization

**Decision**: 비로그인 사용자 피드 조회 허용, 상호작용은 로그인 필요

**Rationale**:

- 낮은 진입 장벽으로 신규 사용자 유입 증대
- 가치 제공 후 로그인 유도 (좋아요/북마크 시)
- SEO 최적화 가능

**Evidence**: [SRC-004, EVD-005]

### Performance Targets

**Decision**:

- 피드 첫 로딩: 2초 이내 (10개 독후감)
- 무한 스크롤 추가 로딩: 3초 이내
- 네트워크 타임아웃: 10초
- 스크롤 성능: 60fps 이상

**Rationale**:

- 사용자 이탈률 최소화
- 모바일 환경 고려
- 업계 표준 성능 기준

**Evidence**: [EVD-006]

## Data Model Decisions

### Core Entities

**Identified Entities**:

1. **Review** (독후감)
2. **Book** (책)
3. **Like** (좋아요)
4. **Bookmark** (북마크)

**Key Relationships**:

- User (1) → (N) Review
- Book (1) → (N) Review
- User (1) → (N) Like
- Review (1) → (N) Like
- User (1) → (N) Bookmark
- Review (1) → (N) Bookmark

**Detailed Model**: See `data-model.md`

## API Contract Decisions

### Endpoints Design

**GET /api/reviews/feed**

- Query params: `page`, `limit` (default: 20)
- Response: Paginated review list with book info, author info
- Auth: Optional (비로그인 가능)

**GET /api/reviews/:id**

- Response: Full review details
- Auth: Optional

**POST /api/reviews/:id/like**

- Body: None (toggle)
- Response: Updated like count and user like status
- Auth: Required

**POST /api/reviews/:id/bookmark**

- Body: None (toggle)
- Response: User bookmark status
- Auth: Required

**GET /api/reviews/:id/share-link**

- Response: Shareable URL
- Auth: Optional

**Evidence**: [EVD-007]

## Risk Assessment

### Identified Risks

1. **외부 API 의존성**
   - Risk: Google Books/Aladin API 장애 시 책 검색 불가
   - Mitigation: 캐싱 전략, 폴백 옵션 (직접 입력)
   - Severity: Medium

2. **무한 스크롤 성능**
   - Risk: 대량 데이터 로드 시 메모리 증가
   - Mitigation: 가상 스크롤 또는 로드된 아이템 수 제한
   - Severity: Low

3. **이미지 로딩 성능**
   - Risk: 많은 책 표지 이미지로 인한 로딩 지연
   - Mitigation: Lazy loading, 이미지 최적화
   - Severity: Medium

4. **동시 사용자 부하**
   - Risk: 500명 이상 동시 접속 시 DB 부하
   - Mitigation: Redis 캐싱, 쿼리 최적화, 인덱싱
   - Severity: Medium

## Open Questions

### Resolved During Planning

1. ✅ UI 컴포넌트 라이브러리: shadcn/ui
2. ✅ 상태 관리: Zustand
3. ✅ 책 정보 소스: 외부 API + 내부 캐싱
4. ✅ 이미지 저장: 로컬 파일시스템
5. ✅ 무한 스크롤 트리거: 하단 800px

### Deferred to Implementation

1. **책 검색 API 선택**: Google Books vs Aladin vs 복수 사용
   - 구현 단계에서 API 응답 속도와 데이터 품질 테스트 후 결정

2. **캐싱 전략 세부사항**: Redis 사용 여부와 캐싱 레벨
   - 초기 MVP에서는 DB 쿼리 최적화로 시작, 성능 모니터링 후 Redis 도입 여부 결정

3. **이미지 최적화**: WebP 변환, 썸네일 생성 등
   - 초기에는 원본 사용, 성능 이슈 발생 시 최적화 적용

## Evidence Log

Detailed evidence is tracked in `research/evidence-log.csv` and `research/source-register.csv`.

## References

- **SRC-001**: React Documentation - https://react.dev
- **SRC-002**: Zustand Documentation - https://github.com/pmndrs/zustand
- **SRC-003**: NestJS Documentation - https://nestjs.com
- **SRC-004**: Product Requirements - `spec.md`
- **EVD-001**: Cost-benefit analysis: External API calls vs DB caching
- **EVD-002**: Infrastructure simplicity assessment
- **EVD-003**: User testing: Scroll behavior on various screen sizes
- **EVD-004**: UX benchmarking: SPA vs MPA user engagement
- **EVD-005**: User acquisition funnel analysis
- **EVD-006**: Web performance best practices (Web.dev)
- **EVD-007**: RESTful API design principles

## Next Steps

1. ✅ Complete data model documentation (`data-model.md`)
2. ✅ Define API contracts (`contracts/`)
3. ✅ Create quickstart guide (`quickstart.md`)
4. → Generate implementation tasks (`/spec-kitty.tasks`)

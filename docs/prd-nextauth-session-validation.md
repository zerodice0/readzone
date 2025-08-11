# PRD: NextAuth 세션 검증 및 갱신 시스템

**문서 버전**: 1.0.0  
**작성일**: 2025-01-06  
**작성자**: Development Team  
**상태**: 구현 대기

---

## 1. 개요

### 1.1 목적
ReadZone 애플리케이션의 인증 시스템에서 발생하는 세션 관련 문제를 해결하고, 안정적인 세션 관리 시스템을 구축합니다.

### 1.2 배경
- **현재 문제**: 독후감 작성 시 `session.user.id`가 데이터베이스와 매칭되지 않아 Foreign Key 제약 조건 위반 에러 발생
- **근본 원인**: JWT 토큰에서 user.id가 올바르게 전달되지 않음
- **추가 이슈**: 세션 유효성 검증 및 자동 갱신 메커니즘 부재

### 1.3 범위
- NextAuth 콜백 함수 수정
- 미들웨어 기반 세션 검증 구현
- 세션 자동 갱신 시스템 구축
- 세션 관련 에러 처리 개선

---

## 2. 요구사항

### 2.1 기능 요구사항

#### FR-001: JWT 토큰 개선
- JWT 토큰에 user.id를 명시적으로 포함
- 세션 콜백에서 안전한 user.id 전달
- undefined 및 null 값 처리

#### FR-002: 미들웨어 보호
- 인증이 필요한 경로 자동 보호
- 미인증 사용자 로그인 페이지 리다이렉트
- 인증된 사용자의 인증 페이지 접근 차단

#### FR-003: 세션 자동 갱신
- 5분 간격 자동 세션 체크
- 윈도우 포커스 시 세션 검증
- 토큰 만료 임박 시 자동 갱신

#### FR-004: 에러 처리
- 세션 관련 에러 명확한 메시지 제공
- 사용자 친화적인 에러 알림
- 자동 복구 메커니즘

### 2.2 비기능 요구사항

#### NFR-001: 성능
- 세션 검증 응답 시간 < 100ms
- 미들웨어 처리 시간 < 50ms
- 자동 갱신 백그라운드 처리

#### NFR-002: 보안
- JWT 토큰 안전한 저장 및 전송
- CSRF 보호 유지
- 세션 하이재킹 방지

#### NFR-003: 사용성
- 투명한 세션 관리 (사용자 개입 최소화)
- 세션 만료 시 자연스러운 재인증 유도
- 진행 중인 작업 보존

#### NFR-004: 유지보수성
- 명확한 로깅 및 디버깅 정보
- 모듈화된 코드 구조
- 테스트 가능한 구현

---

## 3. 기술 사양

### 3.1 아키텍처
```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Browser   │────▶│  Middleware  │────▶│  Next.js    │
│   (JWT)     │     │  (검증)       │     │  App        │
└─────────────┘     └──────────────┘     └─────────────┘
       │                    │                     │
       │                    │                     │
       ▼                    ▼                     ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│SessionProvider│    │   NextAuth   │     │   Prisma    │
│  (갱신)      │────▶│   (인증)     │────▶│   (DB)      │
└─────────────┘     └──────────────┘     └─────────────┘
```

### 3.2 기술 스택
- **Framework**: Next.js 14+ (App Router)
- **Authentication**: NextAuth.js v5
- **Database**: SQLite + Prisma ORM
- **Session Strategy**: JWT
- **State Management**: React Context (SessionProvider)

### 3.3 파일 구조
```
src/
├── middleware.ts              # 새로 생성 - 세션 검증 미들웨어
├── lib/
│   └── auth.ts               # 수정 - NextAuth 콜백 개선
├── components/
│   ├── providers.tsx         # 수정 - SessionProvider 설정
│   └── session-refresh-wrapper.tsx  # 새로 생성 - 세션 갱신 래퍼
├── hooks/
│   └── useSessionRefresh.ts  # 새로 생성 - 세션 갱신 훅
└── app/
    └── api/
        └── reviews/
            └── route.ts      # 수정 - 세션 검증 강화
```

---

## 4. 구현 계획

### 4.1 Phase 1: 세션 검증 문제 수정 (2-3시간)

#### 작업 항목
1. **NextAuth 콜백 수정** (`src/lib/auth.ts`)
   - JWT 콜백에서 user.id 명시적 추가
   - 세션 콜백에서 안전한 값 할당
   - 디버깅 로그 추가

2. **API 라우트 개선** (`src/app/api/reviews/route.ts`)
   - User 존재 검증 로직 추가
   - 상세한 에러 메시지 제공
   - 세션 디버깅 정보 로깅

#### 수락 기준
- [ ] JWT 토큰에 user.id 포함 확인
- [ ] 세션에서 user.id 접근 가능
- [ ] Foreign Key 에러 해결

### 4.2 Phase 2: 미들웨어 구현 (3-4시간)

#### 작업 항목
1. **미들웨어 생성** (`src/middleware.ts`)
   - 보호된 라우트 정의
   - 토큰 검증 로직 구현
   - 리다이렉트 처리

2. **라우트 보호 설정**
   - `/write`, `/settings` 등 보호
   - API 엔드포인트 보호
   - 인증 페이지 접근 제어

#### 수락 기준
- [ ] 미인증 사용자 자동 리다이렉트
- [ ] 인증된 사용자 인증 페이지 차단
- [ ] 토큰 만료 감지

### 4.3 Phase 3: 세션 자동 갱신 (2-3시간)

#### 작업 항목
1. **SessionProvider 개선** (`src/components/providers.tsx`)
   - refetchInterval 설정
   - refetchOnWindowFocus 활성화

2. **갱신 훅 구현** (`src/hooks/useSessionRefresh.ts`)
   - 자동 갱신 로직
   - 만료 임박 감지
   - 에러 처리

3. **UI 통합** (`src/components/session-refresh-wrapper.tsx`)
   - 루트 레이아웃 통합
   - 백그라운드 동작

#### 수락 기준
- [ ] 5분마다 자동 세션 체크
- [ ] 윈도우 포커스 시 갱신
- [ ] 세션 만료 전 자동 갱신

### 4.4 Phase 4: 테스트 및 검증 (1-2시간)

#### 작업 항목
1. **단위 테스트**
   - 세션 콜백 테스트
   - 미들웨어 로직 테스트
   - 갱신 훅 테스트

2. **통합 테스트**
   - 로그인 → 독후감 작성 플로우
   - 세션 만료 시나리오
   - 자동 갱신 동작

3. **사용자 테스트**
   - 실제 사용 시나리오
   - 엣지 케이스 검증
   - 성능 측정

#### 수락 기준
- [ ] 모든 테스트 통과
- [ ] 성능 요구사항 충족
- [ ] 사용자 피드백 반영

---

## 5. 위험 관리

### 5.1 기술적 위험

| 위험 | 영향도 | 확률 | 완화 전략 |
|------|--------|------|-----------|
| JWT 토큰 크기 증가 | 중 | 낮음 | 필수 정보만 포함, 압축 고려 |
| 세션 갱신 실패 | 높음 | 중간 | 재시도 로직, 수동 갱신 옵션 |
| 미들웨어 성능 저하 | 중 | 낮음 | 캐싱, 최적화된 검증 로직 |
| 기존 세션 호환성 | 높음 | 낮음 | 점진적 마이그레이션, 하위 호환성 |

### 5.2 운영 위험

| 위험 | 영향도 | 확률 | 완화 전략 |
|------|--------|------|-----------|
| 대량 로그아웃 | 높음 | 낮음 | 단계적 배포, 모니터링 강화 |
| 세션 관련 버그 | 중 | 중간 | 충분한 테스트, 롤백 계획 |
| 사용자 혼란 | 낮음 | 낮음 | 명확한 에러 메시지, 가이드 제공 |

---

## 6. 성공 지표

### 6.1 정량적 지표
- **에러율 감소**: Foreign Key 에러 0건
- **세션 유지율**: 95% 이상
- **자동 갱신 성공률**: 99% 이상
- **응답 시간**: 세션 검증 < 100ms

### 6.2 정성적 지표
- 사용자 불편 사항 감소
- 개발자 디버깅 용이성 향상
- 시스템 안정성 증가
- 보안 수준 향상

---

## 7. 타임라인

| 단계 | 작업 | 예상 시간 | 담당 |
|------|------|-----------|------|
| Phase 1 | 세션 검증 문제 수정 | 2-3시간 | Backend |
| Phase 2 | 미들웨어 구현 | 3-4시간 | Backend |
| Phase 3 | 세션 자동 갱신 | 2-3시간 | Frontend/Backend |
| Phase 4 | 테스트 및 검증 | 1-2시간 | QA/Dev |
| **총계** | | **8-12시간** | |

---

## 8. 참고 자료

### 8.1 관련 문서
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)

### 8.2 관련 이슈
- Issue #129: BookReview 생성 시 Foreign Key 에러
- Issue #130: 세션 user.id undefined 문제
- Issue #131: 세션 자동 갱신 필요

### 8.3 의존성
- NextAuth.js v5
- Next.js 14+
- Prisma ORM
- SQLite

---

## 9. 승인

| 역할 | 이름 | 날짜 | 서명 |
|------|------|------|------|
| Product Owner | - | - | - |
| Tech Lead | - | - | - |
| Security Lead | - | - | - |

---

## 10. 변경 이력

| 버전 | 날짜 | 변경 내용 | 작성자 |
|------|------|-----------|--------|
| 1.0.0 | 2025-01-06 | 초안 작성 | Dev Team |

---

## 부록 A: 코드 예시

### A.1 JWT 콜백 수정 예시
```typescript
async jwt({ token, user, account }) {
  if (user) {
    token.id = user.id
    token.email = user.email
    token.nickname = user.nickname
  }
  return token
}
```

### A.2 미들웨어 보호 예시
```typescript
const protectedRoutes = ['/write', '/settings']
if (protectedRoutes.includes(pathname) && !token) {
  return NextResponse.redirect('/login')
}
```

### A.3 세션 갱신 훅 예시
```typescript
const { data: session, update } = useSession()
useEffect(() => {
  const interval = setInterval(() => update(), 5 * 60 * 1000)
  return () => clearInterval(interval)
}, [update])
```

---

**문서 끝**
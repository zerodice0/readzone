# Research: 사용자 인증 시스템
*Path: [kitty-specs/001-feature/research.md](kitty-specs/001-feature/research.md)*

**Feature**: 사용자 인증 시스템
**Date**: 2025-11-05
**Status**: 완료

## Overview

이 문서는 사용자 인증 시스템 구현을 위한 기술 스택, 아키텍처 패턴, 보안 best practices에 대한 연구 결과를 요약합니다. 계획 단계에서 확인된 모든 기술 결정의 근거와 대안 분석을 포함합니다.

## Technical Stack Decisions

### 1. Backend Framework: NestJS + TypeScript

**Decision**: NestJS 10.x를 TypeScript strict mode와 함께 사용

**Rationale**:
- **아키텍처**: Angular에서 영감을 받은 구조화된 아키텍처
  - 모듈 기반 설계로 관심사 분리 명확
  - 의존성 주입(DI) 컨테이너 내장
  - 데코레이터 기반 선언적 코딩
  - 헌장 요구사항: 유지보수성과 확장성 충족
- **TypeScript 지원**: 일급 TypeScript 지원, any 타입 없이 완전한 타입 안전성
  - strict mode 기본 설정
  - 데코레이터 메타데이터를 통한 타입 추론
- **통합 생태계**:
  - Prisma: PrismaService를 통한 의존성 주입
  - @nestjs/passport: Passport.js 공식 통합
  - @nestjs/jwt: JWT 인증 공식 지원
  - @nestjs/config: 환경 변수 관리
  - @nestjs/swagger: OpenAPI 자동 생성
- **개발자 경험**:
  - CLI 도구로 빠른 scaffolding
  - 자동 OpenAPI 문서 생성 (@nestjs/swagger)
  - 테스트 유틸리티 내장
- **확장성**: 마이크로서비스 아키텍처 지원, 수평 확장 용이

**Alternatives Considered**:
- **Express**: 가장 널리 사용되지만 구조화 부족, TypeScript 지원 약함
- **Fastify**: 높은 성능이지만 구조화 부족, 보일러플레이트 많음
- **Koa**: 경량이지만 생태계가 작고 구조화 부족
- **Hapi**: 구조화되어 있지만 생태계가 NestJS보다 작음

### 2. Frontend Framework: React 18 + Vite + TypeScript

**Decision**: React 18.x + Vite 5.x + TypeScript 5.3+

**Rationale**:
- **React 18**:
  - 가장 널리 사용되는 UI 라이브러리, 방대한 생태계
  - Server Components, Concurrent Rendering (향후 확장)
  - 컴포넌트 재사용성, 테스트 도구 성숙도
- **Vite**:
  - 빠른 개발 서버 시작 (ES modules 활용)
  - HMR (Hot Module Replacement) 우수
  - 프로덕션 빌드 최적화 (Rollup 기반)
  - TypeScript 네이티브 지원
- **TypeScript**:
  - 헌장 요구사항: any 타입 절대 사용 금지 충족
  - API 타입 공유로 백엔드와 계약 강제
  - 런타임 에러 조기 발견

**Alternatives Considered**:
- **Vue 3 + Vite**: 학습 곡선 낮지만 생태계가 React보다 작음
- **Svelte + SvelteKit**: 컴파일 기반 성능 우수하지만 생태계 미성숙
- **Angular**: 대규모 기업용이지만 over-engineering, 러닝 커브 높음
- **Next.js**: React 프레임워크이지만 SSR/SSG 불필요, Vite가 더 경량

### 3. Monorepo Management: pnpm workspaces

**Decision**: pnpm 8.x workspaces

**Rationale**:
- **효율성**:
  - 디스크 공간 절약 (content-addressable storage)
  - npm/yarn 대비 2-3배 빠른 설치 속도
  - 엄격한 의존성 관리 (phantom dependencies 방지)
- **Monorepo 지원**:
  - workspace 네이티브 지원
  - 패키지 간 의존성 자동 해결
  - 병렬 스크립트 실행 (`pnpm -r`)
- **호환성**: npm과 100% 호환, package.json 재사용

**Alternatives Considered**:
- **npm workspaces**: 표준이지만 느리고 phantom dependencies 문제
- **Yarn workspaces**: 빠르지만 PnP 모드 호환성 이슈
- **Turborepo**: 빌드 캐싱 강력하지만 초기 설정 복잡, pnpm과 함께 사용 가능
- **Nx**: 강력하지만 over-engineering, 학습 곡선 높음

### 4. ORM: Prisma

**Decision**: Prisma 5.x

**Rationale** (2025-01-06 계획 재검토 결과):
- **타입 안전성**:
  - Prisma Client 자동 생성으로 100% 타입 안전 보장
  - any 타입 없이 완전한 TypeScript 타입 추론
  - 스키마 변경 시 컴파일 타임 오류 감지
  - 헌장 요구사항: TypeScript strict mode 완벽 지원
- **개발자 경험**:
  - 직관적인 스키마 문법 (schema.prisma)
  - Prisma Studio (GUI 데이터 브라우저)
  - 자동 완성 및 IntelliSense 지원
  - 마이그레이션 자동 생성 및 추적
- **NestJS 통합**:
  - PrismaService를 통한 의존성 주입
  - NestJS 모듈 시스템과 자연스러운 통합
  - @nestjs/swagger와 호환 (수동 DTO 정의 필요)
- **쿼리 성능**:
  - 최적화된 쿼리 생성 (N+1 문제 자동 방지)
  - Relation 로딩 전략 명시적 제어 (include, select)
  - 쿼리 로깅으로 성능 모니터링
- **PostgreSQL 지원**: 완벽한 PostgreSQL 기능 지원 (JSONB, Enum, UUID 등)
- **마이그레이션**:
  - 선언적 스키마 기반 마이그레이션
  - 마이그레이션 히스토리 추적
  - 프로덕션 배포 안전성

**Alternatives Considered**:
- **TypeORM**: 데코레이터 패턴 좋지만 타입 안전성 약함, 런타임 오류 가능성
- **Drizzle**: 경량, SQL-like이지만 생태계 미성숙, 도구 부족
- **Kysely**: 타입 안전 쿼리 빌더이지만 마이그레이션 도구 부족
- **Sequelize**: 레거시, TypeScript 지원 약함

**Trade-offs**:
- 장점: 타입 안전성, 개발자 경험, 쿼리 성능
- 단점: 데코레이터 패턴 미지원 (Entity 클래스 대신 스키마 파일), DTO 수동 정의 필요
- 결론: 타입 안전성과 개발자 경험이 데코레이터 패턴보다 우선

### 5. Authentication Strategy: JWT 기반 인증

**Decision**: JWT 토큰 기반 무상태 인증 (선택적 Redis 세션 캐싱)

**Rationale** (2025-01-06 계획 재검토 결과):
- **JWT 중심 접근**:
  - 무상태 토큰으로 서버 부하 최소화
  - 수평 확장 용이 (서버 간 상태 공유 불필요)
  - 클라이언트에서 즉시 검증 가능
  - NestJS @nestjs/jwt 공식 지원
- **PostgreSQL 세션 테이블**:
  - 모든 활성 세션을 데이터베이스에 저장
  - 명세서 요구사항: "모든 활성 세션 조회" (FR-018) 충족
  - 개별 세션 로그아웃 지원 (세션 테이블 삭제)
  - 감사 로그 연계 용이
- **선택적 Redis 캐싱**:
  - 자주 조회되는 세션 정보 캐싱 (성능 최적화)
  - DB 부하 감소, 그러나 필수 요구사항 아님
  - 초기 구현에서는 생략 가능
- **인증 워크플로우**:
  1. 로그인 성공 → PostgreSQL Session 테이블에 레코드 생성
  2. JWT 토큰 발급 (페이로드: session_id, user_id, exp)
  3. 요청마다: JWT 검증 → session_id 추출 → PostgreSQL 조회
  4. 세션 유효성 확인 (deleted_at IS NULL) → 요청 처리
  5. 로그아웃: Session 테이블의 deleted_at 업데이트
- **보안**:
  - JWT 탈취 시에도 세션 테이블 삭제로 즉시 차단
  - 민감한 정보는 DB에만 저장 (JWT에 최소 정보)
  - Refresh token 패턴 적용 가능 (향후 구현)

**Alternatives Considered**:
- **순수 세션 기반**: 확장 어렵고 서버 간 세션 복제 필요
- **하이브리드 (JWT + Redis 필수)**: Redis 의존성 증가, 초기 단계에 과도한 복잡도
- **Refresh Token만**: 복잡도 증가, 보안 이점 제한적

### 6. Authentication Libraries: NestJS + Passport.js Ecosystem

**Decision**: @nestjs/passport, @nestjs/jwt, Passport strategies

**Rationale**:
- **@nestjs/passport**:
  - NestJS 공식 Passport 통합 패키지
  - Guard 기반 인증 흐름 (AuthGuard)
  - 의존성 주입으로 Strategy 관리
- **@nestjs/jwt**:
  - JWT 토큰 생성 및 검증 서비스
  - ConfigService와 통합하여 설정 관리
  - RS256, HS256 등 다양한 알고리즘 지원
- **Passport Strategies**:
  - passport-kakao: 카카오 OAuth 2.0
  - passport-naver-v2: 네이버 OAuth 2.0
  - passport-google-oauth20: 구글 OAuth 2.0
  - passport-local: 로컬 인증 (이메일/비밀번호)
- **통합성**: NestJS 아키텍처와 완벽한 통합, 데코레이터 기반 보호

**Alternatives Considered**:
- **@fastify/jwt + @fastify/oauth2**: Fastify 전용, NestJS 호환 불가
- **Auth.js (NextAuth)**: Next.js 전용, NestJS 통합 복잡
- **jsonwebtoken + 직접 구현**: 유연하지만 보일러플레이트 많고 NestJS 패턴 불일치

### 7. Database: PostgreSQL 16

**Decision**: PostgreSQL 16

**Rationale**:
- **관계형 데이터**:
  - 사용자, 세션, 역할, 감사 로그는 관계형 모델에 적합
  - ACID 트랜잭션 보장 (계정 생성, 역할 변경)
- **JSONB 지원**: OAuth 메타데이터, 감사 로그 페이로드 유연하게 저장
- **확장성**:
  - 읽기 레플리카 지원 (조회 성능 향상)
  - 파티셔닝 (감사 로그 테이블)
- **보안**:
  - row-level security (RLS) 지원
  - 암호화 extension (pgcrypto)
- **Prisma 호환성**: Prisma의 최우선 지원 데이터베이스

**Alternatives Considered**:
- **MySQL**: JSON 지원 약함, 트랜잭션 성능 낮음
- **MongoDB**: NoSQL, ACID 보장 약함, 인증 데이터에 부적합
- **SQLite**: 개발용으로만 적합, 프로덕션 확장 불가

### 8. Session Store: PostgreSQL + 선택적 Redis 캐싱

**Decision**: PostgreSQL 세션 테이블 (Primary) + Redis 7 (선택적 캐싱)

**Rationale** (2025-01-06 계획 재검토 결과):
- **PostgreSQL 세션 테이블**:
  - 모든 활성 세션의 영구 저장소
  - 명세서 요구사항: "모든 활성 세션 조회" (FR-018) 충족
  - ACID 트랜잭션 보장 (로그인/로그아웃 일관성)
  - 감사 로그와 관계 설정 용이 (audit_logs.session_id FK)
  - TTL은 애플리케이션 레벨에서 관리 (expires_at 컬럼)
- **선택적 Redis 캐싱**:
  - 자주 조회되는 세션 정보 캐싱 (성능 최적화)
  - 인메모리 저장소, <1ms 응답 시간
  - Rate Limiting에 활용 (@nestjs/throttler + Redis)
  - 초기 구현에서는 생략 가능 (DB 성능 충분 시)
- **확장성**:
  - PostgreSQL 읽기 레플리카 (조회 성능 향상)
  - Redis Cluster (캐싱 확장)
  - 세션 테이블 파티셔닝 (향후 고려)

**Alternatives Considered**:
- **Redis 단독**: 인메모리 전용, 재시작 시 세션 손실 위험
- **Memcached**: 단순하지만 데이터 구조 제한적, 복제 불가
- **DynamoDB**: 클라우드 전용, self-hosted 불가

## Security Research

### Password Hashing: bcrypt

**Decision**: bcrypt 사용

**Rationale** (2025-01-06 계획 재검토 결과):
- **bcrypt**:
  - 업계 표준 해싱 알고리즘 (1999년부터 사용)
  - GPU/ASIC 공격 저항성 우수
  - NestJS 생태계 표준 (대부분 튜토리얼 및 예제)
  - Node.js 네이티브 바인딩 지원 (bcrypt 패키지)
  - 광범위한 프로덕션 검증
- **설정**:
  - Salt rounds: 12 (권장)
  - 해싱 시간: ~100ms (사용자 경험 저해하지 않음)
  - 자동 솔트 생성
- **argon2 대비 Trade-off**:
  - bcrypt: 성숙한 생태계, 간단한 API, NestJS 표준
  - argon2: 최신 알고리즘, 메모리 하드, 그러나 설정 복잡도 증가
  - 결론: 초기 구현에서는 bcrypt로 시작, 향후 필요 시 argon2 마이그레이션

**Alternative**: argon2id (최신, 더 강력하지만 초기 단계에 과도한 복잡도)

### OAuth 2.0 Security Best Practices

**Research Findings**:
1. **PKCE (Proof Key for Code Exchange)** 필수
   - Authorization code 탈취 방지
   - Public client (SPA, Mobile) 필수
2. **State 파라미터** 사용
   - CSRF 공격 방지
   - Passport.js 전략이 자동 생성/검증
3. **Nonce** 사용 (OpenID Connect)
   - Replay attack 방지
   - passport-google-oauth20 등에서 지원
4. **Redirect URI 화이트리스트**
   - Open redirect 취약점 방지
   - 환경 변수로 관리 (@nestjs/config)

**Implementation**: Passport.js OAuth 전략들이 모두 지원

### MFA (Multi-Factor Authentication) Best Practices

**Research Findings**:
1. **TOTP (Time-based One-Time Password)** 표준
   - RFC 6238 준수
   - Google Authenticator, Authy 등 호환
   - 6자리 코드, 30초 유효 기간
2. **백업 코드**:
   - 10개 일회용 코드 생성
   - bcrypt로 해싱 저장
   - 사용 후 즉시 무효화
3. **복구 플로우**:
   - 이메일 인증 → 2FA 비활성화 링크
   - 관리자 검증 (고가치 계정)

**Library**: `speakeasy` (TOTP 생성/검증) + `qrcode` (QR 코드 생성)

### Rate Limiting Strategy

**Research Findings**:
1. **IP 기반 제한**:
   - 로그인 시도: 5회/5분
   - 비밀번호 재설정: 3회/hour
   - 회원가입: 3회/hour
2. **사용자 기반 제한**:
   - 이메일 인증 재발송: 3회/5분
   - 세션 생성: 10개/사용자 동시
3. **글로벌 제한**:
   - API 전체: 100 req/min/IP (익명)
   - API 전체: 1000 req/min/사용자 (인증)

**Implementation**: @nestjs/throttler + 선택적 Redis 저장소 (기본: 인메모리)

### Audit Logging Strategy

**Research Findings**:
1. **로그 대상**:
   - 인증 이벤트: 로그인, 로그아웃, 세션 생성/삭제
   - 권한 변경: 역할 승격, 비밀번호 변경, MFA 설정
   - 보안 이벤트: 로그인 실패, OAuth 연결, 계정 삭제
2. **로그 내용**:
   - 타임스탬프 (UTC)
   - 사용자 ID
   - 이벤트 타입
   - IP 주소
   - User-Agent
   - 성공/실패 여부
   - 메타데이터 (JSONB)
3. **보관 기간**:
   - 활성 로그: 90일 (PostgreSQL)
   - 아카이브: 1년 (압축 백업)

**Implementation**: Prisma 모델 + 비동기 기록 (Bull Queue)

## Architecture Patterns

### Modular Structure (Backend)

**Pattern**: NestJS 모듈 기반 도메인 분리

**Structure**:
```
src/
├── auth/
│   ├── auth.module.ts          # AuthModule 정의
│   ├── auth.controller.ts      # 인증 API 엔드포인트
│   ├── auth.service.ts         # 인증 비즈니스 로직
│   ├── strategies/             # Passport 전략들
│   │   ├── jwt.strategy.ts
│   │   ├── local.strategy.ts
│   │   ├── kakao.strategy.ts
│   │   ├── naver.strategy.ts
│   │   └── google.strategy.ts
│   ├── guards/                 # AuthGuard 확장
│   │   ├── jwt-auth.guard.ts
│   │   └── roles.guard.ts
│   └── decorators/             # 커스텀 데코레이터
│       └── current-user.decorator.ts
├── users/
│   ├── users.module.ts         # UsersModule 정의
│   ├── users.controller.ts     # 사용자 관리 API
│   ├── users.service.ts        # 사용자 비즈니스 로직
│   ├── entities/               # Prisma 타입 (재export용)
│   │   └── user.entity.ts
│   └── dto/                    # Data Transfer Objects
│       ├── create-user.dto.ts
│       └── update-user.dto.ts
├── sessions/
│   ├── sessions.module.ts      # SessionsModule 정의
│   ├── sessions.service.ts     # 세션 관리 로직
│   └── entities/
│       └── session.entity.ts
└── audit/
    ├── audit.module.ts         # AuditModule 정의
    ├── audit.service.ts        # 감사 로그 기록
    └── entities/
        └── audit-log.entity.ts
```

**Benefits**:
- NestJS 의존성 주입 활용
- 모듈 간 명확한 경계
- 독립적 테스트 가능 (TestingModule)
- 팀 협업 용이 (모듈별 담당)

### API Versioning

**Pattern**: URI 경로 버전 관리

**Format**: `/api/v1/{resource}`

**Example**:
- `/api/v1/auth/login`
- `/api/v1/users/me`
- `/api/v1/sessions`

**Rationale**:
- 명확한 버전 구분
- 클라이언트 호환성 보장
- 점진적 마이그레이션 가능

### Error Handling

**Pattern**: 일관된 에러 응답 포맷

**Format**:
```json
{
  "status": "error",
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "이메일 또는 비밀번호가 올바르지 않습니다",
    "details": {
      "attempts_remaining": 3
    }
  }
}
```

**Benefits**:
- 프론트엔드에서 일관된 처리
- 디버깅 용이
- OpenAPI 문서화

### Configuration Management

**Pattern**: 환경 변수 + Zod 검증

**Implementation**:
```typescript
import { z } from 'zod';

const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  // ...
});

export const config = configSchema.parse(process.env);
```

**Benefits**:
- 런타임 타입 안전성
- 누락된 환경 변수 조기 발견
- 자동 타입 추론

### Email Service Integration

**Service**: SendGrid

**Rationale** (2025-01-06 계획 재검토 결과):
- **신뢰성 및 안정성**:
  - 업계 표준 이메일 서비스 (Twilio 인수)
  - 99.9% 가동 시간 SLA
  - 높은 전달률 (99%+) 및 명성 관리
  - 프로덕션 검증된 서비스 (대규모 기업 사용)
- **무료 티어**:
  - 월 100통 무료 (초기 테스트 충분)
  - 유료 전환 용이 (월 $19.95부터)
- **기능**:
  - HTML/Text 이메일 지원
  - 동적 템플릿 시스템
  - 웹훅을 통한 전송 상태 추적
  - 발신자 도메인 인증 (SPF, DKIM, DMARC)
  - 이메일 분석 및 통계
- **개발자 경험**:
  - TypeScript SDK 제공 (@sendgrid/mail)
  - NestJS 통합 용이 (의존성 주입)
  - 명확한 에러 메시지

**Implementation**:
```typescript
// email.module.ts
import { Module } from '@nestjs/common';
import * as sgMail from '@sendgrid/mail';
import { ConfigService } from '@nestjs/config';

@Module({
  providers: [
    {
      provide: 'SENDGRID_CLIENT',
      useFactory: (configService: ConfigService) => {
        sgMail.setApiKey(configService.get('SENDGRID_API_KEY'));
        return sgMail;
      },
      inject: [ConfigService],
    },
    EmailService,
  ],
  exports: [EmailService],
})
export class EmailModule {}

// email.service.ts
import * as sgMail from '@sendgrid/mail';

@Injectable()
export class EmailService {
  constructor(@Inject('SENDGRID_CLIENT') private sendgrid: typeof sgMail) {}

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    await this.sendgrid.send({
      from: 'ReadZone <noreply@readzone.com>',
      to,
      subject: '이메일 인증을 완료해주세요',
      html: `<p>다음 링크를 클릭하여 이메일 인증을 완료하세요:</p>
             <a href="https://readzone.com/verify?token=${token}">이메일 인증하기</a>`,
    });
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    await this.sendgrid.send({
      from: 'ReadZone <noreply@readzone.com>',
      to,
      subject: '비밀번호 재설정',
      html: `<p>다음 링크를 클릭하여 비밀번호를 재설정하세요:</p>
             <a href="https://readzone.com/reset-password?token=${token}">비밀번호 재설정하기</a>`,
    });
  }
}
```

**Alternatives Considered**:
- **Resend**: 신생 서비스, 프로덕션 검증 부족, 장기 안정성 불확실
- **Mailgun**: 무료 티어 없음, 가격 높음
- **AWS SES**: 복잡한 설정, 초기 발신자 검증 필요
- **Nodemailer + Gmail**: 일일 500통 제한, 프로덕션 부적합

## Testing Strategy

### Testing Pyramid

**Distribution**:
- Unit Tests: 70% (비즈니스 로직, 유틸리티)
- Integration Tests: 20% (API 엔드포인트)
- E2E Tests: 10% (사용자 시나리오)

### Unit Testing

**Framework**: Jest (NestJS 표준)

**Rationale** (2025-01-06 계획 재검토 결과):
- NestJS 공식 테스팅 프레임워크
- @nestjs/testing 패키지와 완벽 통합
- TestingModule을 통한 의존성 주입 테스트
- 성숙한 생태계 및 풍부한 문서

**Coverage**:
- 서비스 로직 (auth, user, session)
- 유틸리티 함수 (password hashing, token generation)
- class-validator DTO 검증

**Example**:
```typescript
describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should hash password with bcrypt', async () => {
    const password = 'Test1234!';
    const hashed = await service.hashPassword(password);
    expect(await service.verifyPassword(password, hashed)).toBe(true);
  });
});
```

### Integration Testing

**Framework**: Jest + Supertest (NestJS 표준)

**Coverage**:
- API 엔드포인트 (요청/응답 검증)
- 데이터베이스 상호작용 (Prisma mock 또는 테스트 DB)
- JWT 인증 플로우

**Example**:
```typescript
describe('POST /api/v1/auth/login', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return JWT token on valid credentials', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'Test1234!' })
      .expect(200);

    expect(response.body.data.token).toBeDefined();
  });
});
```

### E2E Testing

**Framework**: Playwright

**Coverage**:
- 6개 사용자 시나리오 (명세서)
- 크로스 브라우저 테스트 (Chromium, Firefox)
- 모바일 뷰포트 테스트

**Example**:
```typescript
test('사용자 회원가입 및 로그인', async ({ page }) => {
  await page.goto('/signup');
  await page.fill('[name="email"]', 'new@example.com');
  await page.fill('[name="password"]', 'Test1234!');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('.email-verification-banner')).toBeVisible();
});
```

### Contract Testing

**Framework**: class-validator + OpenAPI (@nestjs/swagger)

**Approach**:
1. class-validator 데코레이터로 DTO 정의
2. NestJS ValidationPipe 자동 검증
3. @nestjs/swagger로 OpenAPI 스펙 자동 생성
4. 테스트에서 스펙 검증

## Development Workflow

### Local Development Setup

**Services**:
- PostgreSQL: Docker container
- Redis: Docker container
- Backend: `pnpm dev` (NestJS)
- Frontend: `pnpm dev` (Vite)

**Docker Compose**:
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: readzone_dev
      POSTGRES_USER: readzone
      POSTGRES_PASSWORD: dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### CI/CD Pipeline

**Stages**:
1. **Lint & Format**: ESLint, Prettier
2. **Type Check**: TypeScript compiler
3. **Unit Tests**: Jest (backend + frontend)
4. **Integration Tests**: Jest + Supertest (backend)
5. **E2E Tests**: Playwright (critical paths만)
6. **Build**: Production build 검증
7. **Security Scan**: npm audit, Snyk

**Tools**:
- GitHub Actions (우선) 또는 GitLab CI
- Test coverage: Codecov
- Security: Dependabot

### Deployment Strategy

**Target**: 우분투 미니PC

**Approach**:
1. **Docker Compose**: 전체 스택 컨테이너화
2. **Nginx**: 리버스 프록시 + HTTPS (Let's Encrypt)
3. **PM2**: Node.js 프로세스 관리 (대안)
4. **Backup**: 자동 PostgreSQL 백업 (pg_dump)

**Zero-Downtime Deployment**:
- Database migrations: 먼저 실행 (backward compatible)
- Rolling update: 한 인스턴스씩 재시작
- Health check: `/api/v1/health` 엔드포인트

## Monitoring & Observability

### Metrics

**Tool**: Prometheus + Grafana

**Metrics**:
- 요청 수, 응답 시간 (p50, p95, p99)
- 에러율 (4xx, 5xx)
- 활성 세션 수
- 데이터베이스 커넥션 풀 사용률
- Redis 메모리 사용량

### Logging

**Tool**: Winston (@nestjs/logger 대체) 또는 Pino + Loki

**Log Levels**:
- ERROR: 시스템 오류 (500 응답, 예외)
- WARN: 경고 (429 rate limit, 401 인증 실패)
- INFO: 정보 (로그인 성공, 계정 생성)
- DEBUG: 디버깅 (개발 환경만)

**Structured Logging**:
```json
{
  "level": "info",
  "time": "2025-11-05T12:00:00.000Z",
  "msg": "User logged in successfully",
  "userId": "123",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0..."
}
```

### Tracing

**Tool**: OpenTelemetry (선택사항, 향후)

**Use Case**:
- 분산 추적 (API → Database → Redis)
- 병목 지점 식별

## Open Questions & Future Research

### Resolved During Planning

모든 주요 기술 결정이 계획 단계에서 확정되었습니다. 추가 연구 없이 구현 가능합니다.

### Potential Future Enhancements

**Phase 2 이후 고려사항**:
1. **WebAuthn 지원**: 생체 인증, 하드웨어 키
2. **Magic Link 로그인**: 비밀번호 없는 인증
3. **Social Login 확장**: Twitter, Facebook, Apple
4. **Session Replay**: 보안 감사용 세션 재생
5. **Anomaly Detection**: ML 기반 이상 로그인 탐지

## Research Summary

**Updated 2025-01-06**: 계획 재검토 결과 일부 기술 스택 변경

| Category | Decision | Confidence | Notes |
|----------|----------|------------|-------|
| Backend Framework | NestJS + TypeScript | ✅ High | 확정 |
| Frontend Framework | React + Vite + TypeScript | ✅ High | 확정 |
| Monorepo Tool | pnpm workspaces | ✅ High | 확정 |
| ORM | **Prisma 5.x** | ✅ High | TypeORM에서 변경 (타입 안전성) |
| Auth Strategy | **JWT 기반** | ✅ High | 하이브리드에서 단순화 |
| Auth Libraries | NestJS + Passport.js ecosystem | ✅ High | 확정 |
| OAuth Strategies | passport-kakao/naver-v2/google-oauth20 | ✅ High | 확정 |
| Email Service | **SendGrid** | ✅ High | Resend에서 변경 (안정성) |
| Database | PostgreSQL 16 | ✅ High | 확정 |
| Session Store | Redis 7 (선택사항) | ⚠️ Medium | 캐싱용, 필수 아님 |
| Password Hashing | **bcrypt** | ✅ High | argon2에서 변경 (호환성) |
| Testing Framework | **Jest + Playwright** | ✅ High | Vitest에서 변경 (NestJS 표준) |
| Deployment | Docker Compose (우분투 미니PC) | ✅ High | 확정 |

**Status**: ✅ Research 완료. Phase 1 (설계 및 계약) 진행 가능.

---

**Next Steps**: Phase 1 - 데이터 모델 정의 (data-model.md)

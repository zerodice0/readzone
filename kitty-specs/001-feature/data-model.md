# Data Model Design: 사용자 인증 시스템

**Feature**: [spec.md](./spec.md)
**Created**: 2025-11-05
**Status**: Phase 1 - Design & Contracts

## Overview

이 문서는 사용자 인증 시스템의 데이터 모델을 정의합니다. TypeORM을 사용하여 PostgreSQL 데이터베이스 스키마를 구현하며, TypeScript strict mode에서 완전한 타입 안전성을 제공합니다.

### Design Principles

1. **Type Safety**: TypeORM 데코레이터와 명시적 타입으로 `any` 타입 사용 완전 제거
2. **Data Integrity**: Foreign key 제약, unique 제약, NOT NULL 제약 활용
3. **Performance**: 적절한 인덱스 설정으로 쿼리 성능 최적화
4. **Security**: 민감 정보 암호화, soft-delete 패턴, audit logging
5. **Scalability**: 정규화된 스키마, 효율적인 관계 설정
6. **NestJS Integration**: @nestjs/typeorm과 완벽한 통합, 의존성 주입 활용

## Entity Relationship Diagram

```
User (1) ──── (N) Session
User (1) ──── (N) OAuthConnection
User (1) ──── (1) MFASettings
User (1) ──── (N) AuditLog
User (1) ──── (N) EmailVerificationToken
User (1) ──── (N) PasswordResetToken
```

## Core Entities

### 1. User

**Purpose**: 사용자 계정의 핵심 엔티티

**Attributes**:
- `id`: UUID (primary key)
- `email`: String (unique, indexed)
- `emailVerified`: Boolean (기본값: false)
- `emailVerifiedAt`: DateTime (nullable)
- `passwordHash`: String (nullable, OAuth 전용 계정은 null)
- `role`: Enum (anonymous, user, moderator, admin)
- `status`: Enum (active, suspended, deleted)
- `deletedAt`: DateTime (nullable, soft-delete)
- `lastLoginAt`: DateTime (nullable)
- `lastLoginIp`: String (nullable)
- `createdAt`: DateTime
- `updatedAt`: DateTime

**Indexes**:
- `email` (unique)
- `status, deletedAt` (composite, 활성 사용자 조회 최적화)
- `role` (RBAC 쿼리 최적화)

**Relationships**:
- `sessions`: Session[] (1:N)
- `oauthConnections`: OAuthConnection[] (1:N)
- `mfaSettings`: MFASettings (1:1, nullable)
- `auditLogs`: AuditLog[] (1:N)
- `emailVerificationTokens`: EmailVerificationToken[] (1:N)
- `passwordResetTokens`: PasswordResetToken[] (1:N)

**Business Rules**:
- Email은 대소문자 구분 없이 unique (저장 시 lowercase 변환)
- `passwordHash`는 argon2id 알고리즘 사용 (최소 비용 파라미터: memory=65536, iterations=3, parallelism=4)
- Soft-delete: `status = 'deleted'` + `deletedAt` 설정, 30일 후 물리 삭제
- `emailVerified = false`인 사용자는 제한된 권한 (읽기 전용)

**Validation Rules**:
- Email: RFC 5322 형식, 최대 255자
- PasswordHash: argon2id 해시 형식 검증
- Role: 기본값 'user', 변경은 admin만 가능
- Status: 'active' → 'suspended' → 'deleted' 단방향 전환

---

### 2. Session

**Purpose**: 사용자 세션 관리 (하이브리드 전략: JWT + Redis)

**Attributes**:
- `id`: UUID (primary key, JWT에 포함될 session ID)
- `userId`: UUID (foreign key → User.id, indexed)
- `token`: String (JWT 전체 문자열, nullable, 서명 검증용)
- `refreshToken`: String (nullable, refresh token 저장)
- `expiresAt`: DateTime (세션 만료 시간)
- `refreshExpiresAt`: DateTime (nullable, refresh token 만료 시간)
- `ipAddress`: String
- `userAgent`: String
- `deviceInfo`: JSON (브라우저, OS, 디바이스 타입)
- `isActive`: Boolean (기본값: true)
- `revokedAt`: DateTime (nullable, 수동 로그아웃/강제 종료 시)
- `createdAt`: DateTime
- `updatedAt`: DateTime

**Indexes**:
- `userId` (foreign key, 사용자별 세션 조회)
- `userId, isActive, expiresAt` (composite, 활성 세션 조회 최적화)
- `expiresAt` (만료 세션 정리 작업 최적화)

**Relationships**:
- `user`: User (N:1)

**Business Rules**:
- JWT는 session ID만 포함, 실제 세션 데이터는 Redis에 저장
- TTL: 24시간 (일반), 30일 (remember-me)
- 동시 세션 제한: 사용자당 최대 5개 활성 세션
- 만료/비활성 세션은 매일 자동 정리 (cron job)

**Hybrid Auth Strategy**:
```
1. 로그인 성공 → Session 레코드 생성 (DB)
2. JWT 생성 (payload: { sessionId, userId, role })
3. Redis 저장 (key: sessionId, value: { userId, role, permissions }, TTL: 24h)
4. 클라이언트에 JWT 전달 (HttpOnly cookie)

인증 검증:
1. JWT 디코딩 → sessionId 추출
2. Redis 조회 (sessionId) → 빠른 검증
3. Redis miss → DB 조회 (fallback) + Redis 캐시 갱신
4. 세션 유효성 검증 (isActive, expiresAt)
```

**Validation Rules**:
- IP Address: IPv4/IPv6 형식
- User Agent: 최대 1000자
- Device Info: JSON 스키마 검증 (browser, os, device 필드)

---

### 3. OAuthConnection

**Purpose**: OAuth 제공자(Google, GitHub) 연결 정보

**Attributes**:
- `id`: UUID (primary key)
- `userId`: UUID (foreign key → User.id, indexed)
- `provider`: Enum (google, github)
- `providerId`: String (제공자의 user ID, unique per provider)
- `email`: String (제공자에서 받은 email)
- `accessToken`: String (nullable, 암호화 저장)
- `refreshToken`: String (nullable, 암호화 저장)
- `tokenExpiresAt`: DateTime (nullable)
- `profile`: JSON (제공자 프로필 정보: name, avatar, etc.)
- `createdAt`: DateTime
- `updatedAt`: DateTime

**Indexes**:
- `userId` (foreign key)
- `provider, providerId` (composite unique, 중복 연결 방지)
- `provider, email` (composite, OAuth 이메일 조회)

**Relationships**:
- `user`: User (N:1)

**Business Rules**:
- 한 사용자는 제공자당 1개의 연결만 가능
- Access/Refresh Token은 AES-256-GCM으로 암호화 저장
- OAuth 전용 계정: `User.passwordHash = null`, `User.emailVerified = true` (제공자 이메일 신뢰)
- 연결 해제 시: OAuthConnection 삭제, 단 User 레코드는 유지

**OAuth Flow**:
```
1. OAuth 제공자 인증 → providerId, email, tokens 획득
2. email로 기존 User 조회
   - 존재: OAuthConnection 연결
   - 미존재: User + OAuthConnection 생성
3. Session 생성 및 JWT 발급
```

**Validation Rules**:
- Provider ID: 제공자별 형식 검증 (Google: numeric, GitHub: numeric)
- Email: RFC 5322 형식
- Tokens: 암호화 전 길이 제한 (최대 2048자)

---

### 4. MFASettings

**Purpose**: 다중 인증(MFA/2FA) 설정 (TOTP 기반)

**Attributes**:
- `id`: UUID (primary key)
- `userId`: UUID (foreign key → User.id, unique)
- `enabled`: Boolean (기본값: false)
- `secret`: String (TOTP secret, AES-256-GCM 암호화)
- `backupCodes`: String[] (복구 코드 배열, 각각 SHA-256 해시)
- `verifiedAt`: DateTime (nullable, MFA 활성화 시점)
- `createdAt`: DateTime
- `updatedAt`: DateTime

**Indexes**:
- `userId` (unique, 1:1 관계)

**Relationships**:
- `user`: User (1:1)

**Business Rules**:
- TOTP 표준: RFC 6238 (30초 time step, 6자리 코드)
- Backup codes: 10개 생성, 1회 사용 후 삭제, 모두 소진 시 재생성 프롬프트
- Secret 암호화: key rotation 지원 (매 90일)
- MFA 활성화 과정:
  1. Secret 생성 및 QR 코드 표시
  2. 사용자 TOTP 코드 검증
  3. Backup codes 생성 및 표시
  4. `enabled = true`, `verifiedAt = now()` 설정

**Validation Rules**:
- Secret: Base32 인코딩, 32자
- Backup codes: 각 코드는 16자 영숫자, SHA-256 해시 저장
- TOTP 검증: ±1 time step 허용 (시간 오차 보정)

---

### 5. AuditLog

**Purpose**: 보안 관련 이벤트 감사 로그

**Attributes**:
- `id`: UUID (primary key)
- `userId`: UUID (nullable, foreign key → User.id, indexed)
- `action`: Enum (login, logout, login_failed, password_change, mfa_enable, mfa_disable, role_change, account_suspend, account_delete, oauth_connect, oauth_disconnect, password_reset, email_verify)
- `ipAddress`: String
- `userAgent`: String
- `metadata`: JSON (추가 컨텍스트: 실패 이유, 변경 전/후 값 등)
- `severity`: Enum (info, warning, critical)
- `timestamp`: DateTime (indexed)
- `createdAt`: DateTime

**Indexes**:
- `userId` (foreign key)
- `action` (이벤트 유형별 조회)
- `timestamp` (시간 범위 조회, 파티셔닝 기준)
- `userId, timestamp` (composite, 사용자별 활동 이력)
- `severity, timestamp` (composite, 위험 이벤트 모니터링)

**Relationships**:
- `user`: User (N:1, nullable)

**Business Rules**:
- 모든 보안 이벤트는 즉시 기록 (비동기 처리)
- 로그는 수정/삭제 불가 (immutable)
- 보관 기간: 90일 (규정 준수), 이후 아카이브 또는 삭제
- 비정상 패턴 감지: 단시간 내 반복 실패 → 계정 잠금 트리거
- `userId = null`: 시스템 이벤트 또는 인증 전 이벤트 (예: 로그인 실패)

**Severity Levels**:
- `info`: 일반 이벤트 (로그인 성공, 로그아웃)
- `warning`: 주의 필요 (로그인 실패, 비밀번호 재설정 요청)
- `critical`: 즉각 대응 (계정 정지, 역할 변경, MFA 비활성화)

**Validation Rules**:
- IP Address: IPv4/IPv6 형식
- User Agent: 최대 1000자
- Metadata: JSON 스키마 검증 (action별 필수 필드)

---

### 6. EmailVerificationToken

**Purpose**: 이메일 인증 토큰 (일회용)

**Attributes**:
- `id`: UUID (primary key)
- `userId`: UUID (foreign key → User.id, indexed)
- `token`: String (unique, indexed, URL-safe random 32자)
- `expiresAt`: DateTime (토큰 만료 시간, 기본 24시간)
- `usedAt`: DateTime (nullable, 사용 시점)
- `ipAddress`: String (nullable, 토큰 사용 시 IP)
- `createdAt`: DateTime

**Indexes**:
- `userId` (foreign key)
- `token` (unique, 빠른 조회)
- `expiresAt` (만료 토큰 정리)

**Relationships**:
- `user`: User (N:1)

**Business Rules**:
- 토큰 생성: `crypto.randomBytes(32).toString('base64url')`
- TTL: 24시간 (생성 시각 기준)
- 1회 사용: `usedAt` 설정 후 재사용 불가
- 만료/사용된 토큰 자동 정리 (daily cron)
- 재전송: 기존 미사용 토큰 무효화 후 새 토큰 생성

**Validation Rules**:
- Token: 32자 URL-safe Base64
- Expiration: 생성 시각 + 24시간
- 사용 검증: `usedAt = null` AND `expiresAt > now()`

---

### 7. PasswordResetToken

**Purpose**: 비밀번호 재설정 토큰 (일회용)

**Attributes**:
- `id`: UUID (primary key)
- `userId`: UUID (foreign key → User.id, indexed)
- `token`: String (unique, indexed, URL-safe random 32자)
- `expiresAt`: DateTime (토큰 만료 시간, 기본 1시간)
- `usedAt`: DateTime (nullable, 사용 시점)
- `ipAddress`: String (nullable, 토큰 사용 시 IP)
- `createdAt`: DateTime

**Indexes**:
- `userId` (foreign key)
- `token` (unique, 빠른 조회)
- `expiresAt` (만료 토큰 정리)

**Relationships**:
- `user`: User (N:1)

**Business Rules**:
- 토큰 생성: `crypto.randomBytes(32).toString('base64url')`
- TTL: 1시간 (보안상 짧은 유효 기간)
- 1회 사용: `usedAt` 설정 후 재사용 불가
- 만료/사용된 토큰 자동 정리 (hourly cron)
- 비밀번호 변경 성공 시: 모든 활성 세션 무효화
- Rate limiting: 사용자당 1시간에 3회 요청 제한

**Validation Rules**:
- Token: 32자 URL-safe Base64
- Expiration: 생성 시각 + 1시간
- 사용 검증: `usedAt = null` AND `expiresAt > now()`

---

## Enums

### UserRole
```typescript
enum UserRole {
  ANONYMOUS = 'anonymous',  // 비로그인 사용자 (읽기 전용)
  USER = 'user',            // 일반 사용자 (리뷰 작성/수정/삭제)
  MODERATOR = 'moderator',  // 모더레이터 (콘텐츠 관리)
  ADMIN = 'admin'           // 관리자 (전체 시스템 관리)
}
```

### UserStatus
```typescript
enum UserStatus {
  ACTIVE = 'active',        // 활성 계정
  SUSPENDED = 'suspended',  // 정지된 계정 (로그인 불가)
  DELETED = 'deleted'       // 삭제 예정 계정 (30일 유예)
}
```

### OAuthProvider
```typescript
enum OAuthProvider {
  GOOGLE = 'google',
  GITHUB = 'github'
}
```

### AuditAction
```typescript
enum AuditAction {
  LOGIN = 'login',
  LOGOUT = 'logout',
  LOGIN_FAILED = 'login_failed',
  PASSWORD_CHANGE = 'password_change',
  MFA_ENABLE = 'mfa_enable',
  MFA_DISABLE = 'mfa_disable',
  ROLE_CHANGE = 'role_change',
  ACCOUNT_SUSPEND = 'account_suspend',
  ACCOUNT_DELETE = 'account_delete',
  OAUTH_CONNECT = 'oauth_connect',
  OAUTH_DISCONNECT = 'oauth_disconnect',
  PASSWORD_RESET = 'password_reset',
  EMAIL_VERIFY = 'email_verify'
}
```

### AuditSeverity
```typescript
enum AuditSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical'
}
```

---

## TypeORM Entity Definitions

### User Entity

```typescript
// src/users/entities/user.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
  Index,
} from 'typeorm';
import { Session } from '../../sessions/entities/session.entity';
import { OAuthConnection } from '../../auth/entities/oauth-connection.entity';
import { MFASettings } from '../../auth/entities/mfa-settings.entity';
import { AuditLog } from '../../audit/entities/audit-log.entity';
import { EmailVerificationToken } from '../../auth/entities/email-verification-token.entity';
import { PasswordResetToken } from '../../auth/entities/password-reset-token.entity';

export enum UserRole {
  ANONYMOUS = 'anonymous',
  USER = 'user',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
}

export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  DELETED = 'deleted',
}

@Entity('users')
@Index(['status', 'deletedAt'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @Index()
  email!: string;

  @Column({ type: 'boolean', default: false })
  emailVerified!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  emailVerifiedAt?: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  passwordHash?: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  @Index()
  role!: UserRole;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status!: UserStatus;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt?: Date;

  @Column({ type: 'varchar', length: 45, nullable: true })
  lastLoginIp?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relationships
  @OneToMany(() => Session, (session) => session.user)
  sessions!: Session[];

  @OneToMany(() => OAuthConnection, (connection) => connection.user)
  oauthConnections!: OAuthConnection[];

  @OneToOne(() => MFASettings, (mfaSettings) => mfaSettings.user, { nullable: true })
  mfaSettings?: MFASettings;

  @OneToMany(() => AuditLog, (auditLog) => auditLog.user)
  auditLogs!: AuditLog[];

  @OneToMany(() => EmailVerificationToken, (token) => token.user)
  emailVerificationTokens!: EmailVerificationToken[];

  @OneToMany(() => PasswordResetToken, (token) => token.user)
  passwordResetTokens!: PasswordResetToken[];
}
```

### Session Entity

```typescript
// src/sessions/entities/session.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('sessions')
@Index(['userId', 'isActive', 'expiresAt'])
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  @Index()
  userId!: string;

  @Column({ type: 'text', nullable: true })
  token?: string;

  @Column({ type: 'text', nullable: true })
  refreshToken?: string;

  @Column({ type: 'timestamp' })
  @Index()
  expiresAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  refreshExpiresAt?: Date;

  @Column({ type: 'varchar', length: 45 })
  ipAddress!: string;

  @Column({ type: 'varchar', length: 1000 })
  userAgent!: string;

  @Column({ type: 'jsonb' })
  deviceInfo!: Record<string, unknown>;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  revokedAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;
}
```

### OAuthConnection Entity

```typescript
// src/auth/entities/oauth-connection.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum OAuthProvider {
  KAKAO = 'kakao',
  NAVER = 'naver',
  GOOGLE = 'google',
}

@Entity('oauth_connections')
@Index(['provider', 'providerId'], { unique: true })
@Index(['provider', 'email'])
export class OAuthConnection {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  @Index()
  userId!: string;

  @Column({ type: 'enum', enum: OAuthProvider })
  provider!: OAuthProvider;

  @Column({ type: 'varchar', length: 255 })
  providerId!: string;

  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'text', nullable: true })
  accessToken?: string;

  @Column({ type: 'text', nullable: true })
  refreshToken?: string;

  @Column({ type: 'timestamp', nullable: true })
  tokenExpiresAt?: Date;

  @Column({ type: 'jsonb' })
  profile!: Record<string, unknown>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.oauthConnections, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;
}
```

### MFASettings Entity

```typescript
// src/auth/entities/mfa-settings.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('mfa_settings')
export class MFASettings {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', unique: true })
  userId!: string;

  @Column({ type: 'boolean', default: false })
  enabled!: boolean;

  @Column({ type: 'varchar', length: 255 })
  secret!: string;

  @Column({ type: 'simple-array' })
  backupCodes!: string[];

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relationships
  @OneToOne(() => User, (user) => user.mfaSettings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;
}
```

### AuditLog Entity

```typescript
// src/audit/entities/audit-log.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum AuditAction {
  LOGIN = 'login',
  LOGOUT = 'logout',
  LOGIN_FAILED = 'login_failed',
  PASSWORD_CHANGE = 'password_change',
  MFA_ENABLE = 'mfa_enable',
  MFA_DISABLE = 'mfa_disable',
  ROLE_CHANGE = 'role_change',
  ACCOUNT_SUSPEND = 'account_suspend',
  ACCOUNT_DELETE = 'account_delete',
  OAUTH_CONNECT = 'oauth_connect',
  OAUTH_DISCONNECT = 'oauth_disconnect',
  PASSWORD_RESET = 'password_reset',
  EMAIL_VERIFY = 'email_verify',
}

export enum AuditSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

@Entity('audit_logs')
@Index(['userId', 'timestamp'])
@Index(['severity', 'timestamp'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  userId?: string;

  @Column({ type: 'enum', enum: AuditAction })
  @Index()
  action!: AuditAction;

  @Column({ type: 'varchar', length: 45 })
  ipAddress!: string;

  @Column({ type: 'varchar', length: 1000 })
  userAgent!: string;

  @Column({ type: 'jsonb' })
  metadata!: Record<string, unknown>;

  @Column({ type: 'enum', enum: AuditSeverity, default: AuditSeverity.INFO })
  severity!: AuditSeverity;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @Index()
  timestamp!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.auditLogs, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'userId' })
  user?: User;
}
```

### EmailVerificationToken Entity

```typescript
// src/auth/entities/email-verification-token.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('email_verification_tokens')
export class EmailVerificationToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  @Index()
  userId!: string;

  @Column({ type: 'varchar', length: 64, unique: true })
  @Index()
  token!: string;

  @Column({ type: 'timestamp' })
  @Index()
  expiresAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  usedAt?: Date;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress?: string;

  @CreateDateColumn()
  createdAt!: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.emailVerificationTokens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;
}
```

### PasswordResetToken Entity

```typescript
// src/auth/entities/password-reset-token.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('password_reset_tokens')
export class PasswordResetToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  @Index()
  userId!: string;

  @Column({ type: 'varchar', length: 64, unique: true })
  @Index()
  token!: string;

  @Column({ type: 'timestamp' })
  @Index()
  expiresAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  usedAt?: Date;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress?: string;

  @CreateDateColumn()
  createdAt!: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.passwordResetTokens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;
}
```

---

## Type Safety & TypeORM Integration

TypeORM은 데코레이터와 명시적 타입 정의로 완전한 타입 안전성을 제공합니다:

```typescript
// src/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, UserStatus } from './entities/user.entity';
import * as argon2 from 'argon2';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  // ✅ 완전한 타입 안전성 (any 타입 사용 없음)
  async createUser(email: string, password: string): Promise<User> {
    const passwordHash = await argon2.hash(password);

    const user = this.usersRepository.create({
      email: email.toLowerCase(),
      passwordHash,
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
    });

    return this.usersRepository.save(user);
  }

  // ✅ 관계 포함 쿼리도 타입 안전
  async getUserWithActiveSessions(userId: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id: userId },
      relations: ['sessions'],
      // TypeORM의 FindOptions는 완전히 타입 안전
    });
  }

  // ✅ Partial 타입으로 업데이트도 안전
  async updateUserLastLogin(userId: string, ipAddress: string): Promise<User> {
    await this.usersRepository.update(userId, {
      lastLoginAt: new Date(),
      lastLoginIp: ipAddress,
    });

    // update 후 최신 데이터 조회
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  // ✅ QueryBuilder로 복잡한 쿼리도 타입 안전
  async getActiveUsersWithSessions(): Promise<User[]> {
    return this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.sessions', 'session')
      .where('user.status = :status', { status: UserStatus.ACTIVE })
      .andWhere('session.isActive = :isActive', { isActive: true })
      .andWhere('session.expiresAt > :now', { now: new Date() })
      .getMany();
  }
}
```

---

## Migration Strategy

### TypeORM Configuration

```typescript
// src/config/typeorm.config.ts
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getTypeOrmConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get('DATABASE_HOST', 'localhost'),
  port: configService.get('DATABASE_PORT', 5432),
  username: configService.get('DATABASE_USERNAME', 'readzone'),
  password: configService.get('DATABASE_PASSWORD'),
  database: configService.get('DATABASE_NAME', 'readzone_dev'),
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  synchronize: false, // 프로덕션에서는 절대 true로 설정 금지
  logging: configService.get('NODE_ENV') === 'development',
  ssl: configService.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
});
```

### Initial Migration

```bash
# 1. TypeORM CLI 설치 (개발 의존성)
pnpm add -D typeorm ts-node

# 2. 마이그레이션 생성
npx typeorm migration:create src/database/migrations/InitAuthSystem

# 3. 마이그레이션 실행
npx typeorm migration:run -d src/config/typeorm.config.ts

# 4. 마이그레이션 되돌리기 (필요 시)
npx typeorm migration:revert -d src/config/typeorm.config.ts

# 5. 마이그레이션 상태 확인
npx typeorm migration:show -d src/config/typeorm.config.ts
```

### Module Integration

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getTypeOrmConfig } from './config/typeorm.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getTypeOrmConfig,
      inject: [ConfigService],
    }),
    // ... other modules
  ],
})
export class AppModule {}
```

### Seed Data

```typescript
// src/database/seeds/admin.seed.ts
import { DataSource } from 'typeorm';
import * as argon2 from 'argon2';
import { User, UserRole, UserStatus } from '../../users/entities/user.entity';

export async function seedAdmin(dataSource: DataSource): Promise<void> {
  const usersRepository = dataSource.getRepository(User);

  const existingAdmin = await usersRepository.findOne({
    where: { email: 'admin@readzone.com' },
  });

  if (existingAdmin) {
    console.log('✅ Admin user already exists');
    return;
  }

  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const passwordHash = await argon2.hash(adminPassword);

  const admin = usersRepository.create({
    email: 'admin@readzone.com',
    passwordHash,
    emailVerified: true,
    emailVerifiedAt: new Date(),
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
  });

  await usersRepository.save(admin);
  console.log('✅ Admin user created:', admin.email);
}

// src/database/seeds/index.ts
import { DataSource } from 'typeorm';
import { seedAdmin } from './admin.seed';

async function runSeeds() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USERNAME || 'readzone',
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME || 'readzone_dev',
    entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
  });

  await dataSource.initialize();

  try {
    await seedAdmin(dataSource);
    console.log('✅ All seeds completed');
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

runSeeds();
```

```json
// package.json에 스크립트 추가
{
  "scripts": {
    "migration:create": "typeorm migration:create",
    "migration:run": "typeorm migration:run -d src/config/typeorm.config.ts",
    "migration:revert": "typeorm migration:revert -d src/config/typeorm.config.ts",
    "migration:show": "typeorm migration:show -d src/config/typeorm.config.ts",
    "seed": "ts-node src/database/seeds/index.ts"
  }
}
```

---

## Security Considerations

### 1. 암호화 필드
- `User.passwordHash`: argon2id (클라이언트 사이드 처리)
- `OAuthConnection.accessToken`, `refreshToken`: AES-256-GCM (환경 변수 키)
- `MFASettings.secret`: AES-256-GCM (환경 변수 키)
- `MFASettings.backupCodes`: SHA-256 해시

### 2. 민감 정보 처리
```typescript
// ❌ 절대 반환하지 않을 필드
const SENSITIVE_FIELDS = [
  'passwordHash',
  'mfaSettings.secret',
  'mfaSettings.backupCodes',
  'oauthConnections.accessToken',
  'oauthConnections.refreshToken',
];

// ✅ 안전한 사용자 정보 반환
function sanitizeUser(user: User): Omit<User, 'passwordHash'> {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}
```

### 3. Rate Limiting (DB 레벨)
- `AuditLog` 테이블을 활용한 비정상 패턴 감지
- 예: 10분 내 로그인 실패 5회 → 계정 임시 잠금

### 4. Data Retention
- `AuditLog`: 90일 보관 후 아카이브
- `Session`: 만료 후 7일 보관 후 삭제
- `EmailVerificationToken`, `PasswordResetToken`: 만료 후 24시간 보관 후 삭제

---

## Performance Optimization

### 1. 쿼리 최적화
```typescript
// ✅ N+1 문제 방지 (include 사용)
const usersWithSessions = await prisma.user.findMany({
  include: {
    sessions: {
      where: { isActive: true },
    },
  },
});

// ✅ 필요한 필드만 선택 (select 사용)
const userEmails = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
  },
  where: {
    status: UserStatus.ACTIVE,
  },
});

// ✅ 페이지네이션 (cursor-based)
const sessions = await prisma.session.findMany({
  take: 20,
  skip: 1,
  cursor: {
    id: lastSessionId,
  },
  where: {
    userId: currentUserId,
  },
  orderBy: {
    createdAt: 'desc',
  },
});
```

### 2. 인덱스 전략
- **단일 인덱스**: 고유 제약, 외래 키, 자주 조회되는 필드
- **복합 인덱스**: WHERE 절에 함께 사용되는 필드 조합
- **커버링 인덱스**: SELECT 필드를 모두 포함하는 인덱스

### 3. Connection Pool
```typescript
// prisma/client.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Connection pool 설정 (DATABASE_URL에 포함)
// postgresql://user:password@localhost:5432/readzone?connection_limit=10&pool_timeout=20
```

---

## Testing Strategy

### 1. Unit Tests
```typescript
// tests/models/user.test.ts
import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import { hashPassword } from '../../src/utils/crypto';

const prisma = new PrismaClient();

describe('User Model', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it('should create a user with hashed password', async () => {
    const email = 'test@example.com';
    const password = 'SecureP@ss123';
    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
      },
    });

    expect(user.email).toBe(email.toLowerCase());
    expect(user.passwordHash).toBe(passwordHash);
    expect(user.emailVerified).toBe(false);
    expect(user.role).toBe(UserRole.USER);
  });

  it('should enforce unique email constraint', async () => {
    const email = 'duplicate@example.com';
    const passwordHash = await hashPassword('password123');

    await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
      },
    });

    await expect(
      prisma.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash,
          role: UserRole.USER,
          status: UserStatus.ACTIVE,
        },
      })
    ).rejects.toThrow();
  });
});
```

### 2. Integration Tests
- 관계 무결성 테스트 (cascade delete, foreign key)
- 트랜잭션 테스트 (롤백 시나리오)
- 동시성 테스트 (race condition)

---

## Constitution Compliance

### ✅ Principle III: Security & Privacy
- ✅ 비밀번호: argon2id 해시
- ✅ 민감 정보: AES-256-GCM 암호화
- ✅ Audit logging: 모든 보안 이벤트 기록
- ✅ Soft-delete: 30일 복구 기간
- ✅ Data retention: 규정 준수 보관 정책

### ✅ Principle IV: Scalable Architecture
- ✅ 정규화된 스키마 (3NF)
- ✅ 적절한 인덱스 전략
- ✅ Connection pool 설정
- ✅ 페이지네이션 지원

### ✅ Principle V: API-First Development
- ✅ Prisma 자동 생성 타입 → OpenAPI 스키마 생성 가능
- ✅ 엔티티 정의 → API 계약 매핑 명확

### ✅ Principle VI: Test-Driven Quality
- ✅ Unit/Integration 테스트 전략 수립
- ✅ 제약 조건 테스트 케이스 정의

---

## Next Steps

1. ✅ **data-model.md** 생성 완료
2. ⏳ **contracts/** - OpenAPI 스키마 생성:
   - `auth-api.yaml` (인증 엔드포인트)
   - `users-api.yaml` (사용자 관리 엔드포인트)
   - `admin-api.yaml` (관리자 엔드포인트)
3. ⏳ **quickstart.md** - 개발 환경 설정 가이드

---

## Implementation Update (2025-11-06)

### Prisma Schema Implementation

The data model has been implemented using **Prisma 6.19.0** instead of TypeORM as originally planned. This decision was made during Phase 0 (WP01-WP02) based on the following considerations:

**Technology Stack Update**:
- **ORM**: Prisma 6.19.0 (changed from TypeORM)
- **Backend Framework**: Fastify 4.26.1 (changed from NestJS)
- **Database**: PostgreSQL 16
- **TypeScript**: 5.3.3 (strict mode)

**Prisma Schema Location**: `packages/backend/prisma/schema.prisma`

**Implementation Details**:
1. **All 8 Models Implemented**:
   - User (users table)
   - Session (sessions table)
   - OAuthConnection (oauth_connections table)
   - MFASettings (mfa_settings table)
   - AuditLog (audit_logs table)
   - EmailVerificationToken (email_verification_tokens table)
   - PasswordResetToken (password_reset_tokens table)
   - _prisma_migrations (migration tracking)

2. **Enums Defined**:
   - UserRole: ANONYMOUS, USER, MODERATOR, ADMIN, SUPERADMIN
   - UserStatus: ACTIVE, SUSPENDED, DELETED
   - OAuthProvider: GOOGLE, GITHUB
   - AuditAction: 13 actions (LOGIN, LOGOUT, LOGIN_FAILED, etc.)
   - AuditSeverity: INFO, WARNING, CRITICAL

3. **Indexes Implemented**:
   - User: email (unique), status + deletedAt, role
   - Session: userId, userId + isActive + expiresAt, expiresAt
   - OAuthConnection: provider + providerId (unique), userId, provider + email
   - MFASettings: userId (unique)
   - AuditLog: userId, action, timestamp, userId + timestamp, severity + timestamp
   - EmailVerificationToken: userId, token (unique), expiresAt
   - PasswordResetToken: userId, token (unique), expiresAt

4. **Relationships**:
   - User 1:N Session (with CASCADE delete)
   - User 1:N OAuthConnection (with CASCADE delete)
   - User 1:1 MFASettings (with CASCADE delete)
   - User 1:N AuditLog (with SET NULL delete)
   - User 1:N EmailVerificationToken (with CASCADE delete)
   - User 1:N PasswordResetToken (with CASCADE delete)

5. **Migration Status**:
   - Initial migration created: `20251106003847_init`
   - Database tables verified in PostgreSQL 16
   - Prisma Client generated successfully

6. **Seed Script**:
   - Location: `packages/backend/prisma/seed.ts`
   - Test data: 8 users with different roles
   - Includes: MFA settings, OAuth connections, sessions, audit logs
   - Test credentials documented in seed output

**Schema Design Decisions**:
- Used camelCase for Prisma model fields (Prisma convention)
- Used snake_case for database table names via `@@map()`
- JSONB fields for flexible metadata (deviceInfo, profile, metadata)
- UUID primary keys for all entities
- DateTime fields for temporal tracking
- Nullable fields where appropriate (OAuth-only accounts, soft-delete)
- Proper cascade and set-null delete rules

**Data Model Alignment**:
The Prisma implementation maintains 100% compatibility with the entity definitions documented above, translating TypeORM decorators to equivalent Prisma schema directives:
- `@Column()` → field definitions
- `@PrimaryGeneratedColumn('uuid')` → `@id @default(uuid())`
- `@CreateDateColumn()` → `@default(now())`
- `@UpdateDateColumn()` → `@updatedAt`
- `@Index()` → `@@index()`
- `@ManyToOne()` / `@OneToMany()` → Prisma relations

---

**Document Version**: 1.1.0 (Updated for Prisma implementation)
**Last Updated**: 2025-11-06
**Status**: Implemented in Phase 0 (WP02)

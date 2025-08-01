# PRD: S3 - 인증 및 세션 보안 강화

**문서 버전**: v1.0  
**작성일**: 2025-02-01  
**작성자**: 보안팀  
**승인자**: CTO  
**보안 우선순위**: HIGH (8.3/10)

---

## 📋 **프로젝트 개요**

### **목표**
ReadZone Draft 시스템의 인증 및 세션 관리 보안을 강화하여 계정 탈취, 세션 하이재킹, 토큰 도용 등의 공격으로부터 사용자 계정을 완벽하게 보호한다.

### **배경**
현재 시스템은 기본적인 NextAuth.js 구성만 사용하고 있어 다음과 같은 보안 취약점이 존재한다:
- JWT 토큰 보안 설정 부족 (만료 시간, 알고리즘, 서명 검증)
- 세션 관리 취약점 (동시 세션 제한 없음, 세션 고정 공격 가능)
- 토큰 저장 보안 문제 (localStorage 사용 시 XSS 공격 위험)
- 리프레시 토큰 전략 부재
- 2단계 인증(2FA) 미지원

### **성공 지표**
- 계정 탈취 시도 차단율: >99.9%
- 세션 하이재킹 방지율: 100%
- 토큰 관련 보안 사고: 0건
- 인증 관련 사용자 불편 사항: <5%

---

## 🎯 **핵심 요구사항**

### **FR-1: 강화된 JWT 보안**
- **우선순위**: Critical
- **설명**: 산업 표준에 부합하는 안전한 JWT 토큰 구현
- **상세 요구사항**:
  - RS256 알고리즘 사용 (비대칭 키)
  - 짧은 액세스 토큰 만료 시간 (15분)
  - 안전한 리프레시 토큰 메커니즘 (7일)
  - 토큰 페이로드 최소화 (필수 정보만)
  - 토큰 서명 검증 강화

### **FR-2: 안전한 세션 관리**
- **우선순위**: Critical
- **설명**: 세션 하이재킹 및 고정 공격 방지
- **상세 요구사항**:
  - httpOnly 쿠키를 통한 토큰 저장
  - SameSite=Strict 설정
  - Secure 플래그 강제 적용 (HTTPS)
  - 세션 ID 재생성 (로그인 시)
  - 동시 세션 제한 (최대 3개)

### **FR-3: 리프레시 토큰 시스템**
- **우선순위**: High
- **설명**: 안전한 토큰 갱신 메커니즘
- **상세 요구사항**:
  - 리프레시 토큰 로테이션
  - 리프레시 토큰 재사용 탐지 및 차단
  - 가족 토큰 무효화 (토큰 체인 관리)
  - 리프레시 토큰 블랙리스트 관리
  - 자동 갱신 및 무효화 처리

### **FR-4: 2단계 인증 (2FA)**
- **우선순위**: Medium
- **설명**: 추가 보안 계층으로 2FA 지원
- **상세 요구사항**:
  - TOTP (Time-based OTP) 지원
  - 백업 복구 코드 제공
  - SMS 인증 옵션 (선택적)
  - 신뢰할 수 있는 디바이스 관리
  - 관리자 계정 2FA 필수

### **FR-5: 세션 모니터링 및 관리**
- **우선순위**: Medium
- **설명**: 실시간 세션 상태 모니터링 및 관리
- **상세 요구사항**:
  - 활성 세션 목록 표시
  - 원격 세션 종료 기능
  - 의심스러운 로그인 탐지 및 알림
  - 세션 활동 로그 기록
  - 로그인 위치 및 디바이스 추적

---

## 🔐 **인증 보안 아키텍처**

### **JWT 토큰 구조**
```typescript
interface JWTPayload {
  // 표준 클레임
  iss: string  // 발급자 (readzone.com)
  sub: string  // 사용자 ID
  aud: string  // 대상 (readzone-api)
  exp: number  // 만료 시간 (15분)
  iat: number  // 발급 시간
  jti: string  // JWT ID (고유 식별자)
  
  // 커스텀 클레임 (최소화)
  role: 'user' | 'admin' | 'moderator'
  sessionId: string
  
  // 보안 클레임
  fingerprint: string  // 디바이스 핑거프린트
}

interface RefreshTokenPayload {
  sub: string     // 사용자 ID
  sessionId: string
  tokenFamily: string  // 토큰 패밀리 ID
  exp: number     // 만료 시간 (7일)
  jti: string     // 리프레시 토큰 ID
}
```

### **세션 보안 구성**
```typescript
interface SessionConfig {
  cookie: {
    name: 'readzone-session',
    httpOnly: true,
    secure: true,        // HTTPS 필수
    sameSite: 'strict',  // CSRF 방지
    maxAge: 15 * 60,     // 15분 (액세스 토큰과 동일)
    domain: '.readzone.com',
    path: '/'
  },
  
  refreshCookie: {
    name: 'readzone-refresh',
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60, // 7일
    domain: '.readzone.com',
    path: '/api/auth/refresh'
  },
  
  security: {
    maxConcurrentSessions: 3,
    sessionTimeout: 24 * 60 * 60, // 24시간 비활성 시 만료
    forceReauth: 7 * 24 * 60 * 60, // 7일 후 재인증 필요
    ipBinding: false, // IP 고정 (선택적)
    deviceFingerprinting: true
  }
}
```

---

## 🗄️ **데이터베이스 스키마 확장**

### **세션 관리 테이블**
```sql
-- 사용자 세션 테이블
CREATE TABLE user_sessions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id TEXT UNIQUE NOT NULL,
    refresh_token_id TEXT UNIQUE NOT NULL,
    token_family TEXT NOT NULL, -- 토큰 패밀리 ID
    
    -- 세션 정보
    ip_address INET NOT NULL,
    user_agent TEXT NOT NULL,
    device_fingerprint TEXT NOT NULL,
    location_country TEXT,
    location_city TEXT,
    
    -- 보안 정보
    is_trusted_device BOOLEAN DEFAULT false,
    two_factor_verified BOOLEAN DEFAULT false,
    login_method TEXT NOT NULL, -- password, google, apple, etc.
    
    -- 타임스탬프
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    
    -- 상태
    is_active BOOLEAN DEFAULT true,
    terminated_reason TEXT, -- logout, timeout, security, force
    terminated_at TIMESTAMPTZ,
    
    -- 인덱스
    INDEX idx_user_sessions_user_id (user_id),
    INDEX idx_user_sessions_session_id (session_id),
    INDEX idx_user_sessions_refresh_token (refresh_token_id),
    INDEX idx_user_sessions_active (user_id, is_active),
    INDEX idx_user_sessions_expires (expires_at)
);

-- 리프레시 토큰 블랙리스트
CREATE TABLE refresh_token_blacklist (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    token_id TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(id),
    token_family TEXT NOT NULL,
    blacklisted_at TIMESTAMPTZ DEFAULT NOW(),
    reason TEXT NOT NULL, -- rotation, logout, security, expired
    expires_at TIMESTAMPTZ NOT NULL,
    
    INDEX idx_blacklist_token_id (token_id),
    INDEX idx_blacklist_user_id (user_id),
    INDEX idx_blacklist_expires (expires_at)
);

-- 2FA 설정 테이블
CREATE TABLE user_two_factor (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- TOTP 설정
    totp_secret TEXT,
    totp_enabled BOOLEAN DEFAULT false,
    totp_verified_at TIMESTAMPTZ,
    
    -- 백업 코드
    backup_codes JSONB, -- 암호화된 백업 코드 배열
    backup_codes_used JSONB DEFAULT '[]',
    
    -- SMS 설정 (선택적)
    sms_enabled BOOLEAN DEFAULT false,
    sms_phone_number TEXT,
    sms_verified_at TIMESTAMPTZ,
    
    -- 설정
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- 로그인 시도 로그
CREATE TABLE login_attempts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES users(id),
    email TEXT NOT NULL,
    ip_address INET NOT NULL,
    user_agent TEXT NOT NULL,
    
    -- 시도 정보
    success BOOLEAN NOT NULL,
    failure_reason TEXT, -- invalid_password, account_locked, 2fa_failed, etc.
    two_factor_required BOOLEAN DEFAULT false,
    two_factor_success BOOLEAN,
    
    -- 위치 정보
    location_country TEXT,
    location_city TEXT,
    is_suspicious BOOLEAN DEFAULT false,
    
    attempted_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_login_attempts_user_id (user_id),
    INDEX idx_login_attempts_ip (ip_address),
    INDEX idx_login_attempts_email (email),
    INDEX idx_login_attempts_time (attempted_at),
    INDEX idx_login_attempts_suspicious (is_suspicious)
);
```

---

## 🔗 **API 인증 강화**

### **JWT 토큰 서비스**
```typescript
export class JWTService {
  private accessTokenPrivateKey: string
  private accessTokenPublicKey: string
  private refreshTokenSecret: string
  
  constructor() {
    this.accessTokenPrivateKey = process.env.JWT_ACCESS_PRIVATE_KEY!
    this.accessTokenPublicKey = process.env.JWT_ACCESS_PUBLIC_KEY!
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET!
  }
  
  // 액세스 토큰 생성
  async generateAccessToken(payload: JWTPayload): Promise<string> {
    return jwt.sign(payload, this.accessTokenPrivateKey, {
      algorithm: 'RS256',
      expiresIn: '15m',
      issuer: 'readzone.com',
      audience: 'readzone-api'
    })
  }
  
  // 리프레시 토큰 생성
  async generateRefreshToken(payload: RefreshTokenPayload): Promise<string> {
    return jwt.sign(payload, this.refreshTokenSecret, {
      algorithm: 'HS256',
      expiresIn: '7d'
    })
  }
  
  // 액세스 토큰 검증
  async verifyAccessToken(token: string): Promise<JWTPayload> {
    try {
      const decoded = jwt.verify(token, this.accessTokenPublicKey, {
        algorithms: ['RS256'],
        issuer: 'readzone.com',
        audience: 'readzone-api'
      }) as JWTPayload
      
      // 추가 보안 검증
      await this.validateTokenSecurity(decoded)
      
      return decoded
    } catch (error) {
      throw new AuthenticationError('Invalid access token')
    }
  }
  
  // 리프레시 토큰 검증
  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    try {
      const decoded = jwt.verify(token, this.refreshTokenSecret, {
        algorithms: ['HS256']
      }) as RefreshTokenPayload
      
      // 블랙리스트 확인
      const isBlacklisted = await this.isTokenBlacklisted(decoded.jti)
      if (isBlacklisted) {
        throw new AuthenticationError('Token is blacklisted')
      }
      
      return decoded
    } catch (error) {
      throw new AuthenticationError('Invalid refresh token')
    }
  }
  
  // 토큰 보안 검증
  private async validateTokenSecurity(payload: JWTPayload): Promise<void> {
    // 세션 유효성 확인
    const session = await db.userSessions.findUnique({
      where: { sessionId: payload.sessionId },
      select: { isActive: true, expiresAt: true }
    })
    
    if (!session?.isActive || session.expiresAt < new Date()) {
      throw new AuthenticationError('Session is invalid or expired')
    }
    
    // 디바이스 핑거프린트 검증 (선택적)
    if (process.env.ENABLE_DEVICE_FINGERPRINTING === 'true') {
      // 디바이스 핑거프린트 검증 로직
    }
  }
}
```

### **세션 관리 서비스**
```typescript
export class SessionManagementService {
  // 새 세션 생성
  async createSession(userId: string, loginInfo: LoginInfo): Promise<SessionTokens> {
    // 기존 세션 수 확인
    await this.enforceSessionLimit(userId)
    
    // 세션 정보 생성
    const sessionId = generateSecureId()
    const tokenFamily = generateSecureId()
    const deviceFingerprint = this.generateDeviceFingerprint(loginInfo)
    
    // 세션 저장
    const session = await db.userSessions.create({
      data: {
        userId,
        sessionId,
        refreshTokenId: generateSecureId(),
        tokenFamily,
        ipAddress: loginInfo.ipAddress,
        userAgent: loginInfo.userAgent,
        deviceFingerprint,
        locationCountry: await this.getLocationFromIP(loginInfo.ipAddress),
        loginMethod: loginInfo.method,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7일
      }
    })
    
    // JWT 토큰 생성
    const accessToken = await this.jwtService.generateAccessToken({
      iss: 'readzone.com',
      sub: userId,
      aud: 'readzone-api',
      exp: Math.floor(Date.now() / 1000) + 15 * 60, // 15분
      iat: Math.floor(Date.now() / 1000),
      jti: generateSecureId(),
      role: await this.getUserRole(userId),
      sessionId: session.sessionId,
      fingerprint: deviceFingerprint
    })
    
    const refreshToken = await this.jwtService.generateRefreshToken({
      sub: userId,
      sessionId: session.sessionId,
      tokenFamily: session.tokenFamily,
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7일
      jti: session.refreshTokenId
    })
    
    return { accessToken, refreshToken }
  }
  
  // 토큰 갱신 (로테이션)
  async refreshTokens(refreshToken: string, request: Request): Promise<SessionTokens> {
    const payload = await this.jwtService.verifyRefreshToken(refreshToken)
    
    // 토큰 재사용 탐지
    const existingToken = await db.refreshTokenBlacklist.findUnique({
      where: { tokenId: payload.jti }
    })
    
    if (existingToken) {
      // 토큰 재사용 감지 - 전체 토큰 패밀리 무효화
      await this.invalidateTokenFamily(payload.tokenFamily, 'token_reuse')
      throw new SecurityError('Token reuse detected - all sessions invalidated')
    }
    
    // 현재 토큰을 블랙리스트에 추가
    await db.refreshTokenBlacklist.create({
      data: {
        tokenId: payload.jti,
        userId: payload.sub,
        tokenFamily: payload.tokenFamily,
        reason: 'rotation',
        expiresAt: new Date(payload.exp * 1000)
      }
    })
    
    // 새로운 토큰 쌍 생성
    const newRefreshTokenId = generateSecureId()
    
    // 세션 업데이트
    await db.userSessions.update({
      where: { sessionId: payload.sessionId },
      data: {
        refreshTokenId: newRefreshTokenId,
        lastAccessedAt: new Date()
      }
    })
    
    // 새 토큰 생성
    const newAccessToken = await this.jwtService.generateAccessToken({
      // ... 액세스 토큰 페이로드
    })
    
    const newRefreshToken = await this.jwtService.generateRefreshToken({
      sub: payload.sub,
      sessionId: payload.sessionId,
      tokenFamily: payload.tokenFamily,
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
      jti: newRefreshTokenId
    })
    
    return { accessToken: newAccessToken, refreshToken: newRefreshToken }
  }
  
  // 세션 제한 강제
  private async enforceSessionLimit(userId: string): Promise<void> {
    const activeSessions = await db.userSessions.count({
      where: { userId, isActive: true }
    })
    
    if (activeSessions >= 3) {
      // 가장 오래된 세션 종료
      await db.userSessions.updateMany({
        where: {
          userId,
          isActive: true
        },
        data: {
          isActive: false,
          terminatedReason: 'session_limit',
          terminatedAt: new Date()
        },
        orderBy: { lastAccessedAt: 'asc' },
        take: activeSessions - 2 // 1개 자리 확보
      })
    }
  }
}
```

---

## 🛡️ **2단계 인증 (2FA) 구현**

### **TOTP 서비스**
```typescript
export class TwoFactorService {
  // TOTP 시크릿 생성
  async generateTOTPSecret(userId: string): Promise<TOTPSetup> {
    const secret = authenticator.generateSecret()
    const qrCodeUrl = authenticator.keyuri(
      await this.getUserEmail(userId),
      'ReadZone',
      secret
    )
    
    // 임시 저장 (확인 전까지)
    await redis.setex(`totp_setup:${userId}`, 300, secret) // 5분 TTL
    
    return {
      secret,
      qrCodeUrl,
      backupCodes: this.generateBackupCodes()
    }
  }
  
  // TOTP 확인 및 활성화
  async verifyAndEnableTOTP(userId: string, token: string): Promise<boolean> {
    const secret = await redis.get(`totp_setup:${userId}`)
    if (!secret) {
      throw new ValidationError('TOTP setup expired')
    }
    
    const isValid = authenticator.verify({ token, secret })
    if (!isValid) {
      return false
    }
    
    // 2FA 활성화
    await db.userTwoFactor.upsert({
      where: { userId },
      create: {
        userId,
        totpSecret: this.encrypt(secret),
        totpEnabled: true,
        totpVerifiedAt: new Date(),
        backupCodes: this.encryptBackupCodes(this.generateBackupCodes())
      },
      update: {
        totpSecret: this.encrypt(secret),
        totpEnabled: true,
        totpVerifiedAt: new Date()
      }
    })
    
    await redis.del(`totp_setup:${userId}`)
    return true
  }
  
  // 로그인 시 2FA 검증
  async verifyTwoFactor(userId: string, token: string): Promise<boolean> {
    const twoFactor = await db.userTwoFactor.findUnique({
      where: { userId, totpEnabled: true }
    })
    
    if (!twoFactor) {
      return true // 2FA 비활성화된 사용자
    }
    
    const secret = this.decrypt(twoFactor.totpSecret!)
    
    // TOTP 토큰 검증
    const isValidTOTP = authenticator.verify({ token, secret })
    if (isValidTOTP) {
      return true
    }
    
    // 백업 코드 검증
    const isValidBackup = await this.verifyBackupCode(userId, token)
    return isValidBackup
  }
  
  // 백업 코드 생성
  private generateBackupCodes(): string[] {
    return Array.from({ length: 10 }, () => 
      crypto.randomBytes(4).toString('hex').toUpperCase()
    )
  }
}
```

---

## 🧪 **보안 테스트 전략**

### **인증 보안 테스트**
```typescript
describe('Authentication Security Tests', () => {
  describe('JWT Token Security', () => {
    it('should reject tokens with invalid signatures', async () => {
      const invalidToken = 'invalid.jwt.token'
      const response = await request(app)
        .get('/api/protected')
        .set('Authorization', `Bearer ${invalidToken}`)
        
      expect(response.status).toBe(401)
    })
    
    it('should reject expired tokens', async () => {
      // 만료된 토큰 테스트
    })
    
    it('should validate token fingerprints', async () => {
      // 디바이스 핑거프린트 검증 테스트
    })
  })
  
  describe('Session Management', () => {
    it('should enforce session limits', async () => {
      // 동시 세션 제한 테스트
    })
    
    it('should rotate refresh tokens', async () => {
      // 리프레시 토큰 로테이션 테스트
    })
    
    it('should detect token reuse', async () => {
      // 토큰 재사용 탐지 테스트
    })
  })
  
  describe('Two-Factor Authentication', () => {
    it('should require 2FA for protected operations', async () => {
      // 2FA 필수 작업 테스트
    })
    
    it('should validate TOTP tokens', async () => {
      // TOTP 검증 테스트
    })
    
    it('should accept backup codes', async () => {
      // 백업 코드 테스트
    })
  })
})
```

---

## 🚀 **SuperClaude 명령어 가이드**

### **Phase 1: JWT 보안 강화**

#### **JWT 서비스 구현**
```bash
/sc:implement jwt-security --persona security --c7 @docs/prd-security-authentication-session.md
/sc:design token-architecture --persona security --seq @docs/prd-security-authentication-session.md
/sc:test jwt-security --persona security --play @docs/prd-security-authentication-session.md
```

#### **세션 관리 시스템**
```bash
/sc:implement session-management --persona backend --c7 @docs/prd-security-authentication-session.md
/sc:design session-architecture --persona backend --seq @docs/prd-security-authentication-session.md
/sc:analyze session-security --focus security --persona security @docs/prd-security-authentication-session.md
```

### **Phase 2: 2단계 인증 구현**

#### **TOTP 시스템**
```bash
/sc:implement totp-system --persona security --c7 @docs/prd-security-authentication-session.md
/sc:design 2fa-ui --persona frontend --magic @docs/prd-security-authentication-session.md
/sc:test two-factor-auth --persona qa --play @docs/prd-security-authentication-session.md
```

#### **백업 코드 시스템**
```bash
/sc:implement backup-codes --persona security --c7 @docs/prd-security-authentication-session.md
/sc:design recovery-flow --persona frontend --magic @docs/prd-security-authentication-session.md
/sc:test backup-recovery --persona qa --play @docs/prd-security-authentication-session.md
```

### **Phase 3: 세션 모니터링**

#### **세션 대시보드**
```bash
/sc:implement session-dashboard --persona frontend --magic @docs/prd-security-authentication-session.md
/sc:design monitoring-ui --persona frontend --magic @docs/prd-security-authentication-session.md
/sc:test session-management-ui --persona qa --play @docs/prd-security-authentication-session.md
```

#### **보안 모니터링**
```bash
/sc:implement auth-monitoring --persona devops --seq @docs/prd-security-authentication-session.md
/sc:design security-alerts --persona devops --c7 @docs/prd-security-authentication-session.md
/sc:analyze auth-performance --focus performance --persona performance @docs/prd-security-authentication-session.md
```

### **Phase 4: 통합 테스트 및 검증**

#### **보안 테스트**
```bash
/sc:test authentication-security --persona security --play @docs/prd-security-authentication-session.md
/sc:test session-security --persona security --play @docs/prd-security-authentication-session.md
/sc:analyze auth-vulnerabilities --focus security --depth deep --persona security @docs/prd-security-authentication-session.md
```

#### **성능 최적화**
```bash
/sc:analyze auth-performance --focus performance --persona performance @docs/prd-security-authentication-session.md
/sc:improve auth-optimization --type performance --persona performance @docs/prd-security-authentication-session.md
/sc:test auth-load-testing --persona qa --play @docs/prd-security-authentication-session.md
```

### **전체 프로젝트 오케스트레이션**

#### **인증 아키텍처 설계**
```bash
/sc:workflow @docs/prd-security-authentication-session.md --strategy systematic --persona security --all-mcp --output detailed
/sc:design auth-architecture --persona architect --seq @docs/prd-security-authentication-session.md
```

#### **보안 구현 검증**
```bash
/sc:analyze auth-implementation --focus security --depth deep --persona security @docs/prd-security-authentication-session.md
/sc:test auth-integration --persona qa --play @docs/prd-security-authentication-session.md
/sc:document auth-procedures --persona scribe=en @docs/prd-security-authentication-session.md
```

---

## 📊 **성공 측정 지표**

### **정량적 지표**
- JWT 토큰 보안 점수: 100/100
- 세션 하이재킹 방지율: 100%
- 2FA 도입률: >70%
- 인증 관련 보안 사고: 0건

### **정성적 지표**
- 보안 감사 통과: 완료
- 침투 테스트 통과: 완료
- 사용자 인증 만족도: >90%

---

**문서 승인 상태**: ⏳ 검토 중  
**구현 우선순위**: HIGH  
**예상 완료일**: 2025-02-28
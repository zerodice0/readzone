# PRD: S2 - 사용자 간 데이터 격리 강화

**문서 버전**: v1.0  
**작성일**: 2025-02-01  
**작성자**: 보안팀  
**승인자**: CTO  
**보안 우선순위**: CRITICAL (8.9/10)

---

## 📋 **프로젝트 개요**

### **목표**
ReadZone Draft 시스템에서 사용자 간 완전한 데이터 격리를 보장하여 수평적 권한 상승(Horizontal Privilege Escalation) 공격을 원천 차단하고 사용자 프라이버시를 완벽하게 보호한다.

### **배경**
현재 시스템은 사용자 인증 후 Draft ID만으로 데이터에 접근할 수 있어 다음과 같은 심각한 보안 취약점이 존재한다:
- 악의적 사용자가 다른 사용자의 Draft ID를 추측하여 접근 가능
- API 엔드포인트에서 소유권 검증 누락으로 인한 데이터 노출
- 데이터베이스 쿼리에서 userId 필터링 누락
- 관리자 권한과 일반 사용자 권한 간 명확한 경계 부재

### **성공 지표**
- 크로스 사용자 접근 시도 차단율: 100%
- 권한 검증 실패 시 데이터 노출: 0건
- 보안 감사 통과율: 100%
- API 응답 시간 영향: <2%

---

## 🎯 **핵심 요구사항**

### **FR-1: 강제적 사용자 소유권 검증**
- **우선순위**: Critical
- **설명**: 모든 Draft 관련 작업에서 필수적인 사용자 소유권 확인
- **상세 요구사항**:
  - 모든 데이터베이스 쿼리에 userId 필터 강제 포함
  - Draft 접근 전 소유권 사전 검증
  - 검증 실패 시 즉시 403 Forbidden 응답
  - 소유권 검증 우회 불가능한 미들웨어 구조

### **FR-2: API 레벨 권한 검증 미들웨어**
- **우선순위**: Critical
- **설명**: 모든 Draft API에 적용되는 통합 권한 검증 시스템
- **상세 요구사항**:
  - 요청자 신원 확인 (JWT 검증)
  - 리소스 소유권 확인 (Draft ↔ User 매핑)
  - 접근 권한 레벨 검증 (읽기/쓰기/삭제)
  - 권한 검증 로그 및 감사 추적

### **FR-3: 데이터베이스 접근 제어 강화**
- **우선순위**: High
- **설명**: 데이터베이스 레벨에서의 추가적인 접근 제어 계층
- **상세 요구사항**:
  - Row Level Security (RLS) 정책 적용
  - 사용자별 데이터 파티셔닝
  - 데이터베이스 트리거를 통한 무결성 검증
  - 관리자 접근에 대한 별도 감사 로그

### **FR-4: 관리자 권한 분리 및 통제**
- **우선순위**: High
- **설명**: 관리자와 일반 사용자 권한의 명확한 분리
- **상세 요구사항**:
  - 관리자 전용 API 엔드포인트 분리
  - 관리자 작업에 대한 이중 인증 (2FA)
  - 관리자 접근 로그 실시간 모니터링
  - 긴급 상황 시 관리자 권한 일시 차단 기능

### **FR-5: 실시간 침해 탐지 및 대응**
- **우선순위**: Medium
- **설명**: 권한 우회 시도 실시간 탐지 및 자동 대응
- **상세 요구사항**:
  - 비정상적인 접근 패턴 탐지
  - 무차별 대입 공격 탐지 및 차단
  - IP 기반 접근 제한 및 지역 차단
  - 의심스러운 활동 시 계정 일시 잠금

---

## 🛡️ **보안 아키텍처 설계**

### **다층 권한 검증 구조**
```typescript
interface SecurityLayer {
  // Layer 1: Authentication (인증)
  authentication: {
    jwtValidation: 'mandatory',
    sessionVerification: 'required',
    tokenExpiry: '15_minutes'
  }
  
  // Layer 2: Authorization (인가)  
  authorization: {
    resourceOwnership: 'strict_verification',
    roleBasedAccess: 'rbac_enforcement',
    operationPermissions: 'fine_grained'
  }
  
  // Layer 3: Data Access Control (데이터 접근 제어)
  dataAccess: {
    rowLevelSecurity: 'enabled',
    userPartitioning: 'logical_separation',
    auditLogging: 'comprehensive'
  }
  
  // Layer 4: Monitoring (모니터링)
  monitoring: {
    realTimeDetection: 'anomaly_detection',
    accessLogging: 'detailed_audit_trail',
    alerting: 'immediate_notification'
  }
}
```

### **권한 검증 플로우**
```typescript
interface AccessControlFlow {
  step1_authentication: {
    verifyJWT: boolean
    validateSession: boolean
    checkBlacklist: boolean
  }
  
  step2_authorization: {
    extractUserId: string
    verifyResourceOwnership: boolean
    checkPermissionLevel: 'read' | 'write' | 'delete' | 'admin'
  }
  
  step3_dataFilter: {
    applyUserFilter: string  // WHERE userId = ?
    enforceRowSecurity: boolean
    logAccess: boolean
  }
  
  step4_monitoring: {
    recordAccess: boolean
    checkAnomalies: boolean
    triggerAlerts: boolean
  }
}
```

---

## 🗄️ **데이터베이스 보안 강화**

### **Row Level Security (RLS) 정책**
```sql
-- Draft 테이블에 RLS 활성화
ALTER TABLE review_drafts ENABLE ROW LEVEL SECURITY;

-- 사용자별 데이터 접근 정책
CREATE POLICY user_drafts_access ON review_drafts
    FOR ALL
    TO authenticated_users
    USING (user_id = current_setting('app.current_user_id')::text);

-- 관리자 접근 정책 (별도)
CREATE POLICY admin_drafts_access ON review_drafts
    FOR ALL  
    TO admin_users
    USING (
        current_setting('app.user_role') = 'admin' 
        AND current_setting('app.admin_access_reason') IS NOT NULL
    );

-- 감사 로그 테이블
CREATE TABLE user_access_audit (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    action TEXT NOT NULL,
    access_granted BOOLEAN NOT NULL,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    failure_reason TEXT
);

-- 접근 시도 로깅 함수
CREATE OR REPLACE FUNCTION log_access_attempt()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_access_audit (
        user_id, resource_type, resource_id, action, 
        access_granted, ip_address, user_agent
    ) VALUES (
        current_setting('app.current_user_id'),
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        true,
        current_setting('app.client_ip')::inet,
        current_setting('app.user_agent')
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 트리거 설정
CREATE TRIGGER audit_draft_access
    AFTER INSERT OR UPDATE OR DELETE ON review_drafts
    FOR EACH ROW EXECUTE FUNCTION log_access_attempt();
```

### **사용자 분리 스키마**
```sql
-- 사용자 권한 테이블
CREATE TABLE user_permissions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id),
    resource_type TEXT NOT NULL,
    permission_level TEXT NOT NULL CHECK (permission_level IN ('read', 'write', 'delete', 'admin')),
    granted_by TEXT REFERENCES users(id),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    
    UNIQUE(user_id, resource_type)
);

-- 역할 기반 접근 제어
CREATE TABLE user_roles (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id),
    role_name TEXT NOT NULL CHECK (role_name IN ('user', 'moderator', 'admin', 'super_admin')),
    assigned_by TEXT REFERENCES users(id),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true
);
```

---

## 🔗 **API 보안 미들웨어**

### **통합 권한 검증 미들웨어**
```typescript
export class AccessControlMiddleware {
  // 필수 권한 검증 미들웨어
  static enforceUserOwnership = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { draftId } = req.params
      const userId = req.user.id
      
      // 1단계: 리소스 존재 확인
      const resource = await db.reviewDraft.findUnique({
        where: { id: draftId },
        select: { id: true, userId: true }
      })
      
      if (!resource) {
        await this.logSecurityEvent({
          type: 'RESOURCE_NOT_FOUND',
          userId,
          resourceId: draftId,
          severity: 'LOW'
        })
        return res.status(404).json({ 
          success: false, 
          error: { errorType: 'NOT_FOUND', message: '리소스를 찾을 수 없습니다.' }
        })
      }
      
      // 2단계: 소유권 검증
      if (resource.userId !== userId && !req.user.isAdmin) {
        await this.logSecurityEvent({
          type: 'UNAUTHORIZED_ACCESS_ATTEMPT',
          userId,
          resourceId: draftId,
          ownerId: resource.userId,
          severity: 'HIGH'
        })
        
        // 의심스러운 접근 시도 카운트
        await this.incrementSuspiciousActivity(userId, req.ip)
        
        return res.status(403).json({
          success: false,
          error: { errorType: 'FORBIDDEN', message: '접근 권한이 없습니다.' }
        })
      }
      
      // 3단계: 접근 로그 기록
      await this.logAccessSuccess({
        userId,
        resourceId: draftId,
        action: req.method,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      })
      
      next()
      
    } catch (error) {
      console.error('Access control error:', error)
      res.status(500).json({
        success: false,
        error: { errorType: 'INTERNAL_ERROR', message: '권한 검증 중 오류가 발생했습니다.' }
      })
    }
  }
  
  // 관리자 권한 검증
  static requireAdminAccess = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.user.id
      
      // 관리자 권한 확인
      const adminRole = await db.userRoles.findFirst({
        where: {
          userId,
          roleNames: { in: ['admin', 'super_admin'] },
          isActive: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        }
      })
      
      if (!adminRole) {
        await this.logSecurityEvent({
          type: 'ADMIN_ACCESS_DENIED',
          userId,
          severity: 'CRITICAL'
        })
        
        return res.status(403).json({
          success: false,
          error: { errorType: 'ADMIN_REQUIRED', message: '관리자 권한이 필요합니다.' }
        })
      }
      
      // 관리자 접근 로그
      await this.logAdminAccess({
        adminId: userId,
        action: req.method + ' ' + req.path,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      })
      
      next()
      
    } catch (error) {
      console.error('Admin access control error:', error)
      res.status(500).json({
        success: false,
        error: { errorType: 'INTERNAL_ERROR', message: '관리자 권한 검증 중 오류가 발생했습니다.' }
      })
    }
  }
  
  // 의심스러운 활동 탐지
  private static async incrementSuspiciousActivity(userId: string, ipAddress: string) {
    const key = `suspicious:${userId}:${ipAddress}`
    const count = await redis.incr(key)
    await redis.expire(key, 3600) // 1시간 TTL
    
    if (count >= 5) {
      // 5회 이상 시도 시 계정 일시 잠금
      await this.temporaryLockAccount(userId, '1 hour')
      await this.sendSecurityAlert({
        type: 'ACCOUNT_LOCKED',
        userId,
        ipAddress,
        reason: 'Multiple unauthorized access attempts'
      })
    }
  }
}
```

### **보안 이벤트 로깅**
```typescript
export class SecurityEventLogger {
  static async logSecurityEvent(event: SecurityEvent): Promise<void> {
    const auditEntry = {
      id: generateId(),
      eventType: event.type,
      userId: event.userId,
      resourceId: event.resourceId,
      severity: event.severity,
      details: JSON.stringify(event.details || {}),
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      timestamp: new Date(),
      investigated: false
    }
    
    // 데이터베이스 저장
    await db.securityAudit.create({ data: auditEntry })
    
    // 실시간 알림 (높은 위험도)
    if (event.severity === 'HIGH' || event.severity === 'CRITICAL') {
      await this.triggerRealTimeAlert(auditEntry)
    }
    
    // SIEM 시스템 연동
    await this.sendToSIEM(auditEntry)
  }
  
  private static async triggerRealTimeAlert(event: SecurityAuditEntry) {
    // Slack, PagerDuty 등으로 즉시 알림
    await notificationService.sendSecurityAlert({
      title: `🚨 보안 이벤트 발생: ${event.eventType}`,
      message: `사용자 ${event.userId}가 권한 없는 리소스에 접근을 시도했습니다.`,
      severity: event.severity,
      timestamp: event.timestamp,
      details: event.details
    })
  }
}
```

---

## 📊 **모니터링 및 탐지 시스템**

### **실시간 이상 탐지**
```typescript
export class AnomalyDetectionService {
  // 비정상 접근 패턴 탐지
  static async detectAnomalousAccess(userId: string, accessPattern: AccessPattern): Promise<boolean> {
    const baseline = await this.getUserBaseline(userId)
    
    const anomalies = [
      this.checkTimeAnomaly(accessPattern.timestamp, baseline.normalHours),
      this.checkLocationAnomaly(accessPattern.ipAddress, baseline.normalLocations),
      this.checkVolumeAnomaly(accessPattern.requestCount, baseline.normalVolume),
      this.checkResourceAnomaly(accessPattern.resourceIds, baseline.normalResources)
    ]
    
    const anomalyScore = anomalies.filter(Boolean).length
    
    if (anomalyScore >= 2) {
      await SecurityEventLogger.logSecurityEvent({
        type: 'ANOMALOUS_ACCESS_DETECTED',
        userId,
        severity: 'HIGH',
        details: { anomalyScore, patterns: anomalies }
      })
      return true
    }
    
    return false
  }
  
  // 무차별 대입 공격 탐지
  static async detectBruteForceAttack(ipAddress: string): Promise<boolean> {
    const timeWindow = 5 * 60 * 1000 // 5분
    const threshold = 20 // 5분간 20회 이상
    
    const recentAttempts = await db.securityAudit.count({
      where: {
        ipAddress,
        eventType: 'UNAUTHORIZED_ACCESS_ATTEMPT',  
        timestamp: { gte: new Date(Date.now() - timeWindow) }
      }
    })
    
    if (recentAttempts >= threshold) {
      await this.blockIP(ipAddress, '24 hours')
      await SecurityEventLogger.logSecurityEvent({
        type: 'BRUTE_FORCE_DETECTED',
        ipAddress,
        severity: 'CRITICAL',
        details: { attempts: recentAttempts, timeWindow }
      })
      return true
    }
    
    return false
  }
}
```

---

## 🧪 **테스트 전략**

### **보안 테스트 시나리오**
```typescript
describe('User Isolation Security Tests', () => {
  describe('Horizontal Privilege Escalation Prevention', () => {
    it('should deny access to other users drafts', async () => {
      const user1 = await createTestUser()
      const user2 = await createTestUser()
      const draft = await createDraft(user1.id)
      
      const response = await request(app)
        .get(`/api/reviews/draft/${draft.id}`)
        .set('Authorization', `Bearer ${user2.token}`)
        
      expect(response.status).toBe(403)
      expect(response.body.error.errorType).toBe('FORBIDDEN')
    })
    
    it('should log unauthorized access attempts', async () => {
      // 테스트 구현
    })
    
    it('should block IP after multiple failed attempts', async () => {
      // 테스트 구현  
    })
  })
  
  describe('Admin Access Control', () => {
    it('should require admin role for admin endpoints', async () => {
      // 테스트 구현
    })
    
    it('should log all admin access attempts', async () => {
      // 테스트 구현
    })
  })
})
```

---

## 🚀 **SuperClaude 명령어 가이드**

### **Phase 1: 권한 검증 미들웨어 구축**

#### **접근 제어 미들웨어 개발**
```bash
/sc:implement access-control-middleware --persona security --c7 @docs/prd-security-user-isolation.md
/sc:design authorization-flow --persona security --seq @docs/prd-security-user-isolation.md
/sc:test access-control --persona security --play @docs/prd-security-user-isolation.md
```

#### **데이터베이스 보안 강화**
```bash
/sc:implement row-level-security --persona backend --c7 @docs/prd-security-user-isolation.md
/sc:design database-security --persona security --seq @docs/prd-security-user-isolation.md
/sc:analyze database-access-patterns --focus security --persona security @docs/prd-security-user-isolation.md
```

### **Phase 2: 실시간 모니터링 시스템**

#### **이상 탐지 시스템**
```bash
/sc:implement anomaly-detection --persona security --seq @docs/prd-security-user-isolation.md
/sc:design security-monitoring --persona devops --c7 @docs/prd-security-user-isolation.md
/sc:test security-alerts --persona qa --play @docs/prd-security-user-isolation.md
```

#### **감사 로깅 시스템**
```bash
/sc:implement audit-logging --persona backend --c7 @docs/prd-security-user-isolation.md
/sc:design log-analysis --persona devops --seq @docs/prd-security-user-isolation.md
/sc:analyze logging-performance --focus performance --persona performance @docs/prd-security-user-isolation.md
```

### **Phase 3: 관리자 권한 관리**

#### **역할 기반 접근 제어**
```bash
/sc:implement rbac-system --persona security --c7 @docs/prd-security-user-isolation.md
/sc:design admin-dashboard --persona frontend --magic @docs/prd-security-user-isolation.md
/sc:test role-permissions --persona qa --play @docs/prd-security-user-isolation.md
```

#### **보안 대시보드**
```bash
/sc:implement security-dashboard --persona devops --magic @docs/prd-security-user-isolation.md
/sc:design real-time-monitoring --persona devops --seq @docs/prd-security-user-isolation.md
/sc:analyze dashboard-performance --focus performance --persona performance @docs/prd-security-user-isolation.md
```

### **Phase 4: 침투 테스트 및 검증**

#### **보안 테스트**
```bash
/sc:test penetration-testing --persona security --play @docs/prd-security-user-isolation.md
/sc:analyze security-vulnerabilities --focus security --depth deep --persona security @docs/prd-security-user-isolation.md
/sc:test access-control-bypass --persona security --play @docs/prd-security-user-isolation.md
```

#### **성능 영향 분석**
```bash
/sc:analyze security-performance-impact --focus performance --persona performance @docs/prd-security-user-isolation.md
/sc:test load-with-security --persona qa --play @docs/prd-security-user-isolation.md
/sc:improve security-optimization --type performance --persona performance @docs/prd-security-user-isolation.md
```

### **전체 프로젝트 오케스트레이션**

#### **보안 아키텍처 설계**
```bash
/sc:workflow @docs/prd-security-user-isolation.md --strategy systematic --persona security --all-mcp --output detailed
/sc:design security-architecture --persona architect --seq @docs/prd-security-user-isolation.md
```

#### **보안 구현 검증**
```bash
/sc:analyze security-implementation --focus security --depth deep --persona security @docs/prd-security-user-isolation.md
/sc:test security-integration --persona qa --play @docs/prd-security-user-isolation.md
/sc:document security-procedures --persona scribe=en @docs/prd-security-user-isolation.md
```

---

## 📊 **성공 측정 지표**

### **정량적 지표**
- 권한 우회 시도 차단율: 100%
- 보안 이벤트 탐지율: >99%
- 관리자 접근 로그 완료율: 100%
- API 성능 영향: <2%

### **정성적 지표**
- 보안 감사 통과: 완료
- 침투 테스트 통과: 완료  
- 규정 준수 인증: 완료

---

**문서 승인 상태**: ⏳ 검토 중  
**구현 우선순위**: CRITICAL  
**예상 완료일**: 2025-02-21
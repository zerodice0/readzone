# PRD: S7 - 데이터 보존 및 개인정보 보호 강화

**문서 버전**: v1.0  
**작성일**: 2025-02-01  
**작성자**: 보안팀  
**승인자**: DPO (Data Protection Officer)  
**보안 우선순위**: HIGH (8.5/10)

---

## 📋 **프로젝트 개요**

### **목표**
ReadZone Draft 시스템의 개인정보 처리 및 데이터 보존 정책을 GDPR, CCPA 등 국제 개인정보보호 규정에 완전히 준수하도록 개선하여 사용자의 개인정보 자기결정권을 보장하고 규제 리스크를 제거한다.

### **배경**
현재 시스템은 기본적인 데이터 보존 정책만 있어 다음과 같은 법적/규제 위험이 존재한다:
- GDPR Article 17 (잊혀질 권리) 미준수
- 개인정보 보존 기간 정책 부재
- 데이터 삭제 요청 처리 시스템 부족
- 개인정보 처리 투명성 및 사용자 제어권 부족
- 개인정보 이전 및 제3자 제공에 대한 동의 관리 부재

### **성공 지표**
- GDPR 준수율: 100%
- 데이터 삭제 요청 처리율: >99.9%
- 개인정보 보존 정책 준수율: 100%
- 규제 감사 통과율: 100%
- 사용자 개인정보 제어 만족도: >90%

---

## 🎯 **핵심 요구사항**

### **FR-1: 포괄적인 데이터 삭제 시스템**
- **우선순위**: Critical
- **설명**: 사용자 요청 시 완전한 개인정보 삭제 보장
- **상세 요구사항**:
  - 즉시 삭제 (논리적 삭제) 30일 이내
  - 물리적 삭제 (백업 및 로그 포함) 90일 이내
  - 법적 보존 의무 데이터 별도 관리
  - 삭제 프로세스 감사 추적 완전성

### **FR-2: 개인정보 보존 기간 관리**
- **우선순위**: Critical
- **설명**: 데이터 종류별 차등 보존 기간 및 자동 삭제
- **상세 요구사항**:
  - Draft 데이터: 7일 (기존 정책 유지)
  - 개인 식별 정보: 회원 탈퇴 후 5년
  - 서비스 이용 기록: 1년
  - 로그 및 보안 데이터: 3년
  - 자동 만료 및 알림 시스템

### **FR-3: 사용자 개인정보 제어 인터페이스**
- **우선순위**: High
- **설명**: 개인정보 자기결정권 행사를 위한 사용자 인터페이스
- **상세 요구사항**:
  - 개인정보 처리 현황 대시보드
  - 데이터 다운로드 (이동권) 기능
  - 처리 목적별 동의 관리
  - 개인정보 수정/삭제 요청 시스템

### **FR-4: 동의 관리 시스템 (CMS)**
- **우선순위**: High
- **설명**: 세분화된 개인정보 처리 동의 관리
- **상세 요구사항**:
  - 처리 목적별 세분화된 동의
  - 동의 철회 즉시 반영
  - 동의 이력 추적 및 감사
  - 마케팅/분석 동의 별도 관리

### **FR-5: 개인정보 영향평가 (PIA) 시스템**
- **우선순위**: Medium
- **설명**: 새로운 개인정보 처리에 대한 영향평가 자동화
- **상세 요구사항**:
  - 개인정보 처리 위험도 자동 평가
  - 고위험 처리에 대한 승인 프로세스
  - 정기적 개인정보 처리 현황 모니터링
  - 규제 변경사항 자동 반영

---

## 🛡️ **개인정보보호 아키텍처**

### **데이터 분류 및 보존 정책**
```typescript
interface DataClassification {
  // 개인식별정보 (PII)
  personallyIdentifiableInfo: {
    category: 'PII',
    examples: ['email', 'name', 'phone', 'address'],
    retentionPeriod: '5_years_after_withdrawal',
    legalBasis: 'contract_performance',
    deletionPriority: 'critical'
  }
  
  // 민감정보
  sensitivePersonalInfo: {
    category: 'SPI', 
    examples: ['reading_preferences', 'personal_opinions', 'political_views'],
    retentionPeriod: '1_year_after_last_activity',
    legalBasis: 'consent',
    deletionPriority: 'critical'
  }
  
  // 서비스 이용 기록
  serviceUsageData: {
    category: 'Usage',
    examples: ['login_history', 'page_views', 'feature_usage'],
    retentionPeriod: '1_year',
    legalBasis: 'legitimate_interest',
    deletionPriority: 'high'
  }
  
  // 보안 및 감사 로그
  securityAuditLogs: {
    category: 'Security',
    examples: ['security_events', 'access_logs', 'error_logs'],
    retentionPeriod: '3_years',
    legalBasis: 'legal_obligation',
    deletionPriority: 'medium'
  }
  
  // 익명화된 분석 데이터
  anonymizedAnalytics: {
    category: 'Anonymous',
    examples: ['aggregated_statistics', 'anonymized_usage_patterns'],
    retentionPeriod: 'unlimited',
    legalBasis: 'not_applicable',
    deletionPriority: 'low'
  }
}
```

### **동의 관리 구조**
```typescript
interface ConsentManagement {
  consentTypes: {
    essential: {
      required: true,
      withdrawable: false,
      description: '서비스 제공을 위한 필수 처리',
      purposes: ['account_management', 'service_delivery', 'security']
    },
    functional: {
      required: false,
      withdrawable: true,
      description: '서비스 기능 향상을 위한 처리',
      purposes: ['personalization', 'preference_storage', 'user_experience']
    },
    analytics: {
      required: false,
      withdrawable: true,
      description: '서비스 분석 및 개선을 위한 처리',
      purposes: ['usage_analytics', 'performance_monitoring', 'service_improvement']
    },
    marketing: {
      required: false,
      withdrawable: true,
      description: '마케팅 및 광고를 위한 처리',
      purposes: ['email_marketing', 'targeted_advertising', 'promotional_content']
    }
  },
  
  consentGranularity: {
    purpose_level: 'specific_processing_purpose',
    data_type_level: 'personal_data_category',
    retention_level: 'retention_period_control',
    sharing_level: 'third_party_sharing_control'
  }
}
```

---

## 🗄️ **데이터베이스 설계 확장**

### **개인정보 관리 테이블**
```sql
-- 사용자 개인정보 처리 동의
CREATE TABLE user_privacy_consent (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- 동의 정보
    consent_type TEXT NOT NULL CHECK (consent_type IN ('essential', 'functional', 'analytics', 'marketing')),
    processing_purpose TEXT NOT NULL,
    data_categories JSONB NOT NULL, -- 처리하는 개인정보 유형
    
    -- 동의 상태
    consent_given BOOLEAN NOT NULL,
    consent_timestamp TIMESTAMPTZ NOT NULL,
    consent_method TEXT NOT NULL, -- web_form, api, import
    consent_version TEXT NOT NULL, -- 동의서 버전
    
    -- 철회 정보
    withdrawal_timestamp TIMESTAMPTZ,
    withdrawal_method TEXT,
    withdrawal_reason TEXT,
    
    -- 메타데이터
    ip_address INET,
    user_agent TEXT,
    legal_basis TEXT NOT NULL, -- consent, contract, legitimate_interest, legal_obligation
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_privacy_consent_user_id (user_id),
    INDEX idx_privacy_consent_type (consent_type),
    INDEX idx_privacy_consent_status (consent_given),
    INDEX idx_privacy_consent_timestamp (consent_timestamp)
);

-- 데이터 보존 정책
CREATE TABLE data_retention_policy (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    data_category TEXT NOT NULL,
    data_type TEXT NOT NULL,
    
    -- 보존 정책
    retention_period_days INT NOT NULL,
    retention_basis TEXT NOT NULL, -- legal_requirement, business_need, user_consent
    auto_deletion BOOLEAN DEFAULT true,
    
    -- 삭제 정책
    soft_delete_days INT DEFAULT 30, -- 논리적 삭제 기간
    hard_delete_days INT DEFAULT 90, -- 물리적 삭제 기간
    
    -- 예외 사항
    legal_hold_exceptions JSONB, -- 법적 보존 의무 예외
    business_exceptions JSONB, -- 비즈니스 예외
    
    -- 메타데이터
    policy_version TEXT NOT NULL,
    effective_from TIMESTAMPTZ DEFAULT NOW(),
    effective_until TIMESTAMPTZ,
    created_by TEXT REFERENCES users(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(data_category, data_type, policy_version)
);

-- 데이터 삭제 요청 및 처리
CREATE TABLE data_deletion_request (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id),
    
    -- 요청 정보
    request_type TEXT NOT NULL CHECK (request_type IN ('partial_deletion', 'full_deletion', 'account_closure')),
    requested_data_types JSONB, -- 삭제 요청한 데이터 유형
    deletion_reason TEXT,
    
    -- 처리 상태
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected', 'cancelled')),
    processing_started_at TIMESTAMPTZ,
    processing_completed_at TIMESTAMPTZ,
    
    -- 삭제 결과
    deleted_records_count JSONB, -- 데이터 유형별 삭제된 레코드 수
    deletion_report JSONB, -- 상세 삭제 보고서
    retention_exceptions JSONB, -- 법적 보존 의무로 인한 예외사항
    
    -- 검증 정보
    verification_required BOOLEAN DEFAULT false,
    verification_completed_at TIMESTAMPTZ,
    verification_method TEXT, -- email_verification, identity_verification
    
    -- 감사 정보
    processed_by TEXT REFERENCES users(id),
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_deletion_request_user_id (user_id),
    INDEX idx_deletion_request_status (status),
    INDEX idx_deletion_request_type (request_type),
    INDEX idx_deletion_request_created (created_at)
);

-- 데이터 접근 및 다운로드 로그
CREATE TABLE data_access_log (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id),
    
    -- 접근 정보
    access_type TEXT NOT NULL CHECK (access_type IN ('view', 'download', 'export', 'modify', 'delete')),
    data_category TEXT NOT NULL,
    data_fields JSONB, -- 접근한 구체적 필드들
    
    -- 요청 정보
    purpose TEXT, -- data_portability, privacy_dashboard, user_request
    request_size_bytes BIGINT,
    response_size_bytes BIGINT,
    
    -- 결과
    access_granted BOOLEAN NOT NULL,
    denial_reason TEXT,
    
    -- 메타데이터
    ip_address INET NOT NULL,
    user_agent TEXT,
    session_id TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_data_access_user_id (user_id),
    INDEX idx_data_access_type (access_type),
    INDEX idx_data_access_granted (access_granted),
    INDEX idx_data_access_time (created_at)
);

-- 개인정보 영향평가 (PIA)
CREATE TABLE privacy_impact_assessment (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 평가 대상
    assessment_name TEXT NOT NULL,
    processing_activity TEXT NOT NULL,
    data_categories JSONB NOT NULL,
    processing_purposes JSONB NOT NULL,
    
    -- 위험 평가
    risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'very_high')),
    risk_factors JSONB, -- 식별된 위험 요소들
    likelihood_score INT CHECK (likelihood_score >= 1 AND likelihood_score <= 5),
    impact_score INT CHECK (impact_score >= 1 AND impact_score <= 5),
    
    -- 완화 조치
    mitigation_measures JSONB,
    residual_risk_level TEXT CHECK (residual_risk_level IN ('low', 'medium', 'high', 'very_high')),
    
    -- 승인 및 검토
    approval_required BOOLEAN DEFAULT false,
    approved_by TEXT REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    
    next_review_date DATE,
    review_frequency_months INT DEFAULT 12,
    
    -- 메타데이터
    assessed_by TEXT NOT NULL REFERENCES users(id),
    assessment_date DATE NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_pia_risk_level (risk_level),
    INDEX idx_pia_approval (approval_required, approved_at),
    INDEX idx_pia_review_date (next_review_date)
);
```

---

## 🔗 **API 설계 확장**

### **개인정보 관리 API**

#### **GET /api/privacy/data-overview**
- **기능**: 사용자 개인정보 처리 현황 조회
- **응답**:
```json
{
  "success": true,
  "data": {
    "personalData": {
      "categories": ["account_info", "usage_data", "preferences"],
      "processingPurposes": ["service_delivery", "personalization", "analytics"],
      "dataRetention": {
        "account_info": "5_years_after_withdrawal",
        "usage_data": "1_year",
        "preferences": "until_withdrawal"
      }
    },
    "consentStatus": {
      "essential": { "given": true, "withdrawable": false },
      "functional": { "given": true, "withdrawable": true },
      "analytics": { "given": false, "withdrawable": true },
      "marketing": { "given": false, "withdrawable": true }
    },
    "dataSize": {
      "totalRecords": 1247,
      "estimatedSize": "2.4MB"
    }
  }
}
```

#### **POST /api/privacy/data-export**
- **기능**: 개인정보 이동권 (데이터 다운로드)
- **요청**:
```json
{
  "exportFormat": "json",
  "dataCategories": ["account_info", "drafts", "reviews"],
  "includeMetadata": true
}
```

#### **POST /api/privacy/deletion-request**
- **기능**: 개인정보 삭제 요청
- **요청**:
```json
{
  "deletionType": "partial_deletion",
  "dataCategories": ["usage_data", "analytics_data"],
  "reason": "privacy_concern",
  "verificationMethod": "email_verification"
}
```

#### **PUT /api/privacy/consent**
- **기능**: 개인정보 처리 동의 관리
- **요청**:
```json
{
  "consentType": "analytics",
  "consentGiven": false,
  "withdrawalReason": "privacy_preference"
}
```

### **개인정보 관리 서비스**
```typescript
export class PrivacyManagementService {
  // 데이터 삭제 요청 처리
  async processDataDeletionRequest(userId: string, request: DeletionRequest): Promise<DeletionResult> {
    const deletionId = generateId()
    
    try {
      // 1단계: 삭제 요청 검증
      await this.validateDeletionRequest(userId, request)
      
      // 2단계: 법적 보존 의무 확인
      const retentionExceptions = await this.checkLegalRetentionRequirements(userId, request.dataCategories)
      
      // 3단계: 삭제 요청 기록
      const deletionRecord = await db.dataDeletionRequest.create({
        data: {
          id: deletionId,
          userId,
          requestType: request.deletionType,
          requestedDataTypes: request.dataCategories,
          deletionReason: request.reason,
          retentionExceptions,
          status: 'processing'
        }
      })
      
      // 4단계: 비동기 삭제 프로세스 시작
      await this.queueDeletionProcess(deletionId)
      
      return {
        deletionId,
        estimatedCompletionDate: this.calculateCompletionDate(),
        retentionExceptions,
        status: 'processing'
      }
      
    } catch (error) {
      await this.logDeletionError(userId, request, error)
      throw error
    }
  }
  
  // 실제 데이터 삭제 실행
  async executeDeletion(deletionId: string): Promise<void> {
    const deletionRequest = await db.dataDeletionRequest.findUnique({
      where: { id: deletionId }
    })
    
    if (!deletionRequest) {
      throw new Error('Deletion request not found')
    }
    
    const deletionResult = {
      deletedRecords: {} as Record<string, number>,
      errors: [] as string[]
    }
    
    try {
      // 병렬 삭제 실행
      const deletionTasks = deletionRequest.requestedDataTypes.map(async (dataType: string) => {
        try {
          const count = await this.deleteDataByType(deletionRequest.userId, dataType)
          deletionResult.deletedRecords[dataType] = count
        } catch (error) {
          deletionResult.errors.push(`${dataType}: ${error.message}`)
        }
      })
      
      await Promise.all(deletionTasks)
      
      // 삭제 완료 기록
      await db.dataDeletionRequest.update({
        where: { id: deletionId },
        data: {
          status: deletionResult.errors.length > 0 ? 'partially_completed' : 'completed',
          processingCompletedAt: new Date(),
          deletedRecordsCount: deletionResult.deletedRecords,
          deletionReport: { errors: deletionResult.errors }
        }
      })
      
      // 사용자 알림
      await this.notifyDeletionCompletion(deletionRequest.userId, deletionResult)
      
    } catch (error) {
      await db.dataDeletionRequest.update({
        where: { id: deletionId },
        data: {
          status: 'failed',
          deletionReport: { error: error.message }
        }
      })
      throw error
    }
  }
  
  // 데이터 유형별 삭제
  private async deleteDataByType(userId: string, dataType: string): Promise<number> {
    switch (dataType) {
      case 'drafts':
        return await this.deleteDrafts(userId)
      case 'reviews':
        return await this.deleteReviews(userId)
      case 'usage_data':
        return await this.deleteUsageData(userId)
      case 'preferences':
        return await this.deletePreferences(userId)
      default:
        throw new Error(`Unknown data type: ${dataType}`)
    }
  }
  
  private async deleteDrafts(userId: string): Promise<number> {
    // 논리적 삭제 (30일 후 물리적 삭제)
    const result = await db.reviewDraft.updateMany({
      where: { userId },
      data: {
        status: 'DELETED',
        deletedAt: new Date(),
        scheduledDeletionAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30일 후
      }
    })
    
    return result.count
  }
  
  // 동의 관리
  async updateConsent(userId: string, consentUpdate: ConsentUpdate): Promise<void> {
    const consent = await db.userPrivacyConsent.upsert({
      where: {
        userId_consentType: {
          userId,
          consentType: consentUpdate.consentType
        }
      },
      create: {
        userId,
        consentType: consentUpdate.consentType,
        processingPurpose: this.getProcessingPurpose(consentUpdate.consentType),
        dataCategories: this.getDataCategories(consentUpdate.consentType),
        consentGiven: consentUpdate.consentGiven,
        consentTimestamp: new Date(),
        consentMethod: 'web_form',
        consentVersion: 'v1.0',
        legalBasis: 'consent'
      },
      update: {
        consentGiven: consentUpdate.consentGiven,
        withdrawalTimestamp: consentUpdate.consentGiven ? null : new Date(),
        withdrawalMethod: consentUpdate.consentGiven ? null : 'web_form',
        withdrawalReason: consentUpdate.withdrawalReason
      }
    })
    
    // 동의 철회 시 관련 데이터 처리 중단
    if (!consentUpdate.consentGiven) {
      await this.stopDataProcessingForPurpose(userId, consentUpdate.consentType)
    }
  }
  
  // 데이터 이동권 (포터빌리티)
  async exportUserData(userId: string, exportRequest: DataExportRequest): Promise<DataExportResult> {
    const exportId = generateId()
    
    try {
      // 사용자 데이터 수집
      const userData = await this.collectUserData(userId, exportRequest.dataCategories)
      
      // 데이터 포맷팅
      const formattedData = this.formatExportData(userData, exportRequest.exportFormat)
      
      // 보안 파일 생성 (암호화)
      const exportFile = await this.createSecureExportFile(formattedData, exportId)
      
      // 접근 로그 기록
      await this.logDataAccess(userId, 'export', exportRequest.dataCategories)
      
      return {
        exportId,
        downloadUrl: `/api/privacy/download/${exportId}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24시간 후 만료
        fileSize: exportFile.size,
        recordCount: userData.totalRecords
      }
      
    } catch (error) {
      await this.logExportError(userId, exportRequest, error)
      throw error
    }
  }
}

interface DeletionRequest {
  deletionType: 'partial_deletion' | 'full_deletion' | 'account_closure'
  dataCategories: string[]
  reason?: string
  verificationMethod: 'email_verification' | 'identity_verification'
}

interface ConsentUpdate {
  consentType: 'essential' | 'functional' | 'analytics' | 'marketing'
  consentGiven: boolean
  withdrawalReason?: string
}

interface DataExportRequest {
  exportFormat: 'json' | 'csv' | 'xml'
  dataCategories: string[]
  includeMetadata: boolean
}
```

---

## 🧪 **개인정보보호 테스트 전략**

### **GDPR 준수 테스트**
```typescript
describe('GDPR Compliance Tests', () => {
  describe('Right to Erasure (Article 17)', () => {
    it('should completely delete user data upon request', async () => {
      const user = await createTestUser()
      const draft = await createDraft(user.id)
      
      // 삭제 요청
      const deletionResponse = await request(app)
        .post('/api/privacy/deletion-request')
        .set('Authorization', `Bearer ${user.token}`)
        .send({
          deletionType: 'full_deletion',
          dataCategories: ['all'],
          verificationMethod: 'email_verification'
        })
      
      expect(deletionResponse.status).toBe(202)
      
      // 삭제 프로세스 완료 대기
      await waitForDeletionCompletion(deletionResponse.body.data.deletionId)
      
      // 데이터 삭제 확인
      const deletedDraft = await db.reviewDraft.findUnique({
        where: { id: draft.id }
      })
      expect(deletedDraft?.status).toBe('DELETED')
    })
    
    it('should respect legal retention requirements', async () => {
      // 법적 보존 의무가 있는 데이터 테스트
    })
  })
  
  describe('Right to Data Portability (Article 20)', () => {
    it('should export user data in machine-readable format', async () => {
      const user = await createTestUser()
      
      const exportResponse = await request(app)
        .post('/api/privacy/data-export')
        .set('Authorization', `Bearer ${user.token}`)
        .send({
          exportFormat: 'json',
          dataCategories: ['account_info', 'drafts'],
          includeMetadata: true
        })
      
      expect(exportResponse.status).toBe(202)
      expect(exportResponse.body.data.downloadUrl).toBeDefined()
    })
  })
  
  describe('Consent Management', () => {
    it('should allow granular consent control', async () => {
      const user = await createTestUser()
      
      // 분석 동의 철회
      const consentResponse = await request(app)
        .put('/api/privacy/consent')
        .set('Authorization', `Bearer ${user.token}`)
        .send({
          consentType: 'analytics',
          consentGiven: false,
          withdrawalReason: 'privacy_preference'
        })
      
      expect(consentResponse.status).toBe(200)
      
      // 동의 상태 확인
      const consent = await db.userPrivacyConsent.findFirst({
        where: { userId: user.id, consentType: 'analytics' }
      })
      expect(consent?.consentGiven).toBe(false)
      expect(consent?.withdrawalTimestamp).toBeDefined()
    })
  })
})
```

---

## 🚀 **SuperClaude 명령어 가이드**

### **Phase 1: 데이터 삭제 시스템 구축**

#### **포괄적인 데이터 삭제 시스템**
```bash
/sc:implement data-deletion-system --persona security --c7 @docs/prd-security-data-retention-privacy.md
/sc:design deletion-architecture --persona security --seq @docs/prd-security-data-retention-privacy.md
/sc:test data-deletion-completeness --persona security --play @docs/prd-security-data-retention-privacy.md
```

#### **자동 데이터 보존 관리**
```bash
/sc:implement retention-policy-engine --persona backend --c7 @docs/prd-security-data-retention-privacy.md
/sc:design automated-deletion --persona backend --seq @docs/prd-security-data-retention-privacy.md
/sc:analyze retention-compliance --focus security --persona security @docs/prd-security-data-retention-privacy.md
```

### **Phase 2: 동의 관리 시스템 (CMS)**

#### **세분화된 동의 관리**
```bash
/sc:implement consent-management-system --persona security --c7 @docs/prd-security-data-retention-privacy.md
/sc:design consent-ui --persona frontend --magic @docs/prd-security-data-retention-privacy.md
/sc:test consent-granularity --persona qa --play @docs/prd-security-data-retention-privacy.md
```

#### **동의 이력 추적**
```bash
/sc:implement consent-audit-trail --persona backend --c7 @docs/prd-security-data-retention-privacy.md
/sc:design consent-reporting --persona backend --seq @docs/prd-security-data-retention-privacy.md
/sc:analyze consent-compliance --focus security --persona security @docs/prd-security-data-retention-privacy.md
```

### **Phase 3: 개인정보 제어 인터페이스**

#### **개인정보 대시보드**
```bash
/sc:implement privacy-dashboard --persona frontend --magic @docs/prd-security-data-retention-privacy.md
/sc:design data-overview-ui --persona frontend --magic @docs/prd-security-data-retention-privacy.md
/sc:test privacy-dashboard-usability --persona qa --play @docs/prd-security-data-retention-privacy.md
```

#### **데이터 이동권 (포터빌리티)**
```bash
/sc:implement data-export-system --persona backend --c7 @docs/prd-security-data-retention-privacy.md
/sc:design secure-data-export --persona security --seq @docs/prd-security-data-retention-privacy.md
/sc:test data-export-completeness --persona security --play @docs/prd-security-data-retention-privacy.md
```

### **Phase 4: 개인정보 영향평가 시스템**

#### **자동 PIA 시스템**
```bash
/sc:implement privacy-impact-assessment --persona security --seq @docs/prd-security-data-retention-privacy.md
/sc:design risk-assessment-engine --persona security --c7 @docs/prd-security-data-retention-privacy.md
/sc:test pia-accuracy --persona security --play @docs/prd-security-data-retention-privacy.md
```

#### **규제 준수 모니터링**
```bash
/sc:implement compliance-monitoring --persona devops --c7 @docs/prd-security-data-retention-privacy.md
/sc:design compliance-dashboard --persona devops --magic @docs/prd-security-data-retention-privacy.md
/sc:analyze compliance-gaps --focus security --persona security @docs/prd-security-data-retention-privacy.md
```

### **Phase 5: GDPR/CCPA 준수 검증**

#### **규제 준수 테스트**
```bash
/sc:test gdpr-compliance --persona security --play @docs/prd-security-data-retention-privacy.md
/sc:test ccpa-compliance --persona security --play @docs/prd-security-data-retention-privacy.md
/sc:analyze privacy-law-compliance --focus security --depth deep --persona security @docs/prd-security-data-retention-privacy.md
```

#### **감사 준비 및 문서화**
```bash
/sc:document privacy-procedures --persona scribe=en @docs/prd-security-data-retention-privacy.md
/sc:implement audit-reporting --persona devops --c7 @docs/prd-security-data-retention-privacy.md
/sc:test audit-readiness --persona qa --play @docs/prd-security-data-retention-privacy.md
```

### **전체 프로젝트 오케스트레이션**

#### **개인정보보호 아키텍처 설계**
```bash
/sc:workflow @docs/prd-security-data-retention-privacy.md --strategy systematic --persona security --all-mcp --output detailed
/sc:design privacy-architecture --persona architect --seq @docs/prd-security-data-retention-privacy.md
```

#### **개인정보보호 구현 검증**
```bash
/sc:analyze privacy-implementation --focus security --depth deep --persona security @docs/prd-security-data-retention-privacy.md
/sc:test privacy-integration --persona qa --play @docs/prd-security-data-retention-privacy.md
/sc:improve privacy-optimization --type security --persona security @docs/prd-security-data-retention-privacy.md
```

---

## 📊 **규제 준수 지표**

### **GDPR 준수 체크리스트**
- ✅ 개인정보 처리 적법성 확보 (Article 6)
- ✅ 정보주체 권리 보장 (Articles 15-22)
- ✅ 개인정보 보호 by Design/Default (Article 25)
- ✅ 개인정보 영향평가 실시 (Article 35)
- ✅ 개인정보 보호책임자 지정 (Article 37)

### **CCPA 준수 체크리스트**
- ✅ 개인정보 수집 고지 (Section 1798.100)
- ✅ 개인정보 삭제권 보장 (Section 1798.105)
- ✅ 개인정보 판매 금지 요구권 (Section 1798.120)
- ✅ 개인정보 이동권 보장 (Section 1798.110)

### **정량적 지표**
- 데이터 삭제 요청 처리율: >99.9%
- 개인정보 이동권 요청 처리 시간: <7일
- 동의 철회 반영 시간: <24시간
- 규제 감사 통과율: 100%

---

**문서 승인 상태**: ⏳ 검토 중  
**구현 우선순위**: HIGH  
**예상 완료일**: 2025-03-07
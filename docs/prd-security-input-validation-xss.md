# PRD: S5 - 입력 검증 및 XSS 방지 강화

**문서 버전**: v1.0  
**작성일**: 2025-02-01  
**작성자**: 보안팀  
**승인자**: CTO  
**보안 우선순위**: HIGH (8.1/10)

---

## 📋 **프로젝트 개요**

### **목표**
ReadZone Draft 시스템의 모든 사용자 입력에 대한 포괄적인 검증 체계를 구축하고 XSS(Cross-Site Scripting) 공격을 완전히 차단하여 사용자와 시스템의 보안을 보장한다.

### **배경**
현재 시스템은 React Quill 에디터를 통한 HTML 입력을 받고 있어 다음과 같은 보안 취약점이 존재한다:
- 악성 JavaScript 코드 삽입을 통한 XSS 공격 가능성
- 사용자 입력 데이터에 대한 불충분한 서버 측 검증
- HTML 콘텐츠 렌더링 시 안전하지 않은 처리
- 파일 업로드 및 외부 리소스 링크에 대한 검증 부족

### **성공 지표**
- XSS 공격 차단율: 100%
- 악성 입력 탐지율: >99.9%
- 사용자 경험 저하: <5%
- 보안 스캐닝 통과율: 100%

---

## 🎯 **핵심 요구사항**

### **FR-1: 포괄적인 입력 검증 시스템**
- **우선순위**: Critical
- **설명**: 모든 사용자 입력에 대한 다층 검증 체계
- **상세 요구사항**:
  - 클라이언트 측 실시간 검증 (즉시 피드백)
  - 서버 측 필수 검증 (보안 최종 방어선)
  - 스키마 기반 데이터 유효성 검사 (Zod)
  - 입력 길이, 형식, 콘텐츠 제한 강제

### **FR-2: XSS 방지 시스템**
- **우선순위**: Critical
- **설명**: 모든 HTML 콘텐츠에 대한 안전한 처리
- **상세 요구사항**:
  - HTML 새니타이제이션 (DOMPurify)
  - 허용된 태그/속성 화이트리스트 관리
  - 동적 콘텐츠 안전한 렌더링
  - CSP(Content Security Policy) 강화

### **FR-3: React Quill 에디터 보안 강화**
- **우선순위**: High
- **설명**: WYSIWYG 에디터의 보안 취약점 완전 차단
- **상세 요구사항**:
  - 안전한 툴바 기능만 허용
  - 외부 리소스 로딩 차단
  - iframe, script 태그 완전 차단
  - 이미지 업로드 보안 검증

### **FR-4: API 입력 보안 강화**
- **우선순위**: High
- **설명**: 모든 API 엔드포인트 입력 검증 강화
- **상세 요구사항**:
  - Rate Limiting 강화 (60→30 req/min)
  - Request Size 제한 (1MB → 500KB)
  - SQL Injection 방지 강화
  - JSON 구조 검증 및 깊이 제한

### **FR-5: 실시간 위협 탐지 및 대응**
- **우선순위**: Medium
- **설명**: 악성 입력 패턴 실시간 탐지 및 자동 차단
- **상세 요구사항**:
  - 머신러닝 기반 악성 패턴 탐지
  - IP 기반 자동 차단 시스템
  - 보안 이벤트 실시간 알림
  - 공격 시도 분석 및 대응 자동화

---

## 🛡️ **보안 아키텍처 설계**

### **다층 입력 검증 구조**
```typescript
interface InputValidationLayer {
  // Layer 1: Client-side (First Defense)
  clientValidation: {
    realTimeValidation: 'immediate_feedback',
    inputSanitization: 'pre_processing',
    visualFeedback: 'user_guidance'
  }
  
  // Layer 2: Transport (Network Security)
  networkSecurity: {
    contentSecurityPolicy: 'strict_csp',
    requestSizeLimit: '500KB',
    rateLimiting: '30_requests_per_minute'
  }
  
  // Layer 3: Server-side (Final Defense)
  serverValidation: {
    schemaValidation: 'zod_strict_mode',
    htmlSanitization: 'dompurify_strict',
    sqlInjectionPrevention: 'parameterized_queries'
  }
  
  // Layer 4: Monitoring (Threat Detection)
  threatDetection: {
    patternAnalysis: 'ml_based_detection',
    anomalyDetection: 'behavioral_analysis',
    automaticResponse: 'block_and_alert'
  }
}
```

### **XSS 방지 전략**
```typescript
interface XSSPrevention {
  contentSanitization: {
    library: 'DOMPurify',
    mode: 'strict',
    allowedTags: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'h1', 'h2', 'h3'],
    blockedTags: ['script', 'iframe', 'object', 'embed', 'form', 'input'],
    allowedAttributes: ['class', 'style'],
    blockedAttributes: ['onclick', 'onload', 'onerror', 'href', 'src']
  }
  
  contentSecurityPolicy: {
    defaultSrc: "'self'",
    scriptSrc: "'self' 'unsafe-inline'",
    styleSrc: "'self' 'unsafe-inline'",
    imgSrc: "'self' data: https:",
    connectSrc: "'self'",
    fontSrc: "'self'",
    objectSrc: "'none'",
    mediaSrc: "'self'",
    frameSrc: "'none'"
  }
  
  outputEncoding: {
    htmlContext: 'html_entity_encoding',
    attributeContext: 'attribute_encoding',
    jsContext: 'javascript_encoding',
    cssContext: 'css_encoding'
  }
}
```

---

## 🗄️ **데이터베이스 입력 보안**

### **입력 검증 스키마**
```sql
-- 입력 검증 로그 테이블
CREATE TABLE input_validation_log (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES users(id),
    endpoint TEXT NOT NULL,
    input_type TEXT NOT NULL,
    validation_result TEXT NOT NULL, -- PASS, FAIL, SUSPICIOUS
    failure_reason TEXT,
    input_hash TEXT NOT NULL, -- SHA-256 해시 (민감 정보 보호)
    threat_level TEXT CHECK (threat_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    
    -- 요청 정보
    ip_address INET NOT NULL,
    user_agent TEXT,
    referer TEXT,
    
    -- 응답 정보
    blocked BOOLEAN DEFAULT false,
    sanitized BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_input_validation_user_id (user_id),
    INDEX idx_input_validation_endpoint (endpoint),
    INDEX idx_input_validation_result (validation_result),
    INDEX idx_input_validation_threat (threat_level),
    INDEX idx_input_validation_time (created_at)
);

-- XSS 공격 시도 로그
CREATE TABLE xss_attempt_log (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES users(id),
    attack_vector TEXT NOT NULL, -- script_injection, html_injection, attribute_injection
    payload_hash TEXT NOT NULL,
    detected_patterns JSONB, -- 탐지된 악성 패턴들
    
    -- 공격 정보
    ip_address INET NOT NULL,
    user_agent TEXT,
    blocked BOOLEAN DEFAULT true,
    confidence_score FLOAT CHECK (confidence_score >= 0 AND confidence_score <= 1),
    
    -- 대응 정보
    response_action TEXT NOT NULL, -- blocked, sanitized, alerted
    admin_notified BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_xss_attempt_user_id (user_id),
    INDEX idx_xss_attempt_vector (attack_vector),
    INDEX idx_xss_attempt_ip (ip_address),
    INDEX idx_xss_attempt_time (created_at)
);

-- 입력 검증 규칙 설정
CREATE TABLE validation_rules (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name TEXT UNIQUE NOT NULL,
    endpoint_pattern TEXT NOT NULL,
    field_name TEXT NOT NULL,
    
    -- 검증 규칙
    min_length INT,
    max_length INT,
    allowed_patterns JSONB, -- 정규식 패턴
    blocked_patterns JSONB, -- 금지된 패턴
    allowed_html_tags JSONB,
    blocked_html_tags JSONB,
    
    -- 메타 정보
    is_active BOOLEAN DEFAULT true,
    severity_level TEXT DEFAULT 'MEDIUM',
    created_by TEXT REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔗 **API 입력 검증 강화**

### **통합 입력 검증 미들웨어**
```typescript
export class InputValidationMiddleware {
  // 포괄적인 입력 검증 미들웨어
  static validateInput = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const validationStart = performance.now()
      
      // 1단계: 기본 요청 검증
      await this.validateBasicRequest(req)
      
      // 2단계: 스키마 기반 검증
      await this.validateSchema(req)
      
      // 3단계: XSS 패턴 검증
      await this.validateXSSPatterns(req)
      
      // 4단계: 콘텐츠 새니타이제이션
      req.body = await this.sanitizeContent(req.body)
      
      const validationTime = performance.now() - validationStart
      
      // 성능 모니터링 (>50ms 경고)
      if (validationTime > 50) {
        console.warn(`Slow input validation: ${validationTime.toFixed(2)}ms`)
      }
      
      // 검증 성공 로그
      await this.logValidationSuccess(req, validationTime)
      
      next()
      
    } catch (error) {
      await this.handleValidationError(req, res, error)
    }
  }
  
  // 기본 요청 검증
  private static async validateBasicRequest(req: Request): Promise<void> {
    // Content-Length 제한
    const contentLength = parseInt(req.get('content-length') || '0')
    if (contentLength > 500 * 1024) { // 500KB
      throw new ValidationError('Request too large', 'CONTENT_LENGTH_EXCEEDED')
    }
    
    // User-Agent 검증
    const userAgent = req.get('user-agent')
    if (!userAgent || this.isSuspiciousUserAgent(userAgent)) {
      throw new ValidationError('Invalid user agent', 'SUSPICIOUS_USER_AGENT')
    }
    
    // Rate limiting 검증
    await this.checkRateLimit(req.ip, req.user?.id)
  }
  
  // 스키마 기반 검증
  private static async validateSchema(req: Request): Promise<void> {
    const endpoint = `${req.method} ${req.route?.path || req.path}`
    const schema = this.getValidationSchema(endpoint)
    
    if (schema) {
      try {
        // Zod 스키마 검증
        req.body = schema.parse(req.body)
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new ValidationError('Schema validation failed', 'SCHEMA_ERROR', {
            errors: error.errors
          })
        }
        throw error
      }
    }
  }
  
  // XSS 패턴 검증
  private static async validateXSSPatterns(req: Request): Promise<void> {
    const content = JSON.stringify(req.body)
    const suspiciousPatterns = this.detectXSSPatterns(content)
    
    if (suspiciousPatterns.length > 0) {
      // XSS 시도 로그
      await this.logXSSAttempt(req, suspiciousPatterns)
      
      // 높은 신뢰도의 공격 패턴은 즉시 차단
      const highConfidencePatterns = suspiciousPatterns.filter(p => p.confidence > 0.8)
      if (highConfidencePatterns.length > 0) {
        throw new SecurityError('XSS attack detected', 'XSS_BLOCKED', {
          patterns: highConfidencePatterns
        })
      }
    }
  }
  
  // 콘텐츠 새니타이제이션
  private static async sanitizeContent(body: any): Promise<any> {
    if (typeof body !== 'object' || body === null) {
      return body
    }
    
    const sanitized = { ...body }
    
    // HTML 콘텐츠 필드 새니타이제이션
    const htmlFields = ['content', 'description', 'summary']
    
    for (const field of htmlFields) {
      if (sanitized[field] && typeof sanitized[field] === 'string') {
        sanitized[field] = this.sanitizeHTML(sanitized[field])
      }
    }
    
    return sanitized
  }
  
  // HTML 새니타이제이션
  private static sanitizeHTML(html: string): string {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 
        'h1', 'h2', 'h3', 'blockquote'
      ],
      ALLOWED_ATTR: ['class'],
      FORBID_ATTR: ['style', 'onclick', 'onload', 'onerror'],
      FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input'],
      KEEP_CONTENT: true,
      SANITIZE_NAMED_PROPS: true
    })
  }
  
  // XSS 패턴 탐지
  private static detectXSSPatterns(content: string): XSSPattern[] {
    const patterns: XSSPatternRule[] = [
      {
        name: 'script_tag',
        regex: /<script[^>]*>.*?<\/script>/gi,
        confidence: 0.95,
        severity: 'CRITICAL'
      },
      {
        name: 'javascript_protocol',
        regex: /javascript:/gi,
        confidence: 0.9,
        severity: 'HIGH'
      },
      {
        name: 'on_event_handler',
        regex: /on\w+\s*=\s*['"]/gi,
        confidence: 0.85,
        severity: 'HIGH'
      },
      {
        name: 'iframe_tag',
        regex: /<iframe[^>]*>/gi,
        confidence: 0.8,
        severity: 'HIGH'
      },
      {
        name: 'eval_function',
        regex: /eval\s*\(/gi,
        confidence: 0.9,
        severity: 'HIGH'
      }
    ]
    
    const detectedPatterns: XSSPattern[] = []
    
    for (const pattern of patterns) {
      const matches = content.match(pattern.regex)
      if (matches) {
        detectedPatterns.push({
          name: pattern.name,
          matches: matches.length,
          confidence: pattern.confidence,
          severity: pattern.severity,
          sample: matches[0].substring(0, 100)
        })
      }
    }
    
    return detectedPatterns
  }
}

interface XSSPattern {
  name: string
  matches: number
  confidence: number
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  sample: string
}

interface XSSPatternRule {
  name: string
  regex: RegExp
  confidence: number
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}
```

### **React Quill 에디터 보안 설정**
```typescript
export class SecureQuillEditor {
  // 보안 강화된 Quill 설정
  static getSecureConfig(): QuillConfig {
    return {
      theme: 'snow',
      modules: {
        toolbar: {
          container: this.getSecureToolbar(),
          handlers: {
            // 커스텀 핸들러로 보안 검증
            'link': this.handleLinkInsert,
            'image': this.handleImageInsert
          }
        },
        clipboard: {
          // 붙여넣기 시 HTML 새니타이제이션
          matchVisual: false,
          transforms: [this.sanitizeClipboardContent]
        }
      },
      formats: this.getAllowedFormats(),
      bounds: '.editor-container',
      scrollingContainer: '.editor-container',
      strict: true // 엄격 모드 활성화
    }
  }
  
  // 허용된 툴바 기능만 제공
  private static getSecureToolbar(): Array<Array<string>> {
    return [
      ['bold', 'italic', 'underline'],
      ['blockquote'],
      [{ 'header': [1, 2, 3, false] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['clean'] // 포맷 제거
    ]
    // 제거된 기능: link, image, video, code-block (보안 위험)
  }
  
  // 허용된 포맷만 지정
  private static getAllowedFormats(): string[] {
    return [
      'bold', 'italic', 'underline',
      'header', 'blockquote',
      'list', 'bullet'
    ]
  }
  
  // 링크 삽입 보안 검증
  private static handleLinkInsert(value: string): void {
    if (!value) return
    
    // URL 유효성 검증
    if (!this.isValidURL(value)) {
      alert('유효하지 않은 URL입니다.')
      return
    }
    
    // 악성 프로토콜 차단
    if (this.isUnsafeProtocol(value)) {
      alert('허용되지 않는 링크 형식입니다.')
      return
    }
    
    // 안전한 링크만 삽입
    const range = this.quill.getSelection()
    if (range) {
      this.quill.insertText(range.index, value, 'link', value)
    }
  }
  
  // 이미지 삽입 차단 (보안상 위험)
  private static handleImageInsert(): void {
    alert('보안상의 이유로 이미지 삽입이 제한됩니다.')
  }
  
  // 클립보드 콘텐츠 새니타이제이션
  private static sanitizeClipboardContent(delta: Delta): Delta {
    const sanitizedOps = delta.ops?.map(op => {
      if (op.insert && typeof op.insert === 'string') {
        // HTML 태그 제거
        op.insert = DOMPurify.sanitize(op.insert, {
          ALLOWED_TAGS: [],
          KEEP_CONTENT: true
        })
      }
      return op
    })
    
    return new Delta(sanitizedOps)
  }
}
```

---

## 🧪 **보안 테스트 전략**

### **XSS 공격 시뮬레이션**
```typescript
describe('XSS Prevention Tests', () => {
  describe('HTML Content Injection', () => {
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert("XSS")>',
      '<iframe src="javascript:alert(\'XSS\')"></iframe>',
      '<svg onload=alert("XSS")>',
      '<div onclick="alert(\'XSS\')">Click me</div>',
      'javascript:alert("XSS")',
      '<object data="javascript:alert(\'XSS\')"></object>',
      '<embed src="javascript:alert(\'XSS\')">',
      '<link rel="stylesheet" href="javascript:alert(\'XSS\')">',
      '<style>@import "javascript:alert(\'XSS\')"</style>'
    ]
    
    xssPayloads.forEach((payload, index) => {
      it(`should block XSS payload ${index + 1}: ${payload.substring(0, 30)}...`, async () => {
        const response = await request(app)
          .post('/api/reviews/draft')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            content: payload,
            title: 'Test Draft'
          })
          
        // XSS 페이로드는 차단되거나 새니타이즈되어야 함
        expect(response.status).toBe(400) // 차단됨
        expect(response.body.error.errorType).toBe('XSS_BLOCKED')
      })
    })
  })
  
  describe('Input Validation', () => {
    it('should reject oversized content', async () => {
      const oversizedContent = 'A'.repeat(1024 * 1024 + 1) // 1MB + 1
      
      const response = await request(app)
        .post('/api/reviews/draft')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ content: oversizedContent })
        
      expect(response.status).toBe(400)
      expect(response.body.error.errorType).toBe('CONTENT_LENGTH_EXCEEDED')
    })
    
    it('should sanitize HTML content', async () => {
      const maliciousHTML = '<p>Safe content</p><script>alert("XSS")</script>'
      
      const response = await request(app)
        .post('/api/reviews/draft')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ content: maliciousHTML })
        
      expect(response.status).toBe(201)
      
      // 저장된 콘텐츠 확인
      const savedDraft = await db.reviewDraft.findUnique({
        where: { id: response.body.data.id }
      })
      
      expect(savedDraft?.content).toBe('<p>Safe content</p>')
      expect(savedDraft?.content).not.toContain('<script>')
    })
  })
})
```

---

## 🚀 **SuperClaude 명령어 가이드**

### **Phase 1: 입력 검증 시스템 구축**

#### **입력 검증 미들웨어 개발**
```bash
/sc:implement input-validation-middleware --persona security --c7 @docs/prd-security-input-validation-xss.md
/sc:design validation-architecture --persona security --seq @docs/prd-security-input-validation-xss.md
/sc:test input-validation --persona security --play @docs/prd-security-input-validation-xss.md
```

#### **XSS 방지 시스템**
```bash
/sc:implement xss-prevention --persona security --c7 @docs/prd-security-input-validation-xss.md
/sc:design content-sanitization --persona security --seq @docs/prd-security-input-validation-xss.md
/sc:analyze xss-vectors --focus security --persona security @docs/prd-security-input-validation-xss.md
```

### **Phase 2: React Quill 에디터 보안 강화**

#### **에디터 보안 설정**
```bash
/sc:implement secure-quill-editor --persona frontend --magic @docs/prd-security-input-validation-xss.md
/sc:design editor-security --persona frontend --seq @docs/prd-security-input-validation-xss.md
/sc:test editor-xss-prevention --persona qa --play @docs/prd-security-input-validation-xss.md
```

#### **콘텐츠 새니타이제이션**
```bash
/sc:implement content-sanitizer --persona backend --c7 @docs/prd-security-input-validation-xss.md
/sc:design sanitization-rules --persona security --seq @docs/prd-security-input-validation-xss.md
/sc:test sanitization-effectiveness --persona security --play @docs/prd-security-input-validation-xss.md
```

### **Phase 3: API 보안 강화**

#### **API 입력 검증**
```bash
/sc:implement api-input-validation --persona backend --c7 @docs/prd-security-input-validation-xss.md
/sc:design api-security-layer --persona backend --seq @docs/prd-security-input-validation-xss.md
/sc:analyze api-attack-vectors --focus security --persona security @docs/prd-security-input-validation-xss.md
```

#### **Rate Limiting 및 크기 제한**
```bash
/sc:implement advanced-rate-limiting --persona devops --c7 @docs/prd-security-input-validation-xss.md
/sc:design request-filtering --persona devops --seq @docs/prd-security-input-validation-xss.md
/sc:test rate-limiting-effectiveness --persona qa --play @docs/prd-security-input-validation-xss.md
```

### **Phase 4: 위협 탐지 및 모니터링**

#### **실시간 위협 탐지**
```bash
/sc:implement threat-detection --persona security --seq @docs/prd-security-input-validation-xss.md
/sc:design ml-based-detection --persona security --c7 @docs/prd-security-input-validation-xss.md
/sc:test threat-detection-accuracy --persona security --play @docs/prd-security-input-validation-xss.md
```

#### **보안 모니터링 대시보드**
```bash
/sc:implement security-monitoring --persona devops --magic @docs/prd-security-input-validation-xss.md
/sc:design security-dashboard --persona devops --seq @docs/prd-security-input-validation-xss.md
/sc:analyze monitoring-effectiveness --focus security --persona security @docs/prd-security-input-validation-xss.md
```

### **Phase 5: 통합 테스트 및 검증**

#### **XSS 공격 시뮬레이션**
```bash
/sc:test xss-attack-simulation --persona security --play @docs/prd-security-input-validation-xss.md
/sc:test penetration-testing --persona security --play @docs/prd-security-input-validation-xss.md
/sc:analyze security-test-results --focus security --depth deep --persona security @docs/prd-security-input-validation-xss.md
```

#### **성능 영향 분석**
```bash
/sc:analyze validation-performance-impact --focus performance --persona performance @docs/prd-security-input-validation-xss.md
/sc:test load-with-validation --persona qa --play @docs/prd-security-input-validation-xss.md
/sc:improve validation-optimization --type performance --persona performance @docs/prd-security-input-validation-xss.md
```

### **전체 프로젝트 오케스트레이션**

#### **입력 보안 아키텍처 설계**
```bash
/sc:workflow @docs/prd-security-input-validation-xss.md --strategy systematic --persona security --all-mcp --output detailed
/sc:design input-security-architecture --persona architect --seq @docs/prd-security-input-validation-xss.md
```

#### **보안 구현 검증**
```bash
/sc:analyze input-security-implementation --focus security --depth deep --persona security @docs/prd-security-input-validation-xss.md
/sc:test input-security-integration --persona qa --play @docs/prd-security-input-validation-xss.md
/sc:document input-security-procedures --persona scribe=en @docs/prd-security-input-validation-xss.md
```

---

## 📊 **성공 측정 지표**

### **정량적 지표**
- XSS 공격 차단율: 100%
- 입력 검증 성공률: >99.9%
- API 보안 스캔 통과율: 100%
- 성능 영향: <5%

### **정성적 지표**
- 보안 감사 통과: 완료
- 침투 테스트 통과: 완료
- 사용자 경험 만족도: >90%

---

**문서 승인 상태**: ⏳ 검토 중  
**구현 우선순위**: HIGH  
**예상 완료일**: 2025-02-21
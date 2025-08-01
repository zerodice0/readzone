# PRD: 임시저장 시스템 개선

**문서 버전**: v1.0  
**작성일**: 2025-01-31  
**작성자**: 개발팀  
**승인자**: 프로덕트 오너  

---

## 📋 **프로젝트 개요**

### **목표**
ReadZone의 현재 localStorage 기반 임시저장 시스템을 서버 중심의 견고하고 확장 가능한 시스템으로 전환하여 데이터 유실 위험을 제거하고 사용자 경험을 향상시킨다.

### **배경**
현재 시스템은 localStorage에 의존하여 다음과 같은 문제점을 가지고 있다:
- 카카오 API 도서 데이터 저장 시 용량 제한으로 인한 데이터 유실 위험
- 브라우저별 저장 한계 및 사용자 실수로 인한 데이터 손실
- 임시저장된 데이터의 복원 시 사용자 선택권 부재
- 동시 편집 환경에서 도서 중복 등록 문제

### **성공 지표**
- 데이터 유실률: 0%
- Draft 복원 성공률: >95%
- localStorage 의존도: 100% → 20% (오프라인 백업만)
- 사용자 만족도: >85%

---

## 🎯 **핵심 요구사항**

### **FR-1: 서버 기반 임시저장**
- **우선순위**: Critical
- **설명**: 모든 임시저장 데이터를 서버 데이터베이스에 저장
- **상세 요구사항**:
  - 독후감 내용, 도서 정보, 메타데이터 포함
  - 카카오 API 원본 데이터 보존
  - 자동저장 간격: 30초 또는 내용 변경 시
  - 오프라인 대비 localStorage 백업 유지

### **FR-2: Draft 복원 인터페이스**
- **우선순위**: High
- **설명**: 사용자가 독후감 작성 페이지 진입 시 기존 Draft 복원 선택 제공
- **상세 요구사항**:
  - "작성하던 독후감이 있습니다" 알림 표시
  - Draft 목록: 도서명, 저장 시간, 미리보기 포함
  - 선택지: 이어서 작성, 삭제, 새 독후감 작성
  - 최대 표시 개수: 5개 (최신순)

### **FR-3: 자동 데이터 정리**
- **우선순위**: Medium
- **설명**: 임시저장 데이터의 자동 만료 및 정리 시스템
- **상세 요구사항**:
  - 기본 보관 기간: 7일
  - 만료 24시간 전 사용자 알림
  - 일일 배치 작업으로 만료 데이터 삭제
  - 사용자당 최대 5개 Draft 유지

### **FR-4: 자동 도서 동기화**
- **우선순위**: High
- **설명**: Draft 복원 시 도서 정보 자동 동기화 및 중복 방지
- **상세 요구사항**:
  - 임시 도서가 커뮤니티에 등록되었는지 자동 확인
  - 기존 도서 발견 시 자동으로 연결 (사용자 알림 없음)
  - 중복 도서 생성 방지
  - 사용자는 도서 상태 변경을 인지할 필요 없음

### **FR-5: 성능 최적화**
- **우선순위**: Medium
- **설명**: 효율적인 데이터 처리 및 응답 시간 최적화
- **상세 요구사항**:
  - Draft 저장 응답 시간: <500ms
  - Draft 목록 로딩: <1초
  - 페이지네이션으로 대용량 데이터 처리
  - 메모리 사용량 최적화

---

## 🗄️ **데이터베이스 설계**

### **ReviewDraft 테이블 확장**
```sql
model ReviewDraft {
  id           String   @id @default(cuid())
  userId       String
  bookId       String?
  title        String?
  content      String
  metadata     String   @default("{}")
  
  -- 새로운 필드
  bookData     String?  // 카카오 원본 도서 데이터 (JSON)
  status       String   @default("draft") // draft, abandoned, completed
  expiresAt    DateTime // 자동 삭제 시점
  lastAccessed DateTime @default(now())
  
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  book Book? @relation(fields: [bookId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
  @@index([status])
  @@index([lastAccessed])
}
```

---

## 🔗 **API 설계**

### **기존 API 확장**

#### **POST /api/reviews/draft**
- **기능**: Draft 생성/업데이트
- **변경사항**: 
  - `bookData` 필드 추가 (카카오 원본 데이터)
  - `expiresAt` 자동 설정
  - 중복 Draft 처리 개선

#### **GET /api/reviews/draft**
- **기능**: 사용자 Draft 목록 조회
- **응답**: 
```json
{
  "success": true,
  "data": [
    {
      "id": "draft_id",
      "bookTitle": "도서명",
      "bookThumbnail": "thumbnail_url",
      "updatedAt": "2025-01-31T12:00:00Z",
      "previewContent": "독후감 미리보기...",
      "expiresAt": "2025-02-07T12:00:00Z"
    }
  ]
}
```

### **새로운 API**

#### **GET /api/reviews/draft/:id**
- **기능**: 특정 Draft 상세 조회 및 자동 도서 동기화
- **응답**:
```json
{
  "success": true,
  "data": {
    "draft": {
      "id": "draft_id",
      "content": "독후감 내용",
      "bookId": "synchronized_book_id",
      "bookData": null
    }
  }
}
```

#### **DELETE /api/reviews/draft/:id**
- **기능**: Draft 삭제

#### **POST /api/cron/cleanup-drafts**
- **기능**: 만료된 Draft 정리 (Cron Job)

---

## 🎨 **사용자 인터페이스 설계**

### **Draft 복원 프롬프트**
```
┌─────────────────────────────────────────┐
│ 📝 작성하던 독후감이 있습니다           │
├─────────────────────────────────────────┤
│ • 해리포터와 철학자의 돌                │
│   2025-01-30 14:30 저장                 │
│   [이어서 작성] [삭제]                  │
│                                         │
│ • 데미안                                │
│   2025-01-29 09:15 저장                 │
│   [이어서 작성] [삭제]                  │
│                                         │
│ [새 독후감 작성]                        │
└─────────────────────────────────────────┘
```

### **도서 정보 자동 동기화**
임시 도서가 커뮤니티에 등록된 경우, 사용자에게 별도 알림 없이 자동으로 기존 도서와 연결됩니다. 사용자는 새 도서인지 기존 도서인지 구분할 필요가 없으며, 독후감 작성에만 집중할 수 있습니다.

---

## ⚡ **성능 요구사항**

### **응답 시간**
- Draft 저장: <500ms
- Draft 목록 조회: <1초
- Draft 복원: <2초
- 도서 동기화: <1초

### **용량 관리**
- 사용자당 최대 Draft: 5개
- Draft 최대 크기: 1MB
- 자동 정리 주기: 24시간

### **동시성**
- 동시 사용자: 1,000명
- Draft 저장 TPS: 100/초
- 데이터베이스 연결 풀: 20개

---

## 🔒 **보안 요구사항**

### **데이터 보호**
- Draft 데이터 암호화 (민감 정보 포함 시)
- 사용자별 접근 권한 확인
- CSRF 토큰 검증

### **API 보안**
- Rate Limiting: 사용자당 분당 60회 요청
- 입력 데이터 검증 및 Sanitization
- SQL Injection 방지

---

## 🧪 **테스트 계획**

### **단위 테스트**
- Draft CRUD 작업
- 도서 동기화 로직
- 데이터 유효성 검증
- 만료 처리 로직

### **통합 테스트**
- API 엔드포인트 테스트
- 데이터베이스 트랜잭션
- cron 작업 실행

### **사용자 테스트**
- Draft 복원 플로우
- 다중 Draft 관리
- 자동 도서 동기화 시나리오
- 성능 부하 테스트

---

## 📅 **구현 단계**

### **Phase 1: Core Infrastructure (Week 1-2)**
- **목표**: 서버 기반 저장 시스템 구축
- **작업**: 
  - 데이터베이스 스키마 마이그레이션
  - Draft API 확장 및 개선
  - 기본 서버 저장 로직 구현
- **산출물**: 
  - 마이그레이션 스크립트
  - 확장된 API 엔드포인트
  - 단위 테스트

### **Phase 2: User Experience (Week 3)**
- **목표**: 사용자 인터페이스 개선
- **작업**:
  - Draft 목록 UI 구현
  - 복원 선택 인터페이스
  - 자동 도서 동기화 로직
- **산출물**:
  - React 컴포넌트
  - 사용자 플로우 테스트
  - UI/UX 가이드

### **Phase 3: Automation & Polish (Week 4)**
- **목표**: 자동화 및 최적화
- **작업**:
  - 자동 정리 시스템
  - 성능 최적화
  - 모니터링 시스템
- **산출물**:
  - Cron 작업 스케줄러
  - 성능 메트릭 대시보드
  - 운영 가이드

---

## 🚀 **SuperClaude 명령어 가이드**

### **Phase 1: Core Infrastructure**

#### **데이터베이스 스키마 설계 및 마이그레이션**
```bash
/sc:analyze @docs/prd-improved-draft-system.md --focus architecture --depth deep
/sc:design database --schema ReviewDraft --c7 --seq @docs/prd-improved-draft-system.md
/sc:implement prisma-migration --persona backend @docs/prd-improved-draft-system.md
```

#### **API 엔드포인트 확장**
```bash
/sc:improve /api/reviews/draft --type performance --persona backend @docs/prd-improved-draft-system.md
/sc:implement api-endpoints --persona backend --c7 @docs/prd-improved-draft-system.md
/sc:test api-integration --persona qa @docs/prd-improved-draft-system.md
```

### **Phase 2: User Experience**

#### **Draft 복원 UI 구현**
```bash
/sc:design ui-components --persona frontend --magic @docs/prd-improved-draft-system.md
/sc:implement draft-restoration-ui --persona frontend --magic --c7 @docs/prd-improved-draft-system.md
/sc:improve components/draft --type accessibility --persona frontend @docs/prd-improved-draft-system.md
```

#### **자동 도서 동기화 로직**
```bash
/sc:analyze book-synchronization --focus architecture --seq @docs/prd-improved-draft-system.md
/sc:implement auto-sync-logic --persona backend --seq @docs/prd-improved-draft-system.md
/sc:test sync-scenarios --persona qa --play @docs/prd-improved-draft-system.md
```

### **Phase 3: Automation & Polish**

#### **자동 정리 시스템**
```bash
/sc:implement cron-cleanup --persona devops --c7 @docs/prd-improved-draft-system.md
/sc:design monitoring-dashboard --persona devops --seq @docs/prd-improved-draft-system.md
/sc:analyze performance-bottlenecks --focus performance --seq @docs/prd-improved-draft-system.md
```

#### **성능 최적화**
```bash
/sc:improve draft-system --type performance --persona performance @docs/prd-improved-draft-system.md
/sc:analyze database-queries --focus performance --seq @docs/prd-improved-draft-system.md
/sc:test load-testing --persona qa --play @docs/prd-improved-draft-system.md
```

### **전체 프로젝트 오케스트레이션**

#### **프로젝트 초기 분석**
```bash
/sc:workflow @docs/prd-improved-draft-system.md --strategy systematic --all-mcp --output detailed
/sc:estimate @docs/prd-improved-draft-system.md --persona architect --seq
```

#### **코드 품질 및 보안 검토**
```bash
/sc:analyze security-review --focus security --persona security @docs/prd-improved-draft-system.md
/sc:improve code-quality --type maintainability --persona refactorer @docs/prd-improved-draft-system.md
```

#### **문서화 및 배포**
```bash
/sc:document api-specifications --persona scribe=en @docs/prd-improved-draft-system.md
/sc:git create-release-branch --persona devops @docs/prd-improved-draft-system.md
```

---

## 📊 **위험 요소 및 완화 방안**

### **기술적 위험**
- **위험**: 대용량 Draft 데이터로 인한 DB 성능 저하
- **완화**: 페이지네이션, 인덱스 최적화, 압축 저장

### **사용자 경험 위험**
- **위험**: 복잡한 복원 인터페이스로 인한 사용자 혼란
- **완화**: 단순한 UI 설계, 자동 동기화로 사용자 개입 최소화

### **데이터 위험**
- **위험**: 마이그레이션 중 기존 Draft 데이터 손실
- **완화**: 백업 생성, 단계적 마이그레이션, 롤백 계획

---

## 📈 **성공 측정**

### **정량적 지표**
- Draft 저장 성공률: >99.9%
- 데이터 복원 성공률: >95%
- 평균 응답 시간: <500ms
- 시스템 가용성: >99.9%

### **정성적 지표**
- 사용자 만족도 설문: >85% 긍정
- 고객 지원 문의 감소: >50%
- 개발팀 유지보수 효율성 향상

---

## 📝 **승인 및 검토**

**기술 검토**: ✅ 완료 (2025-01-31)  
**보안 검토**: ⏳ 진행중  
**제품 승인**: ⏳ 대기중  
**최종 승인**: ⏳ 대기중  

---

**문서 버전 히스토리**
- v1.0 (2025-01-31): 초기 PRD 작성
# SafeHtmlRenderer 보안 구현 보고서

## 개요

ReadZone 프로젝트에서 사용자가 작성한 HTML 콘텐츠를 안전하게 렌더링하기 위해 `SafeHtmlRenderer` 컴포넌트를 구현했습니다. 이 컴포넌트는 DOMPurify를 기반으로 XSS(Cross-Site Scripting) 공격을 방지하고, 다양한 보안 설정을 제공합니다.

## 구현된 보안 기능

### 1. 다단계 보안 검증 시스템

#### XSS 패턴 감지
```typescript
const XSS_PATTERNS = [
  /javascript:/gi,
  /vbscript:/gi,
  /data:text\/html/gi,
  /data:application/gi,
  /<script[^>]*>/gi,
  /on\w+\s*=/gi,
  /expression\s*\(/gi,
  /behavior\s*:/gi,
  /binding\s*:/gi,
  /import\s*:/gi,
  /@import/gi
]
```

#### 위험한 URL 스키마 차단
```typescript
const DANGEROUS_SCHEMES = [
  'javascript:',
  'vbscript:',
  'data:text/html',
  'data:application',
  'file:',
  'about:'
]
```

### 2. DOMPurify 기반 HTML 정화

#### 허용된 태그 화이트리스트
- 텍스트 구조: `h1-h6`, `p`, `br`, `div`, `span`
- 텍스트 서식: `strong`, `b`, `em`, `i`, `u`, `s`, `del`, `mark`
- 리스트: `ul`, `ol`, `li`
- 인용/코드: `blockquote`, `code`, `pre`
- 미디어: `a`, `img` (조건부)
- 구분선: `hr`

#### 안전한 속성 제한
```typescript
const SAFE_ATTRIBUTES = {
  'a': ['href', 'title', 'rel'],
  'img': ['src', 'alt', 'title', 'width', 'height'],
  'blockquote': ['cite']
}
```

### 3. 보안 모드별 설정

#### Strict Mode (strictMode: true)
- 모든 스타일 속성 차단
- 클래스, ID 속성 제거
- 외부 리소스 URL 엄격 검증
- 보안 경고 발생 시 렌더링 중단

#### Standard Mode (strictMode: false)
- 제한적 스타일 속성 허용
- 보안 경고 발생 시에도 렌더링 계속
- 더 관대한 URL 패턴

### 4. 추가 보안 기능

#### 콘텐츠 검증
- 과도한 태그 중첩 감지 (50개 이상)
- 과도한 이미지 수 감지 (10개 이상)
- 콘텐츠 길이 제한 검증

#### 보안 정보 표시
- 실시간 보안 경고 표시
- 보안 설정 상태 표시
- 감지된 위협 패턴 상세 정보

## 적용 현황

### 1. 독후감 상세보기 페이지
```typescript
<SafeHtmlRenderer 
  content={review.content}
  className="prose prose-gray dark:prose-invert max-w-none"
  showCopyButton={true}
  strictMode={true}
  showSecurityInfo={false}
  allowImages={true}
  allowLinks={true}
  allowStyles={false}
  lazyRender={false}
  fallbackContent="독후감 내용을 안전하게 표시할 수 없습니다."
  onSecurityWarning={(warnings) => {
    console.warn('독후감 보안 경고:', warnings)
  }}
/>
```

### 2. 피드 카드 컴포넌트
```typescript
<SafeHtmlRenderer 
  content={review.content}
  className="prose prose-sm max-w-none"
  strictMode={true}
  showCopyButton={false}
  showSecurityInfo={false}
  allowImages={true}
  allowLinks={true}
  allowStyles={false}
  lazyRender={false}
  fallbackContent="콘텐츠를 안전하게 표시할 수 없습니다."
/>
```

## 테스트 시나리오

### XSS 공격 시나리오 테스트
1. **Script 태그 삽입**: `<script>alert("XSS")</script>` → 완전 제거
2. **JavaScript URL**: `<a href="javascript:alert('XSS')">` → href 속성 제거
3. **이벤트 핸들러**: `<img onload="alert('XSS')">` → onload 속성 제거
4. **Data URL HTML**: `<iframe src="data:text/html,<script>">` → iframe 태그 제거
5. **Style 표현식**: `<div style="expression(alert('XSS'))">` → style 속성 제거

### 정상 콘텐츠 테스트
1. **React Quill 출력**: 모든 서식 유지
2. **이미지 포함**: 안전한 이미지 정상 표시
3. **링크 포함**: 안전한 링크 정상 작동
4. **빈 콘텐츠**: 적절한 빈 상태 메시지

## 보안 강화 사항

### 1. URL 검증 강화
```typescript
// Strict mode에서 외부 리소스 엄격 검증
ALLOWED_URI_REGEXP: /^(?:https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&=]*))?$/
```

### 2. 금지 태그 확대
```typescript
FORBID_TAGS: ['script', 'object', 'embed', 'base', 'link', 'meta', 'style', 'form', 'input', 'textarea', 'button']
```

### 3. 이벤트 속성 완전 차단
```typescript
FORBID_ATTR: [
  'onload', 'onerror', 'onclick', 'onmouseover', 'onmouseout', 
  'onfocus', 'onblur', 'onchange', 'onsubmit', 'onreset'
]
```

## 개발 도구

### SafeHtmlRenderer 테스트 페이지
- 경로: `/test/safe-html` (개발 환경 전용)
- 실시간 보안 테스트 가능
- 다양한 XSS 공격 시나리오 검증
- 보안 설정별 결과 비교

### 테스트 유틸리티
```typescript
// 브라우저 개발자 도구에서 사용
window.testSafeHtmlRenderer.runSecurityTests()
window.testSafeHtmlRenderer.testContent(content, strictMode)
```

## 성능 최적화

### 1. 지연 렌더링
- `lazyRender` 옵션으로 뷰포트 진입 시 렌더링
- Intersection Observer API 활용

### 2. 메모화
- useMemo로 정화된 HTML 캐싱
- 의존성 배열 최적화로 불필요한 재계산 방지

### 3. 에러 복구
- 렌더링 실패 시 적절한 폴백 콘텐츠 제공
- 에러 상황에서도 UX 유지

## 보안 가이드라인

### 사용 권장사항
1. **항상 strictMode 활성화**: 프로덕션에서는 `strictMode: true` 사용
2. **보안 경고 모니터링**: `onSecurityWarning` 콜백으로 위협 추적
3. **최소 권한 원칙**: 필요한 기능만 활성화 (images, links, styles)
4. **정기적 업데이트**: DOMPurify 라이브러리 최신 버전 유지

### 주의사항
1. **사용자 입력 신뢰 금지**: 모든 HTML 콘텐츠를 잠재적 위험으로 간주
2. **화이트리스트 방식**: 허용 목록 기반으로만 태그/속성 허용
3. **다층 방어**: 클라이언트와 서버 양쪽에서 검증

## 결론

SafeHtmlRenderer는 DOMPurify를 기반으로 한 강력한 XSS 방지 시스템을 제공하며, 다양한 보안 설정과 실시간 위협 감지 기능을 통해 사용자 생성 HTML 콘텐츠를 안전하게 렌더링합니다. 

개발 환경에서는 전용 테스트 페이지를 통해 보안 검증을 수행할 수 있으며, 프로덕션에서는 strict mode로 최고 수준의 보안을 보장합니다.

---

**구현 완료일**: 2025년 1월 24일  
**테스트 상태**: ✅ XSS 공격 시나리오 검증 완료  
**배포 상태**: ✅ 독후감 상세보기 및 피드 카드에 적용 완료
/**
 * SafeHtmlRenderer 보안 테스트 케이스
 * 실제 테스트 러너 없이 수동으로 실행할 수 있는 테스트 케이스들
 */

import { SafeHtmlRenderer } from './safe-html-renderer'

// XSS 공격 시나리오 테스트 케이스
export const XSS_TEST_CASES = [
  {
    name: 'Script 태그 삽입 공격',
    input: '<p>안전한 내용</p><script>alert("XSS")</script><p>더 많은 내용</p>',
    expectedBehavior: 'script 태그가 완전히 제거되어야 함',
    strictMode: true
  },
  {
    name: 'JavaScript URL 공격',
    input: '<a href="javascript:alert(\'XSS\')">클릭하세요</a>',
    expectedBehavior: 'href 속성이 제거되거나 안전한 URL로 변경되어야 함',
    strictMode: true
  },
  {
    name: '이벤트 핸들러 공격',
    input: '<img src="valid.jpg" onload="alert(\'XSS\')" alt="이미지">',
    expectedBehavior: 'onload 속성이 완전히 제거되어야 함',
    strictMode: true
  },
  {
    name: 'Data URL HTML 공격',
    input: '<iframe src="data:text/html,<script>alert(\'XSS\')</script>"></iframe>',
    expectedBehavior: 'iframe 태그 자체가 제거되어야 함',
    strictMode: true
  },
  {
    name: 'VBScript 공격',
    input: '<a href="vbscript:MsgBox(\'XSS\')">VBScript Link</a>',
    expectedBehavior: 'href 속성이 제거되거나 차단되어야 함',
    strictMode: true
  },
  {
    name: '중첩된 Script 공격',
    input: '<div><p><script>alert("XSS")</script></p></div>',
    expectedBehavior: 'script 태그만 제거되고 다른 태그는 유지되어야 함',
    strictMode: true
  },
  {
    name: 'Style 표현식 공격',
    input: '<div style="background: expression(alert(\'XSS\'))">내용</div>',
    expectedBehavior: 'expression이 포함된 style 속성이 제거되어야 함',
    strictMode: true
  },
  {
    name: '정상적인 콘텐츠',
    input: '<h1>제목</h1><p>안전한 <strong>내용</strong>입니다.</p><ul><li>목록 항목</li></ul>',
    expectedBehavior: '모든 내용이 정상적으로 렌더링되어야 함',
    strictMode: false
  }
]

// 성능 테스트 케이스
export const PERFORMANCE_TEST_CASES = [
  {
    name: '대용량 콘텐츠',
    input: '<p>' + 'A'.repeat(10000) + '</p>',
    expectedBehavior: '대용량 콘텐츠도 빠르게 처리되어야 함'
  },
  {
    name: '많은 태그 중첩',
    input: '<div>'.repeat(100) + '내용' + '</div>'.repeat(100),
    expectedBehavior: '과도한 중첩에 대한 경고가 표시되어야 함'
  }
]

// 일반적인 사용 케이스
export const NORMAL_USE_CASES = [
  {
    name: 'React Quill 기본 출력',
    input: '<h1>독후감 제목</h1><p>이 책은 <strong>정말 좋은</strong> 책입니다.</p><ul><li>포인트 1</li><li>포인트 2</li></ul>',
    expectedBehavior: '모든 서식이 정상적으로 유지되어야 함'
  },
  {
    name: '이미지가 포함된 콘텐츠',
    input: '<p>책 표지:</p><img src="https://example.com/book-cover.jpg" alt="책 표지" /><p>위 이미지는 책 표지입니다.</p>',
    expectedBehavior: '이미지가 정상적으로 표시되어야 함'
  },
  {
    name: '링크가 포함된 콘텐츠',
    input: '<p>자세한 정보는 <a href="https://example.com" target="_blank">여기</a>를 참조하세요.</p>',
    expectedBehavior: '링크가 안전하게 렌더링되어야 함'
  },
  {
    name: '빈 콘텐츠',
    input: '',
    expectedBehavior: '적절한 빈 상태 메시지가 표시되어야 함'
  },
  {
    name: 'React Quill 빈 태그',
    input: '<p><br></p>',
    expectedBehavior: '빈 상태로 처리되어야 함'
  }
]

/**
 * 수동 테스트 실행 함수
 * 브라우저 개발자 도구에서 실행할 수 있습니다.
 */
export function runSecurityTests() {
  console.group('🔒 SafeHtmlRenderer 보안 테스트 시작')
  
  XSS_TEST_CASES.forEach((testCase, index) => {
    console.group(`테스트 ${index + 1}: ${testCase.name}`)
    console.log('입력:', testCase.input)
    console.log('예상 동작:', testCase.expectedBehavior)
    console.log('Strict 모드:', testCase.strictMode)
    console.groupEnd()
  })
  
  console.groupEnd()
  console.log('✅ 모든 테스트 케이스를 확인하세요. 각 케이스에 대해 SafeHtmlRenderer 컴포넌트를 렌더링하여 보안 동작을 검증하세요.')
}

/**
 * 특정 콘텐츠에 대한 보안 검사 실행
 */
export function testContent(content: string, strictMode: boolean = true) {
  console.group(`🔍 콘텐츠 보안 검사 (Strict: ${strictMode})`)
  console.log('입력 콘텐츠:', content)
  
  // XSS 패턴 감지 (SafeHtmlRenderer 내부 로직과 동일)
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
  
  const warnings: string[] = []
  
  XSS_PATTERNS.forEach((pattern, index) => {
    if (pattern.test(content)) {
      warnings.push(`의심스러운 스크립트 패턴이 감지되었습니다 (패턴 ${index + 1})`)
    }
  })
  
  const DANGEROUS_SCHEMES = [
    'javascript:',
    'vbscript:',
    'data:text/html',
    'data:application',
    'file:',
    'about:'
  ]
  
  DANGEROUS_SCHEMES.forEach(scheme => {
    if (content.toLowerCase().includes(scheme)) {
      warnings.push(`위험한 URL 스키마가 감지되었습니다: ${scheme}`)
    }
  })
  
  if (warnings.length > 0) {
    console.warn('⚠️ 보안 경고:', warnings)
    if (strictMode) {
      console.error('❌ Strict 모드에서는 이 콘텐츠가 차단됩니다.')
    } else {
      console.warn('⚠️ 경고가 있지만 렌더링은 시도됩니다.')
    }
  } else {
    console.log('✅ 보안 검사 통과')
  }
  
  console.groupEnd()
  return warnings
}

// 개발 환경에서만 전역 함수로 노출
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).testSafeHtmlRenderer = {
    runSecurityTests,
    testContent,
    XSS_TEST_CASES,
    NORMAL_USE_CASES,
    PERFORMANCE_TEST_CASES
  }
  
  console.log('🧪 SafeHtmlRenderer 테스트 도구가 준비되었습니다.')
  console.log('사용법: window.testSafeHtmlRenderer.runSecurityTests()')
}
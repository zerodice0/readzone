import { useAuthStore } from '@/store/authStore'

/**
 * 앱 초기화 시 인증 관련 설정
 */
export function initializeAuth() {
  // API 인터셉터 설정
  setupApiInterceptors()
  
  // 페이지 로드 시 토큰 검증
  const authStore = useAuthStore.getState()

  if (authStore.accessToken) {
    authStore.verifyToken()
  }
}

/**
 * API 인터셉터 설정
 */
function setupApiInterceptors() {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001'
  
  // fetch 인터셉터
  const originalFetch = window.fetch
  
  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : (input as Request).url
    
    // ReadZone API 호출인지 확인
    if (url.startsWith(API_BASE_URL)) {
      const authStore = useAuthStore.getState()
      
      // Authorization 헤더 자동 추가
      if (authStore.accessToken) {
        const headers = new Headers(init.headers)

        if (!headers.has('Authorization')) {
          headers.set('Authorization', `Bearer ${authStore.accessToken}`)
        }
        init.headers = headers
      }
      
      // Content-Type 자동 추가 (body가 있는 경우)
      if (init.body && typeof init.body === 'string') {
        const headers = new Headers(init.headers)

        if (!headers.has('Content-Type')) {
          headers.set('Content-Type', 'application/json')
        }
        init.headers = headers
      }
    }
    
    const response = await originalFetch(input, init)
    
    // 401 에러 시 자동 토큰 갱신 시도
    if (response.status === 401 && url.startsWith(API_BASE_URL)) {
      const authStore = useAuthStore.getState()
      
      // refresh 엔드포인트가 아닌 경우에만 토큰 갱신 시도
      if (!url.includes('/auth/refresh') && authStore.refreshToken) {
        const refreshed = await authStore.refreshTokens()
        
        if (refreshed) {
          // 갱신된 토큰으로 재시도
          const headers = new Headers(init.headers)

          headers.set('Authorization', `Bearer ${authStore.accessToken}`)
          init.headers = headers

          return originalFetch(input, init)
        }
      }
    }
    
    return response
  }
}

/**
 * 브라우저 탭 간 토큰 동기화
 */
export function setupTokenSynchronization() {
  // storage 이벤트 리스너로 다른 탭에서의 로그인/로그아웃 감지
  window.addEventListener('storage', (event) => {
    if (event.key === 'accessToken') {
      const authStore = useAuthStore.getState()
      
      if (event.newValue === null) {
        // 다른 탭에서 로그아웃
        authStore.logout()
      } else if (event.newValue !== authStore.accessToken) {
        // 다른 탭에서 로그인 또는 토큰 갱신
        authStore.verifyToken()
      }
    }
  })
}

/**
 * 페이지 새로고침 시 작성 중인 내용 보호
 */
export function setupUnloadProtection() {
  window.addEventListener('beforeunload', (event) => {
    // 작성 중인 폼이 있는지 확인하는 로직은 각 페이지에서 구현
    const hasUnsavedChanges = window.__unsavedChanges ?? false
    
    if (hasUnsavedChanges) {
      event.preventDefault()
      event.returnValue = '작성 중인 내용이 있습니다. 정말 페이지를 떠나시겠습니까?'

      return event.returnValue
    }
  })
}

/**
 * 보안 헤더 설정
 */
export function setupSecurityHeaders() {
  // CSP 설정 (실제로는 서버에서 설정하는 것이 좋음)
  const meta = document.createElement('meta')

  meta.httpEquiv = 'Content-Security-Policy'
  meta.content = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    connect-src 'self' ${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001'};
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
  `.replace(/\s+/g, ' ').trim()
  
  document.head.appendChild(meta)
}

/**
 * 접근성 개선
 */
export function setupAccessibility() {
  // 키보드 네비게이션 개선
  document.addEventListener('keydown', (event) => {
    // Escape 키로 모달/드롭다운 닫기
    if (event.key === 'Escape') {
      const activeElement = document.activeElement as HTMLElement

      if (activeElement?.blur) {
        activeElement.blur()
      }
    }
    
    // Enter 키로 버튼 클릭
    if (event.key === 'Enter' && event.target instanceof HTMLElement) {
      const target = event.target

      if (target.role === 'button' && !(target as HTMLButtonElement).disabled) {
        target.click()
      }
    }
  })
  
  // 포커스 트랩 헬퍼
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Tab') {
      const modal = document.querySelector('[role="dialog"]')

      if (modal) {
        const focusableElements = modal.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        
        if (focusableElements.length > 0) {
          const firstElement = focusableElements[0] as HTMLElement
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement
          
          if (event.shiftKey && document.activeElement === firstElement) {
            event.preventDefault()
            lastElement.focus()
          } else if (!event.shiftKey && document.activeElement === lastElement) {
            event.preventDefault()
            firstElement.focus()
          }
        }
      }
    }
  })
}

/**
 * 에러 추적 및 리포팅
 */
export function setupErrorTracking() {
  // 전역 에러 핸들러
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error)
    
    // 프로덕션 환경에서는 에러 리포팅 서비스로 전송
    if (import.meta.env.PROD) {
      // Sentry, LogRocket 등으로 에러 전송
    }
  })
  
  // Promise rejection 핸들러
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason)
    
    if (import.meta.env.PROD) {
      // 에러 리포팅 서비스로 전송
    }
  })
}

/**
 * 모든 초기화 함수 실행
 */
export function initializeApp() {
  initializeAuth()
  setupTokenSynchronization()
  setupUnloadProtection()
  setupAccessibility()
  setupErrorTracking()
  
  if (import.meta.env.PROD) {
    setupSecurityHeaders()
  }
}
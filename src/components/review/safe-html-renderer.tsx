'use client'

import { useMemo, useCallback, useState } from 'react'
import DOMPurify, { type Config } from 'isomorphic-dompurify'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Copy, Check, Shield, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export interface SafeHtmlRendererProps {
  content: string
  className?: string
  // 보안 설정
  strictMode?: boolean
  allowImages?: boolean
  allowLinks?: boolean
  allowStyles?: boolean
  // UI 옵션
  showCopyButton?: boolean
  showSecurityInfo?: boolean
  maxLength?: number
  // 오류 처리
  fallbackContent?: string
  onError?: (error: Error) => void
  onSecurityWarning?: (warnings: string[]) => void
  // 성능 최적화
  lazyRender?: boolean
}

// 독후감 콘텐츠에 최적화된 안전한 태그 화이트리스트
const SAFE_TAGS = [
  // 텍스트 구조
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'br', 'div', 'span',
  // 텍스트 서식
  'strong', 'b', 'em', 'i', 'u', 's', 'del', 'mark',
  // 리스트
  'ul', 'ol', 'li',
  // 인용 및 코드
  'blockquote', 'code', 'pre',
  // 미디어 (조건부)
  'a', 'img',
  // 구분선
  'hr'
]

// 안전한 속성 화이트리스트 (보안 강화)
const SAFE_ATTRIBUTES: string[] = [
  'a',
  'img',
  'blockquote',
  'p',
  'div',
  'span',
  'h1',
  'strong',
];

// XSS 공격 패턴 감지 정규식
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

// 위험한 URL 스키마
const DANGEROUS_SCHEMES = [
  'javascript:',
  'vbscript:',
  'data:text/html',
  'data:application',
  'file:',
  'about:'
]

export function SafeHtmlRenderer({
  content,
  className = '',
  strictMode = true,
  allowImages = true,
  allowLinks = true,
  allowStyles = false,
  showCopyButton = false,
  showSecurityInfo = false,
  maxLength,
  fallbackContent = '콘텐츠를 안전하게 표시할 수 없습니다.',
  onError,
  onSecurityWarning,
  lazyRender = false
}: SafeHtmlRendererProps) {
  const [isVisible, setIsVisible] = useState(!lazyRender)
  const [isCopied, setIsCopied] = useState(false)
  const [renderError, setRenderError] = useState<string | null>(null)
  const [securityWarnings, setSecurityWarnings] = useState<string[]>([])
  const [showSecurityDetails, setShowSecurityDetails] = useState(false)

  // Intersection Observer for lazy rendering
  const observerRef = useCallback((node: HTMLDivElement | null) => {
    if (!lazyRender || isVisible) return
    
    if (node) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            observer.disconnect()
          }
        },
        { threshold: 0.1 }
      )
      observer.observe(node)
      return () => observer.disconnect()
    }

    return;
  }, [lazyRender, isVisible])

  // 보안 검사 및 경고 생성
  const performSecurityCheck = useCallback((html: string): string[] => {
    const warnings: string[] = []
    
    // XSS 패턴 검사
    XSS_PATTERNS.forEach((pattern, index) => {
      if (pattern.test(html)) {
        warnings.push(`의심스러운 스크립트 패턴이 감지되었습니다 (패턴 ${index + 1})`)
      }
    })
    
    // 위험한 URL 스키마 검사
    DANGEROUS_SCHEMES.forEach(scheme => {
      if (html.toLowerCase().includes(scheme)) {
        warnings.push(`위험한 URL 스키마가 감지되었습니다: ${scheme}`)
      }
    })
    
    // 과도한 중첩 태그 검사
    const tagDepth = (html.match(/<[^\/][^>]*>/g) || []).length
    if (tagDepth > 50) {
      warnings.push('과도한 HTML 태그 중첩이 감지되었습니다')
    }
    
    // 큰 이미지 URL 검사
    const imgMatches = html.match(/<img[^>]+src=["|']([^"|']+)["|'][^>]*>/gi)
    if (imgMatches && imgMatches.length > 10) {
      warnings.push('과도한 이미지 수가 감지되었습니다')
    }
    
    return warnings
  }, [])

  // HTML 정화 및 보안 처리
  const sanitizedHTML = useMemo(() => {
    if (!content || !isVisible) return ''

    try {
      setRenderError(null)
      
      // 콘텐츠 길이 검증
      if (maxLength && content.length > maxLength) {
        console.warn(`Content exceeds maximum length: ${content.length} > ${maxLength}`)
      }
      
      // 보안 검사 수행
      const warnings = performSecurityCheck(content)
      setSecurityWarnings(warnings)
      
      // 보안 경고 콜백 호출
      if (warnings.length > 0) {
        onSecurityWarning?.(warnings)
      }
      
      // strict mode에서 경고가 있으면 처리 중단
      if (strictMode && warnings.length > 0) {
        throw new Error('보안 위험이 감지되어 콘텐츠를 표시할 수 없습니다.')
      }
      
      // 허용된 태그 구성
      let allowedTags = [...SAFE_TAGS]
      if (!allowImages) {
        allowedTags = allowedTags.filter(tag => tag !== 'img')
      }
      if (!allowLinks) {
        allowedTags = allowedTags.filter(tag => tag !== 'a')
      }
      
      // DOMPurify 설정
      const purifyConfig: Config = {
        ALLOWED_TAGS: allowedTags,
        ALLOWED_ATTR: SAFE_ATTRIBUTES,
        ALLOW_DATA_ATTR: false,
        FORBID_TAGS: ['script', 'object', 'embed', 'base', 'link', 'meta', 'style', 'form', 'input', 'textarea', 'button'] as string[],
        FORBID_ATTR: [
          'onload', 'onerror', 'onclick', 'onmouseover', 'onmouseout', 
          'onfocus', 'onblur', 'onchange', 'onsubmit', 'onreset',
          'style' // strictMode에서는 style 속성도 차단
        ] as string[],
        // URL 검증 강화
        ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
        // HTML5 파싱 사용
        USE_PROFILES: { html: true },
        // 변환 후크
        RETURN_DOM: false,
        RETURN_DOM_FRAGMENT: false,
        // 안전성 강화
        SANITIZE_DOM: true,
        KEEP_CONTENT: false, // 알 수 없는 태그의 내용 제거
        IN_PLACE: false
      }
      
      // strict mode에서 추가 제한
      if (strictMode) {
        purifyConfig.FORBID_ATTR?.push('style', 'class', 'id')
        // 외부 리소스 차단
        purifyConfig.ALLOWED_URI_REGEXP = /^(?:https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&=]*))?$/
      }
      
      // HTML 정화 실행
      const sanitized = DOMPurify.sanitize(content, purifyConfig)
      
      // 빈 콘텐츠 검사
      if (!sanitized.trim() || sanitized === '<p><br></p>') {
        return ''
      }
      
      return sanitized
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
      console.error('HTML 렌더링 실패:', error)
      setRenderError(errorMessage)
      onError?.(error instanceof Error ? error : new Error(errorMessage))
      return `<div class="text-red-600 dark:text-red-400" role="alert">${fallbackContent}</div>`
    }
  }, [
    content, isVisible, maxLength, performSecurityCheck, onSecurityWarning, 
    strictMode, allowImages, allowLinks, fallbackContent, onError
  ])

  // 콘텐츠 복사 (텍스트만)
  const handleCopyContent = useCallback(async () => {
    try {
      const textContent = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
      await navigator.clipboard.writeText(textContent)
      setIsCopied(true)
      toast.success('콘텐츠가 복사되었습니다!')
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      toast.error('복사에 실패했습니다.')
    }
  }, [content])

  // 보안 정보 토글
  const toggleSecurityDetails = useCallback(() => {
    setShowSecurityDetails(prev => !prev)
  }, [])

  // 에러 상태 렌더링
  if (renderError) {
    return (
      <div className="my-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
          <div>
            <span className="text-red-800 dark:text-red-300 font-medium">
              보안 오류
            </span>
            <p className="text-red-700 dark:text-red-400 text-sm mt-1">
              {renderError}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // 빈 콘텐츠 상태
  if (!content || content.trim() === '' || content.trim() === '<p><br></p>') {
    return (
      <div 
        className="text-gray-500 dark:text-gray-400 italic text-center py-8"
        role="status"
        aria-label="콘텐츠가 비어있음"
      >
        내용이 없습니다.
      </div>
    )
  }

  // 지연 로딩 플레이스홀더
  if (lazyRender && !isVisible) {
    return (
      <div 
        ref={observerRef}
        className="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse flex items-center justify-center"
        role="status"
        aria-label="콘텐츠 로딩 중"
      >
        <span className="text-gray-500 dark:text-gray-400">안전한 콘텐츠 준비 중...</span>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* 보안 정보 및 액션 버튼 */}
      {(showCopyButton || showSecurityInfo || securityWarnings.length > 0) && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
          {/* 보안 경고 표시 */}
          {securityWarnings.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSecurityDetails}
              className="h-8 w-8 p-0 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/40 text-orange-600 dark:text-orange-400"
              title={`보안 경고 ${securityWarnings.length}개`}
              aria-label={`보안 경고 ${securityWarnings.length}개`}
            >
              <AlertTriangle className="h-4 w-4" />
            </Button>
          )}
          
          {/* 보안 정보 버튼 */}
          {showSecurityInfo && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSecurityDetails}
              className="h-8 w-8 p-0 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 text-green-600 dark:text-green-400"
              title="보안 정보"
              aria-label="보안 정보"
            >
              <Shield className="h-4 w-4" />
            </Button>
          )}
          
          {/* 복사 버튼 */}
          {showCopyButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyContent}
              className="h-8 w-8 p-0 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800"
              title="콘텐츠 복사"
              aria-label="콘텐츠 복사"
            >
              {isCopied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      )}

      {/* 보안 상세 정보 */}
      {showSecurityDetails && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <h3 className="font-medium text-blue-800 dark:text-blue-200">보안 정보</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSecurityDetails}
              className="ml-auto h-6 w-6 p-0"
            >
              <EyeOff className="h-3 w-3" />
            </Button>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-700 dark:text-blue-300">보안 모드:</span>
              <span className="font-medium">{strictMode ? '엄격 모드' : '표준 모드'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700 dark:text-blue-300">이미지 허용:</span>
              <span className="font-medium">{allowImages ? '예' : '아니오'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700 dark:text-blue-300">링크 허용:</span>
              <span className="font-medium">{allowLinks ? '예' : '아니오'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700 dark:text-blue-300">스타일 허용:</span>
              <span className="font-medium">{allowStyles ? '예' : '아니오'}</span>
            </div>
            
            {securityWarnings.length > 0 && (
              <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
                <div className="text-orange-700 dark:text-orange-300 font-medium mb-2">
                  보안 경고 ({securityWarnings.length}개):
                </div>
                <ul className="space-y-1 text-orange-600 dark:text-orange-400">
                  {securityWarnings.map((warning, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                      <span>{warning}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 메인 콘텐츠 */}
      <article 
        className={cn(
          'safe-html-content prose prose-gray dark:prose-invert max-w-none',
          // React Quill 에디터 스타일과 일관성 유지
          'prose-headings:text-gray-900 dark:prose-headings:text-gray-100',
          'prose-p:text-gray-900 dark:prose-p:text-gray-100 prose-p:leading-relaxed',
          'prose-strong:text-gray-900 dark:prose-strong:text-gray-100',
          'prose-em:text-gray-700 dark:prose-em:text-gray-300',
          'prose-ul:space-y-1 prose-ol:space-y-1',
          'prose-li:text-gray-900 dark:prose-li:text-gray-100',
          'prose-blockquote:border-l-blue-500 prose-blockquote:bg-gray-50 dark:prose-blockquote:bg-gray-800',
          'prose-blockquote:text-gray-700 dark:prose-blockquote:text-gray-300',
          'prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline',
          // 접근성 및 보안 강화
          'focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2',
          // 보안 경고가 있는 경우 시각적 표시
          securityWarnings.length > 0 && 'ring-1 ring-orange-200 dark:ring-orange-800',
          className
        )}
        role="main"
        aria-label="안전하게 처리된 HTML 콘텐츠"
        dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
      />
      
      {/* 추가 스타일링 */}
      <style jsx global>{`
        .safe-html-content h1 {
          @apply text-3xl font-bold mt-8 mb-4 text-gray-900 dark:text-gray-100;
        }
        .safe-html-content h2 {
          @apply text-2xl font-semibold mt-6 mb-3 text-gray-900 dark:text-gray-100;
        }
        .safe-html-content h3 {
          @apply text-xl font-medium mt-4 mb-2 text-gray-900 dark:text-gray-100;
        }
        .safe-html-content p {
          @apply mb-4 leading-relaxed text-gray-900 dark:text-gray-100;
        }
        .safe-html-content ul, .safe-html-content ol {
          @apply my-4 ml-6;
        }
        .safe-html-content blockquote {
          @apply border-l-4 border-blue-500 pl-4 my-4 italic text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 py-2 rounded-r;
        }
        .safe-html-content a {
          @apply text-blue-600 dark:text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded;
        }
        .safe-html-content img {
          @apply max-w-full h-auto rounded-lg shadow-sm;
        }
        .safe-html-content code {
          @apply bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm font-mono;
        }
        .safe-html-content pre {
          @apply bg-gray-100 dark:bg-gray-800 rounded-lg p-4 overflow-x-auto my-4;
        }
        /* React Quill에서 생성되는 빈 p 태그 처리 */
        .safe-html-content p:empty,
        .safe-html-content p:has(br:only-child) {
          @apply mb-2;
        }
      `}</style>
    </div>
  )
}

export default SafeHtmlRenderer
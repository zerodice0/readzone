'use client'

import { useMemo, useCallback, useState } from 'react'
import DOMPurify from 'isomorphic-dompurify'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'

export interface HtmlRendererProps {
  content: string
  className?: string
  // 보안 강화 옵션
  strictMode?: boolean
  // 사용자 경험 향상
  showCopyButton?: boolean
  maxLength?: number
  // 오류 처리
  fallbackContent?: string
  onError?: (error: Error) => void
  // 성능 최적화 옵션
  lazyRender?: boolean
}

// React Quill에서 생성되는 기본 HTML 태그들 허용
const ALLOWED_TAGS = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'br', 'strong', 'em', 'u', 's', 'del',
  'ul', 'ol', 'li',
  'blockquote', 'code', 'pre',
  'a', 'img',
  'hr', 'div', 'span'
]

// const ALLOWED_ATTRIBUTES = {
//   'a': ['href', 'title', 'target', 'rel'],
//   'img': ['src', 'alt', 'title', 'width', 'height', 'style'],
//   'blockquote': ['cite'],
//   'p': ['style'],
//   'div': ['style'],
//   'span': ['style'],
//   'h1': ['style'], 'h2': ['style'], 'h3': ['style'], 
//   'h4': ['style'], 'h5': ['style'], 'h6': ['style'],
//   'strong': ['style'], 'em': ['style'], 'u': ['style']
// }

export function HtmlRenderer({
  content,
  className = '',
  strictMode = false,
  showCopyButton = false,
  maxLength,
  fallbackContent = '콘텐츠를 표시할 수 없습니다.',
  onError,
  lazyRender = false
}: HtmlRendererProps) {
  const [isVisible, setIsVisible] = useState(!lazyRender)
  const [isCopied, setIsCopied] = useState(false)
  const [renderError, setRenderError] = useState<string | null>(null)
  
  // Lazy loading with Intersection Observer
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

  // Copy content to clipboard (텍스트만 복사)
  const handleCopyContent = useCallback(async () => {
    try {
      // HTML을 텍스트로 변환하여 복사
      const textContent = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
      await navigator.clipboard.writeText(textContent)
      setIsCopied(true)
      toast.success('콘텐츠가 복사되었습니다!')
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      toast.error('복사에 실패했습니다.')
    }
  }, [content])

  const sanitizedHTML = useMemo(() => {
    if (!content) return ''
    if (!isVisible && lazyRender) return ''

    try {
      setRenderError(null)
      
      // Content length validation
      if (maxLength && content.length > maxLength) {
        console.warn(`Content exceeds maximum length: ${content.length} > ${maxLength}`)
      }
      
      // Enhanced security in strict mode
      if (strictMode) {
        // Additional content validation for suspicious patterns
        const suspiciousPatterns = [
          /<script[^>]*>/gi,
          /javascript:/gi,
          /data:text\/html/gi,
          /vbscript:/gi,
          /on\w+\s*=/gi
        ]
        
        for (const pattern of suspiciousPatterns) {
          if (pattern.test(content)) {
            throw new Error('의심스러운 콘텐츠가 감지되었습니다.')
          }
        }
      }

      // DOMPurify 설정으로 XSS 공격 방지
      const purifyConfig = {
        ALLOWED_TAGS,
        ALLOW_DATA_ATTR: false,
        FORBID_SCRIPTS: true,
        FORBID_TAGS: ['script', 'object', 'embed', 'base', 'link', 'meta', 'style'],
        FORBID_ATTR: strictMode 
          ? ['style', 'onload', 'onerror', 'onclick', 'onmouseover', 'onmouseout', 'onfocus', 'onblur']
          : ['onload', 'onerror', 'onclick', 'onmouseover', 'onmouseout', 'onfocus', 'onblur'],
        // React Quill 스타일 속성 허용 (제한적)
        ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
      }

      return DOMPurify.sanitize(content, purifyConfig)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
      console.error('HTML 렌더링 실패:', error)
      setRenderError(errorMessage)
      onError?.(error instanceof Error ? error : new Error(errorMessage))
      return `<p class="text-red-600 dark:text-red-400" role="alert">${fallbackContent}</p>`
    }
  }, [content, strictMode, maxLength, isVisible, lazyRender, fallbackContent, onError])

  // Error state
  if (renderError) {
    return (
      <div className="my-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <span className="text-red-800 dark:text-red-300">
            {fallbackContent}: {renderError}
          </span>
        </div>
      </div>
    )
  }

  // Empty content state
  if (!content || content.trim() === '<p><br></p>' || content.trim() === '') {
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

  // Lazy loading placeholder
  if (lazyRender && !isVisible) {
    return (
      <div 
        ref={observerRef}
        className="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse flex items-center justify-center"
        role="status"
        aria-label="콘텐츠 로딩 중"
      >
        <span className="text-gray-500 dark:text-gray-400">로딩 중...</span>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Copy button */}
      {showCopyButton && (
        <div className="absolute top-2 right-2 z-10">
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
        </div>
      )}

      {/* Main content */}
      <article 
        className={cn(
          'html-content prose prose-gray dark:prose-invert max-w-none',
          // React Quill 에디터 스타일과 일관성 유지
          'prose-headings:text-gray-900 dark:prose-headings:text-gray-100',
          'prose-p:text-gray-900 dark:prose-p:text-gray-100 prose-p:leading-relaxed',
          'prose-strong:text-gray-900 dark:prose-strong:text-gray-100',
          'prose-em:text-gray-700 dark:prose-em:text-gray-300',
          'prose-ul:space-y-1 prose-ol:space-y-1',
          'prose-li:text-gray-900 dark:prose-li:text-gray-100',
          'prose-blockquote:border-l-blue-500 prose-blockquote:bg-gray-50 dark:prose-blockquote:bg-gray-800',
          'prose-blockquote:text-gray-700 dark:prose-blockquote:text-gray-300',
          'prose-blockquote:border-gray-300 dark:prose-blockquote:border-gray-600',
          'prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline',
          // 접근성 향상
          'focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2',
          className
        )}
        role="main"
        aria-label="HTML 콘텐츠"
        dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
      />
      
      {/* HTML 컨텐츠 특화 스타일 */}
      <style jsx global>{`
        .html-content h1 {
          @apply text-3xl font-bold mt-8 mb-4 text-gray-900 dark:text-gray-100;
        }
        .html-content h2 {
          @apply text-2xl font-semibold mt-6 mb-3 text-gray-900 dark:text-gray-100;
        }
        .html-content h3 {
          @apply text-xl font-medium mt-4 mb-2 text-gray-900 dark:text-gray-100;
        }
        .html-content h4 {
          @apply text-lg font-medium mt-3 mb-2 text-gray-900 dark:text-gray-100;
        }
        .html-content h5 {
          @apply text-base font-medium mt-2 mb-1 text-gray-900 dark:text-gray-100;
        }
        .html-content h6 {
          @apply text-sm font-medium mt-2 mb-1 text-gray-900 dark:text-gray-100;
        }
        .html-content p {
          @apply mb-4 leading-relaxed text-gray-900 dark:text-gray-100;
        }
        .html-content ul, .html-content ol {
          @apply my-4 ml-6;
        }
        .html-content li {
          @apply mb-1 text-gray-900 dark:text-gray-100;
        }
        .html-content blockquote {
          @apply border-l-4 border-blue-500 pl-4 my-4 italic text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 py-2 rounded-r;
        }
        .html-content a {
          @apply text-blue-600 dark:text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded;
        }
        .html-content strong {
          @apply font-semibold text-gray-900 dark:text-gray-100;
        }
        .html-content em {
          @apply italic text-gray-800 dark:text-gray-200;
        }
        .html-content u {
          @apply underline;
        }
        .html-content code {
          @apply bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm font-mono;
        }
        .html-content pre {
          @apply bg-gray-100 dark:bg-gray-800 rounded-lg p-4 overflow-x-auto my-4;
        }
        .html-content hr {
          @apply border-gray-300 dark:border-gray-600 my-8;
        }
        /* React Quill에서 생성되는 빈 p 태그 처리 */
        .html-content p:empty,
        .html-content p:has(br:only-child) {
          @apply mb-2;
        }
      `}</style>
    </div>
  )
}

// HTML 콘텐츠의 텍스트만 추출하는 유틸리티 함수
export function getHtmlTextContent(html: string): string {
  if (!html) return ''
  
  try {
    // HTML 태그 제거하고 텍스트만 추출
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim()
  } catch (error) {
    console.error('HTML 텍스트 추출 실패:', error)
    return ''
  }
}

// HTML 콘텐츠의 요약을 생성하는 유틸리티 함수
export function getHtmlSummary(html: string, maxLength: number = 200): string {
  const textContent = getHtmlTextContent(html)
  if (!textContent) return ''
  
  if (textContent.length <= maxLength) {
    return textContent
  }
  
  return textContent.substring(0, maxLength).trim() + '...'
}

// HTML 콘텐츠 유효성 검사
export function validateHtmlContent(html: string): { isValid: boolean, errors: string[] } {
  const errors: string[] = []
  
  // 기본 내용 검사
  const textContent = getHtmlTextContent(html)
  if (!textContent || textContent.trim().length === 0) {
    errors.push('콘텐츠가 비어있습니다.')
  }
  
  // 의심스러운 패턴 검사
  const suspiciousPatterns = [
    { pattern: /<script[^>]*>/gi, message: 'script 태그가 감지되었습니다.' },
    { pattern: /javascript:/gi, message: 'javascript: 스키마가 감지되었습니다.' },
    { pattern: /on\w+\s*=/gi, message: '이벤트 핸들러가 감지되었습니다.' }
  ]
  
  for (const { pattern, message } of suspiciousPatterns) {
    if (pattern.test(html)) {
      errors.push(message)
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// HTML 콘텐츠 통계 생성
export function getHtmlStats(html: string) {
  if (!html) return null
  
  const textContent = getHtmlTextContent(html)
  const words = textContent.split(/\s+/).filter(word => word.length > 0)
  const characters = textContent.length
  const charactersNoSpaces = textContent.replace(/\s/g, '').length
  
  // HTML 요소 개수
  const headings = (html.match(/<h[1-6][^>]*>/gi) || []).length
  const paragraphs = (html.match(/<p[^>]*>/gi) || []).length
  const links = (html.match(/<a[^>]*>/gi) || []).length
  const images = (html.match(/<img[^>]*>/gi) || []).length
  const lists = (html.match(/<[ou]l[^>]*>/gi) || []).length
  const listItems = (html.match(/<li[^>]*>/gi) || []).length
  const blockquotes = (html.match(/<blockquote[^>]*>/gi) || []).length
  
  // 예상 읽기 시간 (분당 200단어 기준)
  const readingTimeMinutes = Math.ceil(words.length / 200)
  
  return {
    words: words.length,
    characters,
    charactersNoSpaces,
    paragraphs,
    headings,
    links,
    images,
    lists,
    listItems,
    blockquotes,
    readingTimeMinutes
  }
}

export default HtmlRenderer
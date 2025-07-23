'use client'

import { useMemo, useCallback, useState, useEffect } from 'react'
import { marked } from 'marked'
import DOMPurify from 'isomorphic-dompurify'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'

export interface MarkdownRendererProps {
  content: string
  className?: string
  allowImages?: boolean
  allowLinks?: boolean
  allowTables?: boolean
  // 접근성 향상 옵션
  enableHeadingNavigation?: boolean
  // 보안 강화 옵션
  strictMode?: boolean
  // 성능 최적화 옵션
  lazyRender?: boolean
  // 사용자 경험 향상
  showCopyButton?: boolean
  maxLength?: number
  // 오류 처리
  fallbackContent?: string
  onError?: (error: Error) => void
}

// 보안 설정 - XSS 공격 방지
const ALLOWED_TAGS = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'br', 'strong', 'em', 'u', 's', 'del',
  'ul', 'ol', 'li',
  'blockquote', 'code', 'pre',
  'a', 'img',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'hr', 'div', 'span'
]

const ALLOWED_ATTRIBUTES = {
  'a': ['href', 'title', 'target', 'rel'],
  'img': ['src', 'alt', 'title', 'width', 'height'],
  'table': ['class'],
  'th': ['align'],
  'td': ['align'],
  'code': ['class'],
  'pre': ['class'],
  'blockquote': ['cite']
}

export function MarkdownRenderer({
  content,
  className = '',
  allowImages = true,
  allowLinks = true,
  allowTables = true,
  enableHeadingNavigation = false,
  strictMode = false,
  lazyRender = false,
  showCopyButton = false,
  maxLength,
  fallbackContent = '콘텐츠를 표시할 수 없습니다.',
  onError
}: MarkdownRendererProps) {
  const [isVisible, setIsVisible] = useState(!lazyRender)
  const [headings, setHeadings] = useState<Array<{id: string, text: string, level: number}>>([])
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
  }, [lazyRender, isVisible])

  // Copy content to clipboard
  const handleCopyContent = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content)
      setIsCopied(true)
      toast.success('콘텐츠가 복사되었습니다!')
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      toast.error('복사에 실패했습니다.')
    }
  }, [content])

  const renderedHTML = useMemo(() => {
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
        // Additional content validation
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
      // Marked 설정
      marked.setOptions({
        breaks: true, // 줄바꿈을 <br>로 변환
        gfm: true, // GitHub Flavored Markdown 지원
        sanitize: false, // DOMPurify로 직접 처리
      })

      // 커스텀 렌더러 설정
      const renderer = new marked.Renderer()

      // 이미지 렌더링 커스텀 (접근성 및 보안 강화)
      renderer.image = (href, title, text) => {
        if (!allowImages) return text || href
        
        const safeHref = href?.replace(/javascript:/gi, '').replace(/data:(?!image)/gi, '') || ''
        const safeTitle = title ? `title="${title.replace(/"/g, '&quot;')}"` : ''
        const safeAlt = text ? `alt="${text.replace(/"/g, '&quot;')}"` : 'alt="이미지"'
        
        return `<img src="${safeHref}" ${safeAlt} ${safeTitle} loading="lazy" decoding="async" style="max-width: 100%; height: auto; border-radius: 8px; margin: 1em 0;" role="img" />`
      }

      // 링크 렌더링 커스텀 (보안 및 접근성 강화)
      renderer.link = (href, title, text) => {
        if (!allowLinks) return text || href
        
        const safeHref = href?.replace(/javascript:/gi, '').replace(/data:/gi, '') || ''
        const safeTitle = title ? `title="${title.replace(/"/g, '&quot;')}"` : ''
        const isExternal = safeHref.startsWith('http') && (typeof window !== 'undefined' && !safeHref.includes(window.location.hostname))
        const target = isExternal ? 'target="_blank" rel="noopener noreferrer"' : ''
        const ariaLabel = isExternal ? 'aria-label="외부 링크 (새 창에서 열림)"' : ''
        
        return `<a href="${safeHref}" ${safeTitle} ${target} ${ariaLabel} class="text-blue-600 dark:text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded">${text}</a>`
      }

      // 테이블 렌더링 커스텀
      if (allowTables) {
        renderer.table = (header, body) => {
          return `
            <div class="overflow-x-auto my-6">
              <table class="min-w-full border border-gray-200 dark:border-gray-700 rounded-lg">
                <thead class="bg-gray-50 dark:bg-gray-800">
                  ${header}
                </thead>
                <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                  ${body}
                </tbody>
              </table>
            </div>
          `
        }

        renderer.tablerow = (content) => {
          return `<tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50">${content}</tr>`
        }

        renderer.tablecell = (content, flags) => {
          const tag = flags.header ? 'th' : 'td'
          const align = flags.align ? ` style="text-align: ${flags.align}"` : ''
          const classes = flags.header 
            ? 'px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'
            : 'px-4 py-3 text-sm text-gray-900 dark:text-gray-100'
          
          return `<${tag} class="${classes}"${align}>${content}</${tag}>`
        }
      }

      // 코드 블록 렌더링 커스텀
      renderer.code = (code, language) => {
        const safeCode = code.replace(/</g, '&lt;').replace(/>/g, '&gt;')
        const langClass = language ? `language-${language}` : ''
        
        return `
          <pre class="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 overflow-x-auto my-4">
            <code class="${langClass} text-sm">${safeCode}</code>
          </pre>
        `
      }

      // 인라인 코드 렌더링 커스텀
      renderer.codespan = (code) => {
        const safeCode = code.replace(/</g, '&lt;').replace(/>/g, '&gt;')
        return `<code class="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">${safeCode}</code>`
      }

      // 인용문 렌더링 커스텀
      renderer.blockquote = (quote) => {
        return `
          <blockquote class="border-l-4 border-gray-300 dark:border-gray-600 pl-4 my-4 italic text-gray-700 dark:text-gray-300">
            ${quote}
          </blockquote>
        `
      }

      // 제목 렌더링 커스텀 (접근성 및 앵커 링크 강화)
      renderer.heading = (text, level) => {
        const id = text.toLowerCase().replace(/[^\w가-힣]+/g, '-').replace(/^-+|-+$/g, '')
        const classes = {
          1: 'text-3xl font-bold mt-8 mb-4',
          2: 'text-2xl font-semibold mt-6 mb-3',
          3: 'text-xl font-medium mt-4 mb-2',
          4: 'text-lg font-medium mt-3 mb-2',
          5: 'text-base font-medium mt-2 mb-1',
          6: 'text-sm font-medium mt-2 mb-1'
        }[level] || 'font-medium'

        return `<h${level} id="${id}" class="${classes} scroll-mt-20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded" tabindex="-1">${text}</h${level}>`
      }

      // 리스트 렌더링 커스텀
      renderer.list = (body, ordered) => {
        const tag = ordered ? 'ol' : 'ul'
        const classes = ordered 
          ? 'list-decimal list-inside space-y-1 my-4 ml-4'
          : 'list-disc list-inside space-y-1 my-4 ml-4'
        
        return `<${tag} class="${classes}">${body}</${tag}>`
      }

      renderer.listitem = (text) => {
        return `<li class="text-gray-900 dark:text-gray-100">${text}</li>`
      }

      // 단락 렌더링 커스텀
      renderer.paragraph = (text) => {
        return `<p class="mb-4 leading-relaxed text-gray-900 dark:text-gray-100">${text}</p>`
      }

      // 구분선 렌더링 커스텀
      renderer.hr = () => {
        return `<hr class="border-gray-300 dark:border-gray-600 my-8" />`
      }

      // Extract headings for navigation
      const extractedHeadings: Array<{id: string, text: string, level: number}> = []
      
      if (enableHeadingNavigation) {
        const originalHeading = renderer.heading
        renderer.heading = (text, level) => {
          const id = text.toLowerCase().replace(/[^\w가-힣]+/g, '-')
          extractedHeadings.push({ id, text, level })
          return originalHeading.call(renderer, text, level)
        }
      }
      
      // 마크다운을 HTML로 변환
      const rawHTML = marked(content, { renderer })
      
      // Update headings state
      if (enableHeadingNavigation && extractedHeadings.length > 0) {
        setHeadings(extractedHeadings)
      }

      // DOMPurify로 XSS 공격 방지
      const purifyConfig = {
        ALLOWED_TAGS: allowImages && allowLinks && allowTables ? ALLOWED_TAGS : 
                     ALLOWED_TAGS.filter(tag => {
                       if (!allowImages && (tag === 'img')) return false
                       if (!allowLinks && (tag === 'a')) return false
                       if (!allowTables && ['table', 'thead', 'tbody', 'tr', 'th', 'td'].includes(tag)) return false
                       return true
                     }),
        ALLOWED_ATTR: ALLOWED_ATTRIBUTES,
        ALLOW_DATA_ATTR: false,
        FORBID_SCRIPTS: true,
        FORBID_TAGS: ['script', 'object', 'embed', 'base', 'link', 'meta'],
        FORBID_ATTR: strictMode 
          ? ['style', 'onload', 'onerror', 'onclick', 'onmouseover', 'onmouseout', 'onfocus', 'onblur']
          : ['onload', 'onerror', 'onclick']
      }

      return DOMPurify.sanitize(rawHTML, purifyConfig)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
      console.error('마크다운 렌더링 실패:', error)
      setRenderError(errorMessage)
      onError?.(error instanceof Error ? error : new Error(errorMessage))
      return `<p class="text-red-600 dark:text-red-400" role="alert">${fallbackContent}</p>`
    }
  }, [content, allowImages, allowLinks, allowTables, strictMode, maxLength, enableHeadingNavigation, isVisible, lazyRender, fallbackContent, onError])

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
  if (!content) {
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

      {/* Heading navigation */}
      {enableHeadingNavigation && headings.length > 0 && (
        <nav 
          className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
          role="navigation"
          aria-label="콘텐츠 내비게이션"
        >
          <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3">목차</h3>
          <ul className="space-y-1">
            {headings.map((heading, index) => (
              <li key={index} style={{ marginLeft: `${(heading.level - 1) * 1}rem` }}>
                <a
                  href={`#${heading.id}`}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline block py-1"
                  onClick={(e) => {
                    e.preventDefault()
                    const element = document.getElementById(heading.id)
                    element?.scrollIntoView({ behavior: 'smooth' })
                  }}
                >
                  {heading.text}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {/* Main content */}
      <article 
        className={cn(
          'markdown-content prose prose-gray dark:prose-invert max-w-none',
          'prose-headings:text-gray-900 dark:prose-headings:text-gray-100',
          'prose-p:text-gray-900 dark:prose-p:text-gray-100',
          'prose-strong:text-gray-900 dark:prose-strong:text-gray-100',
          'prose-code:text-gray-900 dark:prose-code:text-gray-100',
          'prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800',
          'prose-blockquote:text-gray-700 dark:prose-blockquote:text-gray-300',
          'prose-blockquote:border-gray-300 dark:prose-blockquote:border-gray-600',
          // 접근성 향상
          'focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2',
          className
        )}
        role="main"
        aria-label="마크다운 콘텐츠"
        dangerouslySetInnerHTML={{ __html: renderedHTML }}
      />
    </div>
  )
}

// 마크다운 콘텐츠의 요약을 생성하는 유틸리티 함수 (개선된 버전)
export function getMarkdownSummary(content: string, maxLength: number = 200): string {
  if (!content) return ''
  
  try {
    // 마크다운 문법 제거
    const plainText = content
      .replace(/#{1,6}\s+/g, '') // 제목
      .replace(/\*\*(.*?)\*\*/g, '$1') // 굵은 글씨
      .replace(/\*(.*?)\*/g, '$1') // 기울임
      .replace(/`(.*?)`/g, '$1') // 인라인 코드
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 링크
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1') // 이미지
      .replace(/```[\s\S]*?```/g, '') // 코드 블록
      .replace(/>\s+/g, '') // 인용문
      .replace(/[-*+]\s+/g, '') // 리스트
      .replace(/\n+/g, ' ') // 줄바꿈을 공백으로
      .trim()
    
    if (plainText.length <= maxLength) {
      return plainText
    }
    
    return plainText.substring(0, maxLength).trim() + '...'
  } catch (error) {
    console.error('마크다운 요약 생성 실패:', error)
    return content.substring(0, maxLength) + '...'
  }
}

// 마크다운 콘텐칠 유효성 검사
export function validateMarkdownContent(content: string): { isValid: boolean, errors: string[] } {
  const errors: string[] = []
  
  // 기본 내용 검사
  if (!content || content.trim().length === 0) {
    errors.push('콘텐츠가 비어있습니다.')
  }
  
  // 의심스러운 패턴 검사
  const suspiciousPatterns = [
    { pattern: /<script[^>]*>/gi, message: 'script 태그가 감지되었습니다.' },
    { pattern: /javascript:/gi, message: 'javascript: 스키마가 감지되었습니다.' },
    { pattern: /on\w+\s*=/gi, message: '이벤트 핸들러가 감지되었습니다.' }
  ]
  
  for (const { pattern, message } of suspiciousPatterns) {
    if (pattern.test(content)) {
      errors.push(message)
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// 마크다운 통계 생성
export function getMarkdownStats(content: string) {
  if (!content) return null
  
  const lines = content.split('\n')
  const words = content.split(/\s+/).filter(word => word.length > 0)
  const characters = content.length
  const charactersNoSpaces = content.replace(/\s/g, '').length
  
  // 마크다운 요소 개수
  const headings = (content.match(/^#{1,6}\s/gm) || []).length
  const links = (content.match(/\[([^\]]+)\]\([^)]+\)/g) || []).length
  const images = (content.match(/!\[([^\]]*)\]\([^)]+\)/g) || []).length
  const codeBlocks = (content.match(/```[\s\S]*?```/g) || []).length
  const lists = (content.match(/^\s*[-*+]\s|^\s*\d+\.\s/gm) || []).length
  
  // 예상 읽기 시간 (분당 200단어 기준)
  const readingTimeMinutes = Math.ceil(words.length / 200)
  
  return {
    lines: lines.length,
    words: words.length,
    characters,
    charactersNoSpaces,
    headings,
    links,
    images,
    codeBlocks,
    lists,
    readingTimeMinutes
  }
}
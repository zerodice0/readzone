'use client'

import React, { useEffect, useCallback, useMemo } from 'react'
import { useThemeState } from '@/hooks/use-theme'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { CustomToolbar } from './custom-toolbar'
import { QuillDarkTheme } from './quill-dark-theme'

// react-quill-new 3.0.0을 동적 임포트로 SSR 문제 해결
// forwardRef 래핑 없이 직접 사용
import dynamic from 'next/dynamic'

const ReactQuill = dynamic(() => import('react-quill-new'), { 
  ssr: false,
  loading: () => (
    <div className="min-h-[400px] w-full border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 animate-pulse flex items-center justify-center">
      <p className="text-gray-500 dark:text-gray-400">에디터 로딩 중...</p>
    </div>
  )
})

// Quill CSS는 globals.css에서 임포트

export interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  height?: string
  className?: string
  onSave?: () => void
  isLoading?: boolean
  autofocus?: boolean
  readOnly?: boolean
  // 자동저장 관련 props
  autosaveStatus?: 'idle' | 'saving' | 'saved' | 'error'
  lastSaved?: Date | null
  showAutosaveStatus?: boolean
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = '독후감을 작성해보세요...',
  height = '400px',
  className = '',
  onSave,
  isLoading = false,
  readOnly = false,
  // 자동저장 관련 props
  autosaveStatus = 'idle',
  lastSaved = null,
  showAutosaveStatus = true
}) => {
  const { isLoaded, isDark } = useThemeState()
  // ref는 직접 사용하지 않고 필요시 getEditor() 메서드로 접근

  // Quill 에디터 설정 (독후감 작성에 최적화)
  const modules = useMemo(() => ({
    toolbar: {
      container: '#readzone-toolbar'  // 커스텀 툴바 사용
    }
  }), [])

  // Quill 포맷 설정 (독후감에 필요한 기본 포맷만)
  // Quill 2.0+에서 'bullet'은 'list' 포맷의 값이므로 별도 등록 불필요
  const formats = useMemo(() => [
    'header', 'bold', 'italic', 
    'list', 'blockquote', 'link'
  ], [])

  // 내용 변경 핸들러
  const handleChange = useCallback((content: string) => {
    onChange(content)
  }, [onChange])

  // 시간 포맷팅 함수
  const formatTime = useCallback((date: Date) => {
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diff < 60) return '방금 전'
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
    return date.toLocaleDateString('ko-KR', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }, [])

  // 자동저장 상태 포맷팅
  const formatAutosaveStatus = useCallback(() => {
    if (!showAutosaveStatus) return null

    switch (autosaveStatus) {
      case 'saving':
        return '저장 중...'
      case 'saved':
        return lastSaved ? `저장됨 (${formatTime(lastSaved)})` : '저장됨'
      case 'error':
        return '저장 실패'
      case 'idle':
      default:
        return lastSaved ? `마지막 저장: ${formatTime(lastSaved)}` : null
    }
  }, [autosaveStatus, lastSaved, showAutosaveStatus, formatTime])

  // 키보드 단축키 설정
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + S: 저장
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        onSave?.()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onSave])

  // 에디터 스타일
  const editorStyle = useMemo(() => ({
    height: height
  } as React.CSSProperties), [height])

  return (
    <>
      {/* ReadZone 다크테마 CSS */}
      <QuillDarkTheme />
      
      <Card className={cn("border-0 shadow-none", className)}>
        <div 
          className={cn(
            "quill-wrapper",
            isLoaded && isDark && 'dark-theme',
            isLoading && 'opacity-50 pointer-events-none'
          )}
          style={editorStyle}
        >
          {/* 커스텀 툴바 */}
          <CustomToolbar />
          
          <ReactQuill
            theme="snow"
            value={value}
            onChange={handleChange}
            modules={modules}
            formats={formats}
            placeholder={placeholder}
            readOnly={readOnly || isLoading}
            style={{ height: '100%' }}
          />
        </div>
        
        {/* 하단 정보 */}
        <div className="flex justify-between items-center px-3 py-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <span>
              {value ? `${value.replace(/<[^>]*>/g, '').length}자` : '0자'}
            </span>
            {onSave && (
              <span className="text-gray-400 dark:text-gray-500">| Ctrl+S로 저장</span>
            )}
          </div>
          
          {/* 자동저장 상태 표시 */}
          <div className="flex items-center gap-2">
            {showAutosaveStatus && formatAutosaveStatus() && (
              <div className="flex items-center gap-1">
                {autosaveStatus === 'saving' && (
                  <div className="w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin" />
                )}
                {autosaveStatus === 'saved' && (
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                )}
                {autosaveStatus === 'error' && (
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                )}
                <span className={cn(
                  "text-xs",
                  autosaveStatus === 'saving' && "text-blue-500",
                  autosaveStatus === 'saved' && "text-green-600 dark:text-green-400",
                  autosaveStatus === 'error' && "text-red-500",
                  autosaveStatus === 'idle' && "text-gray-400"
                )}>
                  {formatAutosaveStatus()}
                </span>
              </div>
            )}
            
            {/* 기존 로딩 상태 (하위 호환성) */}
            {isLoading && !showAutosaveStatus && (
              <span className="text-blue-500">저장 중...</span>
            )}
          </div>
        </div>
      </Card>

      {/* 기본 에디터 스타일 */}
      <style jsx global>{`
        /* 에디터 기본 높이 설정 */
        .quill-wrapper .ql-container .ql-editor {
          min-height: ${height === '400px' ? '300px' : 'calc(' + height + ' - 60px)'};
          font-size: 16px;
          line-height: 1.6;
        }
        
        /* 기본 툴바 숨기기 (커스텀 툴바 사용) */
        .quill-wrapper .ql-toolbar.ql-snow {
          display: none;
        }
        
        /* 라이트 테마 기본 스타일 */
        .quill-wrapper .ql-container {
          border-color: rgb(229 231 235); /* border-gray-200 */
          border-radius: 0 0 0.5rem 0.5rem;
        }
        
        .quill-wrapper .ql-editor {
          background-color: rgb(255 255 255); /* bg-white */
          color: rgb(17 24 39);               /* text-gray-900 */
        }
        
        .quill-wrapper .ql-editor.ql-blank::before {
          color: rgb(156 163 175);            /* text-gray-400 */
          font-style: normal;
          opacity: 0.8;
        }
        
        /* 기본 텍스트 요소 스타일 */
        .quill-wrapper .ql-editor blockquote {
          border-left: 4px solid rgb(59 130 246); /* border-l-blue-500 */
          padding-left: 1rem;
          margin: 1rem 0;
          color: rgb(107 114 128);                /* text-gray-500 */
          font-style: italic;
          background-color: rgb(249 250 251);     /* bg-gray-50 */
          border-radius: 0 0.375rem 0.375rem 0;
        }
        
        .quill-wrapper .ql-editor a {
          color: rgb(59 130 246);           /* text-blue-500 */
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        
        .quill-wrapper .ql-editor a:hover {
          color: rgb(37 99 235);            /* text-blue-600 */
        }
        
        /* 리스트 기본 스타일 */
        .quill-wrapper .ql-editor ol,
        .quill-wrapper .ql-editor ul {
          padding-left: 1.5rem;
          margin: 1rem 0;
        }
        
        .quill-wrapper .ql-editor ol > li::marker,
        .quill-wrapper .ql-editor ul > li::marker {
          color: rgb(239 68 68);            /* text-primary-500 */
        }
      `}</style>
    </>
  )
}

export default RichTextEditor
'use client'

import React, { useRef, useEffect, useCallback, useState } from 'react'
import dynamic from 'next/dynamic'
import { useTheme } from '@/contexts/theme-context'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  Heading1, 
  Heading2, 
  Heading3,
  Code,
  Quote,
  List,
  ListOrdered,
  Link,
  Image,
  Table,
  Undo,
  Redo,
  Eye,
  EyeOff,
  Maximize2,
  Save,
  Loader2
} from 'lucide-react'
import toast from 'react-hot-toast'
import type { Editor as EditorType } from '@toast-ui/editor'

// Toast UI Editor는 SSR을 지원하지 않으므로 동적 임포트 사용
const Editor = dynamic(
  async () => {
    const { Editor } = await import('@toast-ui/react-editor')
    const codeSyntaxHighlight = await import('@toast-ui/editor-plugin-code-syntax-highlight')
    const colorSyntax = await import('@toast-ui/editor-plugin-color-syntax')
    await import('@toast-ui/editor/dist/toastui-editor.css')
    await import('@toast-ui/editor/dist/theme/toastui-editor-dark.css')
    await import('prismjs/themes/prism.css')
    
    // Prism.js 언어 지원 추가
    await import('prismjs/components/prism-javascript')
    await import('prismjs/components/prism-typescript')
    await import('prismjs/components/prism-jsx')
    await import('prismjs/components/prism-tsx')
    await import('prismjs/components/prism-css')
    await import('prismjs/components/prism-markdown')
    await import('prismjs/components/prism-json')
    
    return Editor
  },
  { ssr: false }
)

export interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  height?: string
  previewStyle?: 'tab' | 'vertical' 
  enableImages?: boolean
  enableTables?: boolean
  autofocus?: boolean
  onImageUpload?: (file: File) => Promise<string>
  onSave?: () => void
  isLoading?: boolean
  className?: string
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  placeholder = '독후감을 작성해보세요...',
  height = '500px',
  previewStyle = 'vertical',
  enableImages = true,
  enableTables = true,
  autofocus = false,
  onImageUpload,
  onSave,
  isLoading = false,
  className = ''
}) => {
  const { theme } = useTheme()
  const editorRef = useRef<EditorType | null>(null)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // 에디터 인스턴스 초기화
  const handleEditorLoad = useCallback((editor: EditorType) => {
    editorRef.current = editor
    
    // 초기값 설정
    if (value) {
      editor.setMarkdown(value)
    }

    // 이미지 업로드 핸들러 등록
    if (enableImages && onImageUpload) {
      editor.removeHook('addImageBlobHook')
      editor.addHook('addImageBlobHook', async (blob: File) => {
        try {
          const url = await onImageUpload(blob)
          return url
        } catch (error) {
          toast.error('이미지 업로드에 실패했습니다.')
          return false
        }
      })
    }
  }, [value, enableImages, onImageUpload])

  // 에디터 내용 변경 핸들러
  const handleChange = useCallback(() => {
    if (!editorRef.current) return
    const markdown = editorRef.current.getMarkdown()
    onChange(markdown)
  }, [onChange])

  // 테마 변경 시 에디터 테마 업데이트
  useEffect(() => {
    if (editorRef.current) {
      const editorEl = editorRef.current.getRootElement()
      if (theme === 'dark') {
        editorEl?.classList.add('toastui-editor-dark')
      } else {
        editorEl?.classList.remove('toastui-editor-dark')
      }
    }
  }, [theme])

  // 툴바 버튼 액션 핸들러
  const execCommand = useCallback((command: string, ...args: any[]) => {
    if (!editorRef.current) return

    switch (command) {
      case 'bold':
        editorRef.current.exec('bold')
        break
      case 'italic':
        editorRef.current.exec('italic')
        break
      case 'strike':
        editorRef.current.exec('strike')
        break
      case 'heading':
        editorRef.current.exec('heading', { level: args[0] })
        break
      case 'code':
        editorRef.current.exec('code')
        break
      case 'codeblock':
        editorRef.current.exec('codeblock')
        break
      case 'blockQuote':
        editorRef.current.exec('blockQuote')
        break
      case 'ul':
        editorRef.current.exec('bulletList')
        break
      case 'ol':
        editorRef.current.exec('orderedList')
        break
      case 'link':
        editorRef.current.exec('addLink')
        break
      case 'image':
        editorRef.current.exec('addImage')
        break
      case 'table':
        editorRef.current.exec('addTable')
        break
      case 'undo':
        editorRef.current.exec('undo')
        break
      case 'redo':
        editorRef.current.exec('redo')
        break
    }
  }, [])

  // 미리보기 모드 토글
  const togglePreview = useCallback(() => {
    setIsPreviewMode(!isPreviewMode)
    if (editorRef.current) {
      if (!isPreviewMode) {
        editorRef.current.changePreviewStyle('tab')
      } else {
        editorRef.current.changePreviewStyle(previewStyle)
      }
    }
  }, [isPreviewMode, previewStyle])

  // 전체화면 토글
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen)
    if (containerRef.current) {
      if (!isFullscreen) {
        containerRef.current.classList.add('fixed', 'inset-0', 'z-50', 'bg-background')
      } else {
        containerRef.current.classList.remove('fixed', 'inset-0', 'z-50', 'bg-background')
      }
    }
  }, [isFullscreen])

  // 키보드 단축키 설정
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + S: 저장
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        onSave?.()
      }
      // Cmd/Ctrl + Shift + P: 미리보기 토글
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'p') {
        e.preventDefault()
        togglePreview()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onSave, togglePreview])

  return (
    <div ref={containerRef} className={`markdown-editor-container ${className}`}>
      <Card className="border-0 shadow-none">
        {/* 커스텀 툴바 */}
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between p-2">
            <div className="flex items-center gap-1 flex-wrap">
              {/* 텍스트 포맷팅 */}
              <div className="flex items-center gap-0.5 pr-2 border-r">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => execCommand('bold')}
                  title="굵게 (Ctrl+B)"
                >
                  <Bold className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => execCommand('italic')}
                  title="기울임 (Ctrl+I)"
                >
                  <Italic className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => execCommand('strike')}
                  title="취소선"
                >
                  <Strikethrough className="h-4 w-4" />
                </Button>
              </div>

              {/* 제목 */}
              <div className="flex items-center gap-0.5 px-2 border-r">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => execCommand('heading', 1)}
                  title="제목 1"
                >
                  <Heading1 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => execCommand('heading', 2)}
                  title="제목 2"
                >
                  <Heading2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => execCommand('heading', 3)}
                  title="제목 3"
                >
                  <Heading3 className="h-4 w-4" />
                </Button>
              </div>

              {/* 리스트 & 인용 */}
              <div className="flex items-center gap-0.5 px-2 border-r">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => execCommand('ul')}
                  title="글머리 기호"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => execCommand('ol')}
                  title="번호 매기기"
                >
                  <ListOrdered className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => execCommand('blockQuote')}
                  title="인용문"
                >
                  <Quote className="h-4 w-4" />
                </Button>
              </div>

              {/* 코드 & 링크 */}
              <div className="flex items-center gap-0.5 px-2 border-r">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => execCommand('codeblock')}
                  title="코드 블록"
                >
                  <Code className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => execCommand('link')}
                  title="링크 삽입"
                >
                  <Link className="h-4 w-4" />
                </Button>
              </div>

              {/* 이미지 & 테이블 */}
              {(enableImages || enableTables) && (
                <div className="flex items-center gap-0.5 px-2 border-r">
                  {enableImages && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => execCommand('image')}
                      title="이미지 삽입"
                    >
                      <Image className="h-4 w-4" />
                    </Button>
                  )}
                  {enableTables && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => execCommand('table')}
                      title="표 삽입"
                    >
                      <Table className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}

              {/* 실행 취소/다시 실행 */}
              <div className="flex items-center gap-0.5 px-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => execCommand('undo')}
                  title="실행 취소 (Ctrl+Z)"
                >
                  <Undo className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => execCommand('redo')}
                  title="다시 실행 (Ctrl+Y)"
                >
                  <Redo className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* 우측 액션 버튼 */}
            <div className="flex items-center gap-1">
              {onSave && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onSave}
                  disabled={isLoading}
                  className="h-8"
                  title="저장 (Ctrl+S)"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-1" />
                  )}
                  저장
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={togglePreview}
                title="미리보기 전환 (Ctrl+Shift+P)"
              >
                {isPreviewMode ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={toggleFullscreen}
                title="전체화면"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Toast UI Editor */}
        <div className="editor-wrapper" style={{ height: isFullscreen ? 'calc(100vh - 60px)' : height }}>
          <Editor
            initialValue={value}
            placeholder={placeholder}
            previewStyle={previewStyle}
            height="100%"
            initialEditType="markdown"
            useCommandShortcut={true}
            autofocus={autofocus}
            hideModeSwitch={true}
            toolbarItems={[]} // 커스텀 툴바 사용
            theme={theme === 'dark' ? 'dark' : 'light'}
            onChange={handleChange}
            onLoad={handleEditorLoad}
            plugins={[
              [
                '@toast-ui/editor-plugin-code-syntax-highlight',
                { highlighter: require('prismjs') }
              ],
              ['@toast-ui/editor-plugin-color-syntax']
            ]}
          />
        </div>
      </Card>

      <style jsx global>{`
        /* 에디터 스타일 커스터마이징 */
        .toastui-editor-main {
          font-family: inherit;
        }

        .toastui-editor-contents {
          font-family: inherit;
          line-height: 1.8;
        }

        .toastui-editor-contents p {
          margin: 0.75em 0;
        }

        .toastui-editor-contents h1,
        .toastui-editor-contents h2,
        .toastui-editor-contents h3,
        .toastui-editor-contents h4,
        .toastui-editor-contents h5,
        .toastui-editor-contents h6 {
          margin-top: 1.5em;
          margin-bottom: 0.5em;
          font-weight: 600;
        }

        .toastui-editor-contents ul,
        .toastui-editor-contents ol {
          margin: 0.75em 0;
          padding-left: 1.5em;
        }

        .toastui-editor-contents blockquote {
          margin: 1em 0;
          padding-left: 1em;
          border-left: 4px solid #e5e7eb;
        }

        .toastui-editor-dark .toastui-editor-contents blockquote {
          border-left-color: #374151;
        }

        .toastui-editor-contents code {
          background-color: #f3f4f6;
          padding: 0.125em 0.25em;
          border-radius: 0.25em;
          font-size: 0.875em;
        }

        .toastui-editor-dark .toastui-editor-contents code {
          background-color: #374151;
        }

        .toastui-editor-contents pre {
          margin: 1em 0;
          background-color: #f3f4f6;
          border-radius: 0.5em;
          overflow-x: auto;
        }

        .toastui-editor-dark .toastui-editor-contents pre {
          background-color: #1f2937;
        }

        .toastui-editor-contents table {
          margin: 1em 0;
          border-collapse: collapse;
          width: 100%;
        }

        .toastui-editor-contents table th,
        .toastui-editor-contents table td {
          border: 1px solid #e5e7eb;
          padding: 0.5em;
        }

        .toastui-editor-dark .toastui-editor-contents table th,
        .toastui-editor-dark .toastui-editor-contents table td {
          border-color: #374151;
        }

        .toastui-editor-contents img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5em;
          margin: 1em 0;
        }

        /* 전체화면 모드 */
        .markdown-editor-container.fullscreen {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 50;
          background: var(--background);
        }

        /* 로딩 오버레이 */
        .editor-wrapper {
          position: relative;
        }

        .editor-wrapper.loading::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
        }

        .toastui-editor-dark .editor-wrapper.loading::after {
          background: rgba(0, 0, 0, 0.8);
        }
      `}</style>
    </div>
  )
}
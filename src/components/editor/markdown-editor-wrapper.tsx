'use client'

import React, { useRef, useEffect, useState } from 'react'
import { useTheme } from '@/contexts/theme-context'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { 
  Bold, 
  Italic, 
  Heading1, 
  Heading2, 
  Code,
  Quote,
  List,
  Link,
  Image,
  Table,
  Undo,
  Redo,
  Eye,
  Save,
  Loader2
} from 'lucide-react'
import toast from 'react-hot-toast'

let Editor: any = null
let editorLoaded = false

export interface MarkdownEditorWrapperProps {
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

export default function MarkdownEditorWrapper({
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
}: MarkdownEditorWrapperProps) {
  const { theme } = useTheme()
  const editorRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isEditorReady, setIsEditorReady] = useState(false)

  // 에디터 로드
  useEffect(() => {
    const loadEditor = async () => {
      if (!editorLoaded) {
        const [
          { default: EditorModule },
          codeSyntaxHighlightModule,
          colorSyntaxModule
        ] = await Promise.all([
          import('@toast-ui/editor'),
          import('@toast-ui/editor-plugin-code-syntax-highlight/dist/toastui-editor-plugin-code-syntax-highlight-all'),
          import('@toast-ui/editor-plugin-color-syntax'),
          import('@toast-ui/editor/dist/toastui-editor.css'),
          import('@toast-ui/editor/dist/theme/toastui-editor-dark.css'),
          import('prismjs/themes/prism.css')
        ])

        Editor = EditorModule
        editorLoaded = true
      }

      if (containerRef.current && Editor) {
        // 기존 에디터가 있으면 제거
        if (editorRef.current) {
          editorRef.current.destroy()
        }

        // 새 에디터 생성
        editorRef.current = new Editor.default({
          el: containerRef.current,
          initialValue: value || '',
          previewStyle: previewStyle,
          height: height,
          initialEditType: 'markdown',
          useCommandShortcut: true,
          usageStatistics: false,
          hideModeSwitch: true,
          autofocus: autofocus,
          placeholder: placeholder,
          theme: theme === 'dark' ? 'dark' : undefined,
          events: {
            change: () => {
              if (editorRef.current) {
                const markdown = editorRef.current.getMarkdown()
                onChange(markdown)
              }
            }
          },
          hooks: enableImages && onImageUpload ? {
            addImageBlobHook: async (blob: File) => {
              try {
                const url = await onImageUpload(blob)
                return url
              } catch (error) {
                toast.error('이미지 업로드에 실패했습니다.')
                return null
              }
            }
          } : undefined
        })

        setIsEditorReady(true)
      }
    }

    loadEditor()

    return () => {
      if (editorRef.current) {
        editorRef.current.destroy()
        editorRef.current = null
      }
    }
  }, []) // 초기 로드만 수행

  // 테마 변경 처리
  useEffect(() => {
    if (editorRef.current && isEditorReady) {
      const rootEl = editorRef.current.getRootElement()
      if (rootEl) {
        if (theme === 'dark') {
          rootEl.classList.add('toastui-editor-dark')
        } else {
          rootEl.classList.remove('toastui-editor-dark')
        }
      }
    }
  }, [theme, isEditorReady])

  // 값 변경 처리
  useEffect(() => {
    if (editorRef.current && isEditorReady) {
      const currentValue = editorRef.current.getMarkdown()
      if (currentValue !== value) {
        editorRef.current.setMarkdown(value || '')
      }
    }
  }, [value, isEditorReady])

  // 툴바 명령 실행
  const execCommand = (cmd: string, ...args: any[]) => {
    if (!editorRef.current) return

    const editor = editorRef.current
    switch (cmd) {
      case 'bold':
        editor.exec('bold')
        break
      case 'italic':
        editor.exec('italic')
        break
      case 'heading1':
        editor.exec('heading', { level: 1 })
        break
      case 'heading2':
        editor.exec('heading', { level: 2 })
        break
      case 'code':
        editor.exec('codeblock')
        break
      case 'quote':
        editor.exec('blockQuote')
        break
      case 'ul':
        editor.exec('bulletList')
        break
      case 'link':
        editor.exec('addLink')
        break
      case 'image':
        editor.exec('addImage')
        break
      case 'table':
        editor.exec('addTable')
        break
      case 'undo':
        editor.exec('undo')
        break
      case 'redo':
        editor.exec('redo')
        break
      case 'preview':
        if (editor.isViewer()) {
          editor.changeMode('markdown')
        } else {
          editor.changeMode('viewer')
        }
        break
    }
  }

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        onSave?.()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onSave])

  return (
    <Card className={`markdown-editor ${className}`}>
      {/* 툴바 */}
      <div className="border-b p-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1">
            {/* 텍스트 포맷 */}
            <div className="flex items-center gap-0.5 pr-2 border-r">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => execCommand('bold')}
                title="굵게"
                disabled={!isEditorReady}
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => execCommand('italic')}
                title="기울임"
                disabled={!isEditorReady}
              >
                <Italic className="h-4 w-4" />
              </Button>
            </div>

            {/* 제목 */}
            <div className="flex items-center gap-0.5 px-2 border-r">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => execCommand('heading1')}
                title="제목 1"
                disabled={!isEditorReady}
              >
                <Heading1 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => execCommand('heading2')}
                title="제목 2"
                disabled={!isEditorReady}
              >
                <Heading2 className="h-4 w-4" />
              </Button>
            </div>

            {/* 리스트 & 기타 */}
            <div className="flex items-center gap-0.5 px-2 border-r">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => execCommand('ul')}
                title="목록"
                disabled={!isEditorReady}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => execCommand('quote')}
                title="인용"
                disabled={!isEditorReady}
              >
                <Quote className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => execCommand('code')}
                title="코드"
                disabled={!isEditorReady}
              >
                <Code className="h-4 w-4" />
              </Button>
            </div>

            {/* 삽입 */}
            <div className="flex items-center gap-0.5 px-2 border-r">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => execCommand('link')}
                title="링크"
                disabled={!isEditorReady}
              >
                <Link className="h-4 w-4" />
              </Button>
              {enableImages && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => execCommand('image')}
                  title="이미지"
                  disabled={!isEditorReady}
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
                  title="표"
                  disabled={!isEditorReady}
                >
                  <Table className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* 실행 취소 */}
            <div className="flex items-center gap-0.5 px-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => execCommand('undo')}
                title="실행 취소"
                disabled={!isEditorReady}
              >
                <Undo className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => execCommand('redo')}
                title="다시 실행"
                disabled={!isEditorReady}
              >
                <Redo className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => execCommand('preview')}
              title="미리보기"
              disabled={!isEditorReady}
            >
              <Eye className="h-4 w-4" />
            </Button>
            {onSave && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onSave}
                disabled={isLoading || !isEditorReady}
                className="h-8"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-1" />
                )}
                저장
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 에디터 컨테이너 */}
      <div 
        ref={containerRef} 
        className="editor-container"
        style={{ minHeight: height }}
      />

      <style jsx global>{`
        .toastui-editor-contents {
          font-size: 16px;
          line-height: 1.8;
          font-family: inherit;
        }

        .toastui-editor-contents p {
          margin: 0.75em 0;
        }

        .toastui-editor-contents h1,
        .toastui-editor-contents h2,
        .toastui-editor-contents h3 {
          margin: 1em 0 0.5em;
          font-weight: 600;
        }

        .toastui-editor-contents ul,
        .toastui-editor-contents ol {
          padding-left: 1.5em;
          margin: 0.75em 0;
        }

        .toastui-editor-contents blockquote {
          margin: 1em 0;
          padding-left: 1em;
          border-left: 4px solid #e5e7eb;
          color: #6b7280;
        }

        .toastui-editor-dark .toastui-editor-contents blockquote {
          border-left-color: #4b5563;
          color: #9ca3af;
        }

        .toastui-editor-contents code {
          background: #f3f4f6;
          padding: 0.125em 0.25em;
          border-radius: 0.25em;
          font-size: 0.875em;
        }

        .toastui-editor-dark .toastui-editor-contents code {
          background: #374151;
        }

        .toastui-editor-contents pre {
          background: #f3f4f6;
          border-radius: 0.5em;
          padding: 1em;
          overflow-x: auto;
        }

        .toastui-editor-dark .toastui-editor-contents pre {
          background: #1f2937;
        }

        .toastui-editor-contents table {
          border-collapse: collapse;
          margin: 1em 0;
        }

        .toastui-editor-contents table th,
        .toastui-editor-contents table td {
          border: 1px solid #e5e7eb;
          padding: 0.5em;
        }

        .toastui-editor-dark .toastui-editor-contents table th,
        .toastui-editor-dark .toastui-editor-contents table td {
          border-color: #4b5563;
        }

        .toastui-editor-contents img {
          max-width: 100%;
          height: auto;
          margin: 1em 0;
        }

        .toastui-editor-defaultUI {
          border: none !important;
        }

        .toastui-editor {
          background: transparent !important;
        }
      `}</style>
    </Card>
  )
}
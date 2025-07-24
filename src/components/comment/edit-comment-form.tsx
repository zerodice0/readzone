'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Save, X } from 'lucide-react'

interface EditCommentFormProps {
  initialContent: string
  onSubmit: (content: string) => void
  onCancel: () => void
  isLoading?: boolean
  maxLength?: number
  minLength?: number
  className?: string
}

export function EditCommentForm({
  initialContent,
  onSubmit,
  onCancel,
  isLoading = false,
  maxLength = 1000,
  minLength = 2,
  className
}: EditCommentFormProps) {
  const [content, setContent] = useState(initialContent)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 자동 포커스 및 커서를 끝으로 이동
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.focus()
      // 커서를 텍스트 끝으로 이동
      textarea.setSelectionRange(textarea.value.length, textarea.value.length)
    }
  }, [])

  // 텍스트 영역 자동 크기 조절
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      const scrollHeight = Math.min(textarea.scrollHeight, 150)
      textarea.style.height = scrollHeight + 'px'
    }
  }, [content])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const trimmedContent = content.trim()
    
    if (trimmedContent.length < minLength || trimmedContent.length > maxLength) {
      return
    }

    if (trimmedContent === initialContent.trim()) {
      onCancel()
      return
    }

    onSubmit(trimmedContent)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl/Cmd + Enter로 저장
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit(e as any)
    }
    
    // Escape로 취소
    if (e.key === 'Escape') {
      e.preventDefault()
      onCancel()
    }
  }

  const isSubmitDisabled = content.trim().length < minLength || 
                          content.trim().length > maxLength || 
                          content.trim() === initialContent.trim() ||
                          isLoading

  const remainingChars = maxLength - content.length
  const isOverLimit = remainingChars < 0
  const isNearLimit = remainingChars <= 50

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-3', className)}>
      {/* 텍스트 영역 */}
      <div className={cn(
        'relative border rounded-lg',
        'border-primary-500 dark:border-primary-400 ring-1 ring-primary-500 dark:ring-primary-400',
        isOverLimit && 'border-red-500 dark:border-red-400 ring-1 ring-red-500 dark:ring-red-400'
      )}>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="댓글 내용을 수정해주세요..."
          disabled={isLoading}
          className={cn(
            'w-full px-3 py-2 text-sm bg-transparent border-none resize-none',
            'placeholder:text-gray-500 dark:placeholder:text-gray-400',
            'focus:outline-none focus:ring-0',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'min-h-[60px] max-h-[150px]'
          )}
          style={{ overflow: 'hidden' }}
          maxLength={maxLength}
          aria-label="댓글 수정 내용"
        />
        
        {/* 글자 수 표시 */}
        <div className={cn(
          'absolute bottom-2 right-2 text-xs',
          isOverLimit 
            ? 'text-red-500 dark:text-red-400' 
            : isNearLimit 
            ? 'text-yellow-600 dark:text-yellow-400' 
            : 'text-gray-400 dark:text-gray-500'
        )}>
          {content.length} / {maxLength}
        </div>
      </div>

      {/* 도움말 및 에러 메시지 */}
      <div className="flex items-center justify-between text-xs">
        <div className="text-gray-500 dark:text-gray-400">
          {isOverLimit ? (
            <span className="text-red-500 dark:text-red-400">
              글자 수 제한을 초과했습니다
            </span>
          ) : content.trim().length > 0 && content.trim().length < minLength ? (
            <span className="text-yellow-600 dark:text-yellow-400">
              {minLength - content.trim().length}자 더 입력해주세요
            </span>
          ) : content.trim() === initialContent.trim() ? (
            <span className="text-gray-500 dark:text-gray-400">
              변경사항이 없습니다
            </span>
          ) : (
            <span>
              Ctrl/Cmd + Enter: 저장, Escape: 취소
            </span>
          )}
        </div>
      </div>

      {/* 버튼 영역 */}
      <div className="flex items-center justify-end space-x-2">
        {/* 취소 버튼 */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={isLoading}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X className="w-4 h-4 mr-1" />
          취소
        </Button>

        {/* 저장 버튼 */}
        <Button
          type="submit"
          size="sm"
          disabled={isSubmitDisabled}
          loading={isLoading}
          className="bg-primary-500 hover:bg-primary-600 text-white"
        >
          <Save className="w-4 h-4 mr-1" />
          저장
        </Button>
      </div>
    </form>
  )
}
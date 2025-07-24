'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Send, X } from 'lucide-react'

interface CommentFormProps {
  onSubmit: (content: string) => void
  onCancel?: () => void
  placeholder?: string
  initialContent?: string
  isLoading?: boolean
  submitText?: string
  cancelText?: string
  maxLength?: number
  minLength?: number
  showCancel?: boolean
  autoFocus?: boolean
  className?: string
}

export function CommentForm({
  onSubmit,
  onCancel,
  placeholder = '댓글을 작성해주세요...',
  initialContent = '',
  isLoading = false,
  submitText = '댓글 작성',
  cancelText = '취소',
  maxLength = 1000,
  minLength = 2,
  showCancel = true,
  autoFocus = false,
  className
}: CommentFormProps) {
  const [content, setContent] = useState(initialContent)
  const [isFocused, setIsFocused] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 자동 포커스
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [autoFocus])

  // 텍스트 영역 자동 크기 조절
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      // 높이 리셋
      textarea.style.height = 'auto'
      // 내용에 맞게 높이 조절 (최대 150px)
      const scrollHeight = Math.min(textarea.scrollHeight, 150)
      textarea.style.height = scrollHeight + 'px'
    }
  }, [content])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const trimmedContent = content.trim()
    
    if (trimmedContent.length < minLength) {
      return
    }
    
    if (trimmedContent.length > maxLength) {
      return
    }

    onSubmit(trimmedContent)
    setContent('')
    setIsFocused(false)
  }

  const handleCancel = () => {
    setContent(initialContent)
    setIsFocused(false)
    onCancel?.()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl/Cmd + Enter로 제출
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit(e as any)
    }
    
    // Escape로 취소
    if (e.key === 'Escape' && showCancel) {
      handleCancel()
    }
  }

  const isSubmitDisabled = content.trim().length < minLength || 
                          content.trim().length > maxLength || 
                          isLoading

  const remainingChars = maxLength - content.length
  const isNearLimit = remainingChars <= 50
  const isOverLimit = remainingChars < 0

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-3', className)}>
      {/* 텍스트 영역 */}
      <div className={cn(
        'relative border rounded-lg transition-colors',
        isFocused 
          ? 'border-primary-500 dark:border-primary-400 ring-1 ring-primary-500 dark:ring-primary-400' 
          : 'border-gray-200 dark:border-gray-700',
        isOverLimit && 'border-red-500 dark:border-red-400 ring-1 ring-red-500 dark:ring-red-400'
      )}>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          className={cn(
            'w-full px-3 py-2 text-sm bg-transparent border-none resize-none',
            'placeholder:text-gray-500 dark:placeholder:text-gray-400',
            'focus:outline-none focus:ring-0',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'min-h-[80px] max-h-[150px]'
          )}
          style={{ overflow: 'hidden' }}
          maxLength={maxLength}
          aria-label="댓글 내용"
          aria-describedby="comment-help"
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

      {/* 도움말 텍스트 */}
      <div id="comment-help" className="text-xs text-gray-500 dark:text-gray-400">
        <div>
          • 최소 {minLength}자 이상 입력해주세요
        </div>
        <div>
          • Ctrl/Cmd + Enter로 빠르게 제출할 수 있습니다
        </div>
        {showCancel && (
          <div>
            • Escape키로 취소할 수 있습니다
          </div>
        )}
      </div>

      {/* 버튼 영역 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* 에러 메시지 */}
          {isOverLimit && (
            <span className="text-sm text-red-500 dark:text-red-400">
              글자 수 제한을 초과했습니다
            </span>
          )}
          {content.trim().length > 0 && content.trim().length < minLength && (
            <span className="text-sm text-yellow-600 dark:text-yellow-400">
              {minLength - content.trim().length}자 더 입력해주세요
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* 취소 버튼 */}
          {showCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={isLoading}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-4 h-4 mr-1" />
              {cancelText}
            </Button>
          )}

          {/* 제출 버튼 */}
          <Button
            type="submit"
            size="sm"
            disabled={isSubmitDisabled}
            loading={isLoading}
            className="bg-primary-500 hover:bg-primary-600 text-white"
          >
            <Send className="w-4 h-4 mr-1" />
            {submitText}
          </Button>
        </div>
      </div>
    </form>
  )
}
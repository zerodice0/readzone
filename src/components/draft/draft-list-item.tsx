'use client'

import { useState, forwardRef, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DraftPreview } from './draft-preview'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { Draft } from './draft-restoration-modal'
import { AccessibilityStyles } from './draft-accessibility-styles'

interface DraftListItemProps {
  draft: Draft
  onContinue: () => void
  onDelete: () => void
  isDeleting?: boolean
  role?: string
}

export const DraftListItem = forwardRef<HTMLButtonElement, DraftListItemProps>(({ 
  draft, 
  onContinue, 
  onDelete, 
  isDeleting = false,
  role 
}, ref) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const deleteButtonRef = useRef<HTMLButtonElement>(null)
  const continueButtonRef = useRef<HTMLButtonElement>(null)
  
  const timeAgo = formatDistanceToNow(new Date(draft.updatedAt), { 
    addSuffix: true, 
    locale: ko 
  })

  const expiresIn = formatDistanceToNow(new Date(draft.expiresAt), { 
    locale: ko 
  })

  const isExpiringSoon = new Date(draft.expiresAt).getTime() - Date.now() < 24 * 60 * 60 * 1000

  const handleDeleteClick = () => {
    if (showDeleteConfirm) {
      onDelete()
      setShowDeleteConfirm(false)
    } else {
      setShowDeleteConfirm(true)
      // Auto-hide confirmation after 5 seconds
      setTimeout(() => setShowDeleteConfirm(false), 5000)
    }
  }

  // Handle keyboard navigation within draft item
  const handleKeyDown = (e: React.KeyboardEvent, buttonType: 'continue' | 'delete') => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault()
      if (buttonType === 'continue' && e.key === 'ArrowRight') {
        deleteButtonRef.current?.focus()
      } else if (buttonType === 'delete' && e.key === 'ArrowLeft') {
        continueButtonRef.current?.focus()
      }
    }
  }

  // Focus management for delete confirmation
  useEffect(() => {
    if (showDeleteConfirm && deleteButtonRef.current) {
      deleteButtonRef.current.focus()
    }
  }, [showDeleteConfirm])

  return (
    <Card 
      className={`transition-all duration-200 hover:shadow-md ${
        isDeleting ? 'opacity-50 pointer-events-none' : ''
      }`}
      role={role}
      aria-label={`${draft.bookTitle} 독후감 초안`}
    >
      <CardContent className="p-4">
        <div className="flex gap-4" role="group" aria-labelledby={`draft-title-${draft.id}`}>
          {/* Book Thumbnail */}
          <div className="flex-shrink-0">
            {draft.bookThumbnail ? (
              <div className="relative w-12 h-16 rounded overflow-hidden bg-gray-200 dark:bg-gray-700">
                <Image
                  src={draft.bookThumbnail}
                  alt={`"${draft.bookTitle}" 도서 표지`}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
            ) : (
              <div className="w-12 h-16 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center" aria-label="도서 표지 없음">
                <svg 
                  className="w-6 h-6 text-gray-400 dark:text-gray-500" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 
                  id={`draft-title-${draft.id}`}
                  className="font-medium text-gray-900 dark:text-gray-100 truncate"
                >
                  {draft.bookTitle}
                </h3>
                <div 
                  className="flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400"
                  aria-label={`저장 시간: ${timeAgo}${isExpiringSoon ? `, ${expiresIn} 후 삭제 예정` : ''}`}
                >
                  <span>{timeAgo} 저장</span>
                  {isExpiringSoon && (
                    <>
                      <span aria-hidden="true">•</span>
                      <span 
                        className="text-amber-600 dark:text-amber-400 font-medium"
                        role="alert"
                        aria-label="위험: 공되 삭제 예정"
                      >
                        {expiresIn} 후 삭제됨
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div 
                className="flex items-center gap-2"
                role="group"
                aria-label={`${draft.bookTitle} 작업`}
              >
                <Button
                  ref={ref || continueButtonRef}
                  onClick={onContinue}
                  size="sm"
                  className={`h-8 px-3 ${AccessibilityStyles.focusRing} ${AccessibilityStyles.button.primary}`}
                  disabled={isDeleting}
                  aria-label={`"${draft.bookTitle}" 독후감 이어서 작성`}
                  onKeyDown={(e) => handleKeyDown(e, 'continue')}
                >
                  이어서 작성
                </Button>
                <Button
                  ref={deleteButtonRef}
                  onClick={handleDeleteClick}
                  size="sm"
                  variant={showDeleteConfirm ? "destructive" : "ghost"}
                  className={`h-8 px-3 ${AccessibilityStyles.focusRing} ${
                    showDeleteConfirm 
                      ? AccessibilityStyles.button.destructive
                      : AccessibilityStyles.button.ghost
                  }`}
                  disabled={isDeleting}
                  aria-label={showDeleteConfirm ? `"${draft.bookTitle}" 독후감 삭제 확인` : `"${draft.bookTitle}" 독후감 삭제`}
                  aria-pressed={showDeleteConfirm}
                  onKeyDown={(e) => handleKeyDown(e, 'delete')}
                >
                  {isDeleting ? (
                    <>
                      <svg 
                        className="w-3 h-3 animate-spin" 
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <circle 
                          className="opacity-25" 
                          cx="12" 
                          cy="12" 
                          r="10" 
                          stroke="currentColor" 
                          strokeWidth="4"
                        />
                        <path 
                          className="opacity-75" 
                          fill="currentColor" 
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <span className="sr-only">삭제 중</span>
                    </>
                  ) : showDeleteConfirm ? (
                    '확인'
                  ) : (
                    '삭제'
                  )}
                </Button>
              </div>
            </div>

            {/* Preview Content */}
            <div className="mt-3" role="region" aria-label="독후감 미리보기">
              <DraftPreview content={draft.previewContent} />
            </div>
          </div>
        </div>

        {/* Warning for expiring drafts */}
        {isExpiringSoon && (
          <div 
            className={`mt-3 p-2 rounded text-sm ${AccessibilityStyles.status.warning}`}
            role="alert"
            aria-label="만료 경고"
          >
            <span className="font-medium">주의:</span> 이 임시저장 글은 곧 자동으로 삭제됩니다. 계속 보관하려면 이어서 작성하세요.
          </div>
        )}
      </CardContent>
    </Card>
  )
})

DraftListItem.displayName = 'DraftListItem'
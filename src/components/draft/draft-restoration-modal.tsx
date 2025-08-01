'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { DraftListItem } from './draft-list-item'
import { EmptyDraftState } from './empty-draft-state'

export interface Draft {
  id: string
  bookTitle: string
  bookThumbnail?: string
  updatedAt: string
  previewContent: string
  expiresAt: string
  bookId?: string
}

interface DraftRestorationModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  drafts: Draft[]
  onContinueDraft: (draftId: string) => void
  onDeleteDraft: (draftId: string) => void
  onCreateNew: () => void
  loading?: boolean
}

export function DraftRestorationModal({
  isOpen,
  onOpenChange,
  drafts,
  onContinueDraft,
  onDeleteDraft,
  onCreateNew,
  loading = false
}: DraftRestorationModalProps) {
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
  const [announcement, setAnnouncement] = useState('')
  const firstDraftRef = useRef<HTMLButtonElement>(null)
  const liveRegionRef = useRef<HTMLDivElement>(null)

  const handleDeleteDraft = async (draftId: string) => {
    const draft = drafts.find(d => d.id === draftId)
    const bookTitle = draft?.bookTitle || '독후감'
    
    setDeletingIds(prev => new Set([...Array.from(prev), draftId]))
    setAnnouncement(`${bookTitle} 삭제 중...`)
    
    try {
      await onDeleteDraft(draftId)
      setAnnouncement(`${bookTitle} 삭제 완료`)
    } catch (error) {
      setAnnouncement(`${bookTitle} 삭제 실패`)
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(Array.from(prev))
        newSet.delete(draftId)
        return newSet
      })
    }
  }

  // Auto-close modal when no drafts remain
  useEffect(() => {
    if (isOpen && drafts.length === 0 && !loading) {
      setAnnouncement('저장된 독후감이 없습니다. 새 독후감 작성 페이지로 이동합니다.')
      const timer = setTimeout(() => {
        onOpenChange(false)
        onCreateNew()
      }, 500)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [drafts.length, isOpen, loading, onOpenChange, onCreateNew])

  // Auto-focus first draft when modal opens
  useEffect(() => {
    if (isOpen && !loading && drafts.length > 0) {
      const timer = setTimeout(() => {
        firstDraftRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [isOpen, loading, drafts.length])

  // Announce modal state changes
  useEffect(() => {
    if (isOpen && !loading) {
      if (drafts.length === 0) {
        setAnnouncement('저장된 독후감이 없습니다.')
      } else {
        setAnnouncement(`${drafts.length}개의 저장된 독후감을 찾았습니다.`)
      }
    }
    return undefined
  }, [isOpen, loading, drafts.length])

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-hidden p-0"
        aria-describedby="draft-modal-description"
        onOpenAutoFocus={(e) => {
          // Prevent auto-focus on dialog content, we'll focus first draft instead
          e.preventDefault()
        }}
      >
        <DialogHeader className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
              <svg 
                className="w-4 h-4 text-primary-600 dark:text-primary-400" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <DialogTitle 
              className="text-xl"
              id="draft-modal-title"
            >
              작성하던 독후감이 있습니다
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Live region for screen reader announcements */}
        <div 
          ref={liveRegionRef}
          className="sr-only" 
          aria-live="polite" 
          aria-atomic="true"
        >
          {announcement}
        </div>

        <div 
          className="px-6 pb-6 space-y-4 max-h-[60vh] overflow-y-auto"
          id="draft-modal-description"
          role="main"
          aria-labelledby="draft-modal-title"
        >
          {loading ? (
            <div className="space-y-3" role="status" aria-label="독후감 목록 로딩 중">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                </div>
              ))}
              <span className="sr-only">독후감 목록을 불러오는 중입니다...</span>
            </div>
          ) : drafts.length > 0 ? (
            <div 
              className="space-y-3" 
              role="list" 
              aria-label={`${drafts.length}개의 저장된 독후감`}
            >
              {drafts.map((draft, index) => (
                <DraftListItem
                  key={draft.id}
                  draft={draft}
                  onContinue={() => onContinueDraft(draft.id)}
                  onDelete={() => handleDeleteDraft(draft.id)}
                  isDeleting={deletingIds.has(draft.id)}
                  ref={index === 0 ? firstDraftRef : undefined}
                  role="listitem"
                />
              ))}
            </div>
          ) : (
            <EmptyDraftState />
          )}

          {/* Actions */}
          <div 
            className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700"
            role="group"
            aria-label="독후감 작성 옵션"
          >
            <Button
              onClick={onCreateNew}
              className="flex-1 h-12"
              variant="outline"
              aria-describedby="new-review-help"
            >
              <svg 
                className="w-4 h-4 mr-2" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              새 독후감 작성
            </Button>
            <Button
              onClick={() => onOpenChange(false)}
              variant="ghost"
              className="h-12"
              aria-label="모달 닫기"
            >
              취소
            </Button>
            <div id="new-review-help" className="sr-only">
              저장된 독후감을 사용하지 않고 새로운 독후감을 작성합니다.
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
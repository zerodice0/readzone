'use client'

import { useSession } from 'next-auth/react'
import { DraftRestorationModal } from './draft-restoration-modal'
import { useDraftRestoration } from './draft-restoration-hook'
import { DraftErrorBoundary, useDraftErrorHandler } from './draft-error-boundary'
import { AccessibilityStyles } from './draft-accessibility-styles'

interface DraftRestorationWrapperProps {
  /** Whether to automatically show modal when drafts are found */
  autoShow?: boolean
  /** Custom className for styling */
  className?: string
}

/**
 * Wrapper component that handles draft restoration logic
 * Should be placed in write page layout or similar
 */
export function DraftRestorationWrapper({ 
  autoShow = true,
  className = ''
}: DraftRestorationWrapperProps) {
  const { data: session } = useSession()
  const { handleError } = useDraftErrorHandler()
  
  const {
    drafts,
    isModalOpen,
    loading,
    error,
    hideModal,
    continueDraft,
    deleteDraft,
    createNewReview,
  } = useDraftRestoration({ 
    userId: session?.user?.id,
    autoShow 
  })

  // Handle errors with proper context
  const onDraftError = (error: Error, errorInfo: any) => {
    const errorDetails = handleError(error, 'Draft restoration')
    console.error('Draft restoration error:', errorDetails, errorInfo)
  }

  // Don't render anything if user is not logged in
  if (!session?.user?.id) {
    return null
  }

  return (
    <div className={className}>
      <DraftErrorBoundary onError={onDraftError}>
        <DraftRestorationModal
          isOpen={isModalOpen}
          onOpenChange={hideModal}
          drafts={drafts}
          onContinueDraft={continueDraft}
          onDeleteDraft={deleteDraft}
          onCreateNew={createNewReview}
          loading={loading}
        />
      </DraftErrorBoundary>
      
      {/* Enhanced error handling with accessibility - 조용한 처리 */}
      {error && error.includes('서버 오류') && (
        <div 
          className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 ${AccessibilityStyles.status.error}`}
          role="alert"
          aria-live="assertive"
          aria-label="독후감 초안 오류"
        >
          <p className="text-sm font-medium">{error}</p>
          <button 
            className="text-xs underline mt-1 hover:no-underline"
            onClick={() => window.location.reload()}
          >
            새로고침
          </button>
        </div>
      )}
    </div>
  )
}
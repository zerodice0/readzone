'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Draft } from './draft-restoration-modal'

interface UseDraftRestorationOptions {
  userId?: string
  autoShow?: boolean
}

export function useDraftRestoration({ 
  userId, 
  autoShow = true 
}: UseDraftRestorationOptions = {}) {
  const router = useRouter()
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDrafts = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/reviews/draft', {
        headers: {
          'Cache-Control': 'no-cache',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch drafts')
      }

      const data = await response.json()
      const fetchedDrafts = data.data || []
      
      setDrafts(fetchedDrafts)
      
      // Auto-show modal if drafts exist
      if (fetchedDrafts.length > 0 && autoShow) {
        setIsModalOpen(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('Error fetching drafts:', err)
    } finally {
      setLoading(false)
    }
  }, [userId, autoShow])

  // Fetch drafts when component mounts
  useEffect(() => {
    if (userId && autoShow) {
      fetchDrafts()
    }
  }, [userId, autoShow, fetchDrafts])

  const continueDraft = async (draftId: string) => {
    try {
      // Navigate to write page with draft ID
      const currentUrl = new URL(window.location.href)
      currentUrl.searchParams.set('draft', draftId)
      router.push(currentUrl.pathname + currentUrl.search)
      setIsModalOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to continue draft')
    }
  }

  const deleteDraft = async (draftId: string) => {
    try {
      const response = await fetch(`/api/reviews/draft/${draftId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete draft')
      }

      // Remove draft from local state
      setDrafts(prev => prev.filter(draft => draft.id !== draftId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete draft')
      throw err // Re-throw to handle in component
    }
  }

  const createNewReview = () => {
    router.push('/write')
    setIsModalOpen(false)
  }

  const showModal = () => {
    setIsModalOpen(true)
  }

  const hideModal = () => {
    setIsModalOpen(false)
  }

  return {
    drafts,
    isModalOpen,
    loading,
    error,
    showModal,
    hideModal,
    continueDraft,
    deleteDraft,
    createNewReview,
    refetchDrafts: fetchDrafts,
  }
}
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
      // 쿼리 파라미터 추가하여 API 검증 통과
      const response = await fetch('/api/reviews/draft?page=1&limit=10&includeExpired=false', {
        headers: {
          'Cache-Control': 'no-cache',
        },
      })

      if (!response.ok) {
        // 상태 코드별 세분화된 에러 처리
        if (response.status === 401) {
          setError('로그인이 만료되었습니다. 다시 로그인해주세요.')
          return
        }
        if (response.status >= 500) {
          setError('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
          return
        }
        // 400 등 기타 에러는 조용히 처리 (사용자 차단 안함)
        console.warn('Draft fetch failed with status:', response.status)
        return // 에러 상태 설정하지 않고 조용히 실패
      }

      const data = await response.json()
      const fetchedDrafts = data.data?.items || [] // API 응답 구조에 맞게 수정
      
      setDrafts(fetchedDrafts)
      
      // Auto-show modal if drafts exist
      if (fetchedDrafts.length > 0 && autoShow) {
        setIsModalOpen(true)
      }
    } catch (err) {
      // 네트워크 에러 등은 콘솔에만 로그, 사용자 차단하지 않음
      console.error('Network error fetching drafts:', err)
      // 네트워크 에러도 페이지 진입을 차단하지 않도록 에러 설정 안함
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
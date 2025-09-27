import { useCallback, useRef, useState } from 'react'
import type { UseConfirmationReturn } from '@/types'

interface ConfirmationOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'danger'
}

interface ConfirmationState extends ConfirmationOptions {
  isOpen: boolean
  onResolve: (confirmed: boolean) => void
}

/**
 * 확인 다이얼로그 커스텀 훅
 * Promise 기반 확인 모달 관리
 */
export function useConfirmation(): UseConfirmationReturn {
  const [state, setState] = useState<ConfirmationState>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '확인',
    cancelText: '취소',
    variant: 'default',
    onResolve: () => { /* Default empty resolver */ },
  })

  const resolveRef = useRef<(confirmed: boolean) => void>(() => { /* Default empty resolver */ })

  /**
   * 확인 다이얼로그 표시
   * @param options 다이얼로그 옵션
   * @returns Promise<boolean> - 사용자의 확인(true) 또는 취소(false)
   */
  const showConfirmation = useCallback((options: ConfirmationOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve

      setState({
        isOpen: true,
        title: options.title,
        message: options.message,
        confirmText: options.confirmText ?? '확인',
        cancelText: options.cancelText ?? '취소',
        variant: options.variant ?? 'default',
        onResolve: resolve,
      })
    })
  }, [])

  /**
   * 확인 처리
   */
  const handleConfirm = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }))
    if (resolveRef.current) {
      resolveRef.current(true)
    }
  }, [])

  /**
   * 취소 처리
   */
  const handleCancel = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }))
    if (resolveRef.current) {
      resolveRef.current(false)
    }
  }, [])

  /**
   * 모달 닫기 (취소와 동일)
   */
  const handleClose = useCallback(() => {
    handleCancel()
  }, [handleCancel])

  /**
   * 확인 모달 컴포넌트
   */
  const ConfirmationModal = useCallback(() => {
    if (!state.isOpen) {return null}

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* 오버레이 */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={handleClose}
        />

        {/* 모달 콘텐츠 */}
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
          {/* 제목 */}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {state.title}
          </h3>

          {/* 메시지 */}
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {state.message}
          </p>

          {/* 버튼 */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              {state.cancelText}
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              className={`px-4 py-2 text-white rounded-lg transition-colors ${
                state.variant === 'danger'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {state.confirmText}
            </button>
          </div>
        </div>
      </div>
    )
  }, [state, handleConfirm, handleCancel, handleClose])

  return {
    showConfirmation,
    ConfirmationModal,
  }
}

/**
 * 위험한 작업용 확인 다이얼로그 훅
 * 기본적으로 위험한 스타일 적용
 */
export function useDangerConfirmation() {
  const confirmation = useConfirmation()

  const showDangerConfirmation = useCallback(
    (options: Omit<ConfirmationOptions, 'variant'>) => {
      return confirmation.showConfirmation({
        ...options,
        variant: 'danger',
        confirmText: options.confirmText ?? '삭제',
        cancelText: options.cancelText ?? '취소',
      })
    },
    [confirmation]
  )

  return {
    ...confirmation,
    showDangerConfirmation,
  }
}

/**
 * 계정 삭제 확인 다이얼로그 훅
 * 특별한 확인 절차 포함
 */
export function useAccountDeletionConfirmation() {
  // const [step, setStep] = useState(0)
  // const [confirmationText, setConfirmationText] = useState('')
  const confirmation = useConfirmation()

  /**
   * 계정 삭제 확인 다이얼로그 표시
   */
  const showAccountDeletionConfirmation = useCallback(async (): Promise<boolean> => {
    // 1단계: 일반 확인
    const firstConfirm = await confirmation.showConfirmation({
      title: '정말 계정을 삭제하시겠습니까?',
      message: '계정 삭제 시 모든 독후감, 댓글, 좋아요 등이 영구적으로 삭제되며, 30일 후 완전히 삭제됩니다.',
      confirmText: '삭제 진행',
      cancelText: '취소',
      variant: 'danger',
    })

    if (!firstConfirm) {return false}

    // 2단계: 타이핑 확인
    return new Promise((resolve) => {
      const modal = document.createElement('div')

      modal.className = 'fixed inset-0 z-50 flex items-center justify-center'

      modal.innerHTML = `
        <div class="fixed inset-0 bg-black bg-opacity-50"></div>
        <div class="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
          <h3 class="text-lg font-semibold text-red-600 mb-4">계정 삭제 최종 확인</h3>
          <p class="text-gray-600 dark:text-gray-300 mb-4">
            정말로 계정을 삭제하시겠습니까? 아래에 <strong>"계정 삭제"</strong>를 입력해주세요.
          </p>
          <input
            type="text"
            placeholder="계정 삭제"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 mb-4"
            id="deletion-confirm-input"
          />
          <div class="flex justify-end space-x-3">
            <button
              type="button"
              class="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              id="deletion-cancel-btn"
            >
              취소
            </button>
            <button
              type="button"
              class="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              id="deletion-confirm-btn"
              disabled
            >
              계정 삭제
            </button>
          </div>
        </div>
      `

      document.body.appendChild(modal)

      const input = modal.querySelector('#deletion-confirm-input') as HTMLInputElement
      const confirmBtn = modal.querySelector('#deletion-confirm-btn') as HTMLButtonElement
      const cancelBtn = modal.querySelector('#deletion-cancel-btn') as HTMLButtonElement

      // 입력 검증
      input.addEventListener('input', () => {
        confirmBtn.disabled = input.value !== '계정 삭제'
      })

      // 확인 버튼
      confirmBtn.addEventListener('click', () => {
        document.body.removeChild(modal)
        resolve(true)
      })

      // 취소 버튼
      cancelBtn.addEventListener('click', () => {
        document.body.removeChild(modal)
        resolve(false)
      })

      // ESC 키로 취소
      const handleKeydown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          document.body.removeChild(modal)
          resolve(false)
          document.removeEventListener('keydown', handleKeydown)
        }
      }

      document.addEventListener('keydown', handleKeydown)
      input.focus()
    })
  }, [confirmation])

  return {
    showAccountDeletionConfirmation,
  }
}

/**
 * 저장되지 않은 변경사항 확인 훅
 * 페이지 이탈 시 확인
 */
export function useUnsavedChangesConfirmation() {
  const confirmation = useConfirmation()

  /**
   * 저장되지 않은 변경사항 확인
   */
  const confirmUnsavedChanges = useCallback(
    () => {
      return confirmation.showConfirmation({
        title: '저장되지 않은 변경사항',
        message: '저장되지 않은 변경사항이 있습니다. 정말 나가시겠습니까?',
        confirmText: '나가기',
        cancelText: '계속 편집',
        variant: 'default',
      })
    },
    [confirmation]
  )

  /**
   * 브라우저 이탈 방지 설정
   */
  const setupBeforeUnloadProtection = useCallback(
    (hasUnsavedChanges: boolean) => {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        if (hasUnsavedChanges) {
          e.preventDefault()
          e.returnValue = '저장되지 않은 변경사항이 있습니다. 정말 나가시겠습니까?'
        }
      }

      if (hasUnsavedChanges) {
        window.addEventListener('beforeunload', handleBeforeUnload)
      } else {
        window.removeEventListener('beforeunload', handleBeforeUnload)
      }

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload)
      }
    },
    []
  )

  return {
    ...confirmation,
    confirmUnsavedChanges,
    setupBeforeUnloadProtection,
  }
}
import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useDebounce } from './use-debounce'

/**
 * 자동저장 상태
 */
export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error'

/**
 * 저장 전략
 */
export type SaveStrategy = 'localStorage' | 'server' | 'both'

/**
 * 자동저장 옵션
 */
export interface UseAutosaveOptions<T> {
  /** 저장 키 (localStorage용) */
  key: string
  /** 저장할 데이터 */
  data: T
  /** 자동저장 간격 (밀리초, 기본: 30초) */
  interval?: number
  /** 디바운스 시간 (밀리초, 기본: 1초) */
  debounceMs?: number
  /** 저장 전략 */
  storage?: SaveStrategy
  /** 서버 저장 함수 */
  onSave?: (data: T) => Promise<void>
  /** 에러 핸들러 */
  onError?: (error: Error) => void
  /** 성공 콜백 */
  onSuccess?: () => void
  /** 자동저장 활성화 여부 */
  enabled?: boolean
  /** 변경 감지 함수 (기본: JSON 비교) */
  isEqual?: (a: T, b: T) => boolean
  /** 최대 재시도 횟수 */
  maxRetries?: number
}

/**
 * 자동저장 반환값
 */
export interface UseAutosaveReturn {
  /** 수동 저장 트리거 */
  save: () => Promise<void>
  /** 자동저장 취소 */
  cancel: () => void
  /** 현재 상태 */
  status: AutosaveStatus
  /** 마지막 저장 시간 */
  lastSaved: Date | null
  /** 에러 정보 */
  error: Error | null
  /** 자동저장 활성화 상태 */
  isEnabled: boolean
  /** 저장 중 여부 */
  isSaving: boolean
  /** localStorage에서 데이터 복구 */
  restore: () => T | null
  /** 저장된 데이터 삭제 */
  clear: () => void
}

/**
 * 자동저장 훅
 * 
 * @example
 * ```tsx
 * const { save, status, lastSaved } = useAutosave({
 *   key: 'review-draft',
 *   data: { title, content },
 *   interval: 30000, // 30초
 *   storage: 'both',
 *   onSave: async (data) => {
 *     await api.saveDraft(data)
 *   }
 * })
 * ```
 */
export function useAutosave<T>({
  key,
  data,
  interval = 30000, // 30초
  debounceMs = 1000, // 1초
  storage = 'localStorage',
  onSave,
  onError,
  onSuccess,
  enabled = true,
  isEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b),
  maxRetries = 3
}: UseAutosaveOptions<T>): UseAutosaveReturn {
  const [status, setStatus] = useState<AutosaveStatus>('idle')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Refs for persistent values
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const retryCountRef = useRef(0)
  const lastSavedDataRef = useRef<T | null>(null)
  const isMountedRef = useRef(true)
  const abortControllerRef = useRef<AbortController | null>(null)

  // 디바운스된 데이터
  const debouncedData = useDebounce(data, debounceMs)

  /**
   * localStorage에 저장
   */
  const saveToLocalStorage = useCallback((dataToSave: T): void => {
    try {
      const storageData = {
        data: dataToSave,
        timestamp: new Date().toISOString(),
        version: 1
      }
      localStorage.setItem(key, JSON.stringify(storageData))
    } catch (err) {
      // Storage quota exceeded or other errors
      console.error('localStorage save failed:', err)
      throw new Error('로컬 저장소에 저장할 수 없습니다.')
    }
  }, [key])

  /**
   * localStorage에서 복구
   */
  const restore = useCallback((): T | null => {
    try {
      const stored = localStorage.getItem(key)
      if (!stored) return null

      const { data: restoredData, timestamp } = JSON.parse(stored)
      
      // 24시간 이상 오래된 데이터는 무시
      const savedTime = new Date(timestamp)
      const now = new Date()
      const hoursDiff = (now.getTime() - savedTime.getTime()) / (1000 * 60 * 60)
      
      if (hoursDiff > 24) {
        localStorage.removeItem(key)
        return null
      }

      return restoredData as T
    } catch (err) {
      console.error('localStorage restore failed:', err)
      return null
    }
  }, [key])

  /**
   * 저장된 데이터 삭제
   */
  const clear = useCallback((): void => {
    try {
      localStorage.removeItem(key)
      lastSavedDataRef.current = null
      setLastSaved(null)
      setStatus('idle')
      setError(null)
    } catch (err) {
      console.error('Clear storage failed:', err)
    }
  }, [key])

  /**
   * 실제 저장 로직
   */
  const performSave = useCallback(async (dataToSave: T, isManual = false): Promise<void> => {
    // 이미 저장 중이면 스킵 (수동 저장 제외)
    if (isSaving && !isManual) return

    // 변경사항이 없으면 스킵
    if (!isManual && lastSavedDataRef.current && isEqual(dataToSave, lastSavedDataRef.current)) {
      return
    }

    setIsSaving(true)
    setStatus('saving')
    setError(null)

    try {
      // Abort previous save if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      abortControllerRef.current = new AbortController()

      // localStorage 저장
      if (storage === 'localStorage' || storage === 'both') {
        saveToLocalStorage(dataToSave)
      }

      // 서버 저장
      if ((storage === 'server' || storage === 'both') && onSave) {
        await onSave(dataToSave)
      }

      // 성공 처리
      if (isMountedRef.current) {
        lastSavedDataRef.current = dataToSave
        setLastSaved(new Date())
        setStatus('saved')
        setError(null)
        retryCountRef.current = 0
        onSuccess?.()
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // 취소된 요청은 무시
        return
      }

      const error = err instanceof Error ? err : new Error('저장 중 오류가 발생했습니다.')
      
      if (isMountedRef.current) {
        setStatus('error')
        setError(error)
        onError?.(error)

        // 재시도 로직 (서버 저장 실패 시)
        if (storage !== 'localStorage' && retryCountRef.current < maxRetries) {
          retryCountRef.current++
          const retryDelay = Math.min(1000 * Math.pow(2, retryCountRef.current), 10000) // 최대 10초
          
          setTimeout(() => {
            if (isMountedRef.current && enabled) {
              performSave(dataToSave, false)
            }
          }, retryDelay)
        }
      }
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false)
      }
    }
  }, [isSaving, isEqual, storage, saveToLocalStorage, onSave, onSuccess, onError, maxRetries, enabled])

  /**
   * 수동 저장
   */
  const save = useCallback(async (): Promise<void> => {
    await performSave(data, true)
  }, [data, performSave])

  /**
   * 자동저장 취소
   */
  const cancel = useCallback((): void => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }, [])

  /**
   * 자동저장 설정
   */
  useEffect(() => {
    if (!enabled) {
      cancel()
      return
    }

    // 주기적 자동저장
    const intervalId = setInterval(() => {
      if (isMountedRef.current && !isSaving) {
        performSave(debouncedData, false)
      }
    }, interval)

    return () => {
      clearInterval(intervalId)
    }
  }, [enabled, interval, debouncedData, isSaving, performSave, cancel])

  /**
   * 데이터 변경 시 자동저장
   */
  useEffect(() => {
    if (!enabled) return

    // 즉시 저장이 필요한 경우 (첫 렌더링 제외)
    if (lastSavedDataRef.current !== null) {
      performSave(debouncedData, false)
    }
  }, [debouncedData, enabled, performSave])

  /**
   * beforeunload 이벤트 처리
   */
  useEffect(() => {
    if (!enabled) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // 저장되지 않은 변경사항이 있는 경우
      if (lastSavedDataRef.current && !isEqual(data, lastSavedDataRef.current)) {
        // 동기적으로 localStorage에 저장
        try {
          saveToLocalStorage(data)
        } catch (err) {
          console.error('Emergency save failed:', err)
        }

        // 브라우저 확인 대화상자 표시
        const message = '저장하지 않은 변경사항이 있습니다. 정말 나가시겠습니까?'
        e.preventDefault()
        e.returnValue = message
        return message
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [enabled, data, isEqual, saveToLocalStorage])

  /**
   * 컴포넌트 언마운트 시 정리
   */
  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
      cancel()
      
      // 언마운트 시 마지막 저장 시도
      if (enabled && lastSavedDataRef.current && !isEqual(data, lastSavedDataRef.current)) {
        try {
          saveToLocalStorage(data)
        } catch (err) {
          console.error('Cleanup save failed:', err)
        }
      }
    }
  }, [])

  // 반환값 메모이제이션
  const returnValue = useMemo<UseAutosaveReturn>(() => ({
    save,
    cancel,
    status,
    lastSaved,
    error,
    isEnabled: enabled,
    isSaving,
    restore,
    clear
  }), [save, cancel, status, lastSaved, error, enabled, isSaving, restore, clear])

  return returnValue
}

/**
 * 자동저장 상태 포맷터
 */
export function formatAutosaveStatus(status: AutosaveStatus, lastSaved: Date | null): string {
  switch (status) {
    case 'idle':
      return lastSaved ? `마지막 저장: ${formatTime(lastSaved)}` : '저장된 내용 없음'
    case 'saving':
      return '저장 중...'
    case 'saved':
      return `저장됨 (${formatTime(lastSaved || new Date())})`
    case 'error':
      return '저장 실패'
    default:
      return ''
  }
}

/**
 * 시간 포맷터
 */
function formatTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (seconds < 60) {
    return '방금 전'
  } else if (minutes < 60) {
    return `${minutes}분 전`
  } else if (hours < 24) {
    return `${hours}시간 전`
  } else {
    return date.toLocaleDateString()
  }
}
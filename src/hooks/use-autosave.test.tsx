/**
 * useAutosave 훅 테스트 시나리오
 * 
 * 이 파일은 자동저장 훅의 다양한 시나리오를 테스트하기 위한 가이드입니다.
 * 실제 테스트 구현 시 Jest와 React Testing Library를 사용하세요.
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { useAutosave } from './use-autosave'

describe('useAutosave', () => {
  beforeEach(() => {
    // localStorage 초기화
    localStorage.clear()
    jest.clearAllTimers()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  /**
   * 1. 기본 동작 테스트
   */
  test('초기 상태가 올바르게 설정되어야 한다', () => {
    const { result } = renderHook(() => 
      useAutosave({
        key: 'test',
        data: { content: 'test' }
      })
    )

    expect(result.current.status).toBe('idle')
    expect(result.current.lastSaved).toBeNull()
    expect(result.current.error).toBeNull()
    expect(result.current.isSaving).toBe(false)
    expect(result.current.isEnabled).toBe(true)
  })

  /**
   * 2. localStorage 저장 테스트
   */
  test('localStorage에 데이터가 저장되어야 한다', async () => {
    const testData = { title: 'Test', content: 'Content' }
    
    const { result } = renderHook(() => 
      useAutosave({
        key: 'test-local',
        data: testData,
        storage: 'localStorage',
        debounceMs: 100
      })
    )

    // 디바운스 대기
    act(() => {
      jest.advanceTimersByTime(100)
    })

    await waitFor(() => {
      expect(result.current.status).toBe('saved')
    })

    const saved = localStorage.getItem('test-local')
    expect(saved).not.toBeNull()
    
    const parsed = JSON.parse(saved!)
    expect(parsed.data).toEqual(testData)
  })

  /**
   * 3. 서버 저장 테스트
   */
  test('서버에 데이터가 저장되어야 한다', async () => {
    const mockSave = jest.fn().mockResolvedValue(undefined)
    const testData = { content: 'Server test' }

    const { result } = renderHook(() => 
      useAutosave({
        key: 'test-server',
        data: testData,
        storage: 'server',
        onSave: mockSave,
        debounceMs: 100
      })
    )

    act(() => {
      jest.advanceTimersByTime(100)
    })

    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledWith(testData)
      expect(result.current.status).toBe('saved')
    })
  })

  /**
   * 4. 에러 처리 테스트
   */
  test('저장 실패 시 에러가 처리되어야 한다', async () => {
    const mockError = new Error('Save failed')
    const mockSave = jest.fn().mockRejectedValue(mockError)
    const mockOnError = jest.fn()

    const { result } = renderHook(() => 
      useAutosave({
        key: 'test-error',
        data: { content: 'Error test' },
        storage: 'server',
        onSave: mockSave,
        onError: mockOnError,
        debounceMs: 100,
        maxRetries: 1
      })
    )

    act(() => {
      jest.advanceTimersByTime(100)
    })

    await waitFor(() => {
      expect(result.current.status).toBe('error')
      expect(result.current.error).toEqual(mockError)
      expect(mockOnError).toHaveBeenCalledWith(mockError)
    })
  })

  /**
   * 5. 재시도 로직 테스트
   */
  test('실패 시 재시도가 수행되어야 한다', async () => {
    let attemptCount = 0
    const mockSave = jest.fn().mockImplementation(() => {
      attemptCount++
      if (attemptCount < 3) {
        return Promise.reject(new Error('Retry test'))
      }
      return Promise.resolve()
    })

    const { result } = renderHook(() => 
      useAutosave({
        key: 'test-retry',
        data: { content: 'Retry test' },
        storage: 'server',
        onSave: mockSave,
        debounceMs: 100,
        maxRetries: 3
      })
    )

    // 첫 시도
    act(() => {
      jest.advanceTimersByTime(100)
    })

    // 재시도들
    for (let i = 0; i < 3; i++) {
      act(() => {
        jest.advanceTimersByTime(Math.pow(2, i + 1) * 1000)
      })
    }

    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledTimes(3)
      expect(result.current.status).toBe('saved')
    })
  })

  /**
   * 6. 수동 저장 테스트
   */
  test('수동 저장이 즉시 실행되어야 한다', async () => {
    const mockSave = jest.fn().mockResolvedValue(undefined)

    const { result } = renderHook(() => 
      useAutosave({
        key: 'test-manual',
        data: { content: 'Manual save' },
        storage: 'server',
        onSave: mockSave,
        interval: 60000 // 1분 (자동저장 방지)
      })
    )

    await act(async () => {
      await result.current.save()
    })

    expect(mockSave).toHaveBeenCalled()
    expect(result.current.status).toBe('saved')
  })

  /**
   * 7. 데이터 복구 테스트
   */
  test('localStorage에서 데이터를 복구할 수 있어야 한다', () => {
    const savedData = {
      data: { title: 'Restored', content: 'Content' },
      timestamp: new Date().toISOString(),
      version: 1
    }
    localStorage.setItem('test-restore', JSON.stringify(savedData))

    const { result } = renderHook(() => 
      useAutosave({
        key: 'test-restore',
        data: { title: '', content: '' }
      })
    )

    const restored = result.current.restore()
    expect(restored).toEqual(savedData.data)
  })

  /**
   * 8. 오래된 데이터 무시 테스트
   */
  test('24시간 이상 오래된 데이터는 무시되어야 한다', () => {
    const oldDate = new Date()
    oldDate.setDate(oldDate.getDate() - 2) // 2일 전

    const oldData = {
      data: { content: 'Old data' },
      timestamp: oldDate.toISOString(),
      version: 1
    }
    localStorage.setItem('test-old', JSON.stringify(oldData))

    const { result } = renderHook(() => 
      useAutosave({
        key: 'test-old',
        data: { content: '' }
      })
    )

    const restored = result.current.restore()
    expect(restored).toBeNull()
    expect(localStorage.getItem('test-old')).toBeNull()
  })

  /**
   * 9. 취소 기능 테스트
   */
  test('자동저장을 취소할 수 있어야 한다', async () => {
    const mockSave = jest.fn()

    const { result } = renderHook(() => 
      useAutosave({
        key: 'test-cancel',
        data: { content: 'Cancel test' },
        storage: 'server',
        onSave: mockSave,
        debounceMs: 1000
      })
    )

    // 저장 시작 전 취소
    act(() => {
      jest.advanceTimersByTime(500)
      result.current.cancel()
      jest.advanceTimersByTime(1000)
    })

    expect(mockSave).not.toHaveBeenCalled()
  })

  /**
   * 10. 컴포넌트 언마운트 테스트
   */
  test('언마운트 시 마지막 데이터가 저장되어야 한다', () => {
    const { result, unmount } = renderHook(() => 
      useAutosave({
        key: 'test-unmount',
        data: { content: 'Unmount test' },
        storage: 'localStorage'
      })
    )

    unmount()

    const saved = localStorage.getItem('test-unmount')
    expect(saved).not.toBeNull()
  })
})

/**
 * 통합 테스트 시나리오
 */
describe('useAutosave 통합 테스트', () => {
  test('실제 사용 시나리오', async () => {
    // 1. 초기 데이터 로드
    // 2. 사용자 입력
    // 3. 자동저장 발생
    // 4. 네트워크 오류 발생
    // 5. 재시도 및 복구
    // 6. 수동 저장
    // 7. 브라우저 새로고침 시뮬레이션
    // 8. 데이터 복구
  })
})
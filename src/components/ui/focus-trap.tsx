'use client'

import { useEffect, useRef, useCallback, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface FocusTrapProps {
  /**
   * 포커스 트랩을 적용할 자식 요소들
   */
  children: ReactNode
  /**
   * 포커스 트랩 활성화 여부
   */
  enabled?: boolean
  /**
   * 초기 포커스를 받을 요소의 선택자 또는 ref
   */
  initialFocus?: string | React.RefObject<HTMLElement>
  /**
   * 포커스 트랩이 닫힐 때 포커스를 복원할 요소
   */
  restoreFocus?: HTMLElement | null
  /**
   * ESC 키로 포커스 트랩을 닫을 수 있는지 여부
   */
  allowEscapeKey?: boolean
  /**
   * ESC 키를 눌렀을 때 호출될 콜백
   */
  onEscape?: () => void
  /**
   * 추가 CSS 클래스
   */
  className?: string
}

/**
 * 접근성을 위한 포커스 트랩 컴포넌트
 * 모달, 드롭다운 등에서 키보드 포커스가 해당 영역 내에서만 순환하도록 함
 * 
 * @example
 * ```tsx
 * function Modal({ isOpen, onClose }) {
 *   return (
 *     <FocusTrap
 *       enabled={isOpen}
 *       allowEscapeKey={true}
 *       onEscape={onClose}
 *       initialFocus="#modal-title"
 *     >
 *       <div role="dialog" aria-modal="true">
 *         <h2 id="modal-title">모달 제목</h2>
 *         <button onClick={onClose}>닫기</button>
 *       </div>
 *     </FocusTrap>
 *   )
 * }
 * ```
 */
export function FocusTrap({
  children,
  enabled = true,
  initialFocus,
  restoreFocus,
  allowEscapeKey = true,
  onEscape,
  className
}: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const previousActiveElementRef = useRef<HTMLElement | null>(null)

  // 포커스 가능한 요소들을 찾는 함수
  const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'textarea:not([disabled])',
      'select:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ')

    const elements = Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[]
    
    return elements.filter(element => {
      // 숨겨진 요소는 제외
      const style = window.getComputedStyle(element)
      return style.display !== 'none' && style.visibility !== 'hidden' && element.offsetParent !== null
    })
  }

  // 첫 번째와 마지막 포커스 가능한 요소 찾기
  const getFirstAndLastFocusableElements = useCallback((container: HTMLElement) => {
    const focusableElements = getFocusableElements(container)
    return {
      firstElement: focusableElements[0] || null,
      lastElement: focusableElements[focusableElements.length - 1] || null,
      allElements: focusableElements
    }
  }, [])

  // 초기 포커스 설정
  const setInitialFocus = useCallback(() => {
    if (!containerRef.current) return

    let targetElement: HTMLElement | null = null

    if (typeof initialFocus === 'string') {
      targetElement = containerRef.current.querySelector(initialFocus)
    } else if (initialFocus?.current) {
      targetElement = initialFocus.current
    }

    if (!targetElement) {
      const { firstElement } = getFirstAndLastFocusableElements(containerRef.current)
      targetElement = firstElement
    }

    if (targetElement) {
      // 약간의 지연을 두고 포커스 설정 (DOM 업데이트 완료 대기)
      setTimeout(() => {
        targetElement?.focus()
      }, 0)
    }
  }, [initialFocus, getFirstAndLastFocusableElements])

  // 키보드 이벤트 핸들러
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled || !containerRef.current) return

    // ESC 키 처리
    if (event.key === 'Escape' && allowEscapeKey && onEscape) {
      event.preventDefault()
      onEscape()
      return
    }

    // Tab 키 처리 (포커스 트랩)
    if (event.key === 'Tab') {
      const { firstElement, lastElement } = getFirstAndLastFocusableElements(containerRef.current)
      
      if (!firstElement || !lastElement) return

      // Shift + Tab (역방향)
      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault()
          lastElement.focus()
        }
      } 
      // Tab (정방향)
      else {
        if (document.activeElement === lastElement) {
          event.preventDefault()
          firstElement.focus()
        }
      }
    }
  }, [enabled, allowEscapeKey, onEscape, getFirstAndLastFocusableElements])

  // 포커스 트랩 활성화/비활성화
  useEffect(() => {
    if (!enabled) return

    // 현재 활성 요소 저장
    previousActiveElementRef.current = document.activeElement as HTMLElement

    // 초기 포커스 설정
    setInitialFocus()

    // 키보드 이벤트 리스너 등록
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)

      // 포커스 복원
      const restoreTarget = restoreFocus || previousActiveElementRef.current
      if (restoreTarget && typeof restoreTarget.focus === 'function') {
        // 약간의 지연을 두고 포커스 복원 (DOM 업데이트 완료 대기)
        setTimeout(() => {
          restoreTarget.focus()
        }, 0)
      }
    }
  }, [enabled, setInitialFocus, handleKeyDown, restoreFocus])

  // 컨테이너 외부 클릭 방지 (선택사항)
  const handleMouseDown = (event: React.MouseEvent) => {
    // 포커스 트랩이 활성화된 상태에서 컨테이너 외부 클릭 시 포커스 유지
    if (enabled && containerRef.current && !containerRef.current.contains(event.target as Node)) {
      event.preventDefault()
      
      // 현재 포커스된 요소가 컨테이너 내부에 있지 않으면 첫 번째 요소로 포커스 이동
      const { firstElement } = getFirstAndLastFocusableElements(containerRef.current)
      if (firstElement && !containerRef.current.contains(document.activeElement)) {
        firstElement.focus()
      }
    }
  }

  if (!enabled) {
    return <div className={className}>{children}</div>
  }

  return (
    <div
      ref={containerRef}
      className={cn('focus-trap', className)}
      onMouseDown={handleMouseDown}
      // ARIA 속성
      role="region"
      aria-label="포커스 영역"
    >
      {children}
    </div>
  )
}

/**
 * 포커스 관리를 위한 유틸리티 훅
 */
export function useFocusManagement() {
  const focusableElementsRef = useRef<HTMLElement[]>([])
  const currentFocusIndexRef = useRef(-1)

  /**
   * 지정된 컨테이너 내의 포커스 가능한 요소들을 업데이트
   */
  const updateFocusableElements = (container: HTMLElement) => {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'textarea:not([disabled])',
      'select:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ')

    const elements = Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[]
    focusableElementsRef.current = elements.filter(element => {
      const style = window.getComputedStyle(element)
      return style.display !== 'none' && style.visibility !== 'hidden' && element.offsetParent !== null
    })

    // 현재 포커스된 요소의 인덱스 업데이트
    const activeElement = document.activeElement as HTMLElement
    currentFocusIndexRef.current = focusableElementsRef.current.indexOf(activeElement)
  }

  /**
   * 다음 포커스 가능한 요소로 이동
   */
  const focusNext = () => {
    const elements = focusableElementsRef.current
    if (elements.length === 0) return

    currentFocusIndexRef.current = (currentFocusIndexRef.current + 1) % elements.length
    elements[currentFocusIndexRef.current]?.focus()
  }

  /**
   * 이전 포커스 가능한 요소로 이동
   */
  const focusPrevious = () => {
    const elements = focusableElementsRef.current
    if (elements.length === 0) return

    currentFocusIndexRef.current = currentFocusIndexRef.current <= 0 
      ? elements.length - 1 
      : currentFocusIndexRef.current - 1
    elements[currentFocusIndexRef.current]?.focus()
  }

  /**
   * 첫 번째 포커스 가능한 요소로 이동
   */
  const focusFirst = () => {
    const elements = focusableElementsRef.current
    if (elements.length === 0) return

    currentFocusIndexRef.current = 0
    elements[0]?.focus()
  }

  /**
   * 마지막 포커스 가능한 요소로 이동
   */
  const focusLast = () => {
    const elements = focusableElementsRef.current
    if (elements.length === 0) return

    currentFocusIndexRef.current = elements.length - 1
    elements[elements.length - 1]?.focus()
  }

  /**
   * 특정 인덱스의 요소로 포커스 이동
   */
  const focusIndex = (index: number) => {
    const elements = focusableElementsRef.current
    if (index < 0 || index >= elements.length) return

    currentFocusIndexRef.current = index
    elements[index]?.focus()
  }

  return {
    updateFocusableElements,
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast,
    focusIndex,
    getCurrentIndex: () => currentFocusIndexRef.current,
    getFocusableCount: () => focusableElementsRef.current.length
  }
}
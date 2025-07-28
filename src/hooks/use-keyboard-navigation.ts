'use client'

import { useEffect, useCallback, useRef, useState } from 'react'

interface KeyboardNavigationOptions {
  /**
   * 활성화할 키보드 단축키들
   */
  enabledKeys?: {
    escape?: () => void              // ESC: 모달 닫기, 포커스 해제
    enter?: () => void               // Enter: 확인, 제출
    space?: () => void               // Space: 토글, 선택
    arrowUp?: () => void             // ↑: 위로 이동
    arrowDown?: () => void           // ↓: 아래로 이동
    arrowLeft?: () => void           // ←: 왼쪽 이동
    arrowRight?: () => void          // →: 오른쪽 이동
    tab?: () => void                 // Tab: 다음 요소로 이동
    shiftTab?: () => void            // Shift+Tab: 이전 요소로 이동
    home?: () => void                // Home: 첫 번째로 이동
    end?: () => void                 // End: 마지막으로 이동
    pageUp?: () => void              // Page Up: 페이지 위로
    pageDown?: () => void            // Page Down: 페이지 아래로
    delete?: () => void              // Delete: 삭제
    backspace?: () => void           // Backspace: 뒤로/삭제
  }
  /**
   * 키보드 이벤트를 처리할 요소의 ref
   * 기본값은 document
   */
  targetRef?: React.RefObject<HTMLElement>
  /**
   * 키보드 단축키가 비활성화되어야 하는 조건
   */
  disabled?: boolean
  /**
   * 입력 요소에서 키보드 이벤트를 무시할지 여부
   * 기본값: true (input, textarea, select에서는 단축키 무시)
   */
  ignoreInputs?: boolean
  /**
   * 키보드 이벤트를 캐치할 때 preventDefault 호출 여부
   */
  preventDefault?: boolean
}

/**
 * 접근성을 고려한 키보드 네비게이션 훅
 * 
 * @example
 * ```tsx
 * function OpinionList() {
 *   const [selectedIndex, setSelectedIndex] = useState(0)
 *   const [opinions, setOpinions] = useState([])
 * 
 *   useKeyboardNavigation({
 *     enabledKeys: {
 *       arrowUp: () => setSelectedIndex(Math.max(0, selectedIndex - 1)),
 *       arrowDown: () => setSelectedIndex(Math.min(opinions.length - 1, selectedIndex + 1)),
 *       enter: () => openOpinion(opinions[selectedIndex]),
 *       escape: () => clearSelection()
 *     },
 *     disabled: isLoading
 *   })
 * 
 *   return (
 *     <div>
 *       {opinions.map((opinion, index) => (
 *         <div 
 *           key={opinion.id}
 *           className={selectedIndex === index ? 'selected' : ''}
 *           tabIndex={selectedIndex === index ? 0 : -1}
 *         >
 *           {opinion.content}
 *         </div>
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 */
export function useKeyboardNavigation({
  enabledKeys = {},
  targetRef,
  disabled = false,
  ignoreInputs = true,
  preventDefault = true
}: KeyboardNavigationOptions = {}) {
  const keysRef = useRef(enabledKeys)
  
  // enabledKeys가 변경될 때마다 ref 업데이트
  useEffect(() => {
    keysRef.current = enabledKeys
  }, [enabledKeys])

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // 비활성화된 경우 무시
    if (disabled) return

    // 입력 요소에서는 키보드 단축키 무시 (옵션)
    if (ignoreInputs) {
      const target = event.target as HTMLElement
      const tagName = target.tagName.toLowerCase()
      const isEditable = target.contentEditable === 'true'
      const isInput = ['input', 'textarea', 'select'].includes(tagName) || isEditable
      
      if (isInput) return
    }

    const keys = keysRef.current
    let handled = false

    // 수정자 키 조합 확인
    const hasModifier = event.ctrlKey || event.metaKey || event.altKey
    const isShiftTab = event.shiftKey && event.key === 'Tab'

    switch (event.key) {
      case 'Escape':
        if (keys.escape && !hasModifier) {
          keys.escape()
          handled = true
        }
        break

      case 'Enter':
        if (keys.enter && !hasModifier) {
          keys.enter()
          handled = true
        }
        break

      case ' ':
      case 'Space':
        if (keys.space && !hasModifier) {
          keys.space()
          handled = true
        }
        break

      case 'ArrowUp':
        if (keys.arrowUp && !hasModifier) {
          keys.arrowUp()
          handled = true
        }
        break

      case 'ArrowDown':
        if (keys.arrowDown && !hasModifier) {
          keys.arrowDown()
          handled = true
        }
        break

      case 'ArrowLeft':
        if (keys.arrowLeft && !hasModifier) {
          keys.arrowLeft()
          handled = true
        }
        break

      case 'ArrowRight':
        if (keys.arrowRight && !hasModifier) {
          keys.arrowRight()
          handled = true
        }
        break

      case 'Tab':
        if (isShiftTab && keys.shiftTab) {
          keys.shiftTab()
          handled = true
        } else if (!event.shiftKey && keys.tab) {
          keys.tab()
          handled = true
        }
        break

      case 'Home':
        if (keys.home && !hasModifier) {
          keys.home()
          handled = true
        }
        break

      case 'End':
        if (keys.end && !hasModifier) {
          keys.end()
          handled = true
        }
        break

      case 'PageUp':
        if (keys.pageUp && !hasModifier) {
          keys.pageUp()
          handled = true
        }
        break

      case 'PageDown':
        if (keys.pageDown && !hasModifier) {
          keys.pageDown()
          handled = true
        }
        break

      case 'Delete':
        if (keys.delete && !hasModifier) {
          keys.delete()
          handled = true
        }
        break

      case 'Backspace':
        if (keys.backspace && !hasModifier) {
          keys.backspace()
          handled = true
        }
        break
    }

    // 처리된 이벤트는 기본 동작 방지
    if (handled && preventDefault) {
      event.preventDefault()
      event.stopPropagation()
    }
  }, [disabled, ignoreInputs, preventDefault])

  useEffect(() => {
    const target = targetRef?.current || document
    
    target.addEventListener('keydown', handleKeyDown as EventListener)
    
    return () => {
      target.removeEventListener('keydown', handleKeyDown as EventListener)
    }
  }, [handleKeyDown, targetRef])

  return {
    // 키보드 네비게이션 상태를 외부에서 확인할 수 있도록
    isEnabled: !disabled,
    enabledKeys: Object.keys(enabledKeys)
  }
}

/**
 * 리스트 아이템들을 키보드로 네비게이션하는 훅
 * 
 * @example
 * ```tsx
 * function OpinionList({ opinions }: { opinions: Opinion[] }) {
 *   const {
 *     selectedIndex,
 *     setSelectedIndex,
 *     selectNext,
 *     selectPrevious,
 *     selectFirst,
 *     selectLast
 *   } = useListNavigation({
 *     itemCount: opinions.length,
 *     initialIndex: 0,
 *     loop: true,
 *     onSelect: (index) => console.log('Selected:', opinions[index])
 *   })
 * 
 *   useKeyboardNavigation({
 *     enabledKeys: {
 *       arrowUp: selectPrevious,
 *       arrowDown: selectNext,
 *       home: selectFirst,
 *       end: selectLast,
 *       enter: () => openOpinion(opinions[selectedIndex])
 *     }
 *   })
 * 
 *   return (
 *     <div role="listbox" aria-activedescendant={`opinion-${selectedIndex}`}>
 *       {opinions.map((opinion, index) => (
 *         <div
 *           key={opinion.id}
 *           id={`opinion-${index}`}
 *           role="option"
 *           aria-selected={selectedIndex === index}
 *           className={selectedIndex === index ? 'selected' : ''}
 *           onClick={() => setSelectedIndex(index)}
 *         >
 *           {opinion.content}
 *         </div>
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 */
export function useListNavigation({
  itemCount,
  initialIndex = 0,
  loop = false,
  onSelect,
  disabled = false
}: {
  itemCount: number
  initialIndex?: number
  loop?: boolean
  onSelect?: (index: number) => void
  disabled?: boolean
}) {
  const [selectedIndex, setSelectedIndex] = useState(Math.max(0, Math.min(initialIndex, itemCount - 1)))

  // 아이템 수가 변경될 때 선택된 인덱스 조정
  useEffect(() => {
    if (itemCount === 0) {
      setSelectedIndex(-1)
    } else if (selectedIndex >= itemCount) {
      setSelectedIndex(itemCount - 1)
    } else if (selectedIndex < 0 && itemCount > 0) {
      setSelectedIndex(0)
    }
  }, [itemCount, selectedIndex])

  const selectNext = useCallback(() => {
    if (disabled || itemCount === 0) return

    setSelectedIndex(current => {
      const next = current + 1
      if (next >= itemCount) {
        return loop ? 0 : current
      }
      return next
    })
  }, [itemCount, loop, disabled])

  const selectPrevious = useCallback(() => {
    if (disabled || itemCount === 0) return

    setSelectedIndex(current => {
      const prev = current - 1
      if (prev < 0) {
        return loop ? itemCount - 1 : current
      }
      return prev
    })
  }, [itemCount, loop, disabled])

  const selectFirst = useCallback(() => {
    if (disabled || itemCount === 0) return
    setSelectedIndex(0)
  }, [itemCount, disabled])

  const selectLast = useCallback(() => {
    if (disabled || itemCount === 0) return
    setSelectedIndex(itemCount - 1)
  }, [itemCount, disabled])

  const selectIndex = useCallback((index: number) => {
    if (disabled || itemCount === 0) return
    if (index >= 0 && index < itemCount) {
      setSelectedIndex(index)
    }
  }, [itemCount, disabled])

  // 선택이 변경될 때 콜백 호출
  useEffect(() => {
    if (selectedIndex >= 0 && selectedIndex < itemCount && onSelect) {
      onSelect(selectedIndex)
    }
  }, [selectedIndex, itemCount, onSelect])

  return {
    selectedIndex,
    setSelectedIndex: selectIndex,
    selectNext,
    selectPrevious,
    selectFirst,
    selectLast,
    hasSelection: selectedIndex >= 0 && selectedIndex < itemCount,
    isFirst: selectedIndex === 0,
    isLast: selectedIndex === itemCount - 1
  }
}
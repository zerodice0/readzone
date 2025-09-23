import { useCallback, useEffect, useRef } from 'react'

/**
 * 접근성 관련 유틸리티 훅
 * 키보드 네비게이션, 포커스 관리, 스크린 리더 지원 등을 제공합니다.
 */

interface UseAccessibilityOptions {
  /** 컴포넌트 마운트 시 자동으로 포커스할지 여부 */
  autoFocus?: boolean
  /** Escape 키 핸들러 */
  onEscape?: () => void
  /** 포커스 트랩 활성화 여부 */
  trapFocus?: boolean
}

export function useAccessibility({
  autoFocus = false,
  onEscape,
  trapFocus = false
}: UseAccessibilityOptions = {}) {
  const elementRef = useRef<HTMLElement>(null)

  // 포커스 관리
  const focus = useCallback(() => {
    if (elementRef.current) {
      elementRef.current.focus()
    }
  }, [])

  // 키보드 이벤트 핸들러
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && onEscape) {
      onEscape()

      return
    }

    // 포커스 트랩이 활성화된 경우 Tab 키 처리
    if (trapFocus && event.key === 'Tab' && elementRef.current) {
      const focusableElements = elementRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )

      if (focusableElements.length === 0) {return}

      const firstElement = focusableElements[0] as HTMLElement
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

      if (event.shiftKey) {
        // Shift + Tab (역방향)
        if (document.activeElement === firstElement) {
          event.preventDefault()
          lastElement.focus()
        }
      } else {
        // Tab (정방향)
        if (document.activeElement === lastElement) {
          event.preventDefault()
          firstElement.focus()
        }
      }
    }
  }, [onEscape, trapFocus])

  useEffect(() => {
    const element = elementRef.current

    if (!element) {return}

    // 자동 포커스
    if (autoFocus) {
      // 약간의 지연을 두어 DOM이 완전히 렌더링된 후 포커스
      const timer = setTimeout(() => {
        element.focus()
      }, 100)

      return () => clearTimeout(timer)
    }

    // 키보드 이벤트 리스너 등록
    element.addEventListener('keydown', handleKeyDown)

    return () => element.removeEventListener('keydown', handleKeyDown)
  }, [autoFocus, handleKeyDown])

  return {
    elementRef,
    focus
  }
}

/**
 * 스크린 리더 전용 텍스트를 동적으로 업데이트하는 훅
 */
export function useScreenReaderAnnouncement() {
  const announcementRef = useRef<HTMLDivElement>(null)

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!announcementRef.current) {
      // 동적으로 announcement element 생성
      const element = document.createElement('div')

      element.setAttribute('aria-live', priority)
      element.setAttribute('aria-atomic', 'true')
      element.className = 'sr-only'
      element.setAttribute('role', priority === 'assertive' ? 'alert' : 'status')
      document.body.appendChild(element)
      announcementRef.current = element
    }

    // 기존 메시지 클리어 후 새 메시지 설정
    announcementRef.current.textContent = ''
    setTimeout(() => {
      if (announcementRef.current) {
        announcementRef.current.textContent = message
      }
    }, 100)
  }, [])

  useEffect(() => {
    return () => {
      // 컴포넌트 언마운트 시 정리
      if (announcementRef.current && document.body.contains(announcementRef.current)) {
        document.body.removeChild(announcementRef.current)
      }
    }
  }, [])

  return { announce }
}

/**
 * 키보드 네비게이션을 위한 화살표 키 핸들러
 */
export function useArrowKeyNavigation(
  items: HTMLElement[],
  options: {
    loop?: boolean
    orientation?: 'horizontal' | 'vertical' | 'both'
    onSelect?: (index: number) => void
  } = {}
) {
  const { loop = true, orientation = 'both', onSelect } = options
  const currentIndexRef = useRef(0)

  const navigate = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (items.length === 0) {return}

    let newIndex = currentIndexRef.current

    switch (direction) {
      case 'up':
        if (orientation === 'vertical' || orientation === 'both') {
          newIndex = newIndex > 0 ? newIndex - 1 : loop ? items.length - 1 : 0
        }
        break
      case 'down':
        if (orientation === 'vertical' || orientation === 'both') {
          newIndex = newIndex < items.length - 1 ? newIndex + 1 : loop ? 0 : items.length - 1
        }
        break
      case 'left':
        if (orientation === 'horizontal' || orientation === 'both') {
          newIndex = newIndex > 0 ? newIndex - 1 : loop ? items.length - 1 : 0
        }
        break
      case 'right':
        if (orientation === 'horizontal' || orientation === 'both') {
          newIndex = newIndex < items.length - 1 ? newIndex + 1 : loop ? 0 : items.length - 1
        }
        break
    }

    currentIndexRef.current = newIndex
    const targetItem = items[newIndex]

    if (targetItem) {
      targetItem.focus()
      onSelect?.(newIndex)
    }
  }, [items, loop, orientation, onSelect])

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault()
        navigate('up')
        break
      case 'ArrowDown':
        event.preventDefault()
        navigate('down')
        break
      case 'ArrowLeft':
        event.preventDefault()
        navigate('left')
        break
      case 'ArrowRight':
        event.preventDefault()
        navigate('right')
        break
      case 'Home':
        event.preventDefault()
        currentIndexRef.current = 0
        if (items[0]) {
          items[0].focus()
          onSelect?.(0)
        }
        break
      case 'End': {
        event.preventDefault()
        currentIndexRef.current = items.length - 1
        const lastItem = items[items.length - 1]

        if (lastItem) {
          lastItem.focus()
          onSelect?.(items.length - 1)
        }
        break
      }
    }
  }, [navigate, items, onSelect])

  return {
    handleKeyDown,
    navigate,
    setCurrentIndex: (index: number) => {
      currentIndexRef.current = Math.max(0, Math.min(index, items.length - 1))
    },
    getCurrentIndex: () => currentIndexRef.current
  }
}

/**
 * 색상 대비 및 시각적 접근성 유틸리티
 */
export function useColorContrast() {
  const checkContrast = useCallback((foreground: string, background: string): number => {
    // 간단한 색상 대비 계산 (실제로는 더 복잡한 WCAG 알고리즘 사용)
    // 여기서는 기본적인 구현만 제공
    const getRGBValues = (color: string) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      if (!ctx) {return [0, 0, 0]}

      ctx.fillStyle = color
      ctx.fillRect(0, 0, 1, 1)
      const imageData = ctx.getImageData(0, 0, 1, 1)

      return [imageData.data[0], imageData.data[1], imageData.data[2]]
    }

    const [r1, g1, b1] = getRGBValues(foreground)
    const [r2, g2, b2] = getRGBValues(background)

    const luminance = (r: number, g: number, b: number) => {
      const [rs, gs, bs] = [r, g, b].map(c => {
        c = c / 255

        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
      })

      return 0.2126 * (rs ?? 0) + 0.7152 * (gs ?? 0) + 0.0722 * (bs ?? 0)
    }

    const lum1 = luminance(r1 ?? 0, g1 ?? 0, b1 ?? 0)
    const lum2 = luminance(r2 ?? 0, g2 ?? 0, b2 ?? 0)

    const lighter = Math.max(lum1, lum2)
    const darker = Math.min(lum1, lum2)

    return (lighter + 0.05) / (darker + 0.05)
  }, [])

  const meetsWCAGAA = useCallback((foreground: string, background: string): boolean => {
    return checkContrast(foreground, background) >= 4.5
  }, [checkContrast])

  const meetsWCAGAAA = useCallback((foreground: string, background: string): boolean => {
    return checkContrast(foreground, background) >= 7
  }, [checkContrast])

  return {
    checkContrast,
    meetsWCAGAA,
    meetsWCAGAAA
  }
}

/**
 * 접근 가능한 ID 생성 유틸리티
 */
export function useAccessibleId(prefix = 'accessible'): string {
  const idRef = useRef<string>('')

  if (!idRef.current) {
    idRef.current = `${prefix}-${Math.random().toString(36).substring(2, 11)}`
  }

  return idRef.current
}
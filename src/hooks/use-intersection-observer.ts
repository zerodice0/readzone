'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  /**
   * 컴포넌트가 언마운트될 때 observer를 즉시 해제할지 여부
   */
  freezeOnceVisible?: boolean
  /**
   * 초기 가시성 상태
   */
  initialIsIntersecting?: boolean
}

/**
 * Intersection Observer를 사용한 성능 최적화 훅
 * 요소가 뷰포트에 보일 때만 활성화하여 성능을 향상시킴
 * 
 * @example
 * ```tsx
 * function LazyComponent() {
 *   const { ref, isIntersecting, entry } = useIntersectionObserver({
 *     threshold: 0.1,
 *     rootMargin: '50px'
 *   })
 * 
 *   return (
 *     <div ref={ref}>
 *       {isIntersecting && <ExpensiveComponent />}
 *     </div>
 *   )
 * }
 * ```
 */
export function useIntersectionObserver<T extends HTMLElement = HTMLDivElement>({
  threshold = 0,
  root = null,
  rootMargin = '0%',
  freezeOnceVisible = false,
  initialIsIntersecting = false
}: UseIntersectionObserverOptions = {}) {
  const elementRef = useRef<T>(null)
  const [entry, setEntry] = useState<IntersectionObserverEntry | undefined>()
  const [isIntersecting, setIsIntersecting] = useState(initialIsIntersecting)
  const observerRef = useRef<IntersectionObserver>()

  const frozen = freezeOnceVisible && isIntersecting

  const updateEntry = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries
    
    if (entry) {
      setEntry(entry)
      setIsIntersecting(entry.isIntersecting)
      
      // 한 번 보이면 관찰 중단 (성능 최적화)
      if (freezeOnceVisible && entry.isIntersecting && observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [freezeOnceVisible])

  useEffect(() => {
    const element = elementRef.current
    if (!element || frozen) return

    // Intersection Observer 생성
    observerRef.current = new IntersectionObserver(updateEntry, {
      threshold,
      root,
      rootMargin
    })

    // 요소 관찰 시작
    observerRef.current.observe(element)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [threshold, root, rootMargin, frozen, updateEntry])

  // 수동으로 관찰 재시작
  const restart = useCallback(() => {
    if (frozen) return
    
    const element = elementRef.current
    if (!element) return

    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    observerRef.current = new IntersectionObserver(updateEntry, {
      threshold,
      root,
      rootMargin
    })

    observerRef.current.observe(element)
  }, [frozen, threshold, root, rootMargin, updateEntry])

  return {
    ref: elementRef,
    entry,
    isIntersecting,
    restart
  }
}

/**
 * 여러 요소를 관찰하는 Intersection Observer 훅
 * 대량의 요소를 효율적으로 관리
 */
export function useMultipleIntersectionObserver<T extends HTMLElement = HTMLDivElement>({
  threshold = 0,
  root = null,
  rootMargin = '0%'
}: IntersectionObserverInit = {}) {
  const [intersectingElements, setIntersectingElements] = useState<Set<T>>(new Set())
  const observerRef = useRef<IntersectionObserver>()
  const elementsRef = useRef<Set<T>>(new Set())

  const updateIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    setIntersectingElements(prev => {
      const newSet = new Set(prev)
      
      entries.forEach(entry => {
        const element = entry.target as T
        if (entry.isIntersecting) {
          newSet.add(element)
        } else {
          newSet.delete(element)
        }
      })
      
      return newSet
    })
  }, [])

  useEffect(() => {
    observerRef.current = new IntersectionObserver(updateIntersection, {
      threshold,
      root,
      rootMargin
    })

    // 기존에 추가된 요소들 다시 관찰
    elementsRef.current.forEach(element => {
      observerRef.current?.observe(element)
    })

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [threshold, root, rootMargin, updateIntersection])

  const observe = useCallback((element: T | null) => {
    if (!element || !observerRef.current) return

    elementsRef.current.add(element)
    observerRef.current.observe(element)
  }, [])

  const unobserve = useCallback((element: T | null) => {
    if (!element || !observerRef.current) return

    elementsRef.current.delete(element)
    observerRef.current.unobserve(element)
    setIntersectingElements(prev => {
      const newSet = new Set(prev)
      newSet.delete(element)
      return newSet
    })
  }, [])

  const isIntersecting = useCallback((element: T) => {
    return intersectingElements.has(element)
  }, [intersectingElements])

  return {
    observe,
    unobserve,
    isIntersecting,
    intersectingElements,
    intersectingCount: intersectingElements.size
  }
}

/**
 * 가시성 기반 지연 로딩 훅
 * 컴포넌트가 뷰포트에 들어올 때만 렌더링
 */
export function useLazyLoad<T extends HTMLElement = HTMLDivElement>({
  threshold = 0.1,
  rootMargin = '50px',
  once = true
}: {
  threshold?: number
  rootMargin?: string
  once?: boolean
} = {}) {
  const { ref, isIntersecting } = useIntersectionObserver<T>({
    threshold,
    rootMargin,
    freezeOnceVisible: once
  })

  const [hasBeenVisible, setHasBeenVisible] = useState(false)

  useEffect(() => {
    if (isIntersecting && !hasBeenVisible) {
      setHasBeenVisible(true)
    }
  }, [isIntersecting, hasBeenVisible])

  return {
    ref,
    isVisible: isIntersecting,
    hasBeenVisible: once ? hasBeenVisible : isIntersecting,
    shouldRender: once ? hasBeenVisible : isIntersecting
  }
}
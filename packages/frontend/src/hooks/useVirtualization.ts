import { type CSSProperties, type UIEvent, useCallback, useEffect, useMemo, useState } from 'react'

interface UseVirtualizationOptions {
  containerHeight: number
  itemHeight: number
  itemCount: number
  overscan?: number
  threshold?: number
}

interface VirtualizationResult {
  virtualItems: {
    index: number
    start: number
    size: number
  }[]
  totalSize: number
  scrollElementProps: {
    style: CSSProperties
    onScroll: (event: UIEvent<HTMLDivElement>) => void
  }
  innerElementProps: {
    style: CSSProperties
  }
  isVirtualizationEnabled: boolean
}

export function useVirtualization({
  containerHeight,
  itemHeight,
  itemCount,
  overscan = 5,
  threshold = 50
}: UseVirtualizationOptions): VirtualizationResult {
  const [scrollTop, setScrollTop] = useState(0)

  // Only enable virtualization if item count exceeds threshold
  const isVirtualizationEnabled = itemCount > threshold

  const totalSize = useMemo(() => {
    return itemCount * itemHeight
  }, [itemCount, itemHeight])

  const handleScroll = useCallback((event: UIEvent<HTMLDivElement>) => {
    if (!isVirtualizationEnabled) {return}
    setScrollTop(event.currentTarget.scrollTop)
  }, [isVirtualizationEnabled])

  const virtualItems = useMemo(() => {
    if (!isVirtualizationEnabled) {
      // Return all items if virtualization is disabled
      return Array.from({ length: itemCount }, (_, index) => ({
        index,
        start: index * itemHeight,
        size: itemHeight
      }))
    }

    const visibleStart = Math.floor(scrollTop / itemHeight)
    const visibleEnd = Math.min(
      visibleStart + Math.ceil(containerHeight / itemHeight),
      itemCount
    )

    const start = Math.max(0, visibleStart - overscan)
    const end = Math.min(itemCount, visibleEnd + overscan)

    return Array.from({ length: end - start }, (_, index) => {
      const itemIndex = start + index

      return {
        index: itemIndex,
        start: itemIndex * itemHeight,
        size: itemHeight
      }
    })
  }, [
    isVirtualizationEnabled,
    scrollTop,
    containerHeight,
    itemHeight,
    itemCount,
    overscan
  ])

  const scrollElementProps = useMemo(() => ({
    style: {
      height: isVirtualizationEnabled ? containerHeight : 'auto',
      overflow: isVirtualizationEnabled ? 'auto' as const : 'visible' as const
    },
    onScroll: handleScroll
  }), [isVirtualizationEnabled, containerHeight, handleScroll])

  const innerElementProps = useMemo(() => ({
    style: {
      height: isVirtualizationEnabled ? totalSize : 'auto',
      position: isVirtualizationEnabled ? 'relative' as const : 'static' as const
    }
  }), [isVirtualizationEnabled, totalSize])

  return {
    virtualItems,
    totalSize,
    scrollElementProps,
    innerElementProps,
    isVirtualizationEnabled
  }
}

// Helper hook for managing intersection observer
export function useIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options?: IntersectionObserverInit
) {
  const [ref, setRef] = useState<Element | null>(null)

  useEffect(() => {
    if (!ref) {return}

    const observer = new IntersectionObserver(callback, {
      threshold: 0.1,
      rootMargin: '100px',
      ...options
    })

    observer.observe(ref)

    return () => {
      observer.disconnect()
    }
  }, [ref, callback, options])

  return setRef
}
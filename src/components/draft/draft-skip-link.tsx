'use client'

interface SkipLinkProps {
  href: string
  children: React.ReactNode
}

/**
 * Skip link component for improved keyboard navigation
 * Appears when focused, allows users to skip to main content
 */
export function SkipLink({ href, children }: SkipLinkProps) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded focus:shadow-lg focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
      aria-label="메인 콘텐츠로 건너뛰기"
    >
      {children}
    </a>
  )
}

/**
 * Hook for announcing content changes to screen readers
 */
export function useAccessibilityAnnouncer() {
  const announce = (message: string) => {
    // Create or update live region
    let liveRegion = document.getElementById('accessibility-announcer')
    
    if (!liveRegion) {
      liveRegion = document.createElement('div')
      liveRegion.id = 'accessibility-announcer'
      liveRegion.setAttribute('aria-live', 'polite')
      liveRegion.setAttribute('aria-atomic', 'true')
      liveRegion.className = 'sr-only'
      document.body.appendChild(liveRegion)
    }

    // Clear previous message and announce new one
    liveRegion.textContent = ''
    setTimeout(() => {
      liveRegion!.textContent = message
    }, 100)

    // Clean up after announcement
    setTimeout(() => {
      liveRegion!.textContent = ''
    }, 5000)
  }

  return { announce }
}
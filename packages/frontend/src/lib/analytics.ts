// Analytics and monitoring integration for ReadZone
type AnalyticsValue = string | number | boolean | null | undefined

interface AnalyticsEvent {
  name: string
  parameters?: Record<string, AnalyticsValue>
  user_id?: string
  session_id?: string
}

interface UserProperties {
  user_id?: string
  nickname?: string
  email?: string
  registration_date?: string
  subscription_tier?: string
}

interface PerformanceMetric {
  name: string
  value: number
  unit: string
  labels?: Record<string, string>
}

class AnalyticsManager {
  private isInitialized = false
  private sessionId: string
  private userId?: string
  private debugMode: boolean

  constructor() {
    this.sessionId = this.generateSessionId()
    this.debugMode = import.meta.env.MODE === 'development'
  }

  // Initialize analytics services
  async initialize(config: {
    googleAnalyticsId?: string
    userId?: string
    enableErrorTracking?: boolean
  }) {
    if (this.isInitialized) {return}

    if (config.userId) {
      this.userId = config.userId
    }

    // Initialize Google Analytics 4
    if (config.googleAnalyticsId && typeof window !== 'undefined') {
      await this.initializeGA4(config.googleAnalyticsId)
    }

    // Initialize error tracking
    if (config.enableErrorTracking) {
      this.initializeErrorTracking()
    }

    this.isInitialized = true

    if (this.debugMode) {
      console.warn('[Analytics] Initialized', {
        sessionId: this.sessionId,
        userId: this.userId
      })
    }
  }

  private async initializeGA4(measurementId: string) {
    // Load gtag script
    const script = document.createElement('script')

    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
    document.head.appendChild(script)

    // Initialize gtag
    window.dataLayer = window.dataLayer || []
    window.gtag = function() {
      window.dataLayer.push(arguments)
    }

    window.gtag('js', new Date())
    window.gtag('config', measurementId, {
      send_page_view: false, // We'll handle page views manually
      session_id: this.sessionId,
      user_id: this.userId
    })
  }

  private initializeErrorTracking() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.trackError({
        type: 'javascript_error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      })
    })

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError({
        type: 'unhandled_promise_rejection',
        message: event.reason?.toString(),
        stack: event.reason?.stack
      })
    })
  }

  // Generate unique session ID
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // Track page views
  trackPageView(page: {
    page_title: string
    page_location: string
    page_referrer?: string
  }) {
    const event: AnalyticsEvent = {
      name: 'page_view',
      parameters: {
        ...page,
        session_id: this.sessionId,
        user_id: this.userId,
        timestamp: new Date().toISOString()
      }
    }

    this.sendEvent(event)

    if (this.debugMode) {
      console.warn('[Analytics] Page view tracked:', page)
    }
  }

  // Track user interactions
  trackEvent(name: string, parameters: Record<string, AnalyticsValue> = {}) {
    const event: AnalyticsEvent = {
      name,
      parameters: {
        ...parameters,
        session_id: this.sessionId,
        user_id: this.userId,
        timestamp: new Date().toISOString()
      }
    }

    this.sendEvent(event)

    if (this.debugMode) {
      console.warn('[Analytics] Event tracked:', event)
    }
  }

  // Track user actions specific to ReadZone
  trackUserAction(action: string, context: Record<string, AnalyticsValue> = {}) {
    this.trackEvent('user_action', {
      action,
      ...context
    })
  }

  // Track content engagement
  trackContentEngagement(content: {
    content_type: 'review' | 'book' | 'profile' | 'search'
    content_id: string
    engagement_type: 'view' | 'like' | 'share' | 'comment' | 'follow'
    engagement_duration?: number
  }) {
    this.trackEvent('content_engagement', content)
  }

  // Track search behavior
  trackSearch(search: {
    search_term: string
    search_type: 'books' | 'reviews' | 'users' | 'all'
    results_count: number
    result_clicked?: boolean
    click_position?: number
  }) {
    this.trackEvent('search', search)
  }

  // Track performance metrics
  trackPerformance(metric: PerformanceMetric) {
    const event: AnalyticsEvent = {
      name: 'performance_metric',
      parameters: {
        metric_name: metric.name,
        metric_value: metric.value,
        metric_unit: metric.unit,
        ...metric.labels,
        session_id: this.sessionId
      }
    }

    this.sendEvent(event)

    // Also send to Google Analytics as custom event
    if (window.gtag) {
      window.gtag('event', metric.name, {
        custom_parameter_1: metric.value,
        event_category: 'performance'
      })
    }

    if (this.debugMode) {
      console.warn('[Analytics] Performance metric tracked:', metric)
    }
  }

  // Track errors
  trackError(error: {
    type: string
    message: string
    filename?: string
    lineno?: number
    colno?: number
    stack?: string
    user_agent?: string
    url?: string
  }) {
    const event: AnalyticsEvent = {
      name: 'error',
      parameters: {
        error_type: error.type,
        error_message: error.message,
        error_filename: error.filename,
        error_line: error.lineno,
        error_column: error.colno,
        error_stack: error.stack,
        user_agent: error.user_agent ?? navigator.userAgent,
        page_url: error.url ?? window.location.href,
        session_id: this.sessionId,
        user_id: this.userId
      }
    }

    this.sendEvent(event)

    // Also track in Google Analytics
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: error.message,
        fatal: false
      })
    }

    if (this.debugMode) {
      console.error('[Analytics] Error tracked:', error)
    }
  }

  // Set user properties
  setUserProperties(properties: UserProperties) {
    if (properties.user_id) {
      this.userId = properties.user_id
    }

    if (window.gtag) {
      window.gtag('config', window.GA_MEASUREMENT_ID, {
        user_id: properties.user_id,
        custom_map: {
          custom_parameter_1: 'nickname',
          custom_parameter_2: 'registration_date'
        }
      })

      window.gtag('set', {
        user_id: properties.user_id,
        nickname: properties.nickname,
        registration_date: properties.registration_date
      })
    }

    if (this.debugMode) {
      console.warn('[Analytics] User properties set:', properties)
    }
  }

  // Send event to analytics services
  private sendEvent(event: AnalyticsEvent) {
    // Send to Google Analytics
    if (window.gtag) {
      window.gtag('event', event.name, event.parameters)
    }

    // Send to custom analytics endpoint (if available)
    if (import.meta.env.VITE_ANALYTICS_ENDPOINT) {
      fetch(import.meta.env.VITE_ANALYTICS_ENDPOINT as string, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      }).catch(error => {
        if (this.debugMode) {
          console.warn('[Analytics] Failed to send event to custom endpoint:', error)
        }
      })
    }
  }

  // Get current session info
  getSessionInfo() {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      isInitialized: this.isInitialized
    }
  }
}

// Create global analytics instance
export const analytics = new AnalyticsManager()

// Convenience functions for common tracking scenarios
export const trackPageView = (title: string, path: string) => {
  analytics.trackPageView({
    page_title: title,
    page_location: `${window.location.origin}${path}`,
    page_referrer: document.referrer
  })
}

export const trackReviewView = (reviewId: string, authorId: string) => {
  analytics.trackContentEngagement({
    content_type: 'review',
    content_id: reviewId,
    engagement_type: 'view'
  })

  analytics.trackUserAction('view_review', {
    review_id: reviewId,
    author_id: authorId
  })
}

export const trackBookView = (bookId: string, bookTitle: string) => {
  analytics.trackContentEngagement({
    content_type: 'book',
    content_id: bookId,
    engagement_type: 'view'
  })

  analytics.trackUserAction('view_book', {
    book_id: bookId,
    book_title: bookTitle
  })
}

export const trackProfileView = (userId: string, isOwnProfile: boolean) => {
  analytics.trackContentEngagement({
    content_type: 'profile',
    content_id: userId,
    engagement_type: 'view'
  })

  analytics.trackUserAction('view_profile', {
    target_user_id: userId,
    is_own_profile: isOwnProfile
  })
}

export const trackSearch = (query: string, type: 'books' | 'reviews' | 'users' | 'all', resultsCount: number) => {
  analytics.trackSearch({
    search_term: query,
    search_type: type,
    results_count: resultsCount
  })
}

export const trackReviewWrite = (bookId: string, reviewLength: number) => {
  analytics.trackUserAction('write_review', {
    book_id: bookId,
    review_length: reviewLength,
    review_length_category: reviewLength < 100 ? 'short' : reviewLength < 500 ? 'medium' : 'long'
  })
}

export const trackUserRegistration = (method: string) => {
  analytics.trackEvent('sign_up', {
    method
  })
}

export const trackUserLogin = (method: string) => {
  analytics.trackEvent('login', {
    method
  })
}

// Performance tracking helpers
export const trackWebVitals = () => {
  // Track Core Web Vitals when available
  if ('PerformanceObserver' in window) {
    // LCP (Largest Contentful Paint)
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1] as PerformanceEntry & {
        startTime: number
      }

      if (lastEntry) {
        analytics.trackPerformance({
          name: 'LCP',
          value: lastEntry.startTime,
          unit: 'ms',
          labels: { page: window.location.pathname }
        })
      }
    })

    try {
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
    } catch (_e) {
      // Ignore errors for unsupported browsers
    }

    // FID (First Input Delay)
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()

      entries.forEach((entry: PerformanceEntry & { processingStart?: number; startTime: number }) => {
        if (entry.processingStart && entry.startTime) {
          const fid = entry.processingStart - entry.startTime

          analytics.trackPerformance({
            name: 'FID',
            value: fid,
            unit: 'ms',
            labels: { page: window.location.pathname }
          })
        }
      })
    })

    try {
      fidObserver.observe({ entryTypes: ['first-input'] })
    } catch (_e) {
      // Ignore errors for unsupported browsers
    }
  }
}

// Initialize analytics when module loads
if (typeof window !== 'undefined') {
  // Auto-initialize with environment variables
  analytics.initialize({
    googleAnalyticsId: import.meta.env.VITE_GA_MEASUREMENT_ID,
    enableErrorTracking: true
  })

  // Track web vitals
  trackWebVitals()
}

// Export for global access
declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: (...args: unknown[]) => void
    GA_MEASUREMENT_ID: string
  }
}

export default analytics
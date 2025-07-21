// Analytics and performance tracking utilities

interface PerformanceMetrics {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
}

interface UserAction {
  action: string;
  category: string;
  label?: string;
  value?: number;
  timestamp: number;
  userId?: string;
  sessionId: string;
}

interface PageView {
  page: string;
  title: string;
  referrer: string;
  timestamp: number;
  userId?: string;
  sessionId: string;
  loadTime?: number;
}

interface ErrorEvent {
  message: string;
  stack?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  timestamp: number;
  userId?: string;
  sessionId: string;
  userAgent: string;
  url: string;
}

class Analytics {
  private sessionId: string;
  private userId?: string;
  private apiEndpoint: string;
  private isEnabled: boolean;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.apiEndpoint = '/api/analytics';
    this.isEnabled = this.shouldEnableAnalytics();
    
    if (this.isEnabled) {
      this.initializeTracking();
    }
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private shouldEnableAnalytics(): boolean {
    // Enable analytics only in production or when explicitly enabled
    return import.meta.env.PROD || import.meta.env.VITE_ENABLE_ANALYTICS === 'true';
  }

  private initializeTracking(): void {
    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.trackEvent('page_visibility', 'engagement', document.hidden ? 'hidden' : 'visible');
    });

    // Track unload events
    window.addEventListener('beforeunload', () => {
      this.trackEvent('page_unload', 'navigation');
    });

    // Track errors
    window.addEventListener('error', (event) => {
      this.trackError({
        message: event.message,
        stack: event.error?.stack,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        timestamp: Date.now(),
        sessionId: this.sessionId,
        userId: this.userId,
        userAgent: navigator.userAgent,
        url: window.location.href
      });
    });

    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        timestamp: Date.now(),
        sessionId: this.sessionId,
        userId: this.userId,
        userAgent: navigator.userAgent,
        url: window.location.href
      });
    });

    // Track Web Vitals
    this.trackWebVitals();
  }

  setUserId(userId: string): void {
    this.userId = userId;
  }

  trackPageView(page: string, title: string = document.title): void {
    if (!this.isEnabled) return;

    const pageView: PageView = {
      page,
      title,
      referrer: document.referrer,
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.sessionId
    };

    this.sendData('pageview', pageView);
  }

  trackEvent(
    action: string,
    category: string,
    label?: string,
    value?: number
  ): void {
    if (!this.isEnabled) return;

    const event: UserAction = {
      action,
      category,
      label,
      value,
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.sessionId
    };

    this.sendData('event', event);
  }

  trackTiming(name: string, duration: number, category: string = 'performance'): void {
    if (!this.isEnabled) return;

    this.trackEvent('timing', category, name, duration);
  }

  trackError(error: ErrorEvent): void {
    if (!this.isEnabled) return;

    this.sendData('error', error);
  }

  trackPerformanceMetric(metric: PerformanceMetrics): void {
    if (!this.isEnabled) return;

    this.sendData('performance', metric);
  }

  // Track Core Web Vitals
  private trackWebVitals(): void {
    // Track First Contentful Paint (FCP)
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          this.trackPerformanceMetric({
            name: 'FCP',
            value: entry.startTime,
            rating: entry.startTime < 1800 ? 'good' : entry.startTime < 3000 ? 'needs-improvement' : 'poor'
          });
        }
      }
    }).observe({ entryTypes: ['paint'] });

    // Track Largest Contentful Paint (LCP)
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      
      if (lastEntry) {
        this.trackPerformanceMetric({
          name: 'LCP',
          value: lastEntry.startTime,
          rating: lastEntry.startTime < 2500 ? 'good' : lastEntry.startTime < 4000 ? 'needs-improvement' : 'poor'
        });
      }
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // Track First Input Delay (FID)
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.processingStart > entry.startTime) {
          const fid = entry.processingStart - entry.startTime;
          this.trackPerformanceMetric({
            name: 'FID',
            value: fid,
            rating: fid < 100 ? 'good' : fid < 300 ? 'needs-improvement' : 'poor'
          });
        }
      }
    }).observe({ entryTypes: ['first-input'] });

    // Track Cumulative Layout Shift (CLS)
    let clsValue = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      
      this.trackPerformanceMetric({
        name: 'CLS',
        value: clsValue,
        rating: clsValue < 0.1 ? 'good' : clsValue < 0.25 ? 'needs-improvement' : 'poor'
      });
    }).observe({ entryTypes: ['layout-shift'] });
  }

  // Track resource loading performance
  trackResourceTiming(): void {
    if (!this.isEnabled) return;

    const resources = performance.getEntriesByType('resource');
    
    resources.forEach((resource) => {
      if (resource.duration > 1000) { // Only track slow resources
        this.trackTiming(
          `resource_${resource.name.split('/').pop()}`,
          resource.duration,
          'resource_loading'
        );
      }
    });
  }

  // Track user engagement
  trackEngagement(): void {
    if (!this.isEnabled) return;

    let startTime = Date.now();
    let isActive = true;

    const trackActiveTime = () => {
      if (isActive) {
        const activeTime = Date.now() - startTime;
        this.trackTiming('time_on_page', activeTime, 'engagement');
      }
    };

    // Track active time on page visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        trackActiveTime();
        isActive = false;
      } else {
        startTime = Date.now();
        isActive = true;
      }
    });

    // Track active time on page unload
    window.addEventListener('beforeunload', trackActiveTime);
  }

  // Track PWA events
  trackPWAEvent(event: string, data?: any): void {
    if (!this.isEnabled) return;

    this.trackEvent(event, 'pwa', JSON.stringify(data));
  }

  // Track API response times
  trackAPICall(endpoint: string, method: string, duration: number, status: number): void {
    if (!this.isEnabled) return;

    this.trackEvent('api_call', 'performance', `${method} ${endpoint}`, duration);
    
    if (status >= 400) {
      this.trackEvent('api_error', 'error', `${status} ${method} ${endpoint}`);
    }
  }

  private async sendData(type: string, data: any): Promise<void> {
    try {
      // Use sendBeacon for better reliability on page unload
      if (navigator.sendBeacon && (type === 'pageview' || type === 'event')) {
        const payload = JSON.stringify({ type, data, timestamp: Date.now() });
        navigator.sendBeacon(this.apiEndpoint, payload);
        return;
      }

      // Fallback to fetch
      await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, data, timestamp: Date.now() })
      });
    } catch (error) {
      // Silently fail - don't impact user experience
      console.warn('Analytics tracking failed:', error);
    }
  }

  // Manual performance measurement
  startTiming(name: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      this.trackTiming(name, duration);
    };
  }

  // Track component render performance
  trackComponentRender(componentName: string, renderTime: number): void {
    if (!this.isEnabled) return;

    this.trackTiming(`component_${componentName}`, renderTime, 'react_performance');
  }

  // Track user interactions
  trackInteraction(element: string, action: string = 'click'): void {
    if (!this.isEnabled) return;

    this.trackEvent(action, 'interaction', element);
  }

  // Track form submissions
  trackFormSubmission(formName: string, success: boolean, errors?: string[]): void {
    if (!this.isEnabled) return;

    this.trackEvent('form_submit', 'forms', formName, success ? 1 : 0);
    
    if (!success && errors) {
      errors.forEach(error => {
        this.trackEvent('form_error', 'forms', `${formName}_${error}`);
      });
    }
  }

  // Track search queries
  trackSearch(query: string, results: number, source: string = 'books'): void {
    if (!this.isEnabled) return;

    this.trackEvent('search', source, query, results);
  }

  // Get session data for debugging
  getSessionInfo(): { sessionId: string; userId?: string } {
    return {
      sessionId: this.sessionId,
      userId: this.userId
    };
  }
}

// Create singleton instance
const analytics = new Analytics();

export default analytics;

// React hook for tracking component lifecycle
export const useAnalytics = () => {
  return {
    trackPageView: analytics.trackPageView.bind(analytics),
    trackEvent: analytics.trackEvent.bind(analytics),
    trackTiming: analytics.trackTiming.bind(analytics),
    trackError: analytics.trackError.bind(analytics),
    trackInteraction: analytics.trackInteraction.bind(analytics),
    trackFormSubmission: analytics.trackFormSubmission.bind(analytics),
    trackSearch: analytics.trackSearch.bind(analytics),
    trackComponentRender: analytics.trackComponentRender.bind(analytics),
    startTiming: analytics.startTiming.bind(analytics),
    setUserId: analytics.setUserId.bind(analytics)
  };
};
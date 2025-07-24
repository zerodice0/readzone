/**
 * Authentication monitoring and metrics system
 * Tracks auth events, errors, and security metrics
 */

import { AuthError, AuthErrorCode, ErrorSeverity, ErrorMetrics, ERROR_SEVERITY_MAP } from '@/types/error'
import { logger } from './logger'

export interface AuthEvent {
  type: 'login' | 'register' | 'logout' | 'verify_email' | 'password_reset'
  userId?: string
  email?: string
  success: boolean
  timestamp: Date
  metadata?: Record<string, any>
}

export interface SecurityAlert {
  type: 'multiple_failed_logins' | 'suspicious_registration' | 'token_abuse' | 'rate_limit_exceeded'
  severity: 'low' | 'medium' | 'high' | 'critical'
  email?: string
  ip?: string
  count: number
  timeWindow: string
  timestamp: Date
}

/**
 * Auth monitoring service
 */
export class AuthMonitor {
  private static instance: AuthMonitor
  private errorMetrics: Map<string, ErrorMetrics> = new Map()
  private authEvents: AuthEvent[] = []
  private securityAlerts: SecurityAlert[] = []
  
  // Thresholds for security alerts
  private readonly FAILED_LOGIN_THRESHOLD = 5 // per 15 minutes
  private readonly REGISTRATION_THRESHOLD = 10 // per hour
  private readonly TOKEN_ABUSE_THRESHOLD = 20 // per hour
  
  public static getInstance(): AuthMonitor {
    if (!AuthMonitor.instance) {
      AuthMonitor.instance = new AuthMonitor()
    }
    return AuthMonitor.instance
  }

  /**
   * Record authentication event
   */
  public recordAuthEvent(event: Omit<AuthEvent, 'timestamp'>): void {
    const authEvent: AuthEvent = {
      ...event,
      timestamp: new Date()
    }
    
    this.authEvents.push(authEvent)
    
    // Log based on success/failure
    if (event.success) {
      logger.auth(`Successful ${event.type}`, {
        type: event.type,
        userId: event.userId,
        email: event.email,
        metadata: event.metadata
      })
    } else {
      logger.warn(`Failed ${event.type}`, {
        type: event.type,
        email: event.email,
        metadata: event.metadata
      })
    }
    
    // Check for security patterns
    this.checkSecurityPatterns(authEvent)
    
    // Clean old events (keep last 1000 events)
    if (this.authEvents.length > 1000) {
      this.authEvents = this.authEvents.slice(-1000)
    }
  }

  /**
   * Record error metrics
   */
  public recordError(error: AuthError, context: any): void {
    const errorKey = `${error.code}_${context.operation}`
    const existing = this.errorMetrics.get(errorKey)
    
    if (existing) {
      existing.count++
    } else {
      this.errorMetrics.set(errorKey, {
        errorCode: error.code,
        severity: ERROR_SEVERITY_MAP[error.code],
        timestamp: new Date(),
        count: 1,
        context
      })
    }
    
    // Alert on high-severity errors
    if (ERROR_SEVERITY_MAP[error.code] === ErrorSeverity.HIGH || 
        ERROR_SEVERITY_MAP[error.code] === ErrorSeverity.CRITICAL) {
      this.createSecurityAlert({
        type: 'rate_limit_exceeded', // Generic for now
        severity: ERROR_SEVERITY_MAP[error.code] === ErrorSeverity.CRITICAL ? 'critical' : 'high',
        email: context.email,
        ip: context.ip,
        count: 1,
        timeWindow: '1m',
        timestamp: new Date()
      })
    }
  }

  /**
   * Check for suspicious patterns
   */
  private checkSecurityPatterns(event: AuthEvent): void {
    const now = new Date()
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000)
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    
    // Check failed login attempts
    if (event.type === 'login' && !event.success && event.email) {
      const recentFailedLogins = this.authEvents.filter(e => 
        e.type === 'login' && 
        !e.success && 
        e.email === event.email &&
        e.timestamp > fifteenMinutesAgo
      ).length
      
      if (recentFailedLogins >= this.FAILED_LOGIN_THRESHOLD) {
        this.createSecurityAlert({
          type: 'multiple_failed_logins',
          severity: 'medium',
          email: event.email,
          count: recentFailedLogins,
          timeWindow: '15m',
          timestamp: now
        })
      }
    }
    
    // Check registration patterns
    if (event.type === 'register' && event.email) {
      const recentRegistrations = this.authEvents.filter(e => 
        e.type === 'register' && 
        e.timestamp > oneHourAgo
      ).length
      
      if (recentRegistrations >= this.REGISTRATION_THRESHOLD) {
        this.createSecurityAlert({
          type: 'suspicious_registration',
          severity: 'medium',
          count: recentRegistrations,
          timeWindow: '1h',
          timestamp: now
        })
      }
    }
  }

  /**
   * Create security alert
   */
  private createSecurityAlert(alert: SecurityAlert): void {
    this.securityAlerts.push(alert)
    
    // Log security alert
    logger.security('Security alert generated', {
      type: alert.type,
      severity: alert.severity,
      email: alert.email,
      ip: alert.ip,
      count: alert.count,
      timeWindow: alert.timeWindow
    })
    
    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoringService(alert)
    }
    
    // Keep only recent alerts
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    this.securityAlerts = this.securityAlerts.filter(a => a.timestamp > oneWeekAgo)
  }

  /**
   * Send alert to external monitoring service
   */
  private sendToMonitoringService(alert: SecurityAlert): void {
    // Example integration points:
    // - Slack webhook
    // - PagerDuty
    // - DataDog events
    // - Sentry
    console.error('[SECURITY_ALERT]', alert)
  }

  /**
   * Get error metrics for dashboard
   */
  public getErrorMetrics(): ErrorMetrics[] {
    return Array.from(this.errorMetrics.values())
  }

  /**
   * Get security alerts
   */
  public getSecurityAlerts(since?: Date): SecurityAlert[] {
    if (!since) return this.securityAlerts
    return this.securityAlerts.filter(alert => alert.timestamp > since)
  }

  /**
   * Get authentication statistics
   */
  public getAuthStats(timeRange: Date = new Date(Date.now() - 24 * 60 * 60 * 1000)): {
    totalEvents: number
    successfulLogins: number
    failedLogins: number
    registrations: number
    verifications: number
    errorsByCode: Record<string, number>
  } {
    const recentEvents = this.authEvents.filter(event => event.timestamp > timeRange)
    
    const stats = {
      totalEvents: recentEvents.length,
      successfulLogins: recentEvents.filter(e => e.type === 'login' && e.success).length,
      failedLogins: recentEvents.filter(e => e.type === 'login' && !e.success).length,
      registrations: recentEvents.filter(e => e.type === 'register').length,
      verifications: recentEvents.filter(e => e.type === 'verify_email').length,
      errorsByCode: {} as Record<string, number>
    }
    
    // Count errors by code
    this.errorMetrics.forEach((metric, key) => {
      stats.errorsByCode[metric.errorCode] = metric.count
    })
    
    return stats
  }

  /**
   * Reset metrics (for testing)
   */
  public reset(): void {
    this.errorMetrics.clear()
    this.authEvents = []
    this.securityAlerts = []
  }
}

/**
 * Convenience functions
 */
export const authMonitor = AuthMonitor.getInstance()

export function recordAuthEvent(event: Omit<AuthEvent, 'timestamp'>): void {
  authMonitor.recordAuthEvent(event)
}

export function recordAuthError(error: AuthError, context: any): void {
  authMonitor.recordError(error, context)
}
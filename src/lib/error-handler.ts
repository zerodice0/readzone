/**
 * Centralized error handling system for auth operations
 * Provides consistent error processing, logging, and user messaging
 */

import { 
  AuthError, 
  AuthErrorCode, 
  ErrorContext, 
  ErrorSeverity,
  AUTH_ERROR_MESSAGES,
  ERROR_SEVERITY_MAP,
  ACTIONABLE_ERRORS,
  RETRIABLE_ERRORS,
  MONITORABLE_ERRORS
} from '@/types/error'
import { logger } from './logger'
import { recordAuthError } from './auth-monitor'

/**
 * Create a structured auth error
 */
export function createAuthError(
  code: AuthErrorCode,
  details?: Record<string, any>,
  requestId?: string
): AuthError {
  const messages = AUTH_ERROR_MESSAGES[code]
  
  return {
    code,
    message: messages.system,
    userMessage: messages.user,
    details,
    timestamp: new Date(),
    requestId
  }
}

/**
 * Enhanced error handler with context and monitoring
 */
export class AuthErrorHandler {
  private static instance: AuthErrorHandler
  
  public static getInstance(): AuthErrorHandler {
    if (!AuthErrorHandler.instance) {
      AuthErrorHandler.instance = new AuthErrorHandler()
    }
    return AuthErrorHandler.instance
  }

  /**
   * Handle authentication error with full context
   */
  public handleError(
    error: AuthError | Error | unknown,
    context: ErrorContext
  ): AuthError {
    let authError: AuthError

    // Convert various error types to AuthError
    if (this.isAuthError(error)) {
      authError = error
    } else if (error instanceof Error) {
      authError = this.mapGenericError(error, context)
    } else {
      authError = createAuthError(
        AuthErrorCode.INTERNAL_ERROR,
        { originalError: String(error) }
      )
    }

    // Add request context
    authError.details = {
      ...authError.details,
      context
    }

    // Log error with appropriate level
    this.logError(authError, context)

    // Record error metrics
    recordAuthError(authError, context)

    // Report to monitoring if needed
    if (MONITORABLE_ERRORS.has(authError.code)) {
      this.reportToMonitoring(authError, context)
    }

    return authError
  }

  /**
   * Map Prisma and other errors to auth error codes
   */
  private mapGenericError(error: Error, context: ErrorContext): AuthError {
    const message = error.message.toLowerCase()

    // Prisma unique constraint violations
    if (error.message.includes('P2002')) {
      if (message.includes('email')) {
        return createAuthError(AuthErrorCode.EMAIL_ALREADY_EXISTS)
      }
      if (message.includes('nickname')) {
        return createAuthError(AuthErrorCode.NICKNAME_ALREADY_EXISTS)
      }
    }

    // NextAuth credential errors
    if (message.includes('이메일 인증이 완료되지 않았습니다')) {
      return createAuthError(AuthErrorCode.EMAIL_NOT_VERIFIED)
    }
    if (message.includes('등록되지 않은 이메일입니다')) {
      return createAuthError(AuthErrorCode.USER_NOT_FOUND)
    }
    if (message.includes('비밀번호가 올바르지 않습니다')) {
      return createAuthError(AuthErrorCode.INVALID_CREDENTIALS)
    }
    if (message.includes('이메일과 비밀번호를 입력해주세요')) {
      return createAuthError(AuthErrorCode.MISSING_REQUIRED_FIELD)
    }

    // Database connection errors
    if (message.includes('connect') || message.includes('database')) {
      return createAuthError(AuthErrorCode.DATABASE_ERROR, { 
        originalError: error.message 
      })
    }

    // Email service errors
    if (message.includes('email') || message.includes('smtp')) {
      return createAuthError(AuthErrorCode.EMAIL_SERVICE_ERROR, { 
        originalError: error.message 
      })
    }

    // Default to internal error
    return createAuthError(AuthErrorCode.INTERNAL_ERROR, { 
      originalError: error.message 
    })
  }

  /**
   * Type guard for AuthError
   */
  private isAuthError(error: unknown): error is AuthError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      'message' in error &&
      'userMessage' in error
    )
  }

  /**
   * Log error with appropriate severity
   */
  private logError(error: AuthError, context: ErrorContext): void {
    const severity = ERROR_SEVERITY_MAP[error.code]
    
    const logData = {
      errorCode: error.code,
      message: error.message,
      userMessage: error.userMessage,
      severity,
      context,
      details: error.details,
      timestamp: error.timestamp,
      requestId: error.requestId
    }

    switch (severity) {
      case ErrorSeverity.LOW:
        logger.auth('Auth error (low severity)', logData)
        break
      case ErrorSeverity.MEDIUM:
        logger.warn('Auth error (medium severity)', logData)
        break
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        logger.error('Auth error (high/critical severity)', logData)
        break
    }
  }

  /**
   * Report error to monitoring systems
   */
  private reportToMonitoring(error: AuthError, context: ErrorContext): void {
    // In production, this would integrate with monitoring services
    // like Sentry, DataDog, New Relic, etc.
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { contexts: { auth: context } })
      console.error('[MONITORING] Auth Error:', {
        code: error.code,
        severity: ERROR_SEVERITY_MAP[error.code],
        context,
        timestamp: error.timestamp
      })
    }
  }

  /**
   * Determine if error is retriable
   */
  public isRetriable(error: AuthError): boolean {
    return RETRIABLE_ERRORS.has(error.code)
  }

  /**
   * Determine if error is actionable by user
   */
  public isActionable(error: AuthError): boolean {
    return ACTIONABLE_ERRORS.has(error.code)
  }

  /**
   * Get user-friendly action suggestions
   */
  public getActionSuggestions(error: AuthError): string[] {
    const suggestions: string[] = []

    switch (error.code) {
      case AuthErrorCode.EMAIL_NOT_VERIFIED:
        suggestions.push('인증 메일 재발송 요청')
        suggestions.push('스팸함 확인')
        break
      
      case AuthErrorCode.USER_NOT_FOUND:
        suggestions.push('회원가입 진행')
        suggestions.push('이메일 주소 확인')
        break
      
      case AuthErrorCode.EXPIRED_TOKEN:
        suggestions.push('새 인증 메일 요청')
        break
      
      case AuthErrorCode.WEAK_PASSWORD:
        suggestions.push('영문, 숫자, 특수문자 포함 8자 이상')
        break
      
      case AuthErrorCode.INVALID_EMAIL_FORMAT:
        suggestions.push('올바른 이메일 형식 입력')
        break
      
      case AuthErrorCode.TOO_MANY_ATTEMPTS:
        suggestions.push('잠시 후 다시 시도')
        break
    }

    return suggestions
  }
}

/**
 * Convenience function for handling errors
 */
export function handleAuthError(
  error: AuthError | Error | unknown,
  context: ErrorContext
): AuthError {
  return AuthErrorHandler.getInstance().handleError(error, context)
}

/**
 * Create error context from request information
 */
export function createErrorContext(
  operation: string,
  userId?: string,
  email?: string,
  metadata?: Record<string, any>
): ErrorContext {
  return {
    userId,
    email,
    operation,
    metadata,
    // Note: In a real API route, you would extract these from the request
    // userAgent: request.headers.get('user-agent') || undefined,
    // ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
  }
}

/**
 * Error response helper for API routes
 */
export function createErrorResponse(error: AuthError, statusCode?: number) {
  const defaultStatusCode = getDefaultStatusCode(error.code)
  
  return {
    success: false,
    message: error.userMessage,
    error: {
      code: error.code,
      timestamp: error.timestamp,
      requestId: error.requestId
    }
  }
}

/**
 * Map error codes to HTTP status codes
 */
function getDefaultStatusCode(code: AuthErrorCode): number {
  switch (code) {
    case AuthErrorCode.INVALID_CREDENTIALS:
    case AuthErrorCode.EMAIL_NOT_VERIFIED:
    case AuthErrorCode.EMAIL_ALREADY_EXISTS:
    case AuthErrorCode.NICKNAME_ALREADY_EXISTS:
    case AuthErrorCode.WEAK_PASSWORD:
    case AuthErrorCode.INVALID_EMAIL_FORMAT:
    case AuthErrorCode.INVALID_TOKEN:
    case AuthErrorCode.EXPIRED_TOKEN:
    case AuthErrorCode.ALREADY_VERIFIED:
    case AuthErrorCode.INVALID_INPUT:
    case AuthErrorCode.MISSING_REQUIRED_FIELD:
      return 400
    
    case AuthErrorCode.USER_NOT_FOUND:
    case AuthErrorCode.TOKEN_NOT_FOUND:
      return 404
    
    case AuthErrorCode.TOO_MANY_ATTEMPTS:
    case AuthErrorCode.EMAIL_SEND_LIMIT:
      return 429
    
    case AuthErrorCode.DATABASE_ERROR:
    case AuthErrorCode.EMAIL_SERVICE_ERROR:
    case AuthErrorCode.INTERNAL_ERROR:
      return 500
    
    case AuthErrorCode.ACCOUNT_LOCKED:
      return 423
    
    default:
      return 500
  }
}
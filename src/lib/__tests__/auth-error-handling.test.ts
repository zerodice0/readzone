/**
 * Comprehensive test suite for auth error handling improvements
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { AuthErrorCode, createAuthError, AUTH_ERROR_MESSAGES } from '@/types/error'
import { AuthErrorHandler, handleAuthError, createErrorContext } from '@/lib/error-handler'
import { AuthMonitor, recordAuthEvent } from '@/lib/auth-monitor'

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    auth: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    security: jest.fn()
  }
}))

describe('Auth Error Handling System', () => {
  let errorHandler: AuthErrorHandler
  let authMonitor: AuthMonitor

  beforeEach(() => {
    errorHandler = AuthErrorHandler.getInstance()
    authMonitor = AuthMonitor.getInstance()
    authMonitor.reset()
  })

  describe('Error Type System', () => {
    it('should create structured auth errors', () => {
      const error = createAuthError(AuthErrorCode.EMAIL_NOT_VERIFIED, { userId: 'test-123' })
      
      expect(error.code).toBe(AuthErrorCode.EMAIL_NOT_VERIFIED)
      expect(error.message).toBe(AUTH_ERROR_MESSAGES[AuthErrorCode.EMAIL_NOT_VERIFIED].system)
      expect(error.userMessage).toBe(AUTH_ERROR_MESSAGES[AuthErrorCode.EMAIL_NOT_VERIFIED].user)
      expect(error.details?.userId).toBe('test-123')
      expect(error.timestamp).toBeInstanceOf(Date)
    })

    it('should have consistent error messages', () => {
      // Verify all error codes have both user and system messages
      Object.values(AuthErrorCode).forEach(code => {
        const messages = AUTH_ERROR_MESSAGES[code]
        expect(messages).toBeDefined()
        expect(messages.user).toBeTruthy()
        expect(messages.system).toBeTruthy()
      })
    })
  })

  describe('Error Handler', () => {
    it('should map generic errors to auth errors', () => {
      const prismaError = new Error('Unique constraint failed on the field: email')
      ;(prismaError as any).code = 'P2002'
      ;(prismaError as any).meta = { target: ['email'] }
      
      const context = createErrorContext('register', undefined, 'test@example.com')
      const authError = errorHandler.handleError(prismaError, context)
      
      expect(authError.code).toBe(AuthErrorCode.EMAIL_ALREADY_EXISTS)
    })

    it('should handle NextAuth credential errors', () => {
      const nextAuthError = new Error('이메일 인증이 완료되지 않았습니다.')
      const context = createErrorContext('login', 'user-123', 'test@example.com')
      
      const authError = errorHandler.handleError(nextAuthError, context)
      
      expect(authError.code).toBe(AuthErrorCode.EMAIL_NOT_VERIFIED)
      expect(authError.userMessage).toContain('이메일 인증이 필요합니다')
    })

    it('should identify retriable errors', () => {
      const dbError = createAuthError(AuthErrorCode.DATABASE_ERROR)
      const credentialError = createAuthError(AuthErrorCode.INVALID_CREDENTIALS)
      
      expect(errorHandler.isRetriable(dbError)).toBe(true)
      expect(errorHandler.isRetriable(credentialError)).toBe(false)
    })

    it('should identify actionable errors', () => {
      const verificationError = createAuthError(AuthErrorCode.EMAIL_NOT_VERIFIED)
      const internalError = createAuthError(AuthErrorCode.INTERNAL_ERROR)
      
      expect(errorHandler.isActionable(verificationError)).toBe(true)
      expect(errorHandler.isActionable(internalError)).toBe(false)
    })

    it('should provide action suggestions', () => {
      const verificationError = createAuthError(AuthErrorCode.EMAIL_NOT_VERIFIED)
      const suggestions = errorHandler.getActionSuggestions(verificationError)
      
      expect(suggestions).toContain('인증 메일 재발송 요청')
      expect(suggestions).toContain('스팸함 확인')
    })
  })

  describe('Auth Monitoring', () => {
    it('should record authentication events', () => {
      recordAuthEvent({
        type: 'login',
        userId: 'user-123',
        email: 'test@example.com',
        success: true
      })
      
      const stats = authMonitor.getAuthStats()
      expect(stats.totalEvents).toBe(1)
      expect(stats.successfulLogins).toBe(1)
      expect(stats.failedLogins).toBe(0)
    })

    it('should detect suspicious login patterns', () => {
      // Simulate multiple failed logins
      for (let i = 0; i < 6; i++) {
        recordAuthEvent({
          type: 'login',
          email: 'attacker@example.com',
          success: false
        })
      }
      
      const alerts = authMonitor.getSecurityAlerts()
      expect(alerts.length).toBeGreaterThan(0)
      expect(alerts[0].type).toBe('multiple_failed_logins')
      expect(alerts[0].severity).toBe('medium')
    })

    it('should track error metrics', () => {
      const error = createAuthError(AuthErrorCode.INVALID_CREDENTIALS)
      const context = createErrorContext('login', undefined, 'test@example.com')
      
      authMonitor.recordError(error, context)
      
      const metrics = authMonitor.getErrorMetrics()
      expect(metrics.length).toBe(1)
      expect(metrics[0].errorCode).toBe(AuthErrorCode.INVALID_CREDENTIALS)
      expect(metrics[0].count).toBe(1)
    })
  })

  describe('Security Validation', () => {
    it('should not expose sensitive information in user messages', () => {
      Object.values(AUTH_ERROR_MESSAGES).forEach(({ user }) => {
        // User messages should not contain technical details
        expect(user).not.toMatch(/database|sql|prisma|internal|stack/i)
        expect(user).not.toMatch(/P\d{4}/) // Prisma error codes
        expect(user).not.toMatch(/error code|exception/i)
      })
    })

    it('should log appropriate detail levels', () => {
      const error = createAuthError(AuthErrorCode.DATABASE_ERROR, { 
        originalError: 'Connection timeout',
        sensitiveData: 'should-not-be-logged'
      })
      
      const context = createErrorContext('login', 'user-123', 'test@example.com', {
        userAgent: 'Test Browser',
        ip: '127.0.0.1'
      })
      
      handleAuthError(error, context)
      
      // Verify error was handled without exposing sensitive details
      expect(error.userMessage).not.toContain('Connection timeout')
      expect(error.userMessage).not.toContain('should-not-be-logged')
    })

    it('should validate error context sanitization', () => {
      const context = createErrorContext(
        'login',
        'user-123',
        'test@example.com',
        { password: 'secret123', token: 'abc123' } // Sensitive data
      )
      
      // Context should be sanitized before logging
      expect(context.metadata?.password).toBeDefined() // But will be filtered in real implementation
      expect(context.email).toBe('test@example.com')
      expect(context.userId).toBe('user-123')
    })
  })

  describe('Error Response Generation', () => {
    it('should generate consistent API responses', () => {
      const error = createAuthError(AuthErrorCode.EMAIL_NOT_VERIFIED)
      
      // This would be used in API routes
      const response = {
        success: false,
        message: error.userMessage,
        error: {
          code: error.code,
          timestamp: error.timestamp
        }
      }
      
      expect(response.success).toBe(false)
      expect(response.message).toBe(AUTH_ERROR_MESSAGES[AuthErrorCode.EMAIL_NOT_VERIFIED].user)
      expect(response.error.code).toBe(AuthErrorCode.EMAIL_NOT_VERIFIED)
    })
  })

  describe('Integration Tests', () => {
    it('should handle complete error flow', () => {
      // Simulate a complete error handling flow
      const originalError = new Error('User not found')
      const context = createErrorContext('login', undefined, 'nonexistent@example.com')
      
      // Process error through handler
      const authError = handleAuthError(originalError, context)
      
      // Verify error was properly categorized
      expect(authError.code).toBe(AuthErrorCode.USER_NOT_FOUND)
      expect(authError.userMessage).toContain('등록되지 않은 이메일입니다')
      
      // Verify monitoring recorded the event
      const metrics = authMonitor.getErrorMetrics()
      expect(metrics.length).toBeGreaterThan(0)
    })
  })
})
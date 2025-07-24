/**
 * Comprehensive error type system for ReadZone auth system
 * Provides structured error handling with consistent user messaging
 */

export enum AuthErrorCode {
  // Authentication errors
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  
  // Registration errors
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  NICKNAME_ALREADY_EXISTS = 'NICKNAME_ALREADY_EXISTS',
  WEAK_PASSWORD = 'WEAK_PASSWORD',
  INVALID_EMAIL_FORMAT = 'INVALID_EMAIL_FORMAT',
  
  // Email verification errors
  INVALID_TOKEN = 'INVALID_TOKEN',
  EXPIRED_TOKEN = 'EXPIRED_TOKEN',
  TOKEN_NOT_FOUND = 'TOKEN_NOT_FOUND',
  ALREADY_VERIFIED = 'ALREADY_VERIFIED',
  
  // Rate limiting
  TOO_MANY_ATTEMPTS = 'TOO_MANY_ATTEMPTS',
  EMAIL_SEND_LIMIT = 'EMAIL_SEND_LIMIT',
  
  // Server errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  EMAIL_SERVICE_ERROR = 'EMAIL_SERVICE_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  
  // Validation errors
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
}

export interface AuthError {
  code: AuthErrorCode
  message: string
  userMessage: string
  details?: Record<string, any>
  timestamp: Date
  requestId?: string
}

export interface ErrorContext {
  userId?: string
  email?: string
  operation: string
  userAgent?: string
  ip?: string
  metadata?: Record<string, any>
}

/**
 * Error message mappings for consistent user experience
 */
export const AUTH_ERROR_MESSAGES: Record<AuthErrorCode, { user: string; system: string }> = {
  [AuthErrorCode.INVALID_CREDENTIALS]: {
    user: '이메일 또는 비밀번호가 올바르지 않습니다.',
    system: 'Invalid email or password provided'
  },
  [AuthErrorCode.EMAIL_NOT_VERIFIED]: {
    user: '이메일 인증이 필요합니다. 가입 시 받은 인증 메일을 확인해주세요.',
    system: 'Email verification required'
  },
  [AuthErrorCode.USER_NOT_FOUND]: {
    user: '등록되지 않은 이메일입니다. 회원가입을 먼저 진행해주세요.',
    system: 'User not found in database'
  },
  [AuthErrorCode.ACCOUNT_LOCKED]: {
    user: '계정이 일시적으로 잠겼습니다. 잠시 후 다시 시도해주세요.',
    system: 'Account temporarily locked due to multiple failed attempts'
  },
  [AuthErrorCode.EMAIL_ALREADY_EXISTS]: {
    user: '이미 사용 중인 이메일입니다.',
    system: 'Email address already registered'
  },
  [AuthErrorCode.NICKNAME_ALREADY_EXISTS]: {
    user: '이미 사용 중인 닉네임입니다.',
    system: 'Nickname already taken'
  },
  [AuthErrorCode.WEAK_PASSWORD]: {
    user: '비밀번호는 8자 이상이며 영문, 숫자, 특수문자를 포함해야 합니다.',
    system: 'Password does not meet security requirements'
  },
  [AuthErrorCode.INVALID_EMAIL_FORMAT]: {
    user: '올바른 이메일 형식이 아닙니다.',
    system: 'Invalid email format provided'
  },
  [AuthErrorCode.INVALID_TOKEN]: {
    user: '잘못된 인증 토큰입니다.',
    system: 'Invalid verification token format'
  },
  [AuthErrorCode.EXPIRED_TOKEN]: {
    user: '인증 토큰이 만료되었습니다. 새로운 인증 메일을 요청해주세요.',
    system: 'Verification token has expired'
  },
  [AuthErrorCode.TOKEN_NOT_FOUND]: {
    user: '유효하지 않은 인증 토큰입니다.',
    system: 'Verification token not found in database'
  },
  [AuthErrorCode.ALREADY_VERIFIED]: {
    user: '이미 인증이 완료된 계정입니다.',
    system: 'Email already verified'
  },
  [AuthErrorCode.TOO_MANY_ATTEMPTS]: {
    user: '너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.',
    system: 'Rate limit exceeded for authentication attempts'
  },
  [AuthErrorCode.EMAIL_SEND_LIMIT]: {
    user: '이메일 발송 한도에 도달했습니다. 잠시 후 다시 시도해주세요.',
    system: 'Email send rate limit exceeded'
  },
  [AuthErrorCode.DATABASE_ERROR]: {
    user: '일시적인 서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    system: 'Database operation failed'
  },
  [AuthErrorCode.EMAIL_SERVICE_ERROR]: {
    user: '이메일 발송 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    system: 'Email service unavailable or failed'
  },
  [AuthErrorCode.INTERNAL_ERROR]: {
    user: '서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    system: 'Internal server error occurred'
  },
  [AuthErrorCode.INVALID_INPUT]: {
    user: '입력한 정보가 올바르지 않습니다.',
    system: 'Input validation failed'
  },
  [AuthErrorCode.MISSING_REQUIRED_FIELD]: {
    user: '필수 입력 정보가 누락되었습니다.',
    system: 'Required field missing from request'
  },
}

/**
 * Error severity levels for monitoring and alerting
 */
export enum ErrorSeverity {
  LOW = 'low',        // Expected errors (validation, user input)
  MEDIUM = 'medium',  // Operational errors (rate limiting, service unavailable)
  HIGH = 'high',      // System errors (database, internal errors)
  CRITICAL = 'critical' // Security issues, data corruption
}

/**
 * Error classification for monitoring
 */
export const ERROR_SEVERITY_MAP: Record<AuthErrorCode, ErrorSeverity> = {
  [AuthErrorCode.INVALID_CREDENTIALS]: ErrorSeverity.LOW,
  [AuthErrorCode.EMAIL_NOT_VERIFIED]: ErrorSeverity.LOW,
  [AuthErrorCode.USER_NOT_FOUND]: ErrorSeverity.LOW,
  [AuthErrorCode.ACCOUNT_LOCKED]: ErrorSeverity.MEDIUM,
  [AuthErrorCode.EMAIL_ALREADY_EXISTS]: ErrorSeverity.LOW,
  [AuthErrorCode.NICKNAME_ALREADY_EXISTS]: ErrorSeverity.LOW,
  [AuthErrorCode.WEAK_PASSWORD]: ErrorSeverity.LOW,
  [AuthErrorCode.INVALID_EMAIL_FORMAT]: ErrorSeverity.LOW,
  [AuthErrorCode.INVALID_TOKEN]: ErrorSeverity.LOW,
  [AuthErrorCode.EXPIRED_TOKEN]: ErrorSeverity.LOW,
  [AuthErrorCode.TOKEN_NOT_FOUND]: ErrorSeverity.LOW,
  [AuthErrorCode.ALREADY_VERIFIED]: ErrorSeverity.LOW,
  [AuthErrorCode.TOO_MANY_ATTEMPTS]: ErrorSeverity.MEDIUM,
  [AuthErrorCode.EMAIL_SEND_LIMIT]: ErrorSeverity.MEDIUM,
  [AuthErrorCode.DATABASE_ERROR]: ErrorSeverity.HIGH,
  [AuthErrorCode.EMAIL_SERVICE_ERROR]: ErrorSeverity.MEDIUM,
  [AuthErrorCode.INTERNAL_ERROR]: ErrorSeverity.HIGH,
  [AuthErrorCode.INVALID_INPUT]: ErrorSeverity.LOW,
  [AuthErrorCode.MISSING_REQUIRED_FIELD]: ErrorSeverity.LOW,
}

/**
 * Actionable errors that provide user guidance
 */
export const ACTIONABLE_ERRORS = new Set([
  AuthErrorCode.EMAIL_NOT_VERIFIED,
  AuthErrorCode.USER_NOT_FOUND,
  AuthErrorCode.EXPIRED_TOKEN,
  AuthErrorCode.WEAK_PASSWORD,
  AuthErrorCode.INVALID_EMAIL_FORMAT,
])

/**
 * Errors that should trigger automatic retries
 */
export const RETRIABLE_ERRORS = new Set([
  AuthErrorCode.DATABASE_ERROR,
  AuthErrorCode.EMAIL_SERVICE_ERROR,
  AuthErrorCode.INTERNAL_ERROR,
])

/**
 * Errors that should be reported to monitoring systems
 */
export const MONITORABLE_ERRORS = new Set([
  AuthErrorCode.DATABASE_ERROR,
  AuthErrorCode.EMAIL_SERVICE_ERROR,
  AuthErrorCode.INTERNAL_ERROR,
  AuthErrorCode.TOO_MANY_ATTEMPTS,
])

export interface ErrorMetrics {
  errorCode: AuthErrorCode
  severity: ErrorSeverity
  timestamp: Date
  count: number
  context: ErrorContext
}
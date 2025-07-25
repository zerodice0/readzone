/**
 * 이메일 재전송 에러 처리 시스템
 * 재전송 관련 모든 에러 상황을 처리하고 사용자에게 적절한 피드백 제공
 */

'use client'

import { toast } from 'sonner'
import { AuthErrorCode, createAuthError, type AuthError } from '@/types/error'

// 재전송 에러 타입 정의
export enum ResendErrorType {
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  COOLDOWN_ACTIVE = 'COOLDOWN_ACTIVE', 
  DAILY_LIMIT_REACHED = 'DAILY_LIMIT_REACHED',
  HOURLY_LIMIT_REACHED = 'HOURLY_LIMIT_REACHED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  EMAIL_SEND_FAILED = 'EMAIL_SEND_FAILED',
  STORAGE_ERROR = 'STORAGE_ERROR'
}

// 에러 상세 정보 인터페이스
export interface ResendErrorDetails {
  type: ResendErrorType
  message: string
  userMessage: string
  actionable: boolean
  retryable: boolean
  retryAfter?: number // 재시도 가능 시간 (초)
  suggestions?: string[]
  metadata?: Record<string, any>
}

// 에러 메시지 매핑
const ERROR_MESSAGES: Record<ResendErrorType, ResendErrorDetails> = {
  [ResendErrorType.RATE_LIMIT_EXCEEDED]: {
    type: ResendErrorType.RATE_LIMIT_EXCEEDED,
    message: 'Rate limit exceeded for email resend',
    userMessage: '재전송 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
    actionable: true,
    retryable: true,
    suggestions: [
      '5분 후 다시 시도하세요.',
      '이메일 확인 도움말을 참고하세요.',
      '스팸함을 확인해보세요.'
    ]
  },
  
  [ResendErrorType.COOLDOWN_ACTIVE]: {
    type: ResendErrorType.COOLDOWN_ACTIVE,
    message: 'Cooldown period is active',
    userMessage: '재전송 대기 시간입니다.',
    actionable: true,
    retryable: true,
    suggestions: [
      '대기 시간이 끝난 후 다시 시도하세요.',
      '받은 편지함과 스팸함을 확인해보세요.'
    ]
  },
  
  [ResendErrorType.DAILY_LIMIT_REACHED]: {
    type: ResendErrorType.DAILY_LIMIT_REACHED,
    message: 'Daily resend limit reached',
    userMessage: '일일 재전송 한도에 도달했습니다. 내일 다시 시도해주세요.',
    actionable: true,
    retryable: false,
    suggestions: [
      '내일 다시 시도하세요.',
      '이메일 확인 도움말을 참고하세요.',
      '고객 지원에 문의하세요.'
    ]
  },
  
  [ResendErrorType.HOURLY_LIMIT_REACHED]: {
    type: ResendErrorType.HOURLY_LIMIT_REACHED,
    message: 'Hourly resend limit reached',
    userMessage: '시간당 재전송 한도에 도달했습니다. 잠시 후 다시 시도해주세요.',
    actionable: true,
    retryable: true,
    retryAfter: 3600, // 1시간
    suggestions: [
      '1시간 후 다시 시도하세요.',
      '이메일 확인 도움말을 참고하세요.'
    ]
  },
  
  [ResendErrorType.NETWORK_ERROR]: {
    type: ResendErrorType.NETWORK_ERROR,
    message: 'Network connection failed',
    userMessage: '네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인하고 다시 시도해주세요.',
    actionable: true,
    retryable: true,
    suggestions: [
      '인터넷 연결을 확인하세요.',
      '잠시 후 다시 시도하세요.',
      'Wi-Fi 또는 데이터 연결을 확인하세요.'
    ]
  },
  
  [ResendErrorType.SERVER_ERROR]: {
    type: ResendErrorType.SERVER_ERROR,
    message: 'Server error occurred',
    userMessage: '서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
    actionable: true,
    retryable: true,
    retryAfter: 300, // 5분
    suggestions: [
      '5분 후 다시 시도하세요.',
      '문제가 지속되면 고객 지원에 문의하세요.'
    ]
  },
  
  [ResendErrorType.VALIDATION_ERROR]: {
    type: ResendErrorType.VALIDATION_ERROR,
    message: 'Email validation failed',
    userMessage: '이메일 주소가 올바르지 않습니다. 이메일 주소를 확인해주세요.',
    actionable: true,
    retryable: false,
    suggestions: [
      '이메일 주소 형식을 확인하세요.',
      '오타가 없는지 확인하세요.',
      '유효한 이메일 주소를 입력하세요.'
    ]
  },
  
  [ResendErrorType.EMAIL_SEND_FAILED]: {
    type: ResendErrorType.EMAIL_SEND_FAILED,
    message: 'Email delivery failed',
    userMessage: '이메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.',
    actionable: true,
    retryable: true,
    retryAfter: 600, // 10분
    suggestions: [
      '10분 후 다시 시도하세요.',
      '이메일 주소가 올바른지 확인하세요.',
      '고객 지원에 문의하세요.'
    ]
  },
  
  [ResendErrorType.STORAGE_ERROR]: {
    type: ResendErrorType.STORAGE_ERROR,
    message: 'Local storage access failed',
    userMessage: '브라우저 저장소에 접근할 수 없습니다. 브라우저 설정을 확인해주세요.',
    actionable: true,
    retryable: false,
    suggestions: [
      '브라우저 개인정보 보호 설정을 확인하세요.',
      '시크릿 모드가 아닌 일반 모드를 사용하세요.',
      '브라우저를 새로고침하고 다시 시도하세요.'
    ]
  }
}

/**
 * 에러 타입을 자동으로 감지하는 함수
 */
export function detectResendErrorType(error: unknown): ResendErrorType {
  if (!error) return ResendErrorType.SERVER_ERROR
  
  const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()
  
  // 네트워크 에러 감지
  if (errorMessage.includes('network') || 
      errorMessage.includes('fetch') || 
      errorMessage.includes('connection') ||
      errorMessage.includes('timeout')) {
    return ResendErrorType.NETWORK_ERROR
  }
  
  // 서버 에러 감지
  if (errorMessage.includes('server') || 
      errorMessage.includes('internal') ||
      errorMessage.includes('500') ||
      errorMessage.includes('503')) {
    return ResendErrorType.SERVER_ERROR
  }
  
  // Rate limit 에러 감지
  if (errorMessage.includes('rate limit') || 
      errorMessage.includes('too many') ||
      errorMessage.includes('429')) {
    return ResendErrorType.RATE_LIMIT_EXCEEDED
  }
  
  // 일일 한도 에러 감지
  if (errorMessage.includes('daily limit') || 
      errorMessage.includes('일일 한도')) {
    return ResendErrorType.DAILY_LIMIT_REACHED
  }
  
  // 시간당 한도 에러 감지  
  if (errorMessage.includes('hourly limit') || 
      errorMessage.includes('시간당 한도')) {
    return ResendErrorType.HOURLY_LIMIT_REACHED
  }
  
  // 이메일 검증 에러 감지
  if (errorMessage.includes('validation') || 
      errorMessage.includes('invalid email') ||
      errorMessage.includes('올바르지 않은')) {
    return ResendErrorType.VALIDATION_ERROR
  }
  
  // 이메일 발송 실패 감지
  if (errorMessage.includes('email send') || 
      errorMessage.includes('delivery failed') ||
      errorMessage.includes('발송 실패')) {
    return ResendErrorType.EMAIL_SEND_FAILED
  }
  
  // 스토리지 에러 감지
  if (errorMessage.includes('storage') || 
      errorMessage.includes('localstorage') ||
      errorMessage.includes('저장소')) {
    return ResendErrorType.STORAGE_ERROR
  }
  
  // 기본값: 서버 에러
  return ResendErrorType.SERVER_ERROR
}

/**
 * 에러를 처리하고 사용자에게 적절한 피드백을 제공하는 함수
 */
export function handleResendError(
  error: unknown, 
  context?: {
    email?: string
    attemptCount?: number
    lastAttemptTime?: Date
    retryAfter?: number
  }
): ResendErrorDetails {
  const errorType = detectResendErrorType(error)
  const errorDetails = { ...ERROR_MESSAGES[errorType] }
  
  // 컨텍스트 정보 추가
  if (context) {
    errorDetails.metadata = {
      ...errorDetails.metadata,
      ...context
    }
    
    // 재시도 시간이 컨텍스트에 있으면 우선 사용
    if (context.retryAfter) {
      errorDetails.retryAfter = context.retryAfter
    }
  }
  
  // 사용자 메시지에 구체적인 시간 정보 추가
  if (errorDetails.retryAfter && errorDetails.retryAfter > 0) {
    const minutes = Math.ceil(errorDetails.retryAfter / 60)
    if (minutes < 60) {
      errorDetails.userMessage += ` (약 ${minutes}분 후 재시도 가능)`
    } else {
      const hours = Math.ceil(minutes / 60)
      errorDetails.userMessage += ` (약 ${hours}시간 후 재시도 가능)`
    }
  }
  
  return errorDetails
}

/**
 * 토스트 메시지로 에러를 표시하는 함수
 */
export function showResendErrorToast(
  error: unknown,
  context?: {
    email?: string
    attemptCount?: number
    lastAttemptTime?: Date
    retryAfter?: number
  }
): ResendErrorDetails {
  const errorDetails = handleResendError(error, context)
  
  // 에러 타입에 따른 토스트 표시
  switch (errorDetails.type) {
    case ResendErrorType.RATE_LIMIT_EXCEEDED:
    case ResendErrorType.COOLDOWN_ACTIVE:
    case ResendErrorType.HOURLY_LIMIT_REACHED:
      toast.warning(errorDetails.userMessage, {
        description: errorDetails.suggestions?.[0],
        duration: 5000
      })
      break
      
    case ResendErrorType.DAILY_LIMIT_REACHED:
      toast.error(errorDetails.userMessage, {
        description: errorDetails.suggestions?.[0],
        duration: 7000
      })
      break
      
    case ResendErrorType.NETWORK_ERROR:
      toast.error(errorDetails.userMessage, {
        description: errorDetails.suggestions?.[0],
        action: {
          label: '재시도',
          onClick: () => window.location.reload()
        }
      })
      break
      
    case ResendErrorType.VALIDATION_ERROR:
      toast.error(errorDetails.userMessage, {
        description: errorDetails.suggestions?.[0],
        duration: 6000
      })
      break
      
    default:
      toast.error(errorDetails.userMessage, {
        description: errorDetails.suggestions?.[0],
        duration: 5000
      })
  }
  
  return errorDetails
}

/**
 * AuthError로 변환하는 함수
 */
export function createResendAuthError(
  error: unknown,
  context?: {
    email?: string
    operation?: string
  }
): AuthError {
  const errorDetails = handleResendError(error, context)
  
  // AuthErrorCode 매핑
  let authErrorCode: AuthErrorCode
  switch (errorDetails.type) {
    case ResendErrorType.RATE_LIMIT_EXCEEDED:
    case ResendErrorType.DAILY_LIMIT_REACHED:
    case ResendErrorType.HOURLY_LIMIT_REACHED:
      authErrorCode = AuthErrorCode.EMAIL_SEND_LIMIT
      break
    case ResendErrorType.VALIDATION_ERROR:
      authErrorCode = AuthErrorCode.INVALID_EMAIL
      break
    case ResendErrorType.NETWORK_ERROR:
      authErrorCode = AuthErrorCode.NETWORK_ERROR
      break
    default:
      authErrorCode = AuthErrorCode.INTERNAL_ERROR
  }
  
  return createAuthError(authErrorCode, {
    originalMessage: errorDetails.message,
    userMessage: errorDetails.userMessage,
    operation: context?.operation || 'resend_verification',
    email: context?.email,
    actionable: errorDetails.actionable,
    retryable: errorDetails.retryable,
    retryAfter: errorDetails.retryAfter,
    suggestions: errorDetails.suggestions,
    metadata: errorDetails.metadata
  })
}

/**
 * 로깅을 위한 에러 정보 수집 함수
 */
export function logResendError(
  error: unknown,
  context?: {
    email?: string
    userAgent?: string
    timestamp?: Date
    sessionId?: string
  }
): void {
  const errorDetails = handleResendError(error, context)
  
  // 개발 환경에서는 콘솔에 로그 출력
  if (process.env.NODE_ENV === 'development') {
    console.error('📧 Resend Error:', {
      type: errorDetails.type,
      message: errorDetails.message,
      userMessage: errorDetails.userMessage,
      context: context || {},
      timestamp: new Date().toISOString(),
      stack: error instanceof Error ? error.stack : undefined
    })
  }
  
  // 프로덕션 환경에서는 외부 로깅 서비스로 전송
  // 예: Sentry, LogRocket, 자체 로깅 API 등
  if (process.env.NODE_ENV === 'production') {
    // TODO: 프로덕션 로깅 구현
    // sendToLoggingService({
    //   level: 'error',
    //   category: 'email_resend',
    //   ...errorDetails,
    //   context
    // })
  }
}

/**
 * 재시도 가능 여부를 판단하는 함수
 */
export function canRetryResend(error: unknown): {
  canRetry: boolean
  retryAfter?: number
  reason?: string
} {
  const errorType = detectResendErrorType(error)
  const errorDetails = ERROR_MESSAGES[errorType]
  
  if (!errorDetails.retryable) {
    return {
      canRetry: false,
      reason: errorDetails.userMessage
    }
  }
  
  return {
    canRetry: true,
    retryAfter: errorDetails.retryAfter
  }
}
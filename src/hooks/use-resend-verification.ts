/**
 * 이메일 재전송 제한 시스템
 * 쿨다운, 시간당/일당 제한, 로컬스토리지 기반 상태 관리를 통한 스팸 방지
 */

'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { handleQueryError } from '@/lib/query-client'
import { AuthErrorCode, createAuthError } from '@/types/error'
import { 
  showResendErrorToast, 
  logResendError, 
} from '@/lib/resend-error-handler'

// 재전송 제한 인터페이스
interface ResendLimits {
  maxAttemptsPerHour: number   // 시간당 최대 재전송 횟수
  cooldownMinutes: number      // 재전송 간 쿨다운 시간 (분)
  maxAttemptsPerDay: number    // 일당 최대 재전송 횟수
}

// 재전송 기록 인터페이스
interface ResendRecord {
  email: string
  timestamps: number[]        // 재전송 시도 타임스탬프 배열
  lastSentAt: number | null  // 마지막 전송 시간
  dailyCount: number         // 일일 재전송 횟수
  lastResetDate: string      // 마지막 일일 카운트 리셋 날짜
}

// 재전송 상태 인터페이스
interface ResendState {
  canResend: boolean
  cooldownRemaining: number
  attemptsLeft: {
    hourly: number
    daily: number
  }
  nextAvailableTime: Date | null
  isLoading: boolean
}

// 기본 제한 설정
const DEFAULT_LIMITS: ResendLimits = {
  maxAttemptsPerHour: 3,    // 시간당 3회
  cooldownMinutes: 5,       // 5분 쿨다운
  maxAttemptsPerDay: 10     // 일당 10회
}

// 로컬스토리지 키
const STORAGE_KEY = 'readzone_resend_verification'

/**
 * 이메일 재전송 API 호출
 */
async function resendVerificationEmail(email: string): Promise<{ message: string }> {
  const response = await fetch('/api/auth/resend-verification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  
  const result = await response.json()
  
  if (!response.ok) {
    // 서버에서 이미 제한이 걸린 경우
    if (response.status === 429) {
      throw createAuthError(AuthErrorCode.EMAIL_SEND_LIMIT, {
        email,
        serverMessage: result.message
      })
    }
    
    throw new Error(result.message || '인증 이메일 재발송에 실패했습니다.')
  }
  
  return result
}

/**
 * 로컬스토리지에서 재전송 기록 로드
 */
function loadResendRecord(email: string): ResendRecord {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return createEmptyRecord(email)
    }
    
    const data = JSON.parse(stored)
    const record = data[email]
    
    if (!record) {
      return createEmptyRecord(email)
    }
    
    // 날짜가 바뀌었으면 일일 카운트 리셋
    const today = new Date().toDateString()
    if (record.lastResetDate !== today) {
      record.dailyCount = 0
      record.lastResetDate = today
    }
    
    return record
  } catch (error) {
    // 스토리지 에러 로깅
    logResendError(error, { 
      email, 
      userAgent: navigator.userAgent,
      timestamp: new Date()
    })
    return createEmptyRecord(email)
  }
}

/**
 * 로컬스토리지에 재전송 기록 저장
 */
function saveResendRecord(email: string, record: ResendRecord): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    const data = stored ? JSON.parse(stored) : {}
    
    data[email] = record
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    // 스토리지 에러 로깅
    logResendError(error, { 
      email, 
      userAgent: navigator.userAgent,
      timestamp: new Date()
    })
  }
}

/**
 * 빈 재전송 기록 생성
 */
function createEmptyRecord(email: string): ResendRecord {
  return {
    email,
    timestamps: [],
    lastSentAt: null,
    dailyCount: 0,
    lastResetDate: new Date().toDateString()
  }
}

/**
 * 시간당 제한 계산
 */
function calculateHourlyAttempts(timestamps: number[], maxAttemptsPerHour: number): number {
  const oneHourAgo = Date.now() - (60 * 60 * 1000)
  const recentAttempts = timestamps.filter(time => time > oneHourAgo)
  return Math.max(0, maxAttemptsPerHour - recentAttempts.length)
}

/**
 * 쿨다운 시간 계산
 */
function calculateCooldown(lastSentAt: number | null, cooldownMinutes: number): {
  remaining: number
  nextAvailable: Date | null
} {
  if (!lastSentAt) {
    return { remaining: 0, nextAvailable: null }
  }
  
  const cooldownMs = cooldownMinutes * 60 * 1000
  const elapsed = Date.now() - lastSentAt
  const remaining = Math.max(0, Math.ceil((cooldownMs - elapsed) / 1000))
  
  const nextAvailable = remaining > 0 
    ? new Date(lastSentAt + cooldownMs)
    : null
    
  return { remaining, nextAvailable }
}

/**
 * 이메일 재전송 제한 시스템 훅
 * 
 * @param email - 재전송할 이메일 주소
 * @param limits - 재전송 제한 설정 (선택사항)
 * @returns 재전송 상태 및 함수들
 */
export function useResendVerification(
  email: string,
  limits: Partial<ResendLimits> = {}
) {
  const finalLimits = useMemo(() => ({ ...DEFAULT_LIMITS, ...limits }), [limits])
  
  // 상태 관리
  const [record, setRecord] = useState<ResendRecord>(() => loadResendRecord(email))
  // const [cooldownRemaining, setCooldownRemaining] = useState(0)
  
  // API 뮤테이션
  const mutation = useMutation({
    mutationFn: () => resendVerificationEmail(email),
    onSuccess: (data) => {
      const now = Date.now()
      const newRecord: ResendRecord = {
        ...record,
        timestamps: [...record.timestamps, now].slice(-finalLimits.maxAttemptsPerHour),
        lastSentAt: now,
        dailyCount: record.dailyCount + 1
      }
      
      setRecord(newRecord)
      saveResendRecord(email, newRecord)
      
      toast.success(data.message)
    },
    onError: (error) => {
      // 에러 로깅
      logResendError(error, {
        email,
        userAgent: navigator.userAgent,
        timestamp: new Date()
      })
    },
  })
  
  // 쿨다운 타이머
  useEffect(() => {
    if (!record.lastSentAt) return
    
    const interval = setInterval(() => {
      const { remaining } = calculateCooldown(record.lastSentAt, finalLimits.cooldownMinutes)
      // setCooldownRemaining(remaining)
      
      if (remaining === 0) {
        clearInterval(interval)
      }
    }, 1000)
    
    return () => clearInterval(interval)
  }, [record.lastSentAt, finalLimits.cooldownMinutes])
  
  // 재전송 상태 계산
  const state: ResendState = useMemo(() => {
    const { remaining: cooldown, nextAvailable } = calculateCooldown(
      record.lastSentAt, 
      finalLimits.cooldownMinutes
    )
    
    const hourlyLeft = calculateHourlyAttempts(record.timestamps, finalLimits.maxAttemptsPerHour)
    const dailyLeft = Math.max(0, finalLimits.maxAttemptsPerDay - record.dailyCount)
    
    const canResend = 
      cooldown === 0 &&
      hourlyLeft > 0 &&
      dailyLeft > 0 &&
      !mutation.isPending
    
    return {
      canResend,
      cooldownRemaining: cooldown,
      attemptsLeft: {
        hourly: hourlyLeft,
        daily: dailyLeft
      },
      nextAvailableTime: nextAvailable,
      isLoading: mutation.isPending
    }
  }, [
    record.lastSentAt,
    record.timestamps,
    record.dailyCount,
    finalLimits,
    mutation.isPending
  ])
  
  // 재전송 함수
  const resend = useCallback(async () => {
    if (!state.canResend) {
      // 상세한 에러 처리
      if (state.cooldownRemaining > 0) {
        showResendErrorToast(new Error('COOLDOWN_ACTIVE'), {
          email,
          retryAfter: state.cooldownRemaining
        })
      } else if (state.attemptsLeft.daily === 0) {
        showResendErrorToast(new Error('DAILY_LIMIT_REACHED'), {
          email,
          attemptCount: record.dailyCount
        })
      } else if (state.attemptsLeft.hourly === 0) {
        showResendErrorToast(new Error('HOURLY_LIMIT_REACHED'), {
          email,
          attemptCount: record.timestamps.length
        })
      }
      return
    }
    
    try {
      return await mutation.mutateAsync()
    } catch (error) {
      // 뮤테이션에서 처리되지만 추가 로깅
      logResendError(error, {
        email,
        userAgent: navigator.userAgent,
        timestamp: new Date()
      })
      throw error
    }
  }, [state, mutation, email, record])
  
  // 기록 초기화 (개발/테스트용)
  const reset = useCallback(() => {
    const emptyRecord = createEmptyRecord(email)
    setRecord(emptyRecord)
    saveResendRecord(email, emptyRecord)
    // setCooldownRemaining(0)
  }, [email])
  
  // 상태 메시지 생성
  const getStatusMessage = useCallback((): string => {
    if (state.isLoading) return '전송 중...'
    if (state.cooldownRemaining > 0) {
      const minutes = Math.ceil(state.cooldownRemaining / 60)
      return `${minutes}분 후 재전송 가능`
    }
    if (state.attemptsLeft.daily === 0) {
      return '일일 한도 도달 (내일 재시도 가능)'
    }
    if (state.attemptsLeft.hourly === 0) {
      return '시간당 한도 도달 (잠시 후 재시도)'
    }
    return `재전송 가능 (오늘 ${state.attemptsLeft.daily}회 남음)`
  }, [state])
  
  return {
    // 상태
    ...state,
    
    // 함수
    resend,
    reset,
    getStatusMessage,
    
    // 메타데이터
    limits: finalLimits,
    record: {
      email: record.email,
      dailyCount: record.dailyCount,
      totalAttempts: record.timestamps.length,
      lastSentAt: record.lastSentAt ? new Date(record.lastSentAt) : null
    }
  }
}

/**
 * 간단한 재전송 훅 (기존 호환성용)
 * @deprecated use-auth-api.ts의 useResendVerificationBasic 대신 이 훅을 사용하세요
 */
export function useResendVerificationBasic() {
  return useMutation({
    mutationFn: async (email: string) => resendVerificationEmail(email),
    onSuccess: (data) => {
      toast.success(data.message)
    },
    onError: (error) => {
      const message = handleQueryError(error)
      toast.error(message)
    },
  })
}
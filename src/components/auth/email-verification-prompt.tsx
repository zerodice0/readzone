'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui'
import { useResendVerification } from '@/hooks/use-auth-api'
import { Mail, Clock, HelpCircle, CheckCircle, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmailVerificationPromptProps {
  email: string
  onShowGuide: () => void
  className?: string
}

export function EmailVerificationPrompt({ 
  email, 
  onShowGuide, 
  className 
}: EmailVerificationPromptProps): JSX.Element {
  const resendVerification = useResendVerification()
  const [lastSentAt, setLastSentAt] = useState<Date | null>(null)
  const [attemptsCount, setAttemptsCount] = useState(0)
  const [cooldownRemaining, setCooldownRemaining] = useState(0)

  // 재전송 제한 설정
  const COOLDOWN_MINUTES = 5
  const MAX_ATTEMPTS_PER_HOUR = 3
  const MAX_ATTEMPTS_PER_DAY = 10

  // 쿨다운 타이머
  useEffect(() => {
    if (!lastSentAt) return

    const interval = setInterval(() => {
      const now = new Date()
      const timeDiff = now.getTime() - lastSentAt.getTime()
      const cooldownMs = COOLDOWN_MINUTES * 60 * 1000
      const remaining = Math.max(0, Math.ceil((cooldownMs - timeDiff) / 1000))
      
      setCooldownRemaining(remaining)
      
      if (remaining === 0) {
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [lastSentAt])

  // 재전송 가능 여부 계산
  const canResend = useMemo(() => {
    if (cooldownRemaining > 0) return false
    if (attemptsCount >= MAX_ATTEMPTS_PER_DAY) return false
    return true
  }, [cooldownRemaining, attemptsCount])

  // 재전송 버튼 텍스트
  const getResendButtonText = () => {
    if (resendVerification.isPending) return '발송 중...'
    if (cooldownRemaining > 0) return `${Math.floor(cooldownRemaining / 60)}:${(cooldownRemaining % 60).toString().padStart(2, '0')} 후 재전송 가능`
    if (attemptsCount >= MAX_ATTEMPTS_PER_DAY) return '일일 한도 초과'
    return '인증 메일 재전송'
  }

  // 재전송 핸들러
  const handleResend = async (): Promise<void> => {
    if (!canResend) return

    try {
      await resendVerification.mutateAsync({ email })
      setLastSentAt(new Date())
      setAttemptsCount(prev => prev + 1)
    } catch (error) {
      // 에러는 resendVerification hook에서 toast로 처리됨
      console.error('Email resend failed:', error)
    }
  }

  // 상태별 아이콘
  const getStatusIcon = () => {
    if (resendVerification.isPending) {
      return <Clock className="h-5 w-5 text-amber-600 animate-pulse" />
    }
    if (resendVerification.isSuccess && lastSentAt) {
      return <CheckCircle className="h-5 w-5 text-green-600" />
    }
    return <Mail className="h-5 w-5 text-amber-600" />
  }

  // 상태별 메시지
  const getStatusMessage = () => {
    if (resendVerification.isSuccess && lastSentAt) {
      return '인증 메일이 재발송되었습니다. 이메일을 확인해주세요.'
    }
    return `${email}로 발송된 인증 메일을 확인해주세요.`
  }

  return (
    <div className={cn(
      'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4',
      className
    )}>
      <div className="flex items-start space-x-3">
        {/* 상태 아이콘 */}
        <div className="flex-shrink-0 mt-0.5">
          {getStatusIcon()}
        </div>

        {/* 메인 콘텐츠 */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">
            이메일 인증이 필요합니다
          </h3>
          
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
            {getStatusMessage()}
          </p>

          {/* 재전송 제한 정보 */}
          {(cooldownRemaining > 0 || attemptsCount > 0) && (
            <div className="mt-2 text-xs text-amber-600 dark:text-amber-400">
              {cooldownRemaining > 0 ? (
                <span className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {Math.floor(cooldownRemaining / 60)}분 {cooldownRemaining % 60}초 후 재전송 가능
                </span>
              ) : (
                <span>
                  오늘 {MAX_ATTEMPTS_PER_DAY - attemptsCount}회 재전송 가능
                </span>
              )}
            </div>
          )}

          {/* 액션 버튼들 */}
          <div className="mt-3 flex flex-col sm:flex-row gap-2">
            <Button
              onClick={handleResend}
              disabled={!canResend}
              loading={resendVerification.isPending}
              size="sm"
              variant={resendVerification.isSuccess ? "outline" : "default"}
              className="text-xs"
            >
              <Mail className="h-3 w-3 mr-1" />
              {getResendButtonText()}
            </Button>

            <Button
              onClick={onShowGuide}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              <HelpCircle className="h-3 w-3 mr-1" />
              이메일 확인 도움말
            </Button>
          </div>

          {/* 추가 안내 */}
          <div className="mt-3 text-xs text-amber-600 dark:text-amber-400">
            <div className="flex items-start space-x-1">
              <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>
                이메일이 보이지 않는다면 스팸함을 확인하거나 도움말을 참고해주세요.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
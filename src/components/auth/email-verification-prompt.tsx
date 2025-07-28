'use client'

import { useState, useEffect, useId, useRef } from 'react'
import { Button } from '@/components/ui'
import { useResendVerification } from '@/hooks/use-resend-verification'
import { Mail, Clock, HelpCircle, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmailVerificationPromptProps {
  email: string
  onShowGuide: () => void
  availableActions?: string[]
  className?: string
}

export function EmailVerificationPrompt({ 
  email, 
  onShowGuide, 
  className 
}: EmailVerificationPromptProps): JSX.Element {
  // 새로운 재전송 제한 훅 사용
  const resendHook = useResendVerification(email)
  
  // 접근성을 위한 고유 ID 생성
  const titleId = useId()
  const descriptionId = useId()
  const statusId = useId()
  const limitInfoId = useId()
  const helpTextId = useId()
  const liveRegionId = useId()
  
  // 포커스 관리를 위한 ref
  const resendButtonRef = useRef<HTMLButtonElement>(null)
  const [announcement, setAnnouncement] = useState<string>('')
  
  // 상태 변경 시 스크린 리더 안내
  useEffect(() => {
    if (resendHook.isLoading) {
      setAnnouncement('이메일 재전송 중입니다.')
    } else if (resendHook.record.lastSentAt) {
      setAnnouncement('인증 메일이 성공적으로 재발송되었습니다. 이메일을 확인해주세요.')
    }
  }, [resendHook.isLoading, resendHook.record.lastSentAt])
  
  // 쿨다운 시간 변경 시 안내 (1분 단위로만)
  useEffect(() => {
    const minutes = Math.floor(resendHook.cooldownRemaining / 60)
    const seconds = resendHook.cooldownRemaining % 60
    
    // 정확히 분 단위가 변경될 때만 알림
    if (resendHook.cooldownRemaining > 0 && seconds === 0 && minutes > 0) {
      setAnnouncement(`${minutes}분 후 재전송이 가능합니다.`)
    }
  }, [resendHook.cooldownRemaining])

  // 재전송 핸들러 (접근성 개선)
  const handleResend = async (): Promise<void> => {
    if (!resendHook.canResend) return

    try {
      await resendHook.resend()
      // 성공 시 버튼에 포커스 유지 (상태 변경을 인지할 수 있도록)
      setTimeout(() => {
        resendButtonRef.current?.focus()
      }, 100)
    } catch (error) {
      // 에러는 resendHook에서 toast로 처리됨
      console.error('Email resend failed:', error)
      // 에러 시에도 버튼에 포커스 유지
      resendButtonRef.current?.focus()
    }
  }
  
  // 키보드 네비게이션 개선
  const handleKeyDown = (event: React.KeyboardEvent) => {
    // Enter 또는 Space로 도움말 버튼 활성화
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onShowGuide()
    }
  }

  // 상태별 아이콘 (접근성 개선)
  const getStatusIcon = () => {
    if (resendHook.isLoading) {
      return (
        <RefreshCw 
          className="h-5 w-5 text-amber-600 animate-spin" 
          aria-label="이메일 재전송 중"
          role="img"
        />
      )
    }
    if (resendHook.record.lastSentAt) {
      return (
        <CheckCircle 
          className="h-5 w-5 text-green-600" 
          aria-label="이메일 재전송 완료"
          role="img"
        />
      )
    }
    return (
      <Mail 
        className="h-5 w-5 text-amber-600" 
        aria-label="이메일 인증 필요"
        role="img"
      />
    )
  }

  // 상태별 메시지
  const getStatusMessage = () => {
    if (resendHook.record.lastSentAt) {
      return '인증 메일이 재발송되었습니다. 이메일을 확인해주세요.'
    }
    return `${email}로 발송된 인증 메일을 확인해주세요.`
  }

  return (
    <>
      {/* 스크린 리더를 위한 라이브 리전 */}
      <div
        id={liveRegionId}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>
      
      <section 
        className={cn(
          'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4',
          'focus-within:ring-2 focus-within:ring-amber-500 focus-within:ring-opacity-50',
          className
        )}
        role="alert"
        aria-labelledby={titleId}
        aria-describedby={`${descriptionId} ${statusId} ${limitInfoId} ${helpTextId}`}
      >
        <div className="flex items-start space-x-3">
          {/* 상태 아이콘 */}
          <div className="flex-shrink-0 mt-0.5" aria-hidden="false">
            {getStatusIcon()}
          </div>

          {/* 메인 콘텐츠 */}
          <div className="flex-1 min-w-0">
            <h3 
              id={titleId}
              className="text-sm font-medium text-amber-800 dark:text-amber-200"
            >
              이메일 인증이 필요합니다
            </h3>
            
            <p 
              id={descriptionId}
              className="mt-1 text-sm text-amber-700 dark:text-amber-300"
            >
              {getStatusMessage()}
            </p>

            {/* 재전송 제한 정보 */}
            {(resendHook.cooldownRemaining > 0 || resendHook.record.dailyCount > 0) && (
              <div 
                id={limitInfoId}
                className="mt-2 text-xs text-amber-600 dark:text-amber-400"
                role="status"
                aria-live="polite"
              >
                {resendHook.cooldownRemaining > 0 ? (
                  <span className="flex items-center">
                    <Clock 
                      className="h-3 w-3 mr-1" 
                      aria-label="대기 시간"
                      role="img"
                    />
                    <span aria-label={`${Math.floor(resendHook.cooldownRemaining / 60)}분 ${resendHook.cooldownRemaining % 60}초 후 재전송 가능`}>
                      {Math.floor(resendHook.cooldownRemaining / 60)}분 {resendHook.cooldownRemaining % 60}초 후 재전송 가능
                    </span>
                  </span>
                ) : (
                  <span aria-label={`오늘 ${resendHook.attemptsLeft.daily}회 재전송 가능`}>
                    오늘 {resendHook.attemptsLeft.daily}회 재전송 가능
                  </span>
                )}
              </div>
            )}

            {/* 액션 버튼들 */}
            <div 
              className="mt-3 flex flex-col sm:flex-row gap-2"
              role="group"
              aria-label="인증 메일 관련 액션"
            >
              <Button
                ref={resendButtonRef}
                onClick={handleResend}
                disabled={!resendHook.canResend}
                loading={resendHook.isLoading}
                size="sm"
                variant={resendHook.record.lastSentAt ? "outline" : "default"}
                className="text-xs focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                aria-describedby={limitInfoId}
                aria-label={`인증 메일 재전송. ${resendHook.getStatusMessage()}`}
              >
                <Mail 
                  className="h-3 w-3 mr-1" 
                  aria-hidden="true"
                />
                {resendHook.getStatusMessage()}
              </Button>

              <Button
                onClick={onShowGuide}
                onKeyDown={handleKeyDown}
                variant="outline"
                size="sm"
                className="text-xs focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                aria-label="이메일 확인 도움말 보기. 스팸함 확인 방법과 추가 안내를 제공합니다"
              >
                <HelpCircle 
                  className="h-3 w-3 mr-1" 
                  aria-hidden="true"
                />
                이메일 확인 도움말
              </Button>
            </div>

            {/* 추가 안내 */}
            <div 
              id={helpTextId}
              className="mt-3 text-xs text-amber-600 dark:text-amber-400"
              role="note"
            >
              <div className="flex items-start space-x-1">
                <AlertTriangle 
                  className="h-3 w-3 mt-0.5 flex-shrink-0" 
                  aria-label="주의사항"
                  role="img"
                />
                <span>
                  이메일이 보이지 않는다면 스팸함을 확인하거나 도움말을 참고해주세요.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
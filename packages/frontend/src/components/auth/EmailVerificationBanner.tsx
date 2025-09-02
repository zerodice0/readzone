import { useEffect, useState } from 'react'
import { AlertCircle, Mail, X } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { resendEmailVerification } from '@/lib/api/auth'

interface EmailVerificationBannerProps {
  onDismiss?: () => void
}

export function EmailVerificationBanner({ onDismiss }: EmailVerificationBannerProps) {
  const { user } = useAuthStore()
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)
  const [showHelp, setShowHelp] = useState(false)

  // Cooldown 타이머 (간단한 연속 클릭 방지)
  if (cooldown > 0) {
    // setInterval을 남발하지 않도록 렌더 사이드에서 가드
    // 아래 useEffect에서만 타이머를 관리함
  }

  // 초 단위 카운트다운
  
  useEffect(() => {
    if (cooldown <= 0) {
      return
    }
    const id = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000)

    return () => clearInterval(id)
  }, [cooldown])

  // 인증된 사용자는 배너 표시하지 않음
  if (!user || user.isVerified) {
    return null
  }

  const handleResendEmail = async () => {
    if (!user?.email) {
      return
    }

    // 60초 쿨다운 적용
    if (cooldown > 0) {
      return
    }

    setIsResending(true)
    setError(null)

    try {
      await resendEmailVerification(user.email)
      setResendSuccess(true)
      setCooldown(60)
      
      // 3초 후 성공 메시지 숨김
      setTimeout(() => {
        setResendSuccess(false)
      }, 3000)
    } catch (error) {
      console.error('이메일 재발송 오류:', error)
      setError(error instanceof Error ? error.message : '이메일 재발송에 실패했습니다.')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="bg-amber-50 border-l-4 border-amber-400 p-4 shadow-sm">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-amber-400" />
        </div>
        
        <div className="ml-3 flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-amber-800">
                이메일 인증이 필요합니다
              </h3>
              <div className="mt-1 text-sm text-amber-700">
                <p className="mb-2">
                  독후감 작성과 좋아요 기능을 사용하려면 이메일 인증을 완료해주세요.
                </p>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleResendEmail}
                    disabled={isResending || cooldown > 0}
                    className="inline-flex items-center space-x-1 text-amber-800 hover:text-amber-900 font-medium disabled:opacity-50"
                  >
                    <Mail className="h-4 w-4" />
                    <span>
                      {isResending
                        ? '발송 중...'
                        : cooldown > 0
                          ? `재요청 가능: ${cooldown}s`
                          : '인증 이메일 재발송'}
                    </span>
                  </button>
                  
                  {resendSuccess && (
                    <span className="text-sm text-green-600 font-medium">
                      ✓ 인증 이메일이 발송되었습니다
                    </span>
                  )}
                </div>
                
                {error && (
                  <p className="mt-2 text-sm text-red-600">
                    {error}
                  </p>
                )}

                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => setShowHelp(s => !s)}
                    className="text-xs text-amber-700/80 hover:text-amber-900 underline"
                  >
                    {showHelp ? '도움말 접기' : '이메일이 오지 않나요? 도움말 보기'}
                  </button>
                  {showHelp && (
                    <div className="mt-2 text-xs text-amber-700/80 border border-amber-200 rounded p-2 bg-amber-50/60">
                      <ul className="list-disc pl-4 space-y-1">
                        <li>스팸함·프로모션함을 확인해 주세요.</li>
                        <li>메일 규칙/필터에 의해 이동되지 않았는지 확인해 주세요.</li>
                        <li>회사/학교 메일은 보안정책으로 차단될 수 있어요. 개인 메일 사용을 권장합니다.</li>
                        <li>1분 뒤에도 오지 않으면 재발송해 주세요. 너무 잦은 요청은 제한됩니다.</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="flex-shrink-0 ml-4 text-amber-400 hover:text-amber-600"
                aria-label="배너 닫기"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

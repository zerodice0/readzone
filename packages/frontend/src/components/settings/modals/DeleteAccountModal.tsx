import { useEffect, useRef, useState } from 'react'
import { clsx } from 'clsx'

interface DeleteAccountModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string, feedback?: string) => void
  userEmail: string
  userName: string
}

/**
 * 계정 삭제 확인 모달
 * 2단계 확인 과정과 피드백 수집
 */
export function DeleteAccountModal({
  isOpen,
  onClose,
  onConfirm,
  userEmail,
  userName
}: DeleteAccountModalProps) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    reason: '',
    customReason: '',
    feedback: '',
    confirmationText: '',
    agreeToDataDeletion: false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const confirmInputRef = useRef<HTMLInputElement>(null)

  // 모달이 열릴 때마다 초기화
  useEffect(() => {
    if (isOpen) {
      setStep(1)
      setFormData({
        reason: '',
        customReason: '',
        feedback: '',
        confirmationText: '',
        agreeToDataDeletion: false
      })
      setIsSubmitting(false)
    }
  }, [isOpen])

  // 2단계에서 입력 필드에 포커스
  useEffect(() => {
    if (step === 2 && confirmInputRef.current) {
      confirmInputRef.current.focus()
    }
  }, [step])

  // 삭제 사유 옵션
  const reasonOptions = [
    { value: 'not_useful', label: '더 이상 유용하지 않음' },
    { value: 'too_complicated', label: '사용법이 복잡함' },
    { value: 'privacy_concerns', label: '개인정보 우려' },
    { value: 'found_alternative', label: '다른 서비스를 찾음' },
    { value: 'temporary_break', label: '잠시 휴식이 필요함' },
    { value: 'other', label: '기타' }
  ]

  const handleReasonChange = (reason: string) => {
    setFormData(prev => ({ ...prev, reason, customReason: '' }))
  }

  const handleNext = () => {
    if (step === 1) {
      // 1단계 유효성 검사
      if (!formData.reason) {return}
      if (formData.reason === 'other' && !formData.customReason.trim()) {return}

      setStep(2)
    }
  }

  const handleSubmit = async () => {
    // 최종 확인 검사
    if (formData.confirmationText !== '계정 삭제') {
      return
    }

    if (!formData.agreeToDataDeletion) {
      return
    }

    setIsSubmitting(true)

    try {
      const finalReason = formData.reason === 'other'
        ? formData.customReason
        : reasonOptions.find(opt => opt.value === formData.reason)?.label ?? formData.reason

      await onConfirm(finalReason, formData.feedback || undefined)
    } catch (error) {
      console.error('Account deletion failed:', error)
      setIsSubmitting(false)
    }
  }

  const canProceedStep1 = formData.reason && (formData.reason !== 'other' || formData.customReason.trim())
  const canSubmitStep2 = formData.confirmationText === '계정 삭제' && formData.agreeToDataDeletion

  if (!isOpen) {return null}

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 오버레이 */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={!isSubmitting ? onClose : undefined}
      />

      {/* 모달 콘텐츠 */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full">
                <svg className="h-5 w-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.232 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  계정 삭제
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {step}/2 단계
                </p>
              </div>
            </div>
            {!isSubmitting && (
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* 콘텐츠 */}
        <div className="px-6 py-4 max-h-96 overflow-y-auto">
          {step === 1 ? (
            /* 1단계: 삭제 사유 선택 */
            <div className="space-y-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-start space-x-3">
                  <svg className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.232 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                      중요한 알림
                    </h4>
                    <ul className="text-xs text-red-700 dark:text-red-300 space-y-1">
                      <li>• 모든 독후감, 댓글, 좋아요가 영구적으로 삭제됩니다</li>
                      <li>• 다른 사용자의 독후감에 남긴 댓글도 삭제됩니다</li>
                      <li>• 계정 삭제 후 30일간 복구 가능하며, 그 후 완전히 삭제됩니다</li>
                      <li>• 삭제된 데이터는 복구할 수 없습니다</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                  계정을 삭제하시는 이유를 알려주세요 (선택사항)
                </h4>
                <div className="space-y-2">
                  {reasonOptions.map((option) => (
                    <label
                      key={option.value}
                      className={clsx(
                        'flex items-center p-3 border rounded-lg cursor-pointer transition-colors',
                        formData.reason === option.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      )}
                    >
                      <input
                        type="radio"
                        name="reason"
                        value={option.value}
                        checked={formData.reason === option.value}
                        onChange={(e) => handleReasonChange(e.target.value)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-3 text-sm text-gray-900 dark:text-gray-100">
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>

                {formData.reason === 'other' && (
                  <div className="mt-3">
                    <textarea
                      value={formData.customReason}
                      onChange={(e) => setFormData(prev => ({ ...prev, customReason: e.target.value }))}
                      placeholder="자세한 사유를 알려주세요"
                      rows={3}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  서비스 개선을 위한 추가 의견 (선택사항)
                </label>
                <textarea
                  value={formData.feedback}
                  onChange={(e) => setFormData(prev => ({ ...prev, feedback: e.target.value }))}
                  placeholder="ReadZone을 더 나은 서비스로 만들기 위한 의견을 남겨주세요"
                  rows={3}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>
            </div>
          ) : (
            /* 2단계: 최종 확인 */
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-start space-x-3">
                  <svg className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.232 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                      최종 확인
                    </h4>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300">
                      이 작업은 되돌릴 수 없습니다. 신중하게 결정해주세요.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    삭제될 계정 정보
                  </h5>
                  <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    <div>이메일: {userEmail}</div>
                    <div>사용자명: {userName}</div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    확인을 위해 <strong>"계정 삭제"</strong>를 입력해주세요
                  </label>
                  <input
                    ref={confirmInputRef}
                    type="text"
                    value={formData.confirmationText}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmationText: e.target.value }))}
                    placeholder="계정 삭제"
                    className={clsx(
                      'block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors',
                      formData.confirmationText === '계정 삭제'
                        ? 'border-green-500 focus:ring-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800',
                      'text-gray-900 dark:text-gray-100'
                    )}
                  />
                </div>

                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.agreeToDataDeletion}
                    onChange={(e) => setFormData(prev => ({ ...prev, agreeToDataDeletion: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5"
                  />
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    위 내용을 모두 확인했으며, 계정과 모든 데이터가 영구적으로 삭제됨에 동의합니다.
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          <div className="flex space-x-3">
            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={isSubmitting}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                이전
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              취소
            </button>
          </div>

          <div>
            {step === 1 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={!canProceedStep1}
                className={clsx(
                  'px-4 py-2 rounded-lg transition-colors',
                  canProceedStep1
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                )}
              >
                다음
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmitStep2 || isSubmitting}
                className={clsx(
                  'px-4 py-2 rounded-lg transition-colors',
                  canSubmitStep2 && !isSubmitting
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                )}
              >
                {isSubmitting ? '삭제 중...' : '계정 삭제'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeleteAccountModal
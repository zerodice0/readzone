import React, { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { clsx } from 'clsx'
import { usePasswordValidation, useValidation } from '@/hooks/useValidation'
import { settingsAnalytics } from '@/lib/analytics'
import { animations } from '@/lib/animations'

interface PasswordChangeFormProps {
  onSubmit: (data: {
    currentPassword: string
    newPassword: string
    confirmPassword: string
  }) => Promise<void>
  className?: string
  disabled?: boolean
}

/**
 * 비밀번호 변경 폼 컴포넌트
 * Phase 4 UI/UX 개선사항:
 * - 실시간 강도 검증
 * - 애니메이션 피드백
 * - 접근성 지원
 * - 자동 저장 상태 표시
 */
export function PasswordChangeForm({
  onSubmit,
  className,
  disabled = false,
}: PasswordChangeFormProps) {
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const { validatePasswordStrength } = usePasswordValidation()

  // 폼 검증
  const {
    values,
    errors,
    touched,
    isValid,
    setFieldValue,
    setFieldTouched,
    reset,
  } = useValidation(
    {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    {
      currentPassword: { required: true, minLength: 1 },
      newPassword: {
        required: true,
        minLength: 8,
        custom: (value: unknown) => {
          if (!value) {return null}
          const strength = validatePasswordStrength(String(value))

          return strength.isValid ? null : '더 강한 비밀번호를 입력해주세요'
        },
      },
      confirmPassword: {
        required: true,
        custom: (value: unknown) => {
          if (!value) {return null}
          if (String(value) !== values.newPassword) {
            return '비밀번호가 일치하지 않습니다'
          }

          return null
        },
      },
    }
  )

  // 비밀번호 강도 계산
  const newPasswordStrength = useMemo(
    () => validatePasswordStrength(values.newPassword),
    [values.newPassword, validatePasswordStrength]
  )

  // 폼 제출 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid || isSubmitting || disabled) {return}

    setIsSubmitting(true)
    setSubmitSuccess(false)

    const submitStartTime = performance.now()

    try {
      await onSubmit({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      })

      setSubmitSuccess(true)
      reset()

      // 분석 추적
      const submitDuration = performance.now() - submitStartTime

      settingsAnalytics.settingSaved('account', 'password', 'manual', submitDuration)

      // 성공 상태를 3초 후 리셋
      setTimeout(() => setSubmitSuccess(false), 3000)
    } catch (error) {
      settingsAnalytics.error(
        'account',
        'password_change_failed',
        error instanceof Error ? error.message : '비밀번호 변경 실패'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // 비밀번호 가시성 토글
  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }))
    settingsAnalytics.accessibilityUsed('keyboard_navigation')
  }

  // 강도 색상 결정
  const getStrengthColor = (score: number) => {
    if (score <= 1) {return 'bg-red-500'}
    if (score === 2) {return 'bg-yellow-500'}
    if (score === 3) {return 'bg-blue-500'}

    return 'bg-green-500'
  }

  const getStrengthLabel = (score: number) => {
    const labels = ['매우 약함', '약함', '보통', '강함', '매우 강함']

    return labels[score] ?? '없음'
  }

  return (
    <div className={clsx('space-y-6', className)}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 현재 비밀번호 */}
        <div>
          <label
            htmlFor="current-password"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            현재 비밀번호
          </label>
          <div className="relative">
            <input
              id="current-password"
              type={showPasswords.current ? 'text' : 'password'}
              value={values.currentPassword}
              onChange={(e) => setFieldValue('currentPassword', e.target.value)}
              onBlur={() => setFieldTouched('currentPassword')}
              className={clsx(
                'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-12 transition-colors',
                errors.currentPassword && touched.currentPassword
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 dark:border-gray-600',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
              required
              disabled={disabled}
              aria-describedby={errors.currentPassword && touched.currentPassword ? 'current-password-error' : undefined}
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('current')}
              className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label={showPasswords.current ? '비밀번호 숨기기' : '비밀번호 보기'}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {showPasswords.current ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                )}
              </svg>
            </button>
          </div>
          <AnimatePresence>
            {errors.currentPassword && touched.currentPassword && (
              <motion.p
                id="current-password-error"
                className="mt-1 text-xs text-red-600 dark:text-red-400"
                {...animations.slideDown}
                role="alert"
              >
                {errors.currentPassword}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* 새 비밀번호 */}
        <div>
          <label
            htmlFor="new-password"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            새 비밀번호
          </label>
          <div className="relative">
            <input
              id="new-password"
              type={showPasswords.new ? 'text' : 'password'}
              value={values.newPassword}
              onChange={(e) => setFieldValue('newPassword', e.target.value)}
              onBlur={() => setFieldTouched('newPassword')}
              className={clsx(
                'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-12 transition-colors',
                errors.newPassword && touched.newPassword
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 dark:border-gray-600',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
              required
              disabled={disabled}
              aria-describedby="password-strength new-password-error"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('new')}
              className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label={showPasswords.new ? '비밀번호 숨기기' : '비밀번호 보기'}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {showPasswords.new ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                )}
              </svg>
            </button>
          </div>

          {/* 비밀번호 강도 표시 */}
          <AnimatePresence>
            {values.newPassword.length > 0 && (
              <motion.div
                id="password-strength"
                className="mt-2"
                {...animations.slideDown}
              >
                <div className="flex items-center space-x-2">
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      className={clsx('h-full transition-all duration-300', getStrengthColor(newPasswordStrength.score))}
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(newPasswordStrength.score / 4) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400 min-w-0 whitespace-nowrap">
                    {getStrengthLabel(newPasswordStrength.score)}
                  </span>
                </div>

                {newPasswordStrength.feedback.length > 0 && (
                  <motion.ul
                    className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1"
                    {...animations.fadeIn}
                  >
                    {newPasswordStrength.feedback.map((feedback, index) => (
                      <motion.li
                        key={index}
                        className="flex items-center"
                        {...animations.slideInLeft}
                        transition={{ delay: index * 0.1 }}
                      >
                        <svg className="w-3 h-3 text-red-500 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {feedback}
                      </motion.li>
                    ))}
                  </motion.ul>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {errors.newPassword && touched.newPassword && (
              <motion.p
                id="new-password-error"
                className="mt-1 text-xs text-red-600 dark:text-red-400"
                {...animations.slideDown}
                role="alert"
              >
                {errors.newPassword}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* 비밀번호 확인 */}
        <div>
          <label
            htmlFor="confirm-password"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            새 비밀번호 확인
          </label>
          <div className="relative">
            <input
              id="confirm-password"
              type={showPasswords.confirm ? 'text' : 'password'}
              value={values.confirmPassword}
              onChange={(e) => setFieldValue('confirmPassword', e.target.value)}
              onBlur={() => setFieldTouched('confirmPassword')}
              className={clsx(
                'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-12 transition-colors',
                errors.confirmPassword && touched.confirmPassword
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : values.confirmPassword.length > 0 && values.confirmPassword === values.newPassword
                  ? 'border-green-300 focus:border-green-500 focus:ring-green-500'
                  : 'border-gray-300 dark:border-gray-600',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
              required
              disabled={disabled}
              aria-describedby={errors.confirmPassword && touched.confirmPassword ? 'confirm-password-error' : undefined}
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('confirm')}
              className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label={showPasswords.confirm ? '비밀번호 숨기기' : '비밀번호 보기'}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {showPasswords.confirm ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                )}
              </svg>
            </button>

            {/* 매칭 상태 표시 아이콘 */}
            <AnimatePresence>
              {values.confirmPassword.length > 0 && (
                <motion.div
                  className="absolute right-12 top-2.5"
                  {...animations.scale}
                >
                  {values.confirmPassword === values.newPassword ? (
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {errors.confirmPassword && touched.confirmPassword && (
              <motion.p
                id="confirm-password-error"
                className="mt-1 text-xs text-red-600 dark:text-red-400"
                {...animations.slideDown}
                role="alert"
              >
                {errors.confirmPassword}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* 제출 버튼 */}
        <motion.button
          type="submit"
          disabled={!isValid || isSubmitting || disabled}
          className={clsx(
            'w-full px-4 py-2 rounded-lg font-medium transition-all duration-200',
            isValid && !isSubmitting && !disabled
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-400 dark:bg-gray-600 text-gray-200 cursor-not-allowed',
            submitSuccess && 'bg-green-600'
          )}
          whileHover={isValid && !isSubmitting && !disabled ? { scale: 1.02 } : {}}
          whileTap={isValid && !isSubmitting && !disabled ? { scale: 0.98 } : {}}
        >
          <AnimatePresence mode="wait">
            {isSubmitting ? (
              <motion.div
                key="submitting"
                className="flex items-center justify-center"
                {...animations.fadeIn}
              >
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                변경 중...
              </motion.div>
            ) : submitSuccess ? (
              <motion.div
                key="success"
                className="flex items-center justify-center"
                {...animations.fadeIn}
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                변경 완료!
              </motion.div>
            ) : (
              <motion.span key="default" {...animations.fadeIn}>
                비밀번호 변경
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </form>
    </div>
  )
}

export default PasswordChangeForm
import React, { useState } from 'react'
import { useSettings } from '@/hooks/useSettings'
import { useAccountDeletionConfirmation } from '@/hooks/useConfirmation'
import { SettingsCard, SettingsField, SettingsSection } from '../common/SettingsCard'
import type { UserSettingsResponse } from '@/types'

interface AccountManagementProps {
  settings: UserSettingsResponse
  className?: string
}

/**
 * 계정 관리 섹션
 * 보안, 연결된 계정, 계정 삭제 등 계정 관리 기능
 */
function AccountManagement({ settings, className }: AccountManagementProps) {
  const {
    updateEmail,
    updatePassword,
    deleteAccount
  } = useSettings()

  const { showAccountDeletionConfirmation } = useAccountDeletionConfirmation()

  // 이메일 변경 상태
  const [emailChangeData, setEmailChangeData] = useState({
    newEmail: '',
    password: '',
    isOpen: false
  })

  // 비밀번호 변경 상태
  const [passwordChangeData, setPasswordChangeData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    isOpen: false
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // 이메일 변경 처리
  const handleEmailChange = async (event: React.FormEvent) => {
    event.preventDefault()
    setValidationErrors({})

    // 유효성 검사
    if (!emailChangeData.newEmail) {
      setValidationErrors({ newEmail: '새 이메일 주소를 입력하세요.' })

      return
    }

    if (!emailChangeData.password) {
      setValidationErrors({ password: '현재 비밀번호를 입력하세요.' })

      return
    }

    // 이메일 형식 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!emailRegex.test(emailChangeData.newEmail)) {
      setValidationErrors({ newEmail: '올바른 이메일 형식이 아닙니다.' })

      return
    }

    setIsSubmitting(true)

    try {
      await updateEmail({
        newEmail: emailChangeData.newEmail,
        password: emailChangeData.password
      })

      setEmailChangeData({ newEmail: '', password: '', isOpen: false })
      // TODO: 성공 토스트 메시지
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '이메일 변경에 실패했습니다.'

      setValidationErrors({ submit: errorMessage })
    } finally {
      setIsSubmitting(false)
    }
  }

  // 비밀번호 변경 처리
  const handlePasswordChange = async (event: React.FormEvent) => {
    event.preventDefault()
    setValidationErrors({})

    // 유효성 검사
    if (!passwordChangeData.currentPassword) {
      setValidationErrors({ currentPassword: '현재 비밀번호를 입력하세요.' })

      return
    }

    if (!passwordChangeData.newPassword) {
      setValidationErrors({ newPassword: '새 비밀번호를 입력하세요.' })

      return
    }

    if (passwordChangeData.newPassword.length < 8) {
      setValidationErrors({ newPassword: '비밀번호는 8자 이상이어야 합니다.' })

      return
    }

    if (passwordChangeData.newPassword !== passwordChangeData.confirmPassword) {
      setValidationErrors({ confirmPassword: '비밀번호가 일치하지 않습니다.' })

      return
    }

    setIsSubmitting(true)

    try {
      await updatePassword({
        currentPassword: passwordChangeData.currentPassword,
        newPassword: passwordChangeData.newPassword,
        confirmPassword: passwordChangeData.confirmPassword
      })

      setPasswordChangeData({ currentPassword: '', newPassword: '', confirmPassword: '', isOpen: false })
      // TODO: 성공 토스트 메시지
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '비밀번호 변경에 실패했습니다.'

      setValidationErrors({ submit: errorMessage })
    } finally {
      setIsSubmitting(false)
    }
  }

  // 계정 삭제 (즉시 삭제)
  const handleDeleteAccount = async () => {
    const confirmed = await showAccountDeletionConfirmation()

    if (confirmed) {
      try {
        await deleteAccount({
          password: 'temp-password' // TODO: 실제 비밀번호 확인 구현 필요
        })
        // TODO: 로그아웃 후 홈페이지로 이동
      } catch (_error: unknown) {
        // TODO: 에러 토스트 메시지
      }
    }
  }

  return (
    <div className={className}>
      <SettingsSection
        title="계정 관리"
        description="보안 설정과 계정 삭제를 관리하세요"
      >
        <div className="space-y-6">
          {/* 보안 설정 */}
          <SettingsCard
            title="보안 설정"
            description="이메일과 비밀번호를 변경할 수 있습니다"
          >
            <div className="space-y-4">
              {/* 이메일 변경 */}
              <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    이메일 주소
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {settings.user.email}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEmailChangeData(prev => ({ ...prev, isOpen: !prev.isOpen }))}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  변경
                </button>
              </div>

              {/* 이메일 변경 폼 */}
              {emailChangeData.isOpen && (
                <form onSubmit={handleEmailChange} className="ml-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-l-4 border-blue-500">
                  <div className="space-y-3">
                    <SettingsField
                      label="새 이메일 주소"
                      required
                      {...(validationErrors.newEmail && { error: validationErrors.newEmail })}
                    >
                      <input
                        type="email"
                        value={emailChangeData.newEmail}
                        onChange={(e) => setEmailChangeData(prev => ({ ...prev, newEmail: e.target.value }))}
                        placeholder="새로운 이메일 주소를 입력하세요"
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </SettingsField>

                    <SettingsField
                      label="현재 비밀번호"
                      {...(validationErrors.password && { error: validationErrors.password })}
                      required
                    >
                      <input
                        type="password"
                        value={emailChangeData.password}
                        onChange={(e) => setEmailChangeData(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="현재 비밀번호를 입력하세요"
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </SettingsField>

                    <div className="flex space-x-3">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {isSubmitting ? '변경 중...' : '이메일 변경'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEmailChangeData({ newEmail: '', password: '', isOpen: false })
                          setValidationErrors({})
                        }}
                        className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* 비밀번호 변경 */}
              <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    비밀번호
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    마지막 변경: {new Date().toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPasswordChangeData(prev => ({ ...prev, isOpen: !prev.isOpen }))}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  변경
                </button>
              </div>

              {/* 비밀번호 변경 폼 */}
              {passwordChangeData.isOpen && (
                <form onSubmit={handlePasswordChange} className="ml-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-l-4 border-blue-500">
                  <div className="space-y-3">
                    <SettingsField
                      label="현재 비밀번호"
                      required
                      {...(validationErrors.currentPassword && { error: validationErrors.currentPassword })}
                    >
                      <input
                        type="password"
                        value={passwordChangeData.currentPassword}
                        onChange={(e) => setPasswordChangeData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        placeholder="현재 비밀번호를 입력하세요"
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </SettingsField>

                    <SettingsField
                      label="새 비밀번호"
                      required
                      {...(validationErrors.newPassword && { error: validationErrors.newPassword })}
                    >
                      <input
                        type="password"
                        value={passwordChangeData.newPassword}
                        onChange={(e) => setPasswordChangeData(prev => ({ ...prev, newPassword: e.target.value }))}
                        placeholder="새 비밀번호를 입력하세요 (8자 이상)"
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </SettingsField>

                    <SettingsField
                      label="새 비밀번호 확인"
                      required
                      {...(validationErrors.confirmPassword && { error: validationErrors.confirmPassword })}
                    >
                      <input
                        type="password"
                        value={passwordChangeData.confirmPassword}
                        onChange={(e) => setPasswordChangeData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="새 비밀번호를 다시 입력하세요"
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </SettingsField>

                    <div className="flex space-x-3">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {isSubmitting ? '변경 중...' : '비밀번호 변경'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPasswordChangeData({ currentPassword: '', newPassword: '', confirmPassword: '', isOpen: false })
                          setValidationErrors({})
                        }}
                        className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* 에러 메시지 */}
              {validationErrors.submit && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {validationErrors.submit}
                  </p>
                </div>
              )}
            </div>
          </SettingsCard>

          {/* 계정 삭제 */}
          <SettingsCard
            title="계정 삭제"
            description="계정을 영구적으로 삭제할 수 있습니다"
          >
            <div className="space-y-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-start space-x-3">
                  <svg className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.232 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                      계정 영구 삭제
                    </h4>
                    <p className="text-xs text-red-700 dark:text-red-300 mb-3">
                      계정을 삭제하면 모든 독후감, 댓글, 좋아요가 즉시 영구적으로 삭제됩니다.
                      삭제된 데이터는 복구할 수 없습니다.
                    </p>
                    <div className="flex items-center space-x-3">
                      <button
                        type="button"
                        onClick={handleDeleteAccount}
                        className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                      >
                        계정 삭제
                      </button>
                      <span className="text-xs text-red-600 dark:text-red-400">
                        이 작업은 되돌릴 수 없습니다
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SettingsCard>

        </div>
      </SettingsSection>
    </div>
  )
}

export default AccountManagement

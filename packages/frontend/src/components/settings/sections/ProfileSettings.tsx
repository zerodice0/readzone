import React, { useRef, useState } from 'react'
import { clsx } from 'clsx'
import { useImageValidation, useProfileImageUpload } from '@/hooks/useImageUpload'
import { useConfirmation } from '@/hooks/useConfirmation'
import { SettingsActions, SettingsCard, SettingsField, SettingsSection } from '../common/SettingsCard'
import type { UpdateProfileRequest, UserSettingsResponse } from '@/types'
import { useSettingsStore } from '@/store/settingsStore'
import { useAuthStore } from '@/store/authStore'

interface ProfileSettingsProps {
  settings: UserSettingsResponse
  updateProfile: (data: UpdateProfileRequest) => Promise<void>
  markAsChanged: () => void
  hasUnsavedChanges: boolean
  className?: string
}

/**
 * 프로필 설정 섹션
 * 프로필 이미지, 사용자명, 자기소개 편집
 */
function ProfileSettings({
  settings,
  updateProfile,
  markAsChanged,
  hasUnsavedChanges,
  className
}: ProfileSettingsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    uploadProfileImage,
    isUploading,
    error: uploadError,
    progress,
    clearError
  } = useProfileImageUpload()

  const { validateProfileImage } = useImageValidation()
  const { showConfirmation, ConfirmationModal } = useConfirmation()

  // 폼 상태
  const [formData, setFormData] = useState({
    userid: settings.user.userid ?? '',  // 읽기 전용
    nickname: settings.user.nickname ?? '',
    bio: settings.user.bio ?? '',
    profileImage: settings.user.profileImage ?? null
  })

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 프로필 이미지 변경 핸들러
  const handleImageSelect = () => {
    clearError()
    fileInputRef.current?.click()
  }

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {return}

    // 이미지 유효성 검사
    const errors = validateProfileImage(file)

    if (errors.length > 0) {
      setValidationErrors({ profileImage: errors[0] ?? '이미지 유효성 검사에 실패했습니다.' })

      return
    }

    // 업로드 실패 시 복원할 이전 이미지 URL 저장
    const previousImageUrl = formData.profileImage

    try {
      setValidationErrors({})

      // 이미지 선택 즉시 변경사항으로 표시
      markAsChanged()

      const imageUrl = await uploadProfileImage(file)

      // URL 유효성 검증
      if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim() === '') {
        throw new Error('업로드된 이미지 URL이 유효하지 않습니다.')
      }

      // ✅ 로컬 상태 업데이트
      setFormData(prev => ({ ...prev, profileImage: imageUrl }))

      // ✅ settingsStore 동기화 (낙관적 업데이트)
      const settingsState = useSettingsStore.getState()

      if (settingsState.settings) {
        useSettingsStore.setState({
          settings: {
            ...settingsState.settings,
            user: {
              ...settingsState.settings.user,
              profileImage: imageUrl
            }
          }
        })
      }

      // ✅ authStore 동기화 (헤더 등에 즉시 반영)
      const authState = useAuthStore.getState()

      if (authState.user) {
        useAuthStore.setState({
          user: {
            ...authState.user,
            profileImage: imageUrl
          }
        })
      }
    } catch (error) {
      console.error('Profile image upload failed:', error)
      const errorMessage = error instanceof Error ? error.message : '프로필 이미지 업로드에 실패했습니다.'

      // 에러 발생 시 이전 이미지로 복원
      setFormData(prev => ({ ...prev, profileImage: previousImageUrl }))
      setValidationErrors({ profileImage: errorMessage })
    } finally {
      // 파일 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // 프로필 이미지 제거
  const handleImageRemove = async () => {
    const confirmed = await showConfirmation({
      title: '프로필 이미지 삭제',
      message: '프로필 이미지를 삭제하시겠습니까?',
      confirmText: '삭제',
      cancelText: '취소',
      variant: 'danger'
    })

    if (confirmed) {
      setFormData(prev => ({ ...prev, profileImage: null }))
      markAsChanged()
    }
  }

  // 폼 필드 변경 핸들러
  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // 유효성 검사 에러 클리어
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }))
    }

    markAsChanged()
  }

  // 폼 유효성 검사
  const validateForm = () => {
    const errors: Record<string, string> = {}

    // 닉네임 검사
    if (!formData.nickname.trim()) {
      errors.nickname = '닉네임은 필수입니다.'
    } else if (formData.nickname.length < 2) {
      errors.nickname = '닉네임은 2자 이상이어야 합니다.'
    } else if (formData.nickname.length > 50) {
      errors.nickname = '닉네임은 50자 이하여야 합니다.'
    }

    // 자기소개 검사
    if (formData.bio && formData.bio.length > 200) {
      errors.bio = '자기소개는 200자 이하여야 합니다.'
    }

    // URL 유효성 검사 헬퍼
    const isValidUrl = (url: string): boolean => {
      if (!url.trim()) {return true} // 빈 값은 허용

      try {
        new URL(url)

        return true
      } catch {
        return false
      }
    }

    // 프로필 이미지 URL 검사
    if (formData.profileImage && !isValidUrl(formData.profileImage)) {
      errors.profileImage = '프로필 이미지 URL이 유효하지 않습니다.'
    }

    setValidationErrors(errors)

    return Object.keys(errors).length === 0
  }

  // 폼 제출
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      await updateProfile({
        nickname: formData.nickname,
        ...(formData.bio && { bio: formData.bio }),
        ...(formData.profileImage && { profileImage: formData.profileImage })
      })

      // TODO: 성공 토스트 메시지 표시
    } catch (error: unknown) {
      console.error('Profile update failed:', error)
      const errorMessage = error instanceof Error ? error.message : '프로필 업데이트에 실패했습니다.'

      setValidationErrors({ submit: errorMessage })
    } finally {
      setIsSubmitting(false)
    }
  }

  // 변경 사항 취소
  const handleReset = async () => {
    if (!hasUnsavedChanges) {return}

    const confirmed = await showConfirmation({
      title: '변경사항 취소',
      message: '저장되지 않은 변경사항이 사라집니다. 계속하시겠습니까?',
      confirmText: '취소',
      cancelText: '계속 편집',
      variant: 'default'
    })

    if (confirmed) {
      setFormData({
        userid: settings.user.userid ?? '',
        nickname: settings.user.nickname ?? '',
        bio: settings.user.bio ?? '',
        profileImage: settings.user.profileImage ?? null
      })
      setValidationErrors({})
    }
  }

  return (
    <div className={className}>
      <SettingsSection
        title="프로필 설정"
        description="다른 사용자에게 표시되는 프로필 정보를 관리하세요"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 프로필 이미지 설정 */}
          <SettingsCard
            title="프로필 이미지"
            description="독후감과 댓글에 표시되는 프로필 이미지를 설정하세요"
          >
            <div className="flex items-start space-x-6">
              {/* 현재 프로필 이미지 */}
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600">
                  {formData.profileImage ? (
                    <img
                      src={formData.profileImage}
                      alt="프로필 이미지"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* 업로드 진행률 */}
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                    <div className="text-white text-sm font-medium">
                      {progress !== undefined ? `${progress}%` : '업로드 중...'}
                    </div>
                  </div>
                )}
              </div>

              {/* 이미지 업로드 컨트롤 */}
              <div className="flex-1">
                <div className="space-y-3">
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={handleImageSelect}
                      disabled={isUploading}
                      className={clsx(
                        'px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors',
                        isUploading && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      이미지 선택
                    </button>

                    {formData.profileImage && (
                      <button
                        type="button"
                        onClick={handleImageRemove}
                        disabled={isUploading}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                      >
                        이미지 삭제
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    JPEG, PNG, WebP 형식, 최대 5MB
                  </p>

                  {/* 업로드 에러 또는 유효성 검사 에러 */}
                  {(uploadError ?? validationErrors.profileImage) && (
                    <p className="text-xs text-red-600 dark:text-red-400">
                      {uploadError ?? validationErrors.profileImage}
                    </p>
                  )}
                </div>

                {/* 숨겨진 파일 입력 */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            </div>
          </SettingsCard>

          {/* 기본 정보 설정 */}
          <SettingsCard
            title="기본 정보"
            description="사용자 ID, 닉네임, 자기소개를 확인하고 수정하세요"
          >
            <div className="space-y-4">
              {/* 사용자 ID (읽기 전용) */}
              <SettingsField
                label="사용자 ID"
                description="로그인에 사용되는 고유 ID입니다 (변경 불가)"
              >
                <div className="flex items-center justify-between px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg">
                  <span className="text-gray-700 dark:text-gray-300">
                    {formData.userid}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    읽기 전용
                  </span>
                </div>
              </SettingsField>

              {/* 닉네임 */}
              <SettingsField
                label="닉네임"
                description="다른 사용자에게 표시되는 이름입니다"
                {...(validationErrors.nickname && { error: validationErrors.nickname })}
                required
              >
                <input
                  type="text"
                  value={formData.nickname}
                  onChange={(e) => handleFieldChange('nickname', e.target.value)}
                  placeholder="닉네임을 입력하세요"
                  className={clsx(
                    'block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors',
                    validationErrors.nickname && 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  )}
                />
              </SettingsField>

              {/* 자기소개 */}
              <SettingsField
                label="자기소개"
                description="독서 취향이나 관심사를 간단히 소개해보세요 (최대 200자)"
                {...(validationErrors.bio && { error: validationErrors.bio })}
              >
                <div className="relative">
                  <textarea
                    value={formData.bio}
                    onChange={(e) => handleFieldChange('bio', e.target.value)}
                    placeholder="자기소개를 입력하세요"
                    rows={3}
                    maxLength={200}
                    className={clsx(
                      'block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none',
                      validationErrors.bio && 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    )}
                  />
                  <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                    {formData.bio.length}/200
                  </div>
                </div>
              </SettingsField>
            </div>
          </SettingsCard>

          {/* 계정 정보 (읽기 전용) */}
          <SettingsCard
            title="계정 정보"
            description="이메일 주소와 가입일을 확인하세요"
          >
            <div className="space-y-4">
              <SettingsField
                label="이메일"
                description="로그인에 사용되는 이메일 주소입니다"
              >
                <div className="flex items-center justify-between">
                  <span className="text-gray-900 dark:text-gray-100">
                    {settings.user.email}
                  </span>
                  <button
                    type="button"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    onClick={() => {
                      // TODO: 이메일 변경 모달 열기
                    }}
                  >
                    변경
                  </button>
                </div>
              </SettingsField>

              <SettingsField
                label="가입일"
                description="ReadZone에 가입한 날짜입니다"
              >
                <span className="text-gray-900 dark:text-gray-100">
                  {new Date(settings.user.createdAt).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </SettingsField>
            </div>
          </SettingsCard>

          {/* 제출 에러 표시 */}
          {validationErrors.submit && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">
                {validationErrors.submit}
              </p>
            </div>
          )}

          {/* 액션 버튼 */}
          <SettingsActions align="between">
            <button
              type="button"
              onClick={handleReset}
              disabled={!hasUnsavedChanges || isSubmitting}
              className={clsx(
                'px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors',
                hasUnsavedChanges && !isSubmitting
                  ? 'hover:bg-gray-300 dark:hover:bg-gray-600 cursor-pointer'
                  : 'opacity-50 cursor-not-allowed'
              )}
            >
              취소
            </button>

            <button
              type="submit"
              disabled={!hasUnsavedChanges || isSubmitting}
              className={clsx(
                'px-4 py-2 bg-blue-600 text-white rounded-lg transition-colors',
                hasUnsavedChanges && !isSubmitting
                  ? 'hover:bg-blue-700 cursor-pointer'
                  : 'opacity-50 cursor-not-allowed'
              )}
            >
              {isSubmitting ? '저장 중...' : '변경사항 저장'}
            </button>
          </SettingsActions>
        </form>
      </SettingsSection>

      {/* 확인 모달 */}
      <ConfirmationModal />
    </div>
  )
}

export default ProfileSettings
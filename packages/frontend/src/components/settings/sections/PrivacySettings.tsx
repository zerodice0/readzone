import React, { useState } from 'react'
import { clsx } from 'clsx'
import { SettingsActions, SettingsCard, SettingsSection } from '../common/SettingsCard'
import { SimpleSelect } from '../common/SettingsSelect'
import { SettingsToggle } from '../common/SettingsToggle'
import type { UpdatePrivacyRequest, UserSettingsResponse, VisibilityLevel } from '@/types'

interface PrivacySettingsProps {
  settings: UserSettingsResponse
  className?: string
}

/**
 * 개인정보 보호 설정 섹션
 * 프로필 공개 설정, 활동 표시 등 개인정보 관리
 */
function PrivacySettings({ settings, className }: PrivacySettingsProps) {
  // TODO: 추후 실제 개인정보 업데이트 기능 구현 시 부모 컴포넌트에서 props로 전달받을 예정
  const markAsChanged = () => { /* TODO: 구현 예정 */ }
  const hasUnsavedChanges = false
  const updatePrivacy = async (_data: unknown) => { /* TODO: 구현 예정 */ }

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<UpdatePrivacyRequest>({
    profileVisibility: settings.privacy.profileVisibility,
    activityVisibility: settings.privacy.activityVisibility,
    searchable: settings.privacy.searchable,
    showEmail: settings.privacy.showEmail,
    showFollowers: settings.privacy.showFollowers,
    showFollowing: settings.privacy.showFollowing
  })

  // 설정 변경 핸들러
  const handleChange = <K extends keyof UpdatePrivacyRequest>(
    field: K,
    value: UpdatePrivacyRequest[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    markAsChanged()
  }

  // 폼 제출
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      await updatePrivacy(formData)
      // TODO: 성공 토스트 메시지
    } catch (error: unknown) {
      console.error('Privacy settings update failed:', error)
      // TODO: 에러 토스트 메시지
    } finally {
      setIsSubmitting(false)
    }
  }

  // 공개 범위 옵션
  const visibilityOptions = [
    {
      value: 'PUBLIC' as VisibilityLevel,
      label: '전체 공개',
      description: '모든 사용자가 볼 수 있습니다'
    },
    {
      value: 'FOLLOWERS' as VisibilityLevel,
      label: '팔로워만',
      description: '나를 팔로우하는 사용자만 볼 수 있습니다'
    },
    {
      value: 'PRIVATE' as VisibilityLevel,
      label: '비공개',
      description: '나만 볼 수 있습니다'
    }
  ]


  return (
    <div className={className}>
      <SettingsSection
        title="개인정보 보호"
        description="프로필 공개 범위와 활동 표시 방식을 설정하세요"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 프로필 공개 설정 */}
          <SettingsCard
            title="프로필 공개 설정"
            description="다른 사용자가 내 프로필을 보는 범위를 설정합니다"
          >
            <div className="space-y-4">
              <SimpleSelect
                label="프로필 공개 범위"
                description="사용자명, 프로필 이미지, 자기소개가 표시되는 범위"
                value={formData.profileVisibility ?? 'PUBLIC'}
                options={visibilityOptions}
                onChange={(value) => handleChange('profileVisibility', value as VisibilityLevel)}
              />

              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  추가 정보 표시
                </h4>

                <SettingsToggle
                  label="이메일 주소 표시"
                  description="다른 사용자가 내 이메일 주소를 볼 수 있습니다"
                  checked={formData.showEmail ?? false}
                  onChange={(checked) => handleChange('showEmail', checked)}
                />

                <SettingsToggle
                  label="팔로워 목록 표시"
                  description="다른 사용자가 내 팔로워 목록을 볼 수 있습니다"
                  checked={formData.showFollowers !== false}
                  onChange={(checked) => handleChange('showFollowers', checked)}
                />

                <SettingsToggle
                  label="팔로잉 목록 표시"
                  description="다른 사용자가 내가 팔로우하는 사용자 목록을 볼 수 있습니다"
                  checked={formData.showFollowing !== false}
                  onChange={(checked) => handleChange('showFollowing', checked)}
                />
              </div>
            </div>
          </SettingsCard>

          {/* 활동 공개 설정 */}
          <SettingsCard
            title="활동 공개 설정"
            description="내 활동이 다른 사용자에게 표시되는 범위를 설정합니다"
          >
            <div className="space-y-4">
              <SimpleSelect
                label="활동 공개 범위"
                description="내가 작성한 독후감, 댓글, 좋아요 활동이 표시되는 범위"
                value={formData.activityVisibility ?? 'PUBLIC'}
                options={visibilityOptions}
                onChange={(value) => handleChange('activityVisibility', value as VisibilityLevel)}
              />

              <SettingsToggle
                label="검색 허용"
                description="다른 사용자가 검색을 통해 나를 찾을 수 있습니다"
                checked={formData.searchable !== false}
                onChange={(checked) => handleChange('searchable', checked)}
              />
            </div>
          </SettingsCard>


          {/* 현재 설정 요약 */}
          <SettingsCard
            title="설정 요약"
            description="현재 개인정보 보호 설정을 확인하세요"
          >
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                현재 공개 설정
              </h4>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">프로필:</span>
                  <span className={clsx(
                    'font-medium',
                    formData.profileVisibility === 'PUBLIC' ? 'text-green-600 dark:text-green-400' :
                    formData.profileVisibility === 'FOLLOWERS' ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-red-600 dark:text-red-400'
                  )}>
                    {visibilityOptions.find(opt => opt.value === formData.profileVisibility)?.label}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">활동:</span>
                  <span className={clsx(
                    'font-medium',
                    formData.activityVisibility === 'PUBLIC' ? 'text-green-600 dark:text-green-400' :
                    formData.activityVisibility === 'FOLLOWERS' ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-red-600 dark:text-red-400'
                  )}>
                    {visibilityOptions.find(opt => opt.value === formData.activityVisibility)?.label}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">검색 허용:</span>
                  <span className={clsx(
                    'font-medium',
                    formData.searchable === false ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                  )}>
                    {formData.searchable === false ? '비허용' : '허용'}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  추가 정보 표시
                </h5>
                <div className="flex flex-wrap gap-2 text-xs">
                  {formData.showEmail && (
                    <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-full">
                      이메일 표시
                    </span>
                  )}
                  {formData.showFollowers !== false && (
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-full">
                      팔로워 표시
                    </span>
                  )}
                  {formData.showFollowing !== false && (
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-full">
                      팔로잉 표시
                    </span>
                  )}
                </div>
              </div>
            </div>
          </SettingsCard>

          {/* 데이터 관리 */}
          <SettingsCard
            title="데이터 관리"
            description="개인 데이터의 보관과 삭제에 관한 설정입니다"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    데이터 다운로드
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    내 계정의 모든 데이터를 다운로드합니다
                  </p>
                </div>
                <button
                  type="button"
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  onClick={() => {
                    // TODO: 데이터 다운로드 기능 구현
                  }}
                >
                  다운로드
                </button>
              </div>

              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-start space-x-3">
                  <svg className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.232 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                      계정 삭제
                    </h4>
                    <p className="text-xs text-red-700 dark:text-red-300 mb-3">
                      계정을 삭제하면 모든 독후감, 댓글, 좋아요가 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
                    </p>
                    <button
                      type="button"
                      className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                      onClick={() => {
                        // TODO: 계정 삭제 모달 열기
                      }}
                    >
                      계정 삭제
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </SettingsCard>

          {/* 액션 버튼 */}
          <SettingsActions>
            <button
              type="submit"
              disabled={!hasUnsavedChanges || isSubmitting}
              className={clsx(
                'px-6 py-2 bg-blue-600 text-white rounded-lg transition-colors',
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
    </div>
  )
}

export default PrivacySettings
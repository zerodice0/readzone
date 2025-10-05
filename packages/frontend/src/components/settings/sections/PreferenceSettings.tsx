import React, { useState } from 'react'
import { clsx } from 'clsx'
import { SettingsActions, SettingsCard, SettingsSection } from '../common/SettingsCard'
import { SettingsSelect, SimpleSelect } from '../common/SettingsSelect'
import type { Language, Theme, UpdatePreferencesRequest, UserSettingsResponse } from '@/types'
import { useTheme } from '@/contexts/useTheme'

interface PreferenceSettingsProps {
  settings: UserSettingsResponse
  updatePreferences: (data: UpdatePreferencesRequest) => Promise<void>
  markAsChanged: () => void
  hasUnsavedChanges: boolean
  className?: string
}

/**
 * 환경 설정 섹션
 * 테마, 언어, 피드 설정 등 사용자 선호도 관리
 */
function PreferenceSettings({
  settings,
  updatePreferences,
  markAsChanged,
  hasUnsavedChanges,
  className
}: PreferenceSettingsProps) {

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<UpdatePreferencesRequest>({
    theme: settings.preferences.theme,
    language: settings.preferences.language
  })

  // 기본 설정 변경
  const handleBasicChange = <K extends keyof UpdatePreferencesRequest>(
    field: K,
    value: UpdatePreferencesRequest[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    markAsChanged()
  }

  const { setTheme: applyThemePreview } = useTheme()

  const handleThemeChange = (value: Theme) => {
    setFormData(prev => ({ ...prev, theme: value }))
    applyThemePreview(value)
    markAsChanged()
  }

  // 폼 제출
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      await updatePreferences(formData)
      // TODO: 성공 토스트 메시지
    } catch (error: unknown) {
      console.error('Preferences update failed:', error)
      // TODO: 에러 토스트 메시지
    } finally {
      setIsSubmitting(false)
    }
  }

  // 테마 옵션
  const themeOptions = [
    {
      value: 'LIGHT' as Theme,
      label: '라이트 모드',
      description: '밝은 배경으로 표시',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    {
      value: 'DARK' as Theme,
      label: '다크 모드',
      description: '어두운 배경으로 표시',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )
    },
    {
      value: 'AUTO' as Theme,
      label: '시스템 설정',
      description: '기기 설정을 따름',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    }
  ]

  // 언어 옵션
  const languageOptions = [
    {
      value: 'ko' as Language,
      label: '한국어',
      description: 'Korean'
    },
    {
      value: 'en' as Language,
      label: 'English',
      description: '영어'
    }
  ]

  return (
    <div className={className}>
      <SettingsSection
        title="환경 설정"
        description="사용자 인터페이스와 콘텐츠 표시 방식을 설정하세요"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 테마 설정 */}
          <SettingsCard
            title="테마 설정"
            description="ReadZone의 화면 테마를 선택하세요"
          >
            <SettingsSelect
              label="테마"
              value={formData.theme ?? 'AUTO'}
              options={themeOptions}
              onChange={(value) => handleThemeChange(value as Theme)}
              searchable={false}
            />

            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                테마 미리보기
              </h4>
              <div className="grid grid-cols-3 gap-3">
                {themeOptions.map((theme) => (
                  <button
                    key={theme.value}
                    type="button"
                    onClick={() => handleThemeChange(theme.value as Theme)}
                    className={clsx(
                      'p-3 border-2 rounded-lg transition-all cursor-pointer',
                      formData.theme === theme.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    )}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <div className={clsx(
                        'p-2 rounded-full',
                        formData.theme === theme.value
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-600 dark:text-gray-400'
                      )}>
                        {theme.icon}
                      </div>
                      <div className="text-xs text-center">
                        <div className="font-medium">{theme.label}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </SettingsCard>

          {/* 언어 설정 */}
          <SettingsCard
            title="언어 설정"
            description="ReadZone의 표시 언어를 선택하세요"
          >
            <SimpleSelect
              label="언어"
              value={formData.language ?? 'KO'}
              options={languageOptions}
              onChange={(value) => handleBasicChange('language', value as Language)}
            />
          </SettingsCard>

          {/* 접근성 설정 */}
          <SettingsCard
            title="접근성 설정"
            description="더 나은 사용자 경험을 위한 접근성 옵션"
          >
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                접근성 옵션은 추후 버전에서 제공될 예정입니다.
              </p>
            </div>
          </SettingsCard>

          {/* 실험적 기능 */}
          <SettingsCard
            title="실험적 기능"
            description="새로운 기능을 미리 체험해보세요 (불안정할 수 있습니다)"
          >
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-start space-x-3">
                  <svg className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.232 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                      주의사항
                    </h4>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300">
                      실험적 기능은 예고 없이 변경되거나 제거될 수 있으며, 일부 기능이 정상적으로 작동하지 않을 수 있습니다.
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400">
                실험적 기능은 추후 버전에서 제공될 예정입니다.
              </p>
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

export default PreferenceSettings

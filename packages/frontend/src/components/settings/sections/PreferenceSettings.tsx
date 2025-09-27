import React, { useState } from 'react'
import { clsx } from 'clsx'
import { useSettings } from '@/hooks/useSettings'
import { SettingsActions, SettingsCard, SettingsSection } from '../common/SettingsCard'
import { SettingsSelect, SimpleSelect } from '../common/SettingsSelect'
import { SettingsToggle } from '../common/SettingsToggle'
import type { FeedTab, Language, Theme, UpdatePreferencesRequest, UserSettingsResponse } from '@/types'

interface PreferenceSettingsProps {
  settings: UserSettingsResponse
  className?: string
}

/**
 * 환경 설정 섹션
 * 테마, 언어, 피드 설정 등 사용자 선호도 관리
 */
function PreferenceSettings({ settings, className }: PreferenceSettingsProps) {
  const {
    updatePreferences,
    hasUnsavedChanges,
    markAsChanged
  } = useSettings()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<UpdatePreferencesRequest>({
    theme: settings.preferences.theme,
    language: settings.preferences.language,
    defaultFeedTab: settings.preferences.defaultFeedTab,
    contentFilter: settings.preferences.contentFilter,
    dataUsage: settings.preferences.dataUsage
  })

  // 기본 설정 변경
  const handleBasicChange = <K extends keyof UpdatePreferencesRequest>(
    field: K,
    value: UpdatePreferencesRequest[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    markAsChanged()
  }

  // 콘텐츠 필터 변경
  const handleContentFilterChange = (field: string, value: boolean | string) => {
    setFormData(prev => ({
      ...prev,
      contentFilter: {
        ...(prev.contentFilter ?? { hideNSFW: true, hideSpoilers: false, hideNegativeReviews: false }),
        [field]: value
      }
    }))
    markAsChanged()
  }

  // 데이터 사용 설정 변경
  const handleDataUsageChange = (field: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      dataUsage: {
        ...(prev.dataUsage ?? { imageQuality: 'MEDIUM', autoplayVideos: false, preloadImages: true }),
        [field]: value
      }
    }))
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
      value: 'light' as Theme,
      label: '라이트 모드',
      description: '밝은 배경으로 표시',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    {
      value: 'dark' as Theme,
      label: '다크 모드',
      description: '어두운 배경으로 표시',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )
    },
    {
      value: 'system' as Theme,
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

  // 피드 탭 옵션
  const feedTabOptions = [
    {
      value: 'following' as FeedTab,
      label: '팔로잉',
      description: '팔로우한 사용자의 독후감만 표시'
    },
    {
      value: 'discover' as FeedTab,
      label: '발견',
      description: '모든 공개 독후감을 시간순으로 표시'
    },
    {
      value: 'trending' as FeedTab,
      label: '인기',
      description: '인기 있는 독후감을 우선 표시'
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
              onChange={(value) => handleBasicChange('theme', value as Theme)}
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
                    onClick={() => handleBasicChange('theme', theme.value as Theme)}
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

          {/* 피드 설정 */}
          <SettingsCard
            title="피드 설정"
            description="메인 피드의 기본 탭과 표시 방식을 설정하세요"
          >
            <SimpleSelect
              label="기본 피드 탭"
              description="메인 페이지에 처음 방문했을 때 표시될 탭"
              value={formData.defaultFeedTab ?? 'RECOMMENDED'}
              options={feedTabOptions}
              onChange={(value) => handleBasicChange('defaultFeedTab', value as FeedTab)}
            />
          </SettingsCard>

          {/* 콘텐츠 필터 */}
          <SettingsCard
            title="콘텐츠 필터"
            description="표시되는 콘텐츠를 필터링하는 옵션을 설정하세요"
          >
            <div className="space-y-4">
              <SettingsToggle
                label="성인 콘텐츠 필터링"
                description="성인 콘텐츠로 분류된 독후감을 숨깁니다"
                checked={formData.contentFilter?.hideNSFW ?? false}
                onChange={(checked) => handleContentFilterChange('hideNSFW', checked)}
              />

              <SettingsToggle
                label="스포일러 콘텐츠 블러"
                description="스포일러가 포함된 독후감 내용을 흐리게 표시합니다"
                checked={formData.contentFilter?.hideSpoilers ?? false}
                onChange={(checked) => handleContentFilterChange('hideSpoilers', checked)}
              />

              <SettingsToggle
                label="낮은 평점 콘텐츠 숨기기"
                description="평점이 낮은 독후감을 피드에서 숨깁니다"
                checked={formData.contentFilter?.hideNegativeReviews ?? false}
                onChange={(checked) => handleContentFilterChange('hideNegativeReviews', checked)}
              />
            </div>
          </SettingsCard>

          {/* 데이터 사용 설정 */}
          <SettingsCard
            title="데이터 사용 설정"
            description="모바일 데이터 사용량을 줄이기 위한 설정"
          >
            <div className="space-y-4">
              <SettingsToggle
                label="이미지 사전 로드"
                description="이미지를 사전에 로드하여 빠른 로딩을 제공합니다"
                checked={formData.dataUsage?.preloadImages !== false}
                onChange={(checked) => handleDataUsageChange('preloadImages', checked)}
              />

              <SettingsToggle
                label="비디오 자동 재생"
                description="비디오 콘텐츠를 자동으로 재생합니다"
                checked={formData.dataUsage?.autoplayVideos !== false}
                onChange={(checked) => handleDataUsageChange('autoplayVideos', checked)}
              />


            </div>
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
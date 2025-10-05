import React, { useState } from 'react'
import { clsx } from 'clsx'
import { SettingsActions, SettingsCard, SettingsSection } from '../common/SettingsCard'
import { SettingsToggle } from '../common/SettingsToggle'
import { SimpleSelect } from '../common/SettingsSelect'
import type { UpdateNotificationsRequest, UserSettingsResponse } from '@/types'

interface NotificationSettingsProps {
  settings: UserSettingsResponse
  className?: string
}

/**
 * 알림 설정 섹션
 * 좋아요, 댓글, 팔로우 알림 등 설정
 */
function NotificationSettings({ settings, className }: NotificationSettingsProps) {
  // TODO: 추후 실제 알림 업데이트 기능 구현 시 부모 컴포넌트에서 props로 전달받을 예정
  const markAsChanged = () => { /* TODO: 구현 예정 */ }
  const hasUnsavedChanges = false
  const updateNotifications = async (_data: unknown) => { /* TODO: 구현 예정 */ }

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<UpdateNotificationsRequest>({
    likes: settings.notifications.likes,
    comments: settings.notifications.comments,
    follows: settings.notifications.follows,
    quietHours: settings.notifications.quietHours
  })

  // 개별 알림 설정 변경
  const handleNotificationChange = (
    category: keyof UpdateNotificationsRequest,
    field: string,
    value: boolean
  ) => {
    if (category === 'quietHours') {
      setFormData(prev => ({
        ...prev,
        quietHours: {
          ...(prev.quietHours ?? { enabled: false, startTime: '22:00', endTime: '08:00' }),
          [field]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [category]: {
          ...prev[category],
          [field]: value
        }
      }))
    }
    markAsChanged()
  }

  // 조용한 시간 시간대 변경
  const handleQuietHoursTimeChange = (field: 'startTime' | 'endTime', value: string) => {
    setFormData(prev => ({
      ...prev,
      quietHours: {
        ...(prev.quietHours ?? { enabled: false, startTime: '22:00', endTime: '08:00' }),
        [field]: value
      }
    }))
    markAsChanged()
  }

  // 전체 알림 토글
  const handleMasterToggle = (category: 'likes' | 'comments' | 'follows', enabled: boolean) => {
    setFormData(prev => ({
      ...prev,
      [category]: {
        enabled,
        email: enabled ? prev[category]?.email ?? false : false,
        push: enabled ? prev[category]?.push ?? false : false
      }
    }))
    markAsChanged()
  }

  // 폼 제출
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      await updateNotifications(formData)
      // TODO: 성공 토스트 메시지
    } catch (error: unknown) {
      console.error('Notification settings update failed:', error)
      // TODO: 에러 토스트 메시지
    } finally {
      setIsSubmitting(false)
    }
  }

  // 시간 옵션 생성
  const generateTimeOptions = () => {
    const options = []

    for (let hour = 0; hour < 24; hour++) {
      const time = `${hour.toString().padStart(2, '0')}:00`
      const label = hour === 0 ? '오전 12:00' :
                   hour < 12 ? `오전 ${hour}:00` :
                   hour === 12 ? '오후 12:00' :
                   `오후 ${hour - 12}:00`

      options.push({
        value: time,
        label
      })
    }

    return options
  }

  return (
    <div className={className}>
      <SettingsSection
        title="알림 설정"
        description="받고 싶은 알림 유형과 방식을 설정하세요"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 좋아요 알림 */}
          <SettingsCard
            title="좋아요 알림"
            description="내 독후감에 좋아요가 달렸을 때의 알림 설정"
          >
            <div className="space-y-4">
              <SettingsToggle
                label="좋아요 알림 받기"
                description="독후감에 좋아요가 달리면 알림을 받습니다"
                checked={formData.likes?.enabled ?? false}
                onChange={(checked) => handleMasterToggle('likes', checked)}
              />

              {formData.likes?.enabled && (
                <div className="ml-4 pl-4 border-l-2 border-gray-200 dark:border-gray-700 space-y-3">
                  <SettingsToggle
                    label="이메일 알림"
                    description="이메일로 좋아요 알림을 받습니다"
                    checked={formData.likes?.email ?? false}
                    onChange={(checked) => handleNotificationChange('likes', 'email', checked)}
                    size="sm"
                  />

                  <SettingsToggle
                    label="푸시 알림"
                    description="브라우저 푸시 알림으로 받습니다"
                    checked={formData.likes?.push ?? false}
                    onChange={(checked) => handleNotificationChange('likes', 'push', checked)}
                    size="sm"
                  />
                </div>
              )}
            </div>
          </SettingsCard>

          {/* 댓글 알림 */}
          <SettingsCard
            title="댓글 알림"
            description="내 독후감에 댓글이 달렸을 때의 알림 설정"
          >
            <div className="space-y-4">
              <SettingsToggle
                label="댓글 알림 받기"
                description="독후감에 댓글이 달리거나 답글이 달리면 알림을 받습니다"
                checked={formData.comments?.enabled ?? false}
                onChange={(checked) => handleMasterToggle('comments', checked)}
              />

              {formData.comments?.enabled && (
                <div className="ml-4 pl-4 border-l-2 border-gray-200 dark:border-gray-700 space-y-3">
                  <SettingsToggle
                    label="이메일 알림"
                    description="이메일로 댓글 알림을 받습니다"
                    checked={formData.comments?.email ?? false}
                    onChange={(checked) => handleNotificationChange('comments', 'email', checked)}
                    size="sm"
                  />

                  <SettingsToggle
                    label="푸시 알림"
                    description="브라우저 푸시 알림으로 받습니다"
                    checked={formData.comments?.push ?? false}
                    onChange={(checked) => handleNotificationChange('comments', 'push', checked)}
                    size="sm"
                  />
                </div>
              )}
            </div>
          </SettingsCard>

          {/* 팔로우 알림 */}
          <SettingsCard
            title="팔로우 알림"
            description="새로운 팔로워가 생겼을 때의 알림 설정"
          >
            <div className="space-y-4">
              <SettingsToggle
                label="팔로우 알림 받기"
                description="다른 사용자가 나를 팔로우하면 알림을 받습니다"
                checked={formData.follows?.enabled ?? false}
                onChange={(checked) => handleMasterToggle('follows', checked)}
              />

              {formData.follows?.enabled && (
                <div className="ml-4 pl-4 border-l-2 border-gray-200 dark:border-gray-700 space-y-3">
                  <SettingsToggle
                    label="이메일 알림"
                    description="이메일로 팔로우 알림을 받습니다"
                    checked={formData.follows?.email ?? false}
                    onChange={(checked) => handleNotificationChange('follows', 'email', checked)}
                    size="sm"
                  />

                  <SettingsToggle
                    label="푸시 알림"
                    description="브라우저 푸시 알림으로 받습니다"
                    checked={formData.follows?.push ?? false}
                    onChange={(checked) => handleNotificationChange('follows', 'push', checked)}
                    size="sm"
                  />
                </div>
              )}
            </div>
          </SettingsCard>

          {/* 조용한 시간 */}
          <SettingsCard
            title="조용한 시간"
            description="특정 시간대에는 알림을 받지 않도록 설정할 수 있습니다"
          >
            <div className="space-y-4">
              <SettingsToggle
                label="조용한 시간 사용"
                description="설정한 시간대에는 푸시 알림을 받지 않습니다 (이메일 알림은 계속 받습니다)"
                checked={formData.quietHours?.enabled ?? false}
                onChange={(checked) => handleNotificationChange('quietHours', 'enabled', checked)}
              />

              {formData.quietHours?.enabled && (
                <div className="ml-4 pl-4 border-l-2 border-gray-200 dark:border-gray-700 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SimpleSelect
                      label="시작 시간"
                      value={formData.quietHours?.startTime ?? '22:00'}
                      options={generateTimeOptions()}
                      onChange={(value) => handleQuietHoursTimeChange('startTime', value)}
                    />

                    <SimpleSelect
                      label="종료 시간"
                      value={formData.quietHours?.endTime ?? '08:00'}
                      options={generateTimeOptions()}
                      onChange={(value) => handleQuietHoursTimeChange('endTime', value)}
                    />
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    예시: 오후 10시부터 오전 8시까지 조용한 시간으로 설정
                  </p>
                </div>
              )}
            </div>
          </SettingsCard>

          {/* 알림 미리보기 */}
          <SettingsCard
            title="알림 미리보기"
            description="현재 설정으로 받게 될 알림 종류를 확인하세요"
          >
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                활성화된 알림
              </h4>

              <div className="space-y-2 text-sm">
                {formData.likes?.enabled && (
                  <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>좋아요 알림</span>
                    <span className="text-xs text-gray-500">
                      ({[
                        formData.likes?.email && '이메일',
                        formData.likes?.push && '푸시'
                      ].filter(Boolean).join(', ')})
                    </span>
                  </div>
                )}

                {formData.comments?.enabled && (
                  <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>댓글 알림</span>
                    <span className="text-xs text-gray-500">
                      ({[
                        formData.comments?.email && '이메일',
                        formData.comments?.push && '푸시'
                      ].filter(Boolean).join(', ')})
                    </span>
                  </div>
                )}

                {formData.follows?.enabled && (
                  <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>팔로우 알림</span>
                    <span className="text-xs text-gray-500">
                      ({[
                        formData.follows?.email && '이메일',
                        formData.follows?.push && '푸시'
                      ].filter(Boolean).join(', ')})
                    </span>
                  </div>
                )}

                {formData.quietHours?.enabled && (
                  <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <span>조용한 시간</span>
                    <span className="text-xs text-gray-500">
                      ({formData.quietHours?.startTime} ~ {formData.quietHours?.endTime})
                    </span>
                  </div>
                )}

                {!formData.likes?.enabled && !formData.comments?.enabled && !formData.follows?.enabled && (
                  <div className="text-gray-500 dark:text-gray-400">
                    현재 활성화된 알림이 없습니다.
                  </div>
                )}
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

export default NotificationSettings
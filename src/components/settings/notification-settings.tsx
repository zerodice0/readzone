'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  Bell,
  Mail,
  MessageCircle,
  Heart,
  BookOpen,
  Users,
  Settings,
  Smartphone,
  Clock,
  Volume2,
  VolumeX,
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'

interface NotificationSettingsProps {
  userId: string
  className?: string
}

interface NotificationSettings {
  email: {
    newReviews: boolean
    newComments: boolean
    newLikes: boolean
    weeklyDigest: boolean
    newsletter: boolean
    securityAlerts: boolean
  }
  push: {
    enabled: boolean
    newReviews: boolean
    newComments: boolean
    newLikes: boolean
    mentions: boolean
  }
  frequency: {
    immediate: boolean
    daily: boolean
    weekly: boolean
  }
  quiet: {
    enabled: boolean
    startTime: string
    endTime: string
  }
}

const defaultSettings: NotificationSettings = {
  email: {
    newReviews: true,
    newComments: true,
    newLikes: false,
    weeklyDigest: true,
    newsletter: false,
    securityAlerts: true
  },
  push: {
    enabled: false,
    newReviews: false,
    newComments: false,
    newLikes: false,
    mentions: false
  },
  frequency: {
    immediate: true,
    daily: false,
    weekly: false
  },
  quiet: {
    enabled: false,
    startTime: '22:00',
    endTime: '08:00'
  }
}

export function NotificationSettings({ userId, className }: NotificationSettingsProps) {
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [originalSettings, setOriginalSettings] = useState<NotificationSettings>(defaultSettings)

  // 설정 로드
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch(`/api/users/${userId}/notifications`)
        if (response.ok) {
          const data = await response.json()
          setSettings(data.settings || defaultSettings)
          setOriginalSettings(data.settings || defaultSettings)
        }
      } catch (error) {
        console.error('알림 설정 로드 실패:', error)
        toast.error('알림 설정을 불러오는데 실패했습니다.')
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [userId])

  // 변경사항 감지
  useEffect(() => {
    const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings)
    setHasChanges(hasChanges)
  }, [settings, originalSettings])

  const updateSetting = (path: string, value: boolean | string) => {
    setSettings(prev => {
      const keys = path.split('.')
      const newSettings = { ...prev }
      let current: any = newSettings
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]]
      }
      
      current[keys[keys.length - 1]] = value
      return newSettings
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/users/${userId}/notifications`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings })
      })

      if (response.ok) {
        setOriginalSettings(settings)
        setHasChanges(false)
        toast.success('알림 설정이 저장되었습니다.')
      } else {
        throw new Error('저장 실패')
      }
    } catch (error) {
      console.error('알림 설정 저장 실패:', error)
      toast.error('알림 설정 저장에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setSettings(originalSettings)
    setHasChanges(false)
  }

  const requestPushPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('이 브라우저는 푸시 알림을 지원하지 않습니다.')
      return
    }

    if (Notification.permission === 'granted') {
      updateSetting('push.enabled', true)
      toast.success('푸시 알림이 활성화되었습니다.')
      return
    }

    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      updateSetting('push.enabled', true)
      toast.success('푸시 알림이 활성화되었습니다.')
    } else {
      toast.error('푸시 알림 권한이 거부되었습니다.')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    )
  }

  return (
    <div className={cn('space-y-8', className)}>
      {/* 이메일 알림 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="w-5 h-5 mr-2" />
            이메일 알림
          </CardTitle>
          <CardDescription>
            이메일로 받을 알림을 선택하세요. 중요한 보안 관련 알림은 항상 발송됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="email-reviews" className="text-sm font-medium">
                  새로운 독후감 알림
                </Label>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  팔로우하는 사용자가 새 독후감을 작성했을 때
                </p>
              </div>
              <Switch
                id="email-reviews"
                checked={settings.email.newReviews}
                onCheckedChange={(checked) => updateSetting('email.newReviews', checked)}
                aria-describedby="email-reviews-desc"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="email-comments" className="text-sm font-medium">
                  댓글 알림
                </Label>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  내 독후감에 새 댓글이 달렸을 때
                </p>
              </div>
              <Switch
                id="email-comments"
                checked={settings.email.newComments}
                onCheckedChange={(checked) => updateSetting('email.newComments', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="email-likes" className="text-sm font-medium">
                  좋아요 알림
                </Label>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  내 독후감에 좋아요를 받았을 때
                </p>
              </div>
              <Switch
                id="email-likes"
                checked={settings.email.newLikes}
                onCheckedChange={(checked) => updateSetting('email.newLikes', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="email-digest" className="text-sm font-medium">
                  주간 요약
                </Label>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  주간 활동 요약과 추천 도서
                </p>
              </div>
              <Switch
                id="email-digest"
                checked={settings.email.weeklyDigest}
                onCheckedChange={(checked) => updateSetting('email.weeklyDigest', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="email-newsletter" className="text-sm font-medium">
                  뉴스레터
                </Label>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  ReadZone 소식과 업데이트
                </p>
              </div>
              <Switch
                id="email-newsletter"
                checked={settings.email.newsletter}
                onCheckedChange={(checked) => updateSetting('email.newsletter', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1 flex-1">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="email-security" className="text-sm font-medium">
                    보안 알림
                  </Label>
                  <Badge variant="destructive" className="text-xs">필수</Badge>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  로그인, 비밀번호 변경 등 보안 관련 알림
                </p>
              </div>
              <Switch
                id="email-security"
                checked={settings.email.securityAlerts}
                onCheckedChange={(checked) => updateSetting('email.securityAlerts', checked)}
                disabled
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 푸시 알림 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Smartphone className="w-5 h-5 mr-2" />
            푸시 알림
            <Badge variant="outline" className="ml-2 text-xs">
              브라우저 지원 필요
            </Badge>
          </CardTitle>
          <CardDescription>
            실시간 브라우저 알림을 설정하세요. 브라우저 권한이 필요합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!settings.push.enabled && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start space-x-3">
                <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    푸시 알림 활성화
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    실시간 알림을 받으려면 브라우저 권한을 허용해주세요.
                  </p>
                  <Button
                    onClick={requestPushPermission}
                    size="sm"
                    className="mt-3 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    푸시 알림 활성화
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="push-enabled" className="text-sm font-medium">
                  푸시 알림 사용
                </Label>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  브라우저 푸시 알림 전체 활성화/비활성화
                </p>
              </div>
              <Switch
                id="push-enabled"
                checked={settings.push.enabled}
                onCheckedChange={(checked) => {
                  if (checked) {
                    requestPushPermission()
                  } else {
                    updateSetting('push.enabled', false)
                  }
                }}
              />
            </div>

            {settings.push.enabled && (
              <>
                <Separator />
                
                <div className="flex items-center justify-between opacity-100">
                  <div className="space-y-1">
                    <Label htmlFor="push-reviews" className="text-sm font-medium">
                      새로운 독후감
                    </Label>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      팔로우하는 사용자의 새 독후감
                    </p>
                  </div>
                  <Switch
                    id="push-reviews"
                    checked={settings.push.newReviews}
                    onCheckedChange={(checked) => updateSetting('push.newReviews', checked)}
                    disabled={!settings.push.enabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="push-comments" className="text-sm font-medium">
                      댓글 알림
                    </Label>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      내 독후감에 새 댓글
                    </p>
                  </div>
                  <Switch
                    id="push-comments"
                    checked={settings.push.newComments}
                    onCheckedChange={(checked) => updateSetting('push.newComments', checked)}
                    disabled={!settings.push.enabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="push-likes" className="text-sm font-medium">
                      좋아요 알림
                    </Label>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      내 독후감에 좋아요
                    </p>
                  </div>
                  <Switch
                    id="push-likes"
                    checked={settings.push.newLikes}
                    onCheckedChange={(checked) => updateSetting('push.newLikes', checked)}
                    disabled={!settings.push.enabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="push-mentions" className="text-sm font-medium">
                      멘션 알림
                    </Label>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      댓글에서 나를 언급했을 때
                    </p>
                  </div>
                  <Switch
                    id="push-mentions"
                    checked={settings.push.mentions}
                    onCheckedChange={(checked) => updateSetting('push.mentions', checked)}
                    disabled={!settings.push.enabled}
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 알림 빈도 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            알림 빈도
          </CardTitle>
          <CardDescription>
            알림을 받을 빈도를 설정하세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="flex items-center space-x-3">
              <input
                type="radio"
                id="frequency-immediate"
                name="frequency"
                checked={settings.frequency.immediate}
                onChange={() => {
                  updateSetting('frequency.immediate', true)
                  updateSetting('frequency.daily', false)
                  updateSetting('frequency.weekly', false)
                }}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600"
              />
              <Label htmlFor="frequency-immediate" className="flex-1">
                <div className="space-y-1">
                  <div className="text-sm font-medium">즉시 알림</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    활동이 발생하는 즉시 알림을 받습니다
                  </div>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="radio"
                id="frequency-daily"
                name="frequency"
                checked={settings.frequency.daily}
                onChange={() => {
                  updateSetting('frequency.immediate', false)
                  updateSetting('frequency.daily', true)
                  updateSetting('frequency.weekly', false)
                }}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600"
              />
              <Label htmlFor="frequency-daily" className="flex-1">
                <div className="space-y-1">
                  <div className="text-sm font-medium">일일 요약</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    하루에 한 번 모든 활동을 요약해서 받습니다
                  </div>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="radio"
                id="frequency-weekly"
                name="frequency"
                checked={settings.frequency.weekly}
                onChange={() => {
                  updateSetting('frequency.immediate', false)
                  updateSetting('frequency.daily', false)
                  updateSetting('frequency.weekly', true)
                }}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600"
              />
              <Label htmlFor="frequency-weekly" className="flex-1">
                <div className="space-y-1">
                  <div className="text-sm font-medium">주간 요약</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    일주일에 한 번 모든 활동을 요약해서 받습니다
                  </div>
                </div>
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 조용한 시간 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            {settings.quiet.enabled ? (
              <VolumeX className="w-5 h-5 mr-2" />
            ) : (
              <Volume2 className="w-5 h-5 mr-2" />
            )}
            조용한 시간
          </CardTitle>
          <CardDescription>
            특정 시간대에는 알림을 받지 않도록 설정할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="quiet-enabled" className="text-sm font-medium">
                조용한 시간 사용
              </Label>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                설정한 시간 동안 알림을 받지 않습니다
              </p>
            </div>
            <Switch
              id="quiet-enabled"
              checked={settings.quiet.enabled}
              onCheckedChange={(checked) => updateSetting('quiet.enabled', checked)}
            />
          </div>

          {settings.quiet.enabled && (
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="quiet-start" className="text-sm font-medium">
                  시작 시간
                </Label>
                <input
                  type="time"
                  id="quiet-start"
                  value={settings.quiet.startTime}
                  onChange={(e) => updateSetting('quiet.startTime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quiet-end" className="text-sm font-medium">
                  종료 시간
                </Label>
                <input
                  type="time"
                  id="quiet-end"
                  value={settings.quiet.endTime}
                  onChange={(e) => updateSetting('quiet.endTime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 저장 버튼 */}
      <div className="flex items-center justify-between pt-6 border-t">
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          {hasChanges ? (
            <>
              <AlertCircle className="w-4 h-4" />
              <span>변경사항이 있습니다</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              <span>저장된 상태입니다</span>
            </>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={!hasChanges || isSaving}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            초기화
          </Button>
          
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isSaving && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
            {isSaving ? '저장 중...' : '설정 저장'}
          </Button>
        </div>
      </div>
    </div>
  )
}
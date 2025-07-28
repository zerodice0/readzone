'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import {
  Shield,
  Eye,
  Users,
  Globe,
  Lock,
  Search,
  Mail,
  Activity,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react'
import { toast } from 'sonner'

interface PrivacySettingsProps {
  userId: string
  className?: string
}

interface PrivacySettings {
  profile: {
    visibility: 'public' | 'private' | 'friends'
    showEmail: boolean
    showStats: boolean
    showActivity: boolean
    allowSearch: boolean
  }
  content: {
    defaultVisibility: 'public' | 'private' | 'friends'
    allowComments: boolean
    allowLikes: boolean
    moderateComments: boolean
  }
  activity: {
    showReadingList: boolean
    showRecentActivity: boolean
    showLikes: boolean
    shareToFeed: boolean
  }
  communication: {
    allowMessages: boolean
    allowMentions: boolean
    allowNewsletters: boolean
    allowPromotions: boolean
  }
}

const defaultSettings: PrivacySettings = {
  profile: {
    visibility: 'public',
    showEmail: false,
    showStats: true,
    showActivity: true,
    allowSearch: true
  },
  content: {
    defaultVisibility: 'public',
    allowComments: true,
    allowLikes: true,
    moderateComments: false
  },
  activity: {
    showReadingList: true,
    showRecentActivity: true,
    showLikes: false,
    shareToFeed: true
  },
  communication: {
    allowMessages: true,
    allowMentions: true,
    allowNewsletters: false,
    allowPromotions: false
  }
}

const visibilityOptions = [
  {
    value: 'public' as const,
    label: '전체 공개',
    description: '모든 사용자가 볼 수 있습니다',
    icon: <Globe className="w-4 h-4" />
  },
  {
    value: 'friends' as const,
    label: '친구만',
    description: '팔로우하는 사용자만 볼 수 있습니다',
    icon: <Users className="w-4 h-4" />
  },
  {
    value: 'private' as const,
    label: '비공개',
    description: '본인만 볼 수 있습니다',
    icon: <Lock className="w-4 h-4" />
  }
]

export function PrivacySettings({ userId, className }: PrivacySettingsProps) {
  const [settings, setSettings] = useState<PrivacySettings>(defaultSettings)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [originalSettings, setOriginalSettings] = useState<PrivacySettings>(defaultSettings)

  // 설정 로드
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch(`/api/users/${userId}/privacy`)
        if (response.ok) {
          const data = await response.json()
          setSettings(data.settings || defaultSettings)
          setOriginalSettings(data.settings || defaultSettings)
        }
      } catch (error) {
        console.error('개인정보 설정 로드 실패:', error)
        toast.error('개인정보 설정을 불러오는데 실패했습니다.')
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
      const newSettings = { ...prev } as any
      let current = newSettings
      
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] }
        current = current[keys[i]]
      }
      
      current[keys[keys.length - 1]] = value
      return newSettings
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/users/${userId}/privacy`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings })
      })

      if (response.ok) {
        setOriginalSettings(settings)
        setHasChanges(false)
        toast.success('개인정보 보호 설정이 저장되었습니다.')
      } else {
        throw new Error('저장 실패')
      }
    } catch (error) {
      console.error('개인정보 설정 저장 실패:', error)
      toast.error('개인정보 설정 저장에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setSettings(originalSettings)
    setHasChanges(false)
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
      {/* 프로필 공개 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            프로필 공개 설정
          </CardTitle>
          <CardDescription>
            다른 사용자가 내 프로필에서 볼 수 있는 정보를 설정합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 프로필 공개 수준 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">프로필 공개 수준</Label>
            <div className="space-y-2">
              {visibilityOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id={`profile-${option.value}`}
                    name="profile-visibility"
                    value={option.value}
                    checked={settings.profile.visibility === option.value}
                    onChange={(e) => updateSetting('profile.visibility', e.target.value)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600"
                  />
                  <Label htmlFor={`profile-${option.value}`} className="flex-1 cursor-pointer">
                    <div className="flex items-center space-x-2">
                      {option.icon}
                      <span className="font-medium">{option.label}</span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {option.description}
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* 세부 공개 설정 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium flex items-center">
                  <Mail className="w-4 h-4 mr-2" />
                  이메일 주소 공개
                </Label>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  다른 사용자가 내 이메일 주소를 볼 수 있습니다
                </p>
              </div>
              <Switch
                checked={settings.profile.showEmail}
                onCheckedChange={(checked) => updateSetting('profile.showEmail', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium flex items-center">
                  <Activity className="w-4 h-4 mr-2" />
                  활동 통계 공개
                </Label>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  독후감 수, 좋아요 수 등의 통계를 공개합니다
                </p>
              </div>
              <Switch
                checked={settings.profile.showStats}
                onCheckedChange={(checked) => updateSetting('profile.showStats', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium flex items-center">
                  <Eye className="w-4 h-4 mr-2" />
                  최근 활동 공개
                </Label>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  최근에 작성한 독후감이나 의견을 공개합니다
                </p>
              </div>
              <Switch
                checked={settings.profile.showActivity}
                onCheckedChange={(checked) => updateSetting('profile.showActivity', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium flex items-center">
                  <Search className="w-4 h-4 mr-2" />
                  검색 허용
                </Label>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  다른 사용자가 검색으로 내 프로필을 찾을 수 있습니다
                </p>
              </div>
              <Switch
                checked={settings.profile.allowSearch}
                onCheckedChange={(checked) => updateSetting('profile.allowSearch', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 콘텐츠 공개 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="w-5 h-5 mr-2" />
            콘텐츠 공개 설정
          </CardTitle>
          <CardDescription>
            작성하는 독후감과 의견의 기본 공개 설정을 관리합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 기본 공개 수준 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">새 콘텐츠 기본 공개 수준</Label>
            <div className="space-y-2">
              {visibilityOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id={`content-${option.value}`}
                    name="content-visibility"
                    value={option.value}
                    checked={settings.content.defaultVisibility === option.value}
                    onChange={(e) => updateSetting('content.defaultVisibility', e.target.value)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600"
                  />
                  <Label htmlFor={`content-${option.value}`} className="flex-1 cursor-pointer">
                    <div className="flex items-center space-x-2">
                      {option.icon}
                      <span className="font-medium">{option.label}</span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {option.description}
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* 상호작용 설정 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">댓글 허용</Label>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  다른 사용자가 내 독후감에 댓글을 달 수 있습니다
                </p>
              </div>
              <Switch
                checked={settings.content.allowComments}
                onCheckedChange={(checked) => updateSetting('content.allowComments', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">좋아요 허용</Label>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  다른 사용자가 내 독후감에 좋아요를 누를 수 있습니다
                </p>
              </div>
              <Switch
                checked={settings.content.allowLikes}
                onCheckedChange={(checked) => updateSetting('content.allowLikes', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">댓글 검토</Label>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  댓글이 공개되기 전에 내가 승인하도록 설정합니다
                </p>
              </div>
              <Switch
                checked={settings.content.moderateComments}
                onCheckedChange={(checked) => updateSetting('content.moderateComments', checked)}
                disabled={!settings.content.allowComments}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 활동 공개 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            활동 공개 설정
          </CardTitle>
          <CardDescription>
            내 독서 활동과 상호작용을 다른 사용자에게 공개할지 설정합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">독서 목록 공개</Label>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                읽은 책 목록을 다른 사용자가 볼 수 있습니다
              </p>
            </div>
            <Switch
              checked={settings.activity.showReadingList}
              onCheckedChange={(checked) => updateSetting('activity.showReadingList', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">최근 활동 공개</Label>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                최근 독후감 작성, 댓글 등의 활동을 공개합니다
              </p>
            </div>
            <Switch
              checked={settings.activity.showRecentActivity}
              onCheckedChange={(checked) => updateSetting('activity.showRecentActivity', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">좋아요 활동 공개</Label>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                내가 좋아요를 누른 독후감을 다른 사용자가 볼 수 있습니다
              </p>
            </div>
            <Switch
              checked={settings.activity.showLikes}
              onCheckedChange={(checked) => updateSetting('activity.showLikes', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">피드 공유</Label>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                내 활동이 팔로워의 피드에 표시됩니다
              </p>
            </div>
            <Switch
              checked={settings.activity.shareToFeed}
              onCheckedChange={(checked) => updateSetting('activity.shareToFeed', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* 커뮤니케이션 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="w-5 h-5 mr-2" />
            커뮤니케이션 설정
          </CardTitle>
          <CardDescription>
            다른 사용자와의 소통 방식을 설정합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">쪽지 허용</Label>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                다른 사용자가 나에게 개인 메시지를 보낼 수 있습니다
              </p>
            </div>
            <Switch
              checked={settings.communication.allowMessages}
              onCheckedChange={(checked) => updateSetting('communication.allowMessages', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">멘션 허용</Label>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                댓글에서 다른 사용자가 나를 언급할 수 있습니다
              </p>
            </div>
            <Switch
              checked={settings.communication.allowMentions}
              onCheckedChange={(checked) => updateSetting('communication.allowMentions', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">뉴스레터 수신</Label>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                ReadZone의 소식과 업데이트를 이메일로 받습니다
              </p>
            </div>
            <Switch
              checked={settings.communication.allowNewsletters}
              onCheckedChange={(checked) => updateSetting('communication.allowNewsletters', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">프로모션 이메일</Label>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                도서 추천, 할인 정보 등의 마케팅 이메일을 받습니다
              </p>
            </div>
            <Switch
              checked={settings.communication.allowPromotions}
              onCheckedChange={(checked) => updateSetting('communication.allowPromotions', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* 주의사항 */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-6">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                개인정보 보호 안내
              </h4>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• 개인정보 설정은 언제든지 변경할 수 있습니다.</li>
                <li>• 비공개로 설정한 정보는 본인과 관리자만 볼 수 있습니다.</li>
                <li>• 일부 설정은 적용까지 시간이 걸릴 수 있습니다.</li>
                <li>• 법적 요구가 있는 경우 정보가 공개될 수 있습니다.</li>
              </ul>
            </div>
          </div>
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
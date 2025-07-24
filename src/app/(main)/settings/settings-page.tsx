'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useUserProfile } from '@/hooks/use-user-profile'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  Trash2,
  LogOut,
  Save,
  RefreshCw,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Moon,
  Sun,
  Monitor,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Smartphone,
  Download,
  Upload
} from 'lucide-react'
import Link from 'next/link'
import { ProfileEditSection } from '@/components/settings/profile-edit-section'
import { NotificationSettings } from '@/components/settings/notification-settings'
import { PrivacySettings } from '@/components/settings/privacy-settings'
import { ThemeSettings } from '@/components/settings/theme-settings'
import { SecuritySettings } from '@/components/settings/security-settings'
import { DataManagement } from '@/components/settings/data-management'
import { AccountDeletion } from '@/components/settings/account-deletion'

interface SettingsPageProps {
  userId: string
  className?: string
}

type SettingSection = 
  | 'profile' 
  | 'notifications' 
  | 'privacy' 
  | 'theme' 
  | 'security' 
  | 'data' 
  | 'account'

interface SettingSectionConfig {
  id: SettingSection
  title: string
  description: string
  icon: React.ReactNode
  component: React.ComponentType<{ userId: string }>
  badge?: {
    text: string
    variant: 'default' | 'secondary' | 'destructive' | 'outline'
  }
}

export function SettingsPage({ userId, className }: SettingsPageProps) {
  const { data: session } = useSession()
  const [activeSection, setActiveSection] = useState<SettingSection>('profile')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const {
    profile,
    isLoading,
    isError,
    refreshAll
  } = useUserProfile({ userId })

  // 설정 섹션 구성
  const settingSections: SettingSectionConfig[] = [
    {
      id: 'profile',
      title: '프로필 정보',
      description: '기본 프로필 정보와 공개 설정을 관리합니다',
      icon: <User className="w-5 h-5" />,
      component: ProfileEditSection
    },
    {
      id: 'notifications',
      title: '알림 설정',
      description: '이메일 알림과 앱 알림 설정을 관리합니다',
      icon: <Bell className="w-5 h-5" />,
      component: NotificationSettings,
      badge: {
        text: '새로운 기능',
        variant: 'default'
      }
    },
    {
      id: 'privacy',
      title: '개인정보 보호',
      description: '프로필 공개 범위와 개인정보 설정을 관리합니다',
      icon: <Shield className="w-5 h-5" />,
      component: PrivacySettings
    },
    {
      id: 'theme',
      title: '테마 및 표시',
      description: '다크 모드, 언어, 글꼴 크기 등을 설정합니다',
      icon: <Palette className="w-5 h-5" />,
      component: ThemeSettings
    },
    {
      id: 'security',
      title: '보안 설정',
      description: '비밀번호 변경과 로그인 보안을 관리합니다',
      icon: <Lock className="w-5 h-5" />,
      component: SecuritySettings
    },
    {
      id: 'data',
      title: '데이터 관리',
      description: '데이터 내보내기, 가져오기, 백업을 관리합니다',
      icon: <Download className="w-5 h-5" />,
      component: DataManagement
    },
    {
      id: 'account',
      title: '계정 관리',
      description: '계정 삭제와 관련된 설정을 관리합니다',
      icon: <Trash2 className="w-5 h-5" />,
      component: AccountDeletion,
      badge: {
        text: '주의',
        variant: 'destructive'
      }
    }
  ]

  const currentSection = settingSections.find(section => section.id === activeSection)
  const ActiveComponent = currentSection?.component

  // 키보드 네비게이션
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Escape 키로 뒤로 가기
      if (event.key === 'Escape') {
        if (hasUnsavedChanges) {
          if (confirm('저장하지 않은 변경사항이 있습니다. 정말 나가시겠습니까?')) {
            setHasUnsavedChanges(false)
            window.history.back()
          }
        } else {
          window.history.back()
        }
      }
      
      // Ctrl+S로 저장
      if (event.ctrlKey && event.key === 's') {
        event.preventDefault()
        if (hasUnsavedChanges) {
          handleSaveChanges()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [hasUnsavedChanges])

  // 페이지 이탈 감지
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        event.preventDefault()
        event.returnValue = '저장하지 않은 변경사항이 있습니다.'
        return '저장하지 않은 변경사항이 있습니다.'
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  const handleSectionChange = (sectionId: SettingSection) => {
    if (hasUnsavedChanges) {
      if (confirm('저장하지 않은 변경사항이 있습니다. 정말 다른 섹션으로 이동하시겠습니까?')) {
        setHasUnsavedChanges(false)
        setActiveSection(sectionId)
      }
    } else {
      setActiveSection(sectionId)
    }
  }

  const handleSaveChanges = async () => {
    setIsSaving(true)
    try {
      // 여기에 실제 저장 로직 구현
      await new Promise(resolve => setTimeout(resolve, 1000)) // 시뮬레이션
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error('저장 중 오류 발생:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = async () => {
    if (hasUnsavedChanges) {
      if (!confirm('저장하지 않은 변경사항이 있습니다. 정말 로그아웃하시겠습니까?')) {
        return
      }
    }
    
    await signOut({ callbackUrl: '/' })
  }

  if (isLoading) {
    return <SettingsPageSkeleton />
  }

  if (isError || !profile) {
    return (
      <div className={cn('container mx-auto px-4 py-8 max-w-6xl', className)}>
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              설정을 불러올 수 없습니다
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              사용자 정보를 불러오는 중 오류가 발생했습니다.
            </p>
            <div className="flex items-center justify-center space-x-4">
              <Button onClick={refreshAll} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                다시 시도
              </Button>
              <Link href="/">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  홈으로 돌아가기
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={cn('container mx-auto px-4 py-8 max-w-6xl', className)}>
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <Link href={`/profile/${userId}`}>
              <Button variant="ghost" size="sm" aria-label="프로필로 돌아가기">
                <ArrowLeft className="w-4 h-4 mr-2" />
                프로필로 돌아가기
              </Button>
            </Link>
            
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                <SettingsIcon className="w-8 h-8 mr-3" />
                설정
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {profile.nickname}님의 계정 설정을 관리하세요
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {hasUnsavedChanges && (
              <Button
                onClick={handleSaveChanges}
                disabled={isSaving}
                className="bg-green-600 hover:bg-green-700 text-white"
                aria-label="변경사항 저장"
              >
                {isSaving ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                저장
              </Button>
            )}
            
            <Button
              onClick={handleLogout}
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              aria-label="로그아웃"
            >
              <LogOut className="w-4 h-4 mr-2" />
              로그아웃
            </Button>
          </div>
        </div>

        {/* 저장되지 않은 변경사항 알림 */}
        {hasUnsavedChanges && (
          <div 
            className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4"
            role="alert"
            aria-live="polite"
          >
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2" />
              <span className="text-yellow-800 dark:text-yellow-200 font-medium">
                저장하지 않은 변경사항이 있습니다
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 사이드바 네비게이션 */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="text-lg">설정 메뉴</CardTitle>
              <CardDescription>
                원하는 설정 카테고리를 선택하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {settingSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => handleSectionChange(section.id)}
                  className={cn(
                    'w-full flex items-center justify-between p-3 text-left rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                    activeSection === section.id
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                  )}
                  aria-current={activeSection === section.id ? 'page' : undefined}
                  role="tab"
                  tabIndex={0}
                >
                  <div className="flex items-center space-x-3">
                    {section.icon}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {section.title}
                      </div>
                    </div>
                  </div>
                  
                  {section.badge && (
                    <Badge variant={section.badge.variant} className="text-xs">
                      {section.badge.text}
                    </Badge>
                  )}
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                {currentSection?.icon}
                <div>
                  <CardTitle className="text-xl">
                    {currentSection?.title}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {currentSection?.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {ActiveComponent && (
                <ActiveComponent 
                  userId={userId}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// 로딩 스켈레톤
function SettingsPageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* 헤더 스켈레톤 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="w-24 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div>
              <div className="w-32 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
              <div className="w-48 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          </div>
          <div className="w-20 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 사이드바 스켈레톤 */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6 space-y-3">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="w-full h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              ))}
            </CardContent>
          </Card>
        </div>

        {/* 메인 콘텐츠 스켈레톤 */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="w-full h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="w-full h-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
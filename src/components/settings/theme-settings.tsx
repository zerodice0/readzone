'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  Palette,
  Sun,
  Moon,
  Monitor,
  Type,
  Globe,
  Contrast,
  Eye,
  Zap,
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'

interface ThemeSettingsProps {
  userId: string
  className?: string
}

interface ThemeSettings {
  mode: 'light' | 'dark' | 'system'
  fontSize: 'small' | 'medium' | 'large' | 'xl'
  language: 'ko' | 'en'
  highContrast: boolean
  reducedMotion: boolean
  compactMode: boolean
}

const defaultSettings: ThemeSettings = {
  mode: 'system',
  fontSize: 'medium',
  language: 'ko',
  highContrast: false,
  reducedMotion: false,
  compactMode: false
}

const themeOptions = [
  {
    id: 'light' as const,
    name: '라이트 모드',
    description: '밝은 배경과 어두운 텍스트',
    icon: <Sun className="w-5 h-5" />,
    preview: 'bg-white border-gray-200 text-gray-900'
  },
  {
    id: 'dark' as const,
    name: '다크 모드',
    description: '어두운 배경과 밝은 텍스트',
    icon: <Moon className="w-5 h-5" />,
    preview: 'bg-gray-900 border-gray-700 text-gray-100'
  },
  {
    id: 'system' as const,
    name: '시스템 설정',
    description: '운영 체제 설정을 따릅니다',
    icon: <Monitor className="w-5 h-5" />,
    preview: 'bg-gradient-to-br from-white via-gray-100 to-gray-900 border-gray-400 text-gray-700'
  }
]

const fontSizeOptions = [
  {
    id: 'small' as const,
    name: '작은 글꼴',
    description: '14px',
    size: 'text-sm'
  },
  {
    id: 'medium' as const,
    name: '보통 글꼴',
    description: '16px (기본)',
    size: 'text-base'
  },
  {
    id: 'large' as const,
    name: '큰 글꼴',
    description: '18px',
    size: 'text-lg'
  },
  {
    id: 'xl' as const,
    name: '매우 큰 글꼴',
    description: '20px',
    size: 'text-xl'
  }
]

const languageOptions = [
  {
    id: 'ko' as const,
    name: '한국어',
    flag: '🇰🇷'
  },
  {
    id: 'en' as const,
    name: 'English',
    flag: '🇺🇸'
  }
]

export function ThemeSettings({ userId, className }: ThemeSettingsProps) {
  const [settings, setSettings] = useState<ThemeSettings>(defaultSettings)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [originalSettings, setOriginalSettings] = useState<ThemeSettings>(defaultSettings)

  // 설정 로드
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch(`/api/users/${userId}/theme`)
        if (response.ok) {
          const data = await response.json()
          setSettings(data.settings || defaultSettings)
          setOriginalSettings(data.settings || defaultSettings)
        }
      } catch (error) {
        console.error('테마 설정 로드 실패:', error)
        toast.error('테마 설정을 불러오는데 실패했습니다.')
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

  // 테마 적용
  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement
      
      // 다크 모드 적용
      if (settings.mode === 'dark') {
        root.classList.add('dark')
      } else if (settings.mode === 'light') {
        root.classList.remove('dark')
      } else {
        // 시스템 설정
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        if (prefersDark) {
          root.classList.add('dark')
        } else {
          root.classList.remove('dark')
        }
      }

      // 폰트 크기 적용
      root.style.fontSize = {
        small: '14px',
        medium: '16px',
        large: '18px',
        xl: '20px'
      }[settings.fontSize]

      // 고대비 모드
      if (settings.highContrast) {
        root.classList.add('high-contrast')
      } else {
        root.classList.remove('high-contrast')
      }

      // 애니메이션 감소
      if (settings.reducedMotion) {
        root.classList.add('reduce-motion')
      } else {
        root.classList.remove('reduce-motion')
      }

      // 컴팩트 모드
      if (settings.compactMode) {
        root.classList.add('compact')
      } else {
        root.classList.remove('compact')
      }
    }

    applyTheme()
  }, [settings])

  const updateSetting = <K extends keyof ThemeSettings>(
    key: K,
    value: ThemeSettings[K]
  ) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/users/${userId}/theme`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings })
      })

      if (response.ok) {
        setOriginalSettings(settings)
        setHasChanges(false)
        toast.success('테마 설정이 저장되었습니다.')
      } else {
        throw new Error('저장 실패')
      }
    } catch (error) {
      console.error('테마 설정 저장 실패:', error)
      toast.error('테마 설정 저장에 실패했습니다.')
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
      {/* 테마 모드 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Palette className="w-5 h-5 mr-2" />
            테마 모드
          </CardTitle>
          <CardDescription>
            원하는 테마를 선택하세요. 시스템 설정을 따르면 운영 체제의 설정에 맞춰집니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {themeOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => updateSetting('mode', option.id)}
                className={cn(
                  'relative p-4 border-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                  settings.mode === option.id
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-950'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                )}
                role="radio"
                aria-checked={settings.mode === option.id}
                tabIndex={0}
              >
                <div className="flex items-center space-x-3 mb-3">
                  {option.icon}
                  <div className="text-left">
                    <div className="font-medium text-sm">{option.name}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {option.description}
                    </div>
                  </div>
                </div>
                
                {/* 미리보기 */}
                <div className={cn(
                  'h-16 rounded border-2 flex items-center justify-center text-xs',
                  option.preview
                )}>
                  미리보기
                </div>
                
                {settings.mode === option.id && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle className="w-5 h-5 text-primary-600" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 글꼴 크기 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Type className="w-5 h-5 mr-2" />
            글꼴 크기
          </CardTitle>
          <CardDescription>
            읽기 편한 글꼴 크기를 선택하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {fontSizeOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => updateSetting('fontSize', option.id)}
                className={cn(
                  'relative p-4 border-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                  settings.fontSize === option.id
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-950'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                )}
                role="radio"
                aria-checked={settings.fontSize === option.id}
              >
                <div className="text-center">
                  <div className={cn('font-medium mb-1', option.size)}>
                    가나다 Aa
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {option.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {option.description}
                  </div>
                </div>
                
                {settings.fontSize === option.id && (
                  <div className="absolute top-1 right-1">
                    <CheckCircle className="w-4 h-4 text-primary-600" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 언어 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="w-5 h-5 mr-2" />
            언어 설정
          </CardTitle>
          <CardDescription>
            인터페이스 언어를 선택하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {languageOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => updateSetting('language', option.id)}
                className={cn(
                  'relative p-4 border-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                  settings.language === option.id
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-950'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                )}
                role="radio"
                aria-checked={settings.language === option.id}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{option.flag}</span>
                  <span className="font-medium">{option.name}</span>
                </div>
                
                {settings.language === option.id && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle className="w-5 h-5 text-primary-600" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 접근성 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Eye className="w-5 h-5 mr-2" />
            접근성 설정
          </CardTitle>
          <CardDescription>
            시각적 접근성과 사용자 경험을 개선하는 설정입니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium flex items-center">
                <Contrast className="w-4 h-4 mr-2" />
                고대비 모드
              </Label>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                텍스트와 배경의 대비를 높여 가독성을 향상시킵니다
              </p>
            </div>
            <button
              onClick={() => updateSetting('highContrast', !settings.highContrast)}
              className={cn(
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                settings.highContrast ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
              )}
              role="switch"
              aria-checked={settings.highContrast}
            >
              <span
                className={cn(
                  'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out',
                  settings.highContrast ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium flex items-center">
                <Zap className="w-4 h-4 mr-2" />
                애니메이션 감소
              </Label>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                페이지 전환과 애니메이션을 줄여 어지러움을 방지합니다
              </p>
            </div>
            <button
              onClick={() => updateSetting('reducedMotion', !settings.reducedMotion)}
              className={cn(
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                settings.reducedMotion ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
              )}
              role="switch"
              aria-checked={settings.reducedMotion}
            >
              <span
                className={cn(
                  'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out',
                  settings.reducedMotion ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">
                컴팩트 모드
              </Label>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                UI 요소 간격을 줄여 더 많은 정보를 볼 수 있습니다
              </p>
            </div>
            <button
              onClick={() => updateSetting('compactMode', !settings.compactMode)}
              className={cn(
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                settings.compactMode ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
              )}
              role="switch"
              aria-checked={settings.compactMode}
            >
              <span
                className={cn(
                  'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out',
                  settings.compactMode ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </button>
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
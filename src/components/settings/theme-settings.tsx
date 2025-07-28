'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
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
  Eye,
  Contrast,
  Zap,
  CheckCircle,
  Settings,
  Sparkles,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'

interface ThemeSettingsProps {
  userId: string
  className?: string
}

interface AdditionalSettings {
  fontSize: 'small' | 'medium' | 'large' | 'xl'
  highContrast: boolean
  reducedMotion: boolean
  compactMode: boolean
}

const defaultAdditionalSettings: AdditionalSettings = {
  fontSize: 'medium',
  highContrast: false,
  reducedMotion: false,
  compactMode: false
}

const themeOptions = [
  {
    id: 'light' as const,
    name: '라이트 모드',
    description: '밝은 배경과 어두운 텍스트로 주간 사용에 최적화',
    icon: <Sun className="w-5 h-5" />,
    preview: 'bg-white border-gray-200 text-gray-900',
    gradient: 'from-yellow-50 to-orange-50'
  },
  {
    id: 'dark' as const,
    name: '다크 모드',
    description: '어두운 배경과 밝은 텍스트로 야간 사용에 최적화',
    icon: <Moon className="w-5 h-5" />,
    preview: 'bg-gray-900 border-gray-700 text-gray-100',
    gradient: 'from-gray-900 to-gray-800'
  },
  {
    id: 'system' as const,
    name: '시스템 설정',
    description: '운영 체제의 테마 설정을 자동으로 따릅니다',
    icon: <Monitor className="w-5 h-5" />,
    preview: 'bg-gradient-to-br from-white via-gray-100 to-gray-900 border-gray-400 text-gray-700',
    gradient: 'from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900'
  }
]

const fontSizeOptions = [
  {
    id: 'small' as const,
    name: '작은 글꼴',
    description: '14px - 더 많은 정보를 화면에 표시',
    size: 'text-sm',
    pixels: '14px'
  },
  {
    id: 'medium' as const,
    name: '보통 글꼴',
    description: '16px - 기본 권장 크기',
    size: 'text-base',
    pixels: '16px'
  },
  {
    id: 'large' as const,
    name: '큰 글꼴',
    description: '18px - 읽기 편한 크기',
    size: 'text-lg',
    pixels: '18px'
  },
  {
    id: 'xl' as const,
    name: '매우 큰 글꼴',
    description: '20px - 시야가 불편한 경우',
    size: 'text-xl',
    pixels: '20px'
  }
]

export function ThemeSettings({ userId, className }: ThemeSettingsProps) {
  const { theme, setTheme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [additionalSettings, setAdditionalSettings] = useState<AdditionalSettings>(defaultAdditionalSettings)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // 컴포넌트 마운트 후 하이드레이션 완료 표시
  useEffect(() => {
    setMounted(true)
  }, [])

  // 추가 설정 로드
  useEffect(() => {
    const loadAdditionalSettings = async () => {
      try {
        const response = await fetch(`/api/users/${userId}/additional-theme`)
        if (response.ok) {
          const data = await response.json()
          setAdditionalSettings(data.settings || defaultAdditionalSettings)
        }
      } catch (error) {
        console.error('추가 테마 설정 로드 실패:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (mounted) {
      loadAdditionalSettings()
    }
  }, [userId, mounted])

  // 추가 설정 적용 (하이드레이션 완료 후에만)
  useEffect(() => {
    if (!mounted) return

    const root = document.documentElement

    // 폰트 크기 적용
    root.style.fontSize = {
      small: '14px',
      medium: '16px',
      large: '18px',
      xl: '20px'
    }[additionalSettings.fontSize]

    // 고대비 모드
    if (additionalSettings.highContrast) {
      root.classList.add('high-contrast')
    } else {
      root.classList.remove('high-contrast')
    }

    // 애니메이션 감소
    if (additionalSettings.reducedMotion) {
      root.classList.add('reduce-motion')
    } else {
      root.classList.remove('reduce-motion')
    }

    // 컴팩트 모드
    if (additionalSettings.compactMode) {
      root.classList.add('compact')
    } else {
      root.classList.remove('compact')
    }
  }, [additionalSettings, mounted])

  const updateAdditionalSetting = <K extends keyof AdditionalSettings>(
    key: K,
    value: AdditionalSettings[K]
  ) => {
    setAdditionalSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleSaveAdditionalSettings = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/users/${userId}/additional-theme`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings: additionalSettings })
      })

      if (response.ok) {
        toast.success('설정이 저장되었습니다.')
      } else {
        throw new Error('저장 실패')
      }
    } catch (error) {
      console.error('추가 설정 저장 실패:', error)
      toast.error('설정 저장에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  // 하이드레이션 완료 전까지 로딩 UI 표시
  if (!mounted || isLoading) {
    return (
      <div className={cn('space-y-8', className)}>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    )
  }

  const currentTheme = theme === 'system' ? systemTheme : theme

  return (
    <div className={cn('space-y-8', className)}>
      {/* 현재 테마 상태 표시 */}
      <Card className="bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-950 dark:to-purple-950 border-primary-200 dark:border-primary-800">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg">
                <Sparkles className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h3 className="font-medium text-primary-900 dark:text-primary-100">
                  현재 테마: {themeOptions.find(opt => opt.id === currentTheme)?.name || '알 수 없음'}
                </h3>
                <p className="text-sm text-primary-700 dark:text-primary-300">
                  {theme === 'system' ? `시스템 설정에 따라 ${currentTheme === 'dark' ? '다크' : '라이트'} 모드로 표시` : '사용자 설정에 따른 테마'}
                </p>
              </div>
            </div>
            <div className="text-2xl">
              {currentTheme === 'dark' ? '🌙' : '☀️'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 테마 모드 선택 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Palette className="w-5 h-5 mr-2" />
            테마 모드
          </CardTitle>
          <CardDescription>
            원하는 테마를 선택하세요. 시스템 설정을 선택하면 운영 체제의 다크/라이트 모드 설정에 자동으로 맞춰집니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {themeOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setTheme(option.id)}
                className={cn(
                  'relative p-4 border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 group',
                  theme === option.id
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-950 shadow-lg scale-105'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md hover:scale-102'
                )}
                role="radio"
                aria-checked={theme === option.id}
                tabIndex={0}
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className={cn(
                    'p-2 rounded-lg transition-colors',
                    theme === option.id 
                      ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 group-hover:bg-primary-50 dark:group-hover:bg-primary-950'
                  )}>
                    {option.icon}
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-medium text-sm">{option.name}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {option.description}
                    </div>
                  </div>
                </div>
                
                {/* 미리보기 */}
                <div className={cn(
                  'h-16 rounded-lg border-2 flex items-center justify-center text-xs font-medium transition-all',
                  option.preview,
                  'relative overflow-hidden'
                )}>
                  <div className="relative z-10">미리보기</div>
                  <div className={cn(
                    'absolute inset-0 bg-gradient-to-br opacity-20',
                    option.gradient
                  )} />
                </div>
                
                {theme === option.id && (
                  <div className="absolute -top-2 -right-2 bg-primary-500 rounded-full p-1">
                    <CheckCircle className="w-4 h-4 text-white" />
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
            읽기 편한 글꼴 크기를 선택하세요. 선택한 크기는 전체 사이트에 적용됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {fontSizeOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => updateAdditionalSetting('fontSize', option.id)}
                className={cn(
                  'relative p-4 border-2 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                  additionalSettings.fontSize === option.id
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-950 shadow-md'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                )}
                role="radio"
                aria-checked={additionalSettings.fontSize === option.id}
              >
                <div className="text-center space-y-2">
                  <div className={cn('font-medium', option.size)}>
                    가나다 Aa
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    <div className="font-medium">{option.name}</div>
                    <div className="text-gray-500">{option.description}</div>
                  </div>
                </div>
                
                {additionalSettings.fontSize === option.id && (
                  <div className="absolute top-1 right-1">
                    <CheckCircle className="w-4 h-4 text-primary-600" />
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
            접근성 및 사용성 설정
          </CardTitle>
          <CardDescription>
            시각적 접근성과 사용자 경험을 개선하는 고급 설정입니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 고대비 모드 */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="space-y-1 flex-1">
              <Label className="text-sm font-medium flex items-center">
                <Contrast className="w-4 h-4 mr-2" />
                고대비 모드
              </Label>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                텍스트와 배경의 대비를 높여 가독성을 향상시킵니다. 시각적 접근성이 필요한 사용자에게 권장됩니다.
              </p>
            </div>
            <button
              onClick={() => updateAdditionalSetting('highContrast', !additionalSettings.highContrast)}
              className={cn(
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                additionalSettings.highContrast ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
              )}
              role="switch"
              aria-checked={additionalSettings.highContrast}
            >
              <span
                className={cn(
                  'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out',
                  additionalSettings.highContrast ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </button>
          </div>

          {/* 애니메이션 감소 */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="space-y-1 flex-1">
              <Label className="text-sm font-medium flex items-center">
                <Zap className="w-4 h-4 mr-2" />
                애니메이션 감소
              </Label>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                페이지 전환과 애니메이션을 줄여 어지러움을 방지하고 배터리 사용량을 줄입니다.
              </p>
            </div>
            <button
              onClick={() => updateAdditionalSetting('reducedMotion', !additionalSettings.reducedMotion)}
              className={cn(
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                additionalSettings.reducedMotion ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
              )}
              role="switch"
              aria-checked={additionalSettings.reducedMotion}
            >
              <span
                className={cn(
                  'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out',
                  additionalSettings.reducedMotion ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </button>
          </div>

          {/* 컴팩트 모드 */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="space-y-1 flex-1">
              <Label className="text-sm font-medium flex items-center">
                <Settings className="w-4 h-4 mr-2" />
                컴팩트 모드
              </Label>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                UI 요소 간격을 줄여 더 많은 정보를 한 화면에 표시합니다. 큰 화면에서 효율적입니다.
              </p>
            </div>
            <button
              onClick={() => updateAdditionalSetting('compactMode', !additionalSettings.compactMode)}
              className={cn(
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                additionalSettings.compactMode ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
              )}
              role="switch"
              aria-checked={additionalSettings.compactMode}
            >
              <span
                className={cn(
                  'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out',
                  additionalSettings.compactMode ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* 저장 버튼 */}
      <div className="flex justify-end pt-6 border-t">
        <Button
          onClick={handleSaveAdditionalSettings}
          disabled={isSaving}
          className="bg-primary-600 hover:bg-primary-700 text-white"
        >
          {isSaving && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
          {isSaving ? '저장 중...' : '설정 저장'}
        </Button>
      </div>
    </div>
  )
}
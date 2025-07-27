'use client'

import { useTheme as useNextThemes } from 'next-themes'
import { useEffect, useState } from 'react'

/**
 * ReadZone 전용 테마 훅
 * next-themes를 기반으로 하되 하이드레이션 안전성과 추가 기능을 제공
 */
export function useTheme() {
  const { theme, setTheme, systemTheme, resolvedTheme } = useNextThemes()
  const [mounted, setMounted] = useState(false)

  // 하이드레이션 완료 표시
  useEffect(() => {
    setMounted(true)
  }, [])

  // 하이드레이션 전까지는 안전한 기본값 반환
  if (!mounted) {
    return {
      theme: 'system' as const,
      setTheme: () => {},
      systemTheme: undefined,
      resolvedTheme: undefined,
      currentTheme: 'light' as const,
      isLoaded: false,
      toggleTheme: () => {},
      isDark: false,
      isLight: false,
      isSystem: false
    }
  }

  // 현재 적용된 테마 (시스템 테마 고려)
  const currentTheme = theme === 'system' ? systemTheme : theme

  // 편의 함수들
  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark')
    } else if (theme === 'dark') {
      setTheme('system')
    } else {
      setTheme('light')
    }
  }

  const isDark = currentTheme === 'dark'
  const isLight = currentTheme === 'light'
  const isSystem = theme === 'system'

  return {
    // next-themes 기본 API
    theme,
    setTheme,
    systemTheme,
    resolvedTheme,
    
    // ReadZone 추가 기능
    currentTheme,
    isLoaded: mounted,
    toggleTheme,
    isDark,
    isLight,
    isSystem
  }
}

/**
 * 하이드레이션 안전한 테마 상태 확인
 * 컴포넌트에서 테마 상태를 조건부로 렌더링할 때 사용
 */
export function useThemeState() {
  const { isLoaded, currentTheme, isDark, isLight } = useTheme()
  
  return {
    isLoaded,
    currentTheme: isLoaded ? currentTheme : 'light',
    isDark: isLoaded ? isDark : false,
    isLight: isLoaded ? isLight : true
  }
}

/**
 * 테마 변경 감지 훅
 * 테마가 변경될 때 특정 작업을 수행해야 하는 경우 사용
 */
export function useThemeEffect(callback: (theme: string) => void, deps: React.DependencyList = []) {
  const { currentTheme, isLoaded } = useTheme()
  
  useEffect(() => {
    if (isLoaded && currentTheme) {
      callback(currentTheme)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTheme, isLoaded, callback, ...deps])
}
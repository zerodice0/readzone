'use client'

import { useTheme } from '@/hooks/use-theme'
import { Button } from './button'

export function ThemeToggle() {
  const { currentTheme, toggleTheme, isLoaded } = useTheme()

  // 하이드레이션 완료 전까지는 로딩 표시
  if (!isLoaded) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="w-9 h-9"
        disabled
        aria-label="테마 설정 로딩 중"
      >
        <div className="h-5 w-5 animate-pulse bg-gray-400 rounded" />
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="w-9 h-9"
      aria-label={currentTheme === 'light' ? '다크모드로 전환' : '라이트모드로 전환'}
    >
      {currentTheme === 'light' ? (
        // 달 아이콘 (다크모드로 전환)
        <svg
          className="h-5 w-5 text-gray-700 dark:text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      ) : (
        // 태양 아이콘 (라이트모드로 전환)
        <svg
          className="h-5 w-5 text-gray-700 dark:text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      )}
    </Button>
  )
}
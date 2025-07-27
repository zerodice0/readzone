'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui'
import { useLogout } from '@/hooks/use-auth-api'
import { useAuthStore } from '@/store/auth-store'
import { useThemeState } from '@/hooks/use-theme'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/ui/theme-toggle'

export function Header(): JSX.Element {
  const { data: session, status } = useSession()
  const { user } = useAuthStore()
  const { isLoaded, isDark } = useThemeState()
  const logout = useLogout()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const isAuthenticated = status === 'authenticated' || user?.isAuthenticated

  const handleLogout = async (): Promise<void> => {
    try {
      await logout.mutateAsync()
      setIsMobileMenuOpen(false)
    } catch (error) {
      // 에러는 hook에서 toast로 처리됨
    }
  }

  const toggleMobileMenu = (): void => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <header 
      className={cn(
        "bg-white shadow-sm border-b border-gray-200 dark:bg-gray-900 dark:border-gray-700 transition-colors duration-200",
        !isLoaded && "opacity-95" // 하이드레이션 로딩 중 약간의 투명도
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 로고 및 브랜드 */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 group">
              <div 
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 group-hover:scale-105",
                  isDark 
                    ? "bg-gradient-to-r from-red-500 to-pink-500" 
                    : "bg-gradient-to-r from-blue-600 to-indigo-600"
                )}
              >
                <span className="text-white font-bold text-lg">R</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-gray-100 transition-colors">
                ReadZone
              </span>
            </Link>
          </div>

          {/* 데스크톱 네비게이션 */}
          <div className="hidden md:flex items-center space-x-8">
            {/* 메인 네비게이션 링크들 */}
            <nav className="flex items-center space-x-6">
              <Link 
                href="/"
                className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 px-3 py-2 text-sm font-medium transition-colors"
              >
                홈
              </Link>
              <Link 
                href="/search"
                className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 px-3 py-2 text-sm font-medium transition-colors"
              >
                도서 검색
              </Link>
              {isAuthenticated && (
                <Link 
                  href="/write"
                  className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 px-3 py-2 text-sm font-medium transition-colors"
                >
                  독후감 작성
                </Link>
              )}
            </nav>

            {/* 사용자 액션 */}
            <div className="flex items-center space-x-4">
              {/* 테마 토글 - 구분선과 함께 배치 */}
              <div className="flex items-center space-x-4">
                <ThemeToggle />
                {isAuthenticated && (
                  <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
                )}
              </div>
              
              {isAuthenticated ? (
                <>
                  {/* 사용자 정보 */}
                  <div className="flex items-center space-x-3">
                  <div 
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200",
                      isDark
                        ? "bg-gradient-to-r from-red-500 to-pink-500"
                        : "bg-gradient-to-r from-blue-500 to-indigo-500"
                    )}
                  >
                    <span className="text-sm font-medium text-white">
                      {session?.user?.name?.[0] || user?.user?.nickname?.[0] || 'U'}
                    </span>
                  </div>
                  <div className="hidden lg:block">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {session?.user?.name || user?.user?.nickname || '사용자'}
                    </p>
                  </div>
                </div>

                {/* 드롭다운 메뉴 (프로필, 설정, 로그아웃) */}
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    loading={logout.isPending}
                    className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
                  >
                    로그아웃
                  </Button>
                </div>
                </>
              ) : (
              <div className="flex items-center space-x-3">
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    로그인
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">
                    회원가입
                  </Button>
                </Link>
              </div>
              )}
            </div>
          </div>

          {/* 모바일 메뉴 버튼 */}
          <div className="md:hidden">
            <button
              type="button"
              className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 p-2"
              onClick={toggleMobileMenu}
              aria-label="메뉴 열기"
            >
              {isMobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* 모바일 메뉴 */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className={cn(
              "px-2 pt-2 pb-3 space-y-1 border-t transition-colors duration-200",
              "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
            )}>
              {/* 모바일 네비게이션 링크들 */}
              <Link
                href="/"
                className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-800 rounded-md"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                홈
              </Link>
              <Link
                href="/search"
                className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-800 rounded-md"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                도서 검색
              </Link>
              {isAuthenticated && (
                <Link
                  href="/write"
                  className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-800 rounded-md"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  독후감 작성
                </Link>
              )}

              {/* 모바일 테마 설정 */}
              <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
                <div className="px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      테마 설정
                    </span>
                    <ThemeToggle />
                  </div>
                </div>
              </div>

              {/* 모바일 사용자 액션 */}
              <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
                {isAuthenticated ? (
                  <div className="space-y-1">
                    <div className="px-3 py-2">
                      <div className="flex items-center">
                        <div 
                          className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200",
                            isDark
                              ? "bg-gradient-to-r from-red-500 to-pink-500"
                              : "bg-gradient-to-r from-blue-500 to-indigo-500"
                          )}
                        >
                          <span className="text-sm font-medium text-white">
                            {session?.user?.name?.[0] || user?.user?.nickname?.[0] || 'U'}
                          </span>
                        </div>
                        <div className="ml-3">
                          <div className="text-base font-medium text-gray-900 dark:text-gray-100">
                            {session?.user?.name || user?.user?.nickname || '사용자'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {session?.user?.email || user?.user?.email}
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      disabled={logout.isPending}
                      className={cn(
                        'block w-full text-left px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-800 rounded-md',
                        logout.isPending && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      {logout.isPending ? '로그아웃 중...' : '로그아웃'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Link
                      href="/login"
                      className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-800 rounded-md"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      로그인
                    </Link>
                    <Link
                      href="/register"
                      className="block px-3 py-2 text-base font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20 rounded-md"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      회원가입
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
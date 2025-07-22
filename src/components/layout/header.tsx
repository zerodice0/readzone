'use client';

import Link from 'next/link';
import { useSession } from '@/hooks/use-session';
import { Button } from '@/components/ui/button';
import { BookOpen, Menu, X, User } from 'lucide-react';
import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export function Header() {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary-600 dark:text-primary-500" />
            <span className="font-bold text-xl">ReadZone</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            {status === 'loading' ? (
              <div className="w-20 h-8 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
            ) : session ? (
              <>
                <Link href="/search" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">
                  도서 검색
                </Link>
                <Link href={`/profile/${session.user.id}`} className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">
                  프로필
                </Link>
                <Link href="/settings" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">
                  설정
                </Link>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  로그아웃
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">로그인</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">회원가입</Button>
                </Link>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="메뉴"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
          <div className="px-4 py-4 space-y-2">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-200 dark:border-gray-800">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">테마 설정</span>
              <ThemeToggle />
            </div>
            {session ? (
              <>
                <Link
                  href="/search"
                  className="block py-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  도서 검색
                </Link>
                <Link
                  href={`/profile/${session.user.id}`}
                  className="block py-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  프로필
                </Link>
                <Link
                  href="/settings"
                  className="block py-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  설정
                </Link>
                <button
                  className="block w-full text-left py-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="block py-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  로그인
                </Link>
                <Link
                  href="/register"
                  className="block py-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  회원가입
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
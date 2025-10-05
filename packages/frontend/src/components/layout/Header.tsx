import { Link, useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '@/store/authStore';
import { useNotificationsStore } from '@/store/notificationsStore';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, Edit, LogOut, Menu, Search, Settings, User } from 'lucide-react';
import { useEffect, useState } from 'react';

export function Header() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { summary, refreshUnreadCount } = useNotificationsStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 미읽음 알림 수 주기적 갱신
  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    refreshUnreadCount()

    const interval = setInterval(() => {
      refreshUnreadCount()
    }, 60000) // 1분마다 갱신

    return () => clearInterval(interval)
  }, [isAuthenticated, refreshUnreadCount]);

  const handleLoginClick = () => {
    navigate({ to: '/login', search: { redirect: undefined } });
  };

  const handleRegisterClick = () => {
    navigate({ to: '/register' });
  };

  const handleWriteClick = () => {
    navigate({ to: '/write' });
  };

  const handleSearchClick = () => {
    navigate({ to: '/search' });
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      const searchParams = {
        q: searchQuery.trim(),
        type: 'all' as const,
        mode: 'view' as const,
        redirect: '/write'
      };

      navigate({
        to: '/search',
        search: searchParams
      });
      // 검색창을 유지하여 사용자가 검색어를 수정하거나 재검색할 수 있도록 함
    }
  };

  const handleProfileClick = () => {
    if (user?.userid) {
      navigate({ to: `/profile/${user.userid}` });
    }
  };

  const handleSettingsClick = () => {
    navigate({ to: '/settings' });
  };

  const handleNotificationsClick = () => {
    navigate({ to: '/notifications' });
  };

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
    navigate({ to: '/' });
  };

  return (
    <header
      className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      role="banner"
      aria-label="사이트 헤더"
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* 로고 */}
          <div className="flex items-center space-x-4">
            <Link
              to="/"
              className="text-2xl font-bold text-primary hover:text-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
              aria-label="ReadZone 홈페이지로 이동"
            >
              ReadZone
            </Link>
          </div>

          {/* 데스크톱 검색창 */}
          <div id="search" className="hidden md:flex flex-1 max-w-md mx-4">
            <form
              role="search"
              aria-label="사이트 검색"
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch();
              }}
              className="relative w-full"
            >
              <label htmlFor="search-input" className="sr-only">
                도서, 독후감, 사용자 검색
              </label>
              <input
                id="search-input"
                type="search"
                placeholder="도서, 독후감, 사용자 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-describedby="search-description"
                className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
                aria-hidden="true"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="검색어 지우기"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary rounded"
                >
                  ×
                </button>
              )}
              <div id="search-description" className="sr-only">
                엔터키를 누르거나 검색 버튼을 클릭하여 검색할 수 있습니다
              </div>
            </form>
          </div>

          {/* 데스크톱 네비게이션 */}
          <nav
            id="navigation"
            className="hidden md:flex items-center space-x-6"
            role="navigation"
            aria-label="주요 네비게이션"
          >
            {isAuthenticated && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleWriteClick}
                className="text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                aria-label="새 독후감 작성하기"
              >
                <Edit className="w-4 h-4 mr-2" aria-hidden="true" />
                독후감 작성
              </Button>
            )}
          </nav>

          {/* 사용자 메뉴 */}
          <div className="flex items-center space-x-4">
            {/* 모바일 검색 버튼 */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSearchClick}
              className="md:hidden focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label="검색 페이지로 이동"
            >
              <Search className="w-4 h-4" aria-hidden="true" />
              <span className="sr-only">검색</span>
            </Button>

            {isAuthenticated ? (
              <>
                {/* 알림 버튼 (데스크톱) */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNotificationsClick}
                  className="hidden md:flex relative focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  aria-label={`알림${summary && summary.unreadCount > 0 ? ` (${summary.unreadCount}개)` : ''}`}
                >
                  <Bell className="w-4 h-4" aria-hidden="true" />
                  <span className="sr-only">알림</span>
                  {/* 알림 뱃지 */}
                  {summary && summary.unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                      {summary.unreadCount > 99 ? '99+' : summary.unreadCount}
                    </span>
                  )}
                </Button>

                {/* 사용자 드롭다운 */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-8 w-8 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                      aria-label={`사용자 메뉴 (${user?.nickname ?? '사용자'})`}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.profileImage} alt={user?.nickname ?? '사용자'} />
                        <AvatarFallback className="text-sm">
                          {user?.nickname?.charAt(0).toUpperCase() ?? 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.profileImage} alt={user?.nickname ?? '사용자'} />
                        <AvatarFallback className="text-sm">
                          {user?.nickname?.charAt(0).toUpperCase() ?? 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user?.nickname ?? '사용자'}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleProfileClick}
                      className="focus:bg-accent focus:text-accent-foreground"
                    >
                      <User className="mr-2 h-4 w-4" aria-hidden="true" />
                      프로필
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleNotificationsClick}
                      className="md:hidden focus:bg-accent focus:text-accent-foreground"
                    >
                      <div className="flex items-center w-full">
                        <Bell className="mr-2 h-4 w-4" aria-hidden="true" />
                        <span>알림</span>
                        {summary && summary.unreadCount > 0 && (
                          <span className="ml-auto inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                            {summary.unreadCount > 99 ? '99+' : summary.unreadCount}
                          </span>
                        )}
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleWriteClick}
                      className="md:hidden focus:bg-accent focus:text-accent-foreground"
                    >
                      <Edit className="mr-2 h-4 w-4" aria-hidden="true" />
                      독후감 작성
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleSettingsClick}
                      className="focus:bg-accent focus:text-accent-foreground"
                    >
                      <Settings className="mr-2 h-4 w-4" aria-hidden="true" />
                      설정
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="focus:bg-accent focus:text-accent-foreground"
                    >
                      <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                      로그아웃
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                {/* 비로그인 사용자 - 데스크톱 */}
                <div className="hidden md:flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLoginClick}
                    className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    aria-label="로그인 페이지로 이동"
                  >
                    로그인
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleRegisterClick}
                    className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    aria-label="회원가입 페이지로 이동"
                  >
                    회원가입
                  </Button>
                </div>

                {/* 비로그인 사용자 - 모바일 */}
                <div className="md:hidden">
                  <DropdownMenu open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                        aria-label="모바일 메뉴 열기"
                      >
                        <Menu className="w-4 h-4" aria-hidden="true" />
                        <span className="sr-only">메뉴</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48" align="end">
                      <DropdownMenuItem
                        onClick={handleSearchClick}
                        className="focus:bg-accent focus:text-accent-foreground"
                      >
                        <Search className="mr-2 h-4 w-4" aria-hidden="true" />
                        도서 검색
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleLoginClick}
                        className="focus:bg-accent focus:text-accent-foreground"
                      >
                        로그인
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={handleRegisterClick}
                        className="focus:bg-accent focus:text-accent-foreground"
                      >
                        회원가입
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
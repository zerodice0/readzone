import { Link, useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bell, Edit, LogOut, Menu, Search, Settings, User } from 'lucide-react';
import { useState } from 'react';

export function Header() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const handleProfileClick = () => {
    if (user?.userid) {
      navigate({ to: `/profile/${user.userid}` });
    }
  };

  const handleSettingsClick = () => {
    navigate({ to: '/settings' });
  };

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
    navigate({ to: '/' });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* 로고 */}
          <div className="flex items-center space-x-4">
            <Link 
              to="/" 
              className="text-2xl font-bold text-primary hover:text-primary/90 transition-colors"
            >
              ReadZone
            </Link>
          </div>

          {/* 데스크톱 네비게이션 */}
          <nav className="hidden md:flex items-center space-x-6">
            {isAuthenticated && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleWriteClick}
                className="text-muted-foreground hover:text-foreground"
              >
                <Edit className="w-4 h-4 mr-2" />
                독후감 작성
              </Button>
            )}
          </nav>

          {/* 사용자 메뉴 */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {/* 알림 버튼 (데스크톱) */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden md:flex relative"
                >
                  <Bell className="w-4 h-4" />
                  <span className="sr-only">알림</span>
                  {/* 알림 뱃지 - 추후 구현 */}
                </Button>

                {/* 사용자 드롭다운 */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-sm">
                          {user?.nickname?.charAt(0).toUpperCase() ?? 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
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
                    <DropdownMenuItem onClick={handleProfileClick}>
                      <User className="mr-2 h-4 w-4" />
                      프로필
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={handleWriteClick}
                      className="md:hidden"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      독후감 작성
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSettingsClick}>
                      <Settings className="mr-2 h-4 w-4" />
                      설정
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
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
                  >
                    로그인
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleRegisterClick}
                  >
                    회원가입
                  </Button>
                </div>

                {/* 비로그인 사용자 - 모바일 */}
                <div className="md:hidden">
                  <DropdownMenu open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Menu className="w-4 h-4" />
                        <span className="sr-only">메뉴</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48" align="end">
                      <DropdownMenuItem onClick={handleSearchClick}>
                        <Search className="mr-2 h-4 w-4" />
                        도서 검색
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLoginClick}>
                        로그인
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleRegisterClick}>
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
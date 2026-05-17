import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  SignedIn,
  SignedOut,
  useAuth,
  useClerk,
  useUser,
} from '@clerk/clerk-react';
import {
  BarChart3,
  BookOpen,
  Bookmark,
  ChevronDown,
  FileText,
  Home,
  Library,
  LogOut,
  Menu,
  PenSquare,
  User,
  type LucideIcon,
} from 'lucide-react';
import { m } from 'framer-motion';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../ui/sheet';
import { BrandMark } from '../brand/BrandMark';
import { getAnimationProps } from '../../lib/motion';
import { getUserDisplayName } from '../../utils/userDisplayName';

interface NavLinkItem {
  to: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  authOnly?: boolean;
}

const NAV_LINKS: NavLinkItem[] = [
  { to: '/feed', label: '피드', shortLabel: '피드', icon: Home },
  { to: '/books', label: '책 목록', shortLabel: '책', icon: Library },
  {
    to: '/reading-diary',
    label: '독서 일기',
    shortLabel: '일기',
    icon: BookOpen,
    authOnly: true,
  },
  {
    to: '/dashboard',
    label: '대시보드',
    shortLabel: '대시보드',
    icon: BarChart3,
    authOnly: true,
  },
];

const SIGNED_IN_ACCOUNT_LINKS: NavLinkItem[] = [
  {
    to: '/dashboard?tab=account',
    label: '계정 관리',
    shortLabel: '계정',
    icon: User,
    authOnly: true,
  },
  {
    to: '/dashboard?tab=reviews',
    label: '내 독후감',
    shortLabel: '독후감',
    icon: FileText,
    authOnly: true,
  },
  {
    to: '/dashboard?tab=bookmarks',
    label: '북마크',
    shortLabel: '북마크',
    icon: Bookmark,
    authOnly: true,
  },
];

function getVisibleNavLinks(isSignedIn?: boolean): NavLinkItem[] {
  return NAV_LINKS.filter((link) => !link.authOnly || isSignedIn);
}

function isActiveNavLink(pathname: string, to: string) {
  if (to === '/feed') {
    return (
      pathname === '/' ||
      pathname === '/feed' ||
      pathname.startsWith('/reviews')
    );
  }

  if (to === '/books') {
    return pathname === '/books' || pathname.startsWith('/books/');
  }

  return pathname === to || pathname.startsWith(`${to}/`);
}

function MobileLogoutButton({ onLogout }: { onLogout: () => void }) {
  const { signOut } = useClerk();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
    } finally {
      onLogout();
      void navigate('/');
    }
  };

  return (
    <Button
      variant="ghost"
      className="h-12 w-full justify-start rounded-md px-4 text-stone-600 hover:bg-red-50 hover:text-red-600"
      onClick={() => {
        handleLogout().catch(() => {});
      }}
    >
      <LogOut className="w-5 h-5 mr-3" />
      로그아웃
    </Button>
  );
}

function UserAvatar({ className = 'h-9 w-9' }: { className?: string }) {
  const { user } = useUser();
  const displayName = getUserDisplayName(user);

  return (
    <Avatar className={`${className} border border-stone-200`}>
      <AvatarImage src={user?.imageUrl} alt={displayName} />
      <AvatarFallback className="bg-primary-100 text-sm font-medium text-primary-700">
        {displayName.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}

function DesktopUserMenu() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const displayName = getUserDisplayName(user);
  const email = user?.primaryEmailAddress?.emailAddress;

  const handleSignOut = async () => {
    await signOut();
    void navigate('/feed');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-10 gap-2 px-2">
          <UserAvatar />
          <ChevronDown className="h-4 w-4 text-stone-500" />
          <span className="sr-only">사용자 메뉴 열기</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <span className="block truncate text-sm">{displayName}</span>
          {email && (
            <span className="block truncate text-xs font-normal text-stone-500">
              {email}
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/dashboard?tab=account" className="cursor-pointer">
            <User className="h-4 w-4" />
            계정 관리
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer text-red-600 focus:text-red-600"
          onClick={() => {
            handleSignOut().catch(() => {});
          }}
        >
          <LogOut className="h-4 w-4" />
          로그아웃
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileUserInfo() {
  const { user } = useUser();

  const displayName = getUserDisplayName(user);
  const email = user?.primaryEmailAddress?.emailAddress;

  // 긴 이름은 12자로 제한
  const truncatedName =
    displayName.length > 12 ? `${displayName.slice(0, 12)}...` : displayName;

  return (
    <div
      className="flex items-center gap-3 rounded-md px-4 py-4"
      aria-label="로그인 사용자 정보"
    >
      <UserAvatar className="h-8 w-8" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-stone-800">
          {truncatedName}
        </span>
        <span className="block truncate text-xs text-stone-500">
          {email || '로그인 중'}
        </span>
      </span>
    </div>
  );
}

function MobileMenuSection({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section className="space-y-2">
      <h3 className="px-1 text-xs font-semibold text-stone-500">{title}</h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function MobileMenuLink({
  isActive = false,
  item,
  onNavigate,
}: {
  isActive?: boolean;
  item: NavLinkItem;
  onNavigate: () => void;
}) {
  const Icon = item.icon;

  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      className={`relative flex h-14 items-center gap-4 rounded-md px-4 text-base font-semibold transition-colors ${
        isActive
          ? 'bg-paper-100/75 text-stone-950 shadow-sm ring-1 ring-paper-200/80'
          : 'text-stone-700 hover:bg-paper-50 hover:text-primary-800'
      }`}
      aria-current={isActive ? 'page' : undefined}
    >
      {isActive && (
        <span className="absolute left-0 top-3 h-8 w-1 rounded-r-sm bg-primary-500" />
      )}
      <Icon className="h-5 w-5 text-current" />
      {item.label}
    </Link>
  );
}

function MobileBottomNavigation({ navLinks }: { navLinks: NavLinkItem[] }) {
  const location = useLocation();

  return (
    <nav
      className="mobile-bottom-nav-wrap md:hidden"
      aria-label="모바일 주요 네비게이션"
    >
      <div
        className="mobile-bottom-nav grid"
        style={{
          gridTemplateColumns: `repeat(${navLinks.length}, minmax(0, 1fr))`,
        }}
      >
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = isActiveNavLink(location.pathname, link.to);

          return (
            <Link
              key={link.to}
              to={link.to}
              className={`relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-md px-2 py-2 text-xs font-semibold transition-colors ${
                isActive
                  ? 'text-primary-700'
                  : 'text-stone-500 hover:bg-paper-50 hover:text-stone-800'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="h-5 w-5" />
              <span>{link.shortLabel}</span>
              {isActive && (
                <span className="absolute -bottom-1 h-3 w-5 rounded-t-sm bg-primary-500" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function MobileComposeButton() {
  return (
    <Link
      to="/reviews/new"
      className="mobile-compose-fab md:hidden"
      aria-label="독후감 작성"
    >
      <PenSquare className="h-6 w-6" />
    </Link>
  );
}

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const { loaded: clerkLoaded, client } = useClerk();
  const location = useLocation();

  // iOS Chrome에서 Clerk 상태 변화가 리렌더링을 트리거하지 않는 문제 대응
  // 로컬 상태로 관리하여 useEffect에서 강제 업데이트
  const [isClerkReady, setIsClerkReady] = useState(clerkLoaded);

  useEffect(() => {
    if (clerkLoaded) {
      setIsClerkReady(true);
    }
  }, [clerkLoaded]);

  // URL 파라미터로 디버그 모드 활성화 (?debug=true)
  const isDebugMode =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('debug') === 'true';

  // 디버그 정보 수집
  const debugInfo = {
    clerkLoaded,
    authLoaded,
    isSignedIn,
    isClerkReady,
    clientStatus: client ? 'initialized' : 'null',
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
  };

  const navLinks = getVisibleNavLinks(isSignedIn);
  const isWritingRoute =
    location.pathname === '/reviews/new' ||
    (location.pathname.startsWith('/reviews/') &&
      location.pathname.endsWith('/edit'));

  return (
    <>
      {/* 디버그 패널 - ?debug=true로 활성화 */}
      {isDebugMode && (
        <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-black/90 text-white p-3 text-xs font-mono overflow-auto max-h-48">
          <div className="font-bold text-yellow-400 mb-2">
            🔧 Clerk Debug Panel
          </div>
          <div className="grid grid-cols-2 gap-1">
            <span className="text-stone-400">clerkLoaded:</span>
            <span className={clerkLoaded ? 'text-green-400' : 'text-red-400'}>
              {String(clerkLoaded)}
            </span>
            <span className="text-stone-400">isClerkReady:</span>
            <span className={isClerkReady ? 'text-green-400' : 'text-red-400'}>
              {String(isClerkReady)}
            </span>
            <span className="text-stone-400">authLoaded:</span>
            <span className={authLoaded ? 'text-green-400' : 'text-red-400'}>
              {String(authLoaded)}
            </span>
            <span className="text-stone-400">isSignedIn:</span>
            <span>{String(isSignedIn)}</span>
            <span className="text-stone-400">client:</span>
            <span>{debugInfo.clientStatus}</span>
          </div>
          <div className="mt-2 text-stone-400 break-all">
            <span className="text-stone-500">UA: </span>
            {debugInfo.userAgent}
          </div>
          <div className="mt-1 text-stone-500">{debugInfo.timestamp}</div>
        </div>
      )}
      <header className="sticky top-0 z-50 border-b border-paper-200/70 bg-[#fffdf8]/88 shadow-sm backdrop-blur-xl">
        {/* Skip to main content link for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:bg-primary focus:text-white focus:px-4 focus:py-2 focus:rounded-md focus:font-medium"
        >
          본문으로 건너뛰기
        </a>
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* 로고 */}
          <Link
            to="/feed"
            className="flex items-center gap-2 text-xl font-bold text-ink hover:text-primary-700 transition-colors"
          >
            <m.span
              {...getAnimationProps({
                whileHover: {
                  scale: 1.05,
                  rotateZ: [0, -2, 2, -2, 0],
                },
                whileTap: { scale: 0.95 },
                transition: { duration: 0.5 },
              })}
              className="inline-block"
            >
              <BrandMark className="h-8 w-8 rounded-xl" />
            </m.span>
            <span>글다락</span>
          </Link>

          {/* 데스크톱 네비게이션 */}
          <nav
            className="hidden items-center gap-2 md:flex"
            aria-label="주요 네비게이션"
          >
            {navLinks.map((link, index) => {
              const Icon = link.icon;
              const isActive = isActiveNavLink(location.pathname, link.to);

              return (
                <m.div
                  key={link.to}
                  {...getAnimationProps({
                    initial: { opacity: 0, y: -10 },
                    animate: { opacity: 1, y: 0 },
                    transition: { delay: index * 0.08, duration: 0.3 },
                    whileHover: { y: -1 },
                    whileTap: { scale: 0.97 },
                  })}
                >
                  <Link
                    to={link.to}
                    className={`flex h-10 items-center gap-2 rounded-full px-3 text-sm font-semibold transition-colors ${
                      isActive
                        ? 'bg-paper-100 text-primary-800'
                        : 'text-stone-700 hover:bg-paper-50 hover:text-primary-700'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                </m.div>
              );
            })}
          </nav>

          {/* 우측 메뉴 */}
          <div className="flex items-center gap-3">
            {/* 데스크톱: 독후감 작성 버튼 */}
            <div className="hidden md:flex items-center gap-3">
              {!isClerkReady ? (
                /* Clerk 로딩 중 스켈레톤 UI */
                <>
                  <div className="w-16 h-8 bg-stone-200 animate-pulse rounded" />
                  <div className="w-20 h-8 bg-stone-200 animate-pulse rounded" />
                </>
              ) : (
                <>
                  <SignedOut>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to="/sign-in">로그인</Link>
                    </Button>
                    <Button size="sm" asChild>
                      <Link to="/sign-up">회원가입</Link>
                    </Button>
                  </SignedOut>
                  <SignedIn>
                    <Button
                      variant="default"
                      size="sm"
                      asChild
                      className="gap-2"
                    >
                      <Link to="/reviews/new">
                        <PenSquare className="w-4 h-4" />
                        독후감 작성
                      </Link>
                    </Button>
                    <DesktopUserMenu />
                  </SignedIn>
                </>
              )}
            </div>

            {/* 모바일: 햄버거 메뉴 */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 border border-paper-200 bg-[#fff8e6]/80 text-stone-700 shadow-sm md:hidden"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">메뉴 열기</span>
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="paper-nav-drawer flex h-dvh w-[min(86vw,22rem)] flex-col border-l-0 px-5 pb-6 pt-10"
              >
                <SheetHeader className="mb-8">
                  <SheetTitle className="text-left font-heading text-2xl text-primary-700">
                    글다락
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-1 flex-col gap-7">
                  <SignedIn>
                    <div className="rounded-lg border border-paper-200/80 bg-[#fffdf8]/72 p-2 shadow-sm">
                      <MobileUserInfo />
                    </div>
                  </SignedIn>

                  <MobileMenuSection title="전체 메뉴">
                    <nav className="space-y-2" aria-label="모바일 전체 메뉴">
                      {navLinks.map((link) => {
                        const isActive = isActiveNavLink(
                          location.pathname,
                          link.to
                        );

                        return (
                          <MobileMenuLink
                            key={link.to}
                            isActive={isActive}
                            item={link}
                            onNavigate={() => setIsMobileMenuOpen(false)}
                          />
                        );
                      })}
                    </nav>
                  </MobileMenuSection>

                  <div className="border-t border-paper-200/80" />

                  {/* 모바일: 로그인/회원가입 */}
                  {!isClerkReady ? (
                    /* Clerk 로딩 중 스켈레톤 UI */
                    <>
                      <div className="w-full h-10 bg-stone-200 animate-pulse rounded" />
                      <div className="w-full h-10 bg-stone-200 animate-pulse rounded" />
                    </>
                  ) : (
                    <SignedOut>
                      <div className="space-y-3">
                        <Button
                          variant="outline"
                          className="h-12 w-full"
                          asChild
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Link to="/sign-in">로그인</Link>
                        </Button>
                        <Button
                          className="h-12 w-full"
                          asChild
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Link to="/sign-up">회원가입</Link>
                        </Button>
                      </div>
                    </SignedOut>
                  )}

                  {/* 모바일: 사용자 메뉴 */}
                  <SignedIn>
                    <MobileMenuSection title="내 메뉴">
                      {SIGNED_IN_ACCOUNT_LINKS.map((link) => (
                        <MobileMenuLink
                          key={`${link.to}-${link.label}`}
                          isActive={false}
                          item={link}
                          onNavigate={() => setIsMobileMenuOpen(false)}
                        />
                      ))}
                      <div className="rounded-lg border border-paper-200/80 bg-[#fffdf8]/72 p-2 shadow-sm">
                        <MobileLogoutButton
                          onLogout={() => setIsMobileMenuOpen(false)}
                        />
                      </div>
                    </MobileMenuSection>
                  </SignedIn>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
      {!isWritingRoute && <MobileComposeButton />}
      <MobileBottomNavigation navLinks={navLinks} />
    </>
  );
}

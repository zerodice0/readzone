import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  SignedIn,
  SignedOut,
  useAuth,
  useClerk,
  useUser,
  UserButton,
} from '@clerk/clerk-react';
import { Menu, PenSquare, LayoutDashboard, LogOut } from 'lucide-react';
import { m } from 'framer-motion';
import { Button } from '../ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../ui/sheet';
import { getAnimationProps } from '../../lib/motion';

interface MobileNavLinksProps {
  onNavigate: () => void;
}

function MobileNavLinks({ onNavigate }: MobileNavLinksProps) {
  return (
    <Link
      to="/dashboard"
      onClick={onNavigate}
      className="flex items-center gap-3 text-stone-700 hover:text-primary-600 font-medium py-2 px-3 rounded-md hover:bg-stone-50 transition-colors"
    >
      <LayoutDashboard className="w-4 h-4" />
      대시보드
    </Link>
  );
}

function DesktopDashboardButton() {
  return (
    <Link
      to="/dashboard"
      className="p-2 rounded-lg text-stone-600 hover:text-primary-600 hover:bg-stone-50 transition-colors"
      aria-label="대시보드로 이동"
    >
      <LayoutDashboard className="w-5 h-5" />
    </Link>
  );
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
      className="w-full justify-start text-stone-600 hover:text-red-600 hover:bg-red-50"
      onClick={() => {
        handleLogout().catch(() => {});
      }}
    >
      <LogOut className="w-5 h-5 mr-3" />
      로그아웃
    </Button>
  );
}

function MobileUserInfo({ onNavigate }: { onNavigate: () => void }) {
  const { user } = useUser();

  // 표시할 이름 결정: fullName > firstName > username > 이메일 앞부분
  const displayName =
    user?.fullName ||
    user?.firstName ||
    user?.username ||
    user?.primaryEmailAddress?.emailAddress?.split('@')[0] ||
    '사용자';

  // 긴 이름은 12자로 제한
  const truncatedName =
    displayName.length > 12 ? `${displayName.slice(0, 12)}...` : displayName;

  return (
    <Link
      to="/dashboard"
      onClick={onNavigate}
      className="flex items-center gap-3 p-2 rounded-lg hover:bg-stone-50 transition-colors"
    >
      {user?.imageUrl ? (
        <img
          src={user.imageUrl}
          alt={displayName}
          className="w-8 h-8 rounded-full border-2 border-stone-200"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
          <span className="text-primary-600 font-medium text-sm">
            {displayName.charAt(0).toUpperCase()}
          </span>
        </div>
      )}
      <span className="text-sm font-medium text-stone-700">
        {truncatedName}
      </span>
    </Link>
  );
}

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const { loaded: clerkLoaded, client } = useClerk();

  // iOS Chrome에서 Clerk 상태 변화가 리렌더링을 트리거하지 않는 문제 대응
  // 로컬 상태로 관리하여 useEffect에서 강제 업데이트
  const [isClerkReady, setIsClerkReady] = useState(clerkLoaded);

  useEffect(() => {
    if (clerkLoaded && !isClerkReady) {
      setIsClerkReady(true);
    }
  }, [clerkLoaded, isClerkReady]);

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

  const navLinks = useMemo(() => {
    const baseLinks = [
      { to: '/feed', label: '피드' },
      { to: '/books', label: '책 목록' },
    ];

    if (isSignedIn) {
      baseLinks.push({ to: '/reading-diary', label: '독서 일기' });
    }

    return baseLinks;
  }, [isSignedIn]);

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
      <header className="sticky top-0 z-50 bg-white border-b border-stone-200 shadow-sm">
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
            className="text-xl font-bold text-primary-600 hover:text-primary-700 transition-colors"
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
              ReadZone
            </m.span>
          </Link>

          {/* 데스크톱 네비게이션 */}
          <nav
            className="hidden md:flex items-center gap-6"
            aria-label="주요 네비게이션"
          >
            {navLinks.map((link, index) => (
              <m.div
                key={link.to}
                {...getAnimationProps({
                  initial: { opacity: 0, y: -10 },
                  animate: { opacity: 1, y: 0 },
                  transition: { delay: index * 0.1, duration: 0.3 },
                  whileHover: { y: -2 },
                  whileTap: { scale: 0.95 },
                })}
              >
                <Link
                  to={link.to}
                  className="text-stone-700 hover:text-primary-600 font-medium transition-colors"
                >
                  {link.label}
                </Link>
              </m.div>
            ))}
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
                    <DesktopDashboardButton />
                    <UserButton
                      appearance={{
                        elements: {
                          avatarBox: 'w-9 h-9',
                        },
                      }}
                    />
                  </SignedIn>
                </>
              )}
            </div>

            {/* 모바일: 햄버거 메뉴 */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">메뉴 열기</span>
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[300px] sm:w-[400px] flex flex-col h-full"
              >
                <SheetHeader>
                  <SheetTitle className="text-left text-primary-600">
                    ReadZone
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-8 flex flex-col gap-4">
                  {/* 모바일: 독후감 작성 버튼 (로그인 상태에서만 표시) */}
                  <SignedIn>
                    <Button
                      variant="default"
                      className="w-full gap-2"
                      asChild
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Link to="/reviews/new">
                        <PenSquare className="w-4 h-4" />
                        독후감 작성
                      </Link>
                    </Button>
                    {/* 구분선 (로그인 상태에서만 표시) */}
                    <div className="border-t border-stone-200 my-2" />
                  </SignedIn>

                  {/* 모바일 네비게이션 링크 */}
                  {navLinks.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-stone-700 hover:text-primary-600 font-medium py-2 px-3 rounded-md hover:bg-stone-50 transition-colors"
                    >
                      {link.label}
                    </Link>
                  ))}

                  {/* 구분선 */}
                  <div className="border-t border-stone-200 my-2" />

                  {/* 모바일: 로그인/회원가입 */}
                  {!isClerkReady ? (
                    /* Clerk 로딩 중 스켈레톤 UI */
                    <>
                      <div className="w-full h-10 bg-stone-200 animate-pulse rounded" />
                      <div className="w-full h-10 bg-stone-200 animate-pulse rounded" />
                    </>
                  ) : (
                    <SignedOut>
                      <Button
                        variant="outline"
                        className="w-full"
                        asChild
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Link to="/sign-in">로그인</Link>
                      </Button>
                      <Button
                        className="w-full"
                        asChild
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Link to="/sign-up">회원가입</Link>
                      </Button>
                    </SignedOut>
                  )}
                </div>

                {/* 모바일: 사용자 메뉴 (하단 고정) */}
                <SignedIn>
                  <div className="mt-auto border-t border-stone-200 pt-4 flex flex-col gap-3">
                    {/* 사용자 전용 네비게이션 링크 */}
                    <MobileNavLinks
                      onNavigate={() => setIsMobileMenuOpen(false)}
                    />
                    {/* 구분선 */}
                    <div className="border-t border-stone-200" />
                    {/* 사용자 정보 및 계정 관리 */}
                    <MobileUserInfo
                      onNavigate={() => setIsMobileMenuOpen(false)}
                    />
                    {/* 로그아웃 버튼 */}
                    <MobileLogoutButton
                      onLogout={() => setIsMobileMenuOpen(false)}
                    />
                  </div>
                </SignedIn>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </>
  );
}

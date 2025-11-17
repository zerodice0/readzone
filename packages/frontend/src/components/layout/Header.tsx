import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import { Menu, PenSquare } from 'lucide-react';
import { m } from 'framer-motion';
import { Button } from '../ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../ui/sheet';
import { useLoginPromptStore } from '../../stores/loginPromptStore';
import { getAnimationProps } from '../../lib/motion';

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { show: showLoginPrompt } = useLoginPromptStore();

  const navLinks = [
    { to: '/feed', label: '피드' },
    { to: '/books', label: '책 목록' },
  ];

  const handleWriteReview = () => {
    showLoginPrompt('독후감을 작성하려면 로그인이 필요합니다.');
  };

  return (
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
            <SignedOut>
              <Button
                variant="outline"
                size="sm"
                onClick={handleWriteReview}
                className="gap-2"
              >
                <PenSquare className="w-4 h-4" />
                독후감 작성
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/sign-in">로그인</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/sign-up">회원가입</Link>
              </Button>
            </SignedOut>
            <SignedIn>
              <Button variant="default" size="sm" asChild className="gap-2">
                <Link to="/reviews/new">
                  <PenSquare className="w-4 h-4" />
                  독후감 작성
                </Link>
              </Button>
              <UserButton afterSignOutUrl="/feed" />
            </SignedIn>
          </div>

          {/* 모바일: 햄버거 메뉴 */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">메뉴 열기</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle className="text-left text-primary-600">
                  ReadZone
                </SheetTitle>
              </SheetHeader>
              <div className="mt-8 flex flex-col gap-4">
                {/* 모바일: 독후감 작성 버튼 */}
                <SignedOut>
                  <Button
                    variant="default"
                    className="w-full gap-2"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleWriteReview();
                    }}
                  >
                    <PenSquare className="w-4 h-4" />
                    독후감 작성
                  </Button>
                </SignedOut>
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
                </SignedIn>

                {/* 구분선 */}
                <div className="border-t border-stone-200 my-2" />

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

                {/* 모바일: 사용자 정보 */}
                <SignedIn>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-stone-600">로그인됨</span>
                    <UserButton afterSignOutUrl="/feed" />
                  </div>
                </SignedIn>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

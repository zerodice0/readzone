import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../ui/sheet';
import { UserSidebar } from './UserSidebar';

interface UserLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function UserLayout({ children, title }: UserLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* 데스크톱 사이드바 (lg 이상) */}
      <aside className="hidden lg:flex lg:w-60 lg:flex-col lg:fixed lg:inset-y-0 lg:top-16 lg:border-r lg:border-stone-200 lg:bg-white">
        <UserSidebar />
      </aside>

      {/* 메인 콘텐츠 영역 */}
      <main className="flex-1 lg:pl-60">
        {/* 모바일 헤더 (사이드바 트리거) */}
        <div className="lg:hidden sticky top-16 z-40 bg-white border-b border-stone-200 px-4 py-3 flex items-center gap-3">
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm">
                <Menu className="w-5 h-5" />
                <span className="sr-only">사이드바 열기</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <SheetHeader className="sr-only">
                <SheetTitle>사용자 메뉴</SheetTitle>
              </SheetHeader>
              <UserSidebar onNavigate={() => setIsSidebarOpen(false)} />
            </SheetContent>
          </Sheet>
          <h1 className="text-lg font-semibold text-stone-900">{title}</h1>
        </div>

        {/* 페이지 콘텐츠 */}
        <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}

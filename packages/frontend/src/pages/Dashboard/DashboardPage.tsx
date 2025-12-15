import { useState } from 'react';
import { useUser, UserProfile } from '@clerk/clerk-react';
import { Loader2, BarChart3, FileText, Bookmark, User } from 'lucide-react';
import EmailVerificationBanner from '../../components/EmailVerificationBanner';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../components/ui/tabs';
import { ReadingStatsSection } from './components/ReadingStatsSection';
import { MyReviewsSection } from './components/MyReviewsSection';
import { BookmarksSection } from './components/BookmarksSection';

/**
 * 대시보드 페이지
 * 모든 사용자 관련 기능을 탭으로 통합
 * - 독서 통계
 * - 내 독후감
 * - 북마크
 * - 계정 관리
 */
function DashboardPage() {
  const { user, isLoaded } = useUser();
  const [activeTab, setActiveTab] = useState('stats');

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
          <p className="text-stone-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Email Verification Banner */}
      {user && !user.primaryEmailAddress?.verification.status && (
        <EmailVerificationBanner />
      )}

      <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* 페이지 헤더 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-stone-900">대시보드</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* 탭 네비게이션 - 모바일에서도 가로 스크롤 가능 */}
          <TabsList className="w-full justify-start overflow-x-auto flex-nowrap mb-6 h-auto p-1">
            <TabsTrigger
              value="stats"
              className="flex items-center gap-2 whitespace-nowrap"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">독서 통계</span>
              <span className="sm:hidden">통계</span>
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="flex items-center gap-2 whitespace-nowrap"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">내 독후감</span>
              <span className="sm:hidden">독후감</span>
            </TabsTrigger>
            <TabsTrigger
              value="bookmarks"
              className="flex items-center gap-2 whitespace-nowrap"
            >
              <Bookmark className="w-4 h-4" />
              <span>북마크</span>
            </TabsTrigger>
            <TabsTrigger
              value="account"
              className="flex items-center gap-2 whitespace-nowrap"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">계정 관리</span>
              <span className="sm:hidden">계정</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stats">
            <ReadingStatsSection />
          </TabsContent>

          <TabsContent value="reviews">
            <MyReviewsSection />
          </TabsContent>

          <TabsContent value="bookmarks">
            <BookmarksSection />
          </TabsContent>

          <TabsContent value="account">
            <UserProfile
              routing="hash"
              appearance={{
                variables: {
                  colorPrimary: '#f97316',
                  colorBackground: '#ffffff',
                  colorText: '#1c1917',
                  colorTextSecondary: '#57534e',
                  borderRadius: '0.75rem',
                },
                elements: {
                  rootBox: 'w-full',
                  card: 'shadow-sm border border-stone-200 rounded-xl',
                  navbar: 'border-r border-stone-200',
                  navbarButton:
                    'text-stone-700 hover:text-primary-600 hover:bg-stone-50',
                  navbarButtonActive: 'text-primary-600 bg-primary-50',
                  pageScrollBox: 'p-6',
                  formButtonPrimary:
                    'bg-primary-600 hover:bg-primary-700 text-white rounded-lg',
                  formButtonReset:
                    'text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg',
                  formFieldInput:
                    'border-stone-300 focus:border-primary-500 focus:ring-primary-500 rounded-lg',
                  badge: 'bg-primary-100 text-primary-700',
                  avatarBox: 'rounded-full border-2 border-stone-200',
                },
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

export default DashboardPage;

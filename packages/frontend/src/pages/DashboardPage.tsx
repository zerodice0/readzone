import { useNavigate, Link } from 'react-router-dom';
import { useUser, useClerk } from '@clerk/clerk-react';
import { FileText, User, Settings, Shield } from 'lucide-react';
import EmailVerificationBanner from '../components/EmailVerificationBanner';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { logError } from '../utils/error';

/**
 * T109: DashboardPage
 * Main authenticated homepage for users
 */

function DashboardPage() {
  const { user } = useUser();
  const clerk = useClerk();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await clerk.signOut();
      navigate('/');
    } catch (error) {
      logError(error, 'Logout failed');
      // Even if logout fails, redirect to home
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* T107: Email Verification Banner */}
      {user && !user.primaryEmailAddress?.verification.status && <EmailVerificationBanner />}

      {/* Header */}
      <header className="bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-stone-900">
            ReadZone 대시보드
          </h1>
          <Button
            onClick={() => {
              void handleLogout();
            }}
            variant="outline"
            className="border-stone-300 text-stone-700 hover:bg-stone-100 hover:text-stone-900"
          >
            로그아웃
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* User Welcome */}
            <div className="bg-white border border-stone-200 shadow-sm rounded-xl p-6 sm:p-8 mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 mb-6">
                환영합니다, {user?.fullName || user?.firstName}님!
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-stone-200 rounded-xl p-6 bg-stone-50/50">
                  <div className="flex items-center gap-2 mb-4">
                    <User className="w-5 h-5 text-primary-500" />
                    <h3 className="font-semibold text-stone-900">
                      프로필 정보
                    </h3>
                  </div>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm text-stone-600">이메일</dt>
                      <dd className="text-sm font-medium text-stone-900 mt-1">
                        {user?.primaryEmailAddress?.emailAddress}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-stone-600">이름</dt>
                      <dd className="text-sm font-medium text-stone-900 mt-1">
                        {user?.fullName}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-stone-600">사용자 ID</dt>
                      <dd className="text-sm font-medium text-stone-900 mt-1 font-mono text-xs">
                        {user?.id}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-stone-600 mb-2">이메일 인증</dt>
                      <dd className="text-sm font-medium">
                        {user?.primaryEmailAddress?.verification.status === 'verified' ? (
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            ✓ 인증 완료
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                            ✗ 미인증
                          </Badge>
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-stone-600 mb-2">2단계 인증</dt>
                      <dd className="text-sm font-medium">
                        {user?.twoFactorEnabled ? (
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            ✓ 활성화
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-stone-100 text-stone-700 border-stone-200">
                            ✗ 비활성화
                          </Badge>
                        )}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="border border-stone-200 rounded-xl p-6 bg-stone-50/50">
                  <div className="flex items-center gap-2 mb-4">
                    <Settings className="w-5 h-5 text-primary-500" />
                    <h3 className="font-semibold text-stone-900">
                      빠른 작업
                    </h3>
                  </div>
                  <div className="space-y-2">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-stone-700 hover:bg-stone-100 hover:text-stone-900"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      독후감 작성하기
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-stone-700 hover:bg-stone-100 hover:text-stone-900"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      내 독후감 보기
                    </Button>
                    <Link to="/profile" className="block">
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-stone-700 hover:bg-stone-100 hover:text-stone-900"
                      >
                        <User className="w-4 h-4 mr-2" />
                        프로필 설정
                      </Button>
                    </Link>
                    <Link to="/sessions" className="block">
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-stone-700 hover:bg-stone-100 hover:text-stone-900"
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        활성 세션 관리
                      </Button>
                    </Link>
                    <Link to="/settings" className="block">
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-stone-700 hover:bg-stone-100 hover:text-stone-900"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        계정 설정
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Placeholder */}
            <div className="bg-white border border-stone-200 shadow-sm rounded-xl p-6 sm:p-8">
              <h3 className="text-lg font-semibold text-stone-900 mb-6">
                최근 활동
              </h3>
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-stone-400" />
                </div>
                <p className="text-stone-600 text-center">
                  아직 활동 내역이 없습니다. 첫 독후감을 작성해보세요!
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default DashboardPage;

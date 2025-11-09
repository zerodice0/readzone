import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import EmailVerificationBanner from '../components/EmailVerificationBanner';

/**
 * T109: DashboardPage
 * Main authenticated homepage for users
 */

function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout fails, redirect to login
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* T107: Email Verification Banner */}
      {user && !user.emailVerified && <EmailVerificationBanner />}

      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">
            ReadZone 대시보드
          </h1>
          <button
            onClick={handleLogout}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            로그아웃
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* User Welcome */}
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                환영합니다, {user?.name}님!
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-gray-700 mb-2">
                    프로필 정보
                  </h3>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm text-gray-500">이메일</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {user?.email}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">이름</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {user?.name}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">역할</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {user?.role === 'USER' ? '사용자' : user?.role}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">이메일 인증</dt>
                      <dd className="text-sm font-medium">
                        {user?.emailVerified ? (
                          <span className="text-green-600">✓ 인증 완료</span>
                        ) : (
                          <span className="text-yellow-600">✗ 미인증</span>
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">2단계 인증</dt>
                      <dd className="text-sm font-medium">
                        {user?.mfaEnabled ? (
                          <span className="text-green-600">✓ 활성화</span>
                        ) : (
                          <span className="text-gray-500">✗ 비활성화</span>
                        )}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-gray-700 mb-2">
                    빠른 작업
                  </h3>
                  <div className="space-y-2">
                    <button className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 text-sm text-gray-700">
                      독후감 작성하기
                    </button>
                    <button className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 text-sm text-gray-700">
                      내 독후감 보기
                    </button>
                    <Link
                      to="/profile"
                      className="block w-full text-left px-3 py-2 rounded hover:bg-gray-100 text-sm text-gray-700"
                    >
                      프로필 설정
                    </Link>
                    <Link
                      to="/sessions"
                      className="block w-full text-left px-3 py-2 rounded hover:bg-gray-100 text-sm text-gray-700"
                    >
                      활성 세션 관리
                    </Link>
                    <Link
                      to="/settings"
                      className="block w-full text-left px-3 py-2 rounded hover:bg-gray-100 text-sm text-gray-700"
                    >
                      계정 설정
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Placeholder */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                최근 활동
              </h3>
              <p className="text-gray-500 text-center py-8">
                아직 활동 내역이 없습니다. 첫 독후감을 작성해보세요!
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default DashboardPage;

import { useUser } from '@clerk/clerk-react';
import { Settings, Shield, Loader2 } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
// import EditProfileForm from '../components/EditProfileForm';

/**
 * T113: ProfilePage
 * User profile view and edit page
 */

function ProfilePage() {
  const { user } = useUser();
  // const [isEditing, setIsEditing] = useState(false);

  if (!user) {
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-stone-900">내 프로필</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Profile Card */}
          <div className="bg-white border border-stone-200 shadow-sm rounded-xl overflow-hidden">
            {/* Profile Header with Avatar */}
            <div className="bg-gradient-to-r from-amber-500 to-primary-500 px-6 sm:px-8 py-10">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                {/* Profile Image */}
                {user?.imageUrl ? (
                  <img
                    src={user.imageUrl}
                    alt={user.fullName || 'Profile'}
                    className="h-24 w-24 rounded-full shadow-lg ring-4 ring-white"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-full bg-white flex items-center justify-center text-primary-600 text-3xl font-bold shadow-lg ring-4 ring-white">
                    {(user?.fullName || user?.firstName || '?').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="text-white text-center sm:text-left">
                  <h2 className="text-2xl sm:text-3xl font-bold">{user?.fullName || user?.firstName}</h2>
                  <p className="text-amber-100 mt-1">{user?.primaryEmailAddress?.emailAddress}</p>
                </div>
              </div>
            </div>

            {/* Profile Details */}
            <div className="px-6 sm:px-8 py-8">
              {/* View Mode */}
              <div className="space-y-8">
                    {/* Basic Information Section */}
                    <div>
                      <h3 className="text-lg font-semibold text-stone-900 mb-6 pb-3 border-b border-stone-200">
                        기본 정보
                      </h3>
                      <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <dt className="text-sm font-medium text-stone-600">
                            이메일
                          </dt>
                          <dd className="mt-1.5 text-sm text-stone-900 font-medium">
                            {user?.primaryEmailAddress?.emailAddress}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-stone-600">
                            이름
                          </dt>
                          <dd className="mt-1.5 text-sm text-stone-900 font-medium">
                            {user?.fullName}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-stone-600">
                            사용자 ID
                          </dt>
                          <dd className="mt-1.5 text-sm text-stone-900 font-medium font-mono text-xs">
                            {user?.id}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-stone-600 mb-2">
                            이메일 인증 상태
                          </dt>
                          <dd>
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
                          <dt className="text-sm font-medium text-stone-600 mb-2">
                            2단계 인증
                          </dt>
                          <dd>
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

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-6 border-t border-stone-200">
                      <Button
                        disabled
                        variant="outline"
                        className="cursor-not-allowed opacity-50"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        프로필 수정 (준비 중)
                      </Button>
                    </div>
                  </div>
            </div>
          </div>

          {/* Additional Info Cards */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Security Card */}
            <div className="bg-white border border-stone-200 shadow-sm rounded-xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <Shield className="w-5 h-5 text-primary-500" />
                <h3 className="text-lg font-semibold text-stone-900">
                  보안 설정
                </h3>
              </div>
              <div className="space-y-2">
                <a href="/settings">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-stone-700 hover:bg-stone-100 hover:text-stone-900"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    계정 설정
                  </Button>
                </a>
                <a href="/sessions">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-stone-700 hover:bg-stone-100 hover:text-stone-900"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    활성 세션 관리
                  </Button>
                </a>
              </div>
            </div>

            {/* Activity Card */}
            <div className="bg-white border border-stone-200 shadow-sm rounded-xl p-6">
              <h3 className="text-lg font-semibold text-stone-900 mb-4">활동</h3>
              <p className="text-sm text-stone-600">
                최근 활동 내역이 여기에 표시됩니다.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ProfilePage;

import { useUser } from '@clerk/clerk-react';
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">내 프로필</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Profile Card */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {/* Profile Header with Avatar */}
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-8">
              <div className="flex items-center space-x-4">
                {/* Profile Image */}
                {user?.imageUrl ? (
                  <img
                    src={user.imageUrl}
                    alt={user.fullName || 'Profile'}
                    className="h-24 w-24 rounded-full shadow-lg"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-full bg-white flex items-center justify-center text-primary-600 text-3xl font-bold shadow-lg">
                    {(user?.fullName || user?.firstName || '?').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="text-white">
                  <h2 className="text-2xl font-bold">{user?.fullName || user?.firstName}</h2>
                  <p className="text-primary-100">{user?.primaryEmailAddress?.emailAddress}</p>
                </div>
              </div>
            </div>

            {/* Profile Details */}
            <div className="px-6 py-6">
              {/* View Mode */}
              <div className="space-y-6">
                    {/* Basic Information Section */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                        기본 정보
                      </h3>
                      <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">
                            이메일
                          </dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {user?.primaryEmailAddress?.emailAddress}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">
                            이름
                          </dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {user?.fullName}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">
                            사용자 ID
                          </dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {user?.id}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">
                            이메일 인증 상태
                          </dt>
                          <dd className="mt-1">
                            {user?.primaryEmailAddress?.verification.status === 'verified' ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                ✓ 인증 완료
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                ✗ 미인증
                              </span>
                            )}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">
                            2단계 인증
                          </dt>
                          <dd className="mt-1">
                            {user?.twoFactorEnabled ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                ✓ 활성화
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                ✗ 비활성화
                              </span>
                            )}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3 pt-4 border-t">
                      <button
                        disabled
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-400 cursor-not-allowed"
                      >
                        프로필 수정 (준비 중)
                      </button>
                    </div>
                  </div>
            </div>
          </div>

          {/* Additional Info Cards */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Security Card */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                보안 설정
              </h3>
              <div className="space-y-3">
                <a
                  href="/settings"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition"
                >
                  계정 설정
                </a>
                <a
                  href="/sessions"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition"
                >
                  활성 세션 관리
                </a>
              </div>
            </div>

            {/* Activity Card */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">활동</h3>
              <p className="text-sm text-gray-500">
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

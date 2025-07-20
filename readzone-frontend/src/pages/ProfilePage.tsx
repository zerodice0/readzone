import React from 'react';
import { useAuthStore } from '../stores/authStore';
import { User, Calendar, BookOpen, Edit, Smartphone } from 'lucide-react';
import Button from '../components/ui/Button';
import PWAStatus from '../components/pwa/PWAStatus';

const ProfilePage: React.FC = () => {
  const { user } = useAuthStore();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">사용자 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-8">
            <div className="flex items-center space-x-6">
              <div className="flex-shrink-0">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-10 h-10 text-blue-600" />
                  )}
                </div>
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">
                  {user.displayName || user.username}
                </h1>
                <p className="text-gray-600">@{user.username}</p>
                {user.bio && (
                  <p className="mt-2 text-gray-700">{user.bio}</p>
                )}
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>
                    {new Date(user.createdAt).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long'
                    })}에 가입
                  </span>
                </div>
              </div>
              <div className="flex-shrink-0">
                <Button variant="outline" className="flex items-center space-x-2">
                  <Edit className="w-4 h-4" />
                  <span>프로필 수정</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">읽은 책</p>
                <p className="text-2xl font-bold text-gray-900">0권</p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Edit className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">독서 기록</p>
                <p className="text-2xl font-bold text-gray-900">0개</p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <User className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">팔로워</p>
                <p className="text-2xl font-bold text-gray-900">0명</p>
              </div>
            </div>
          </div>
        </div>

        {/* PWA 상태 */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Smartphone className="w-5 h-5 mr-2 text-blue-600" />
              앱 설정
            </h3>
          </div>
          <div className="p-6">
            <PWAStatus />
          </div>
        </div>

        {/* Content Tabs */}
        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button className="border-b-2 border-blue-500 py-4 px-1 text-sm font-medium text-blue-600">
                독서 기록
              </button>
              <button className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700">
                내 서재
              </button>
              <button className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700">
                독서 목표
              </button>
            </nav>
          </div>

          <div className="p-6">
            <div className="text-center py-12">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-sm font-medium text-gray-900">
                아직 독서 기록이 없습니다
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                첫 번째 독서 기록을 작성해보세요!
              </p>
              <div className="mt-6">
                <Button>독서 기록 작성하기</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
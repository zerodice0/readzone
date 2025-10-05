import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { ReportsManagement } from './ReportsManagement'
import { UserManagement } from './UserManagement'

type TabType = 'reports' | 'users'

export function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabType>('reports')
  const { user, isAdmin, isModerator } = useAuthStore()

  if (!user || (!isAdmin() && !isModerator())) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            접근 권한이 없습니다
          </h2>
          <p className="text-gray-600">
            관리자 또는 중급 관리자 권한이 필요합니다.
          </p>
        </div>
      </div>
    )
  }

  const tabs = [
    {
      id: 'reports' as const,
      label: '신고 관리',
      description: '사용자 신고 검토 및 처리',
      requiredRole: 'MODERATOR',
    },
    {
      id: 'users' as const,
      label: '사용자 관리',
      description: '사용자 정지 및 위반 사항 관리',
      requiredRole: 'ADMIN',
    },
  ]

  // Filter tabs based on user role
  const availableTabs = tabs.filter((tab) => {
    if (tab.requiredRole === 'ADMIN') {
      return isAdmin()
    }

    return isModerator() || isAdmin()
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">관리자 패널</h1>
              <p className="text-gray-600 mt-1">
                ReadZone 커뮤니티 관리 대시보드
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <div className="text-sm text-gray-600">관리자</div>
                <div className="font-medium">{user.nickname}</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                {user.nickname[0]?.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {availableTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    pb-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${
                      activeTab === tab.id
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="flex flex-col items-start">
                    <span>{tab.label}</span>
                    <span className="text-xs font-normal text-gray-400 mt-0.5">
                      {tab.description}
                    </span>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {activeTab === 'reports' && <ReportsManagement />}
        {activeTab === 'users' && isAdmin() && <UserManagement />}
      </div>
    </div>
  )
}

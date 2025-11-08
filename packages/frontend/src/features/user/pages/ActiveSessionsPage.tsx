import { useState, useEffect } from 'react';
import apiClient from '../../../lib/api-client';
import SessionListItem from '../components/SessionListItem';

/**
 * T116: ActiveSessionsPage
 * Display and manage user's active sessions
 */

interface Session {
  id: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
  lastActivityAt: string;
  ipAddress: string;
  userAgent: string;
  deviceType: string;
  browser: string;
  os: string;
  current: boolean;
}

function ActiveSessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSessions = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await apiClient.get<{ sessions: Session[] }>(
        '/users/me/sessions'
      );
      setSessions(response.data.sessions);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as {
          response?: { data?: { message?: string } };
        };
        setError(
          axiosError.response?.data?.message ||
            '세션 목록을 불러오는데 실패했습니다'
        );
      } else {
        setError('세션 목록을 불러오는데 실패했습니다');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleLogoutSession = async (sessionId: string) => {
    try {
      await apiClient.delete(`/users/me/sessions/${sessionId}`);

      // Remove from list
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as {
          response?: { data?: { message?: string } };
        };
        setError(
          axiosError.response?.data?.message ||
            '세션 로그아웃에 실패했습니다'
        );
      } else {
        setError('세션 로그아웃에 실패했습니다');
      }
    }
  };

  const currentSession = sessions.find((s) => s.current);
  const otherSessions = sessions.filter((s) => !s.current);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">활성 세션 관리</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-blue-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm text-blue-700">
                  다른 기기에서 로그인한 세션을 확인하고 로그아웃할 수 있습니다.
                  의심스러운 세션이 있다면 즉시 로그아웃하세요.
                </p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"></div>
              <p className="mt-2 text-gray-500">세션 목록 로딩 중...</p>
            </div>
          ) : (
            <>
              {/* Current Session */}
              {currentSession && (
                <div className="mb-8">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    현재 세션
                  </h2>
                  <div className="bg-white shadow rounded-lg">
                    <SessionListItem
                      session={currentSession}
                      isCurrent={true}
                      onLogout={handleLogoutSession}
                    />
                  </div>
                </div>
              )}

              {/* Other Sessions */}
              {otherSessions.length > 0 ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                      다른 세션 ({otherSessions.length})
                    </h2>
                  </div>
                  <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
                    {otherSessions.map((session) => (
                      <SessionListItem
                        key={session.id}
                        session={session}
                        isCurrent={false}
                        onLogout={handleLogoutSession}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white shadow rounded-lg p-8 text-center">
                  <p className="text-gray-500">다른 활성 세션이 없습니다</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default ActiveSessionsPage;

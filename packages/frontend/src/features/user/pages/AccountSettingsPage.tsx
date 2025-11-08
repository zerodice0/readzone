import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../../lib/api-client';
import { useAuth } from '../../../lib/auth-context';
import ConfirmDialog from '../components/ConfirmDialog';

/**
 * T119: AccountSettingsPage
 * T120: Confirmation dialogs
 * Account management page with MFA toggle and account deletion
 */

function AccountSettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const [mfaError, setMfaError] = useState('');
  const [mfaSuccess, setMfaSuccess] = useState('');
  const [isMfaLoading, setIsMfaLoading] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      setDeleteError('비밀번호를 입력하세요');
      return;
    }

    setIsDeleting(true);
    setDeleteError('');

    try {
      await apiClient.delete('/users/me', {
        data: { password: deletePassword },
      });

      // Logout and redirect
      await logout();
      navigate('/login');
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as {
          response?: { data?: { message?: string } };
        };
        setDeleteError(
          axiosError.response?.data?.message ||
            '계정 삭제에 실패했습니다. 비밀번호를 확인하세요.'
        );
      } else {
        setDeleteError('계정 삭제에 실패했습니다. 비밀번호를 확인하세요.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMfaToggle = async () => {
    setIsMfaLoading(true);
    setMfaError('');
    setMfaSuccess('');

    try {
      if (user.mfaEnabled) {
        // Disable MFA
        await apiClient.post('/users/me/mfa/disable');
        setMfaSuccess('2단계 인증이 비활성화되었습니다');
      } else {
        // Redirect to MFA setup page
        navigate('/settings/mfa/setup');
        return;
      }
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as {
          response?: { data?: { message?: string } };
        };
        setMfaError(
          axiosError.response?.data?.message ||
            'MFA 설정 변경에 실패했습니다'
        );
      } else {
        setMfaError('MFA 설정 변경에 실패했습니다');
      }
    } finally {
      setIsMfaLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">계정 설정</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          {/* Security Settings Card */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">보안 설정</h2>
            </div>
            <div className="px-6 py-6 space-y-6">
              {/* MFA Setting */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900">
                    2단계 인증 (MFA)
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    로그인 시 추가 인증 단계를 통해 계정을 보호합니다
                  </p>
                  {user.mfaEnabled && (
                    <span className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      활성화됨
                    </span>
                  )}
                </div>
                <button
                  onClick={handleMfaToggle}
                  disabled={isMfaLoading}
                  className={`ml-4 inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                    user.mfaEnabled
                      ? 'border-red-300 text-red-700 bg-white hover:bg-red-50'
                      : 'border-transparent text-white bg-primary-600 hover:bg-primary-700'
                  } disabled:bg-gray-400 disabled:cursor-not-allowed`}
                >
                  {isMfaLoading
                    ? '처리 중...'
                    : user.mfaEnabled
                      ? 'MFA 비활성화'
                      : 'MFA 활성화'}
                </button>
              </div>

              {mfaSuccess && (
                <div
                  className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded"
                  role="alert"
                >
                  {mfaSuccess}
                </div>
              )}

              {mfaError && (
                <div
                  className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded"
                  role="alert"
                >
                  {mfaError}
                </div>
              )}

              {/* Password Change */}
              <div className="flex items-center justify-between pt-6 border-t">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900">
                    비밀번호 변경
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    정기적으로 비밀번호를 변경하여 보안을 강화하세요
                  </p>
                </div>
                <button
                  onClick={() => navigate('/settings/password')}
                  className="ml-4 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  비밀번호 변경
                </button>
              </div>

              {/* Active Sessions */}
              <div className="flex items-center justify-between pt-6 border-t">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900">활성 세션</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    다른 기기에서 로그인한 세션을 관리합니다
                  </p>
                </div>
                <button
                  onClick={() => navigate('/sessions')}
                  className="ml-4 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  세션 관리
                </button>
              </div>
            </div>
          </div>

          {/* Danger Zone Card */}
          <div className="bg-white shadow rounded-lg overflow-hidden border-2 border-red-200">
            <div className="px-6 py-4 bg-red-50 border-b border-red-200">
              <h2 className="text-lg font-semibold text-red-900">위험 구역</h2>
            </div>
            <div className="px-6 py-6">
              {/* Account Deletion */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900">
                    계정 삭제
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    계정을 영구적으로 삭제합니다. 이 작업은 되돌릴 수 없습니다.
                  </p>
                  <p className="mt-2 text-sm text-red-600 font-medium">
                    ⚠️ 모든 데이터가 삭제되며 복구할 수 없습니다
                  </p>
                </div>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="ml-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  계정 삭제
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <ConfirmDialog
          title="계정 삭제 확인"
          message="정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없으며, 모든 데이터가 영구적으로 삭제됩니다."
          confirmText="계정 삭제"
          confirmButtonClass="bg-red-600 hover:bg-red-700 focus:ring-red-500"
          onConfirm={handleDeleteAccount}
          onCancel={() => {
            setShowDeleteConfirm(false);
            setDeletePassword('');
            setDeleteError('');
          }}
          isLoading={isDeleting}
        >
          {/* Password Input */}
          <div className="mt-4">
            <label
              htmlFor="delete-password"
              className="block text-sm font-medium text-gray-700"
            >
              비밀번호 확인
            </label>
            <input
              type="password"
              id="delete-password"
              value={deletePassword}
              onChange={(e) => {
                setDeletePassword(e.target.value);
                setDeleteError('');
              }}
              placeholder="비밀번호를 입력하세요"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
            />
            {deleteError && (
              <p className="mt-2 text-sm text-red-600">{deleteError}</p>
            )}
          </div>
        </ConfirmDialog>
      )}
    </div>
  );
}

export default AccountSettingsPage;

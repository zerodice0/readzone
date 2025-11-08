import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../lib/auth-context';

/**
 * T123: OAuthCallbackPage
 * Handles OAuth callback from Google/GitHub
 * Parses URL params (code, state) and exchanges for JWT token
 */

function OAuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setToken } = useAuth();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const handleOAuthCallback = () => {
      try {
        // OAuth 콜백에서 받은 파라미터
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        // 에러가 있는 경우
        if (error) {
          setStatus('error');
          setErrorMessage(
            errorDescription || 'OAuth 인증에 실패했습니다. 다시 시도해주세요.'
          );
          return;
        }

        // code가 없는 경우
        if (!code) {
          setStatus('error');
          setErrorMessage('잘못된 OAuth 콜백입니다. 다시 시도해주세요.');
          return;
        }

        // Backend OAuth 콜백 엔드포인트는 자체적으로 JWT를 생성하고 리다이렉트합니다.
        // 이 페이지는 백엔드에서 리다이렉트된 후 JWT를 URL에서 받아 저장하는 역할입니다.
        // 백엔드에서 OAuth 콜백 처리 후 /oauth/callback?token=xxx 형태로 리다이렉트합니다.
        const token = searchParams.get('token');

        if (token) {
          // JWT 토큰을 localStorage에 저장
          setToken(token);
          setStatus('success');

          // 잠시 후 대시보드로 이동
          void setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 1000);
        } else {
          // 토큰이 없으면 에러
          setStatus('error');
          setErrorMessage('인증 토큰을 받지 못했습니다. 다시 시도해주세요.');
        }
      } catch (error) {
        // Error logging for debugging
        setStatus('error');
        setErrorMessage('OAuth 인증 처리 중 오류가 발생했습니다.');
      }
    };

    handleOAuthCallback();
  }, [searchParams, setToken, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto" />
              <h2 className="mt-6 text-2xl font-bold text-gray-900">로그인 처리 중...</h2>
              <p className="mt-2 text-sm text-gray-600">잠시만 기다려주세요.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <svg
                className="mx-auto h-12 w-12 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <h2 className="mt-6 text-2xl font-bold text-gray-900">로그인 성공!</h2>
              <p className="mt-2 text-sm text-gray-600">
                대시보드로 이동합니다...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <svg
                className="mx-auto h-12 w-12 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              <h2 className="mt-6 text-2xl font-bold text-gray-900">로그인 실패</h2>
              <p className="mt-2 text-sm text-gray-600">{errorMessage}</p>
              <div className="mt-6">
                <button
                  onClick={() => navigate('/login')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  로그인 페이지로 돌아가기
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default OAuthCallbackPage;

import { useNavigate } from '@tanstack/react-router'

interface FullPageAuthErrorProps {
  className?: string
}

/**
 * 전체 화면 인증 에러 컴포넌트
 * 로그인하지 않은 사용자가 settings 페이지 접근 시 표시
 */
export function FullPageAuthError({ className }: FullPageAuthErrorProps) {
  const navigate = useNavigate()

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center ${className}`}>
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* 아이콘 */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/20 mb-6">
            <svg
              className="h-8 w-8 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>

          {/* 제목 */}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            로그인이 필요합니다
          </h1>

          {/* 설명 */}
          <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
            설정 페이지에 접근하려면 먼저 로그인해주세요.
          </p>

          {/* 버튼들 */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => window.location.href = '/login'}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              로그인하기
            </button>

            <button
              type="button"
              onClick={() => navigate({ to: '/' })}
              className="w-full flex justify-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              홈으로 돌아가기
            </button>
          </div>

          {/* 부가 정보 */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              계정이 없으신가요?{' '}
              <button
                type="button"
                onClick={() => window.location.href = '/register'}
                className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors"
              >
                회원가입하기
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FullPageAuthError
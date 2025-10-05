interface FullPageLoadingProps {
  className?: string
}

/**
 * 전체 화면 로딩 컴포넌트
 * 설정 데이터 로드 중일 때 표시
 */
export function FullPageLoading({ className }: FullPageLoadingProps) {
  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center ${className}`}>
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* 로딩 스피너 */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/20 mb-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
          </div>

          {/* 제목 */}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            설정을 불러오는 중...
          </h1>

          {/* 설명 */}
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            잠시만 기다려주세요.
          </p>

          {/* 진행 바 (선택사항) */}
          <div className="mt-8 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FullPageLoading
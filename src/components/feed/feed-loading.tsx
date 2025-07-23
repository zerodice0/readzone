import { Card, CardContent } from '@/components/ui'

export function FeedLoading(): JSX.Element {
  return (
    <div className="space-y-6">
      {[...Array(3)].map((_, index) => (
        <Card key={index} className="w-full">
          <CardContent className="p-6">
            {/* 사용자 정보 스켈레톤 */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-16 animate-pulse" />
                </div>
              </div>
              <div className="h-6 bg-gray-200 rounded-full w-16 animate-pulse" />
            </div>

            {/* 도서 정보 스켈레톤 */}
            <div className="flex space-x-4 mb-4">
              <div className="w-15 h-20 bg-gray-200 rounded-md animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
              </div>
            </div>

            {/* 제목 스켈레톤 */}
            <div className="h-6 bg-gray-200 rounded w-2/3 mb-3 animate-pulse" />

            {/* 내용 스켈레톤 */}
            <div className="space-y-2 mb-4">
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
            </div>

            {/* 액션 버튼 스켈레톤 */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center space-x-6">
                <div className="h-8 bg-gray-200 rounded w-12 animate-pulse" />
                <div className="h-8 bg-gray-200 rounded w-12 animate-pulse" />
                <div className="h-8 bg-gray-200 rounded w-12 animate-pulse" />
              </div>
              <div className="h-8 bg-gray-200 rounded w-16 animate-pulse" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
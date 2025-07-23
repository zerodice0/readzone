import { Card } from '@/components/ui/card'

interface LoadingSkeletonProps {
  type: 'book-detail' | 'opinion-list' | 'review-list'
  count?: number
  className?: string
}

function BookDetailSkeleton() {
  return (
    <div className="container max-w-6xl mx-auto px-4 py-6" role="status" aria-label="도서 정보 로딩 중">
      <div className="animate-pulse space-y-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-48 h-64 bg-gray-200 rounded-lg mx-auto lg:mx-0"></div>
          <div className="flex-1 space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="flex gap-2">
              <div className="h-6 bg-gray-200 rounded w-20"></div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="flex gap-3">
              <div className="h-10 bg-gray-200 rounded w-32"></div>
              <div className="h-10 bg-gray-200 rounded w-28"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function OpinionListSkeleton({ count = 3 }: { count: number }) {
  return (
    <div className="space-y-4" role="status" aria-label="의견 목록 로딩 중">
      <Card className="p-4">
        <div className="animate-pulse flex justify-between">
          <div className="flex gap-6">
            <div className="text-center">
              <div className="h-8 w-8 bg-gray-200 rounded"></div>
              <div className="h-3 w-12 bg-gray-200 rounded mt-1"></div>
            </div>
            <div className="text-center">
              <div className="h-8 w-8 bg-gray-200 rounded"></div>
              <div className="h-3 w-8 bg-gray-200 rounded mt-1"></div>
            </div>
            <div className="text-center">
              <div className="h-8 w-8 bg-gray-200 rounded"></div>
              <div className="h-3 w-10 bg-gray-200 rounded mt-1"></div>
            </div>
          </div>
          <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
        </div>
      </Card>
      
      {[...Array(count)].map((_, index) => (
        <Card key={index} className="p-4">
          <div className="animate-pulse">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-3 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

function ReviewListSkeleton({ count = 3 }: { count: number }) {
  return (
    <div className="space-y-6" role="status" aria-label="독후감 목록 로딩 중">
      <Card className="p-4">
        <div className="animate-pulse flex justify-between">
          <div className="flex gap-6">
            <div className="text-center">
              <div className="h-8 w-8 bg-gray-200 rounded"></div>
              <div className="h-3 w-16 bg-gray-200 rounded mt-1"></div>
            </div>
            <div className="text-center">
              <div className="h-8 w-8 bg-gray-200 rounded"></div>
              <div className="h-3 w-8 bg-gray-200 rounded mt-1"></div>
            </div>
            <div className="text-center">
              <div className="h-8 w-8 bg-gray-200 rounded"></div>
              <div className="h-3 w-10 bg-gray-200 rounded mt-1"></div>
            </div>
          </div>
          <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
        </div>
      </Card>
      
      {[...Array(count)].map((_, index) => (
        <Card key={index} className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
            <div className="h-5 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/5"></div>
            </div>
            <div className="flex gap-2">
              <div className="h-5 bg-gray-200 rounded w-12"></div>
              <div className="h-5 bg-gray-200 rounded w-16"></div>
              <div className="h-5 bg-gray-200 rounded w-14"></div>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <div className="flex gap-4">
                <div className="h-4 bg-gray-200 rounded w-16"></div>
                <div className="h-4 bg-gray-200 rounded w-12"></div>
              </div>
              <div className="h-8 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

export function LoadingSkeleton({ type, count = 3, className = "" }: LoadingSkeletonProps) {
  const skeletonContent = {
    'book-detail': <BookDetailSkeleton />,
    'opinion-list': <OpinionListSkeleton count={count} />,
    'review-list': <ReviewListSkeleton count={count} />
  }

  return (
    <div className={className}>
      {skeletonContent[type]}
    </div>
  )
}
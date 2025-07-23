import { Card, CardContent } from '@/components/ui'
import { cn } from '@/lib/utils'

interface ServiceIntroProps {
  className?: string
}

export function ServiceIntro({ className }: ServiceIntroProps): JSX.Element {
  const features = [
    {
      icon: '📚',
      title: '독후감 공유',
      description: '읽은 책에 대한 생각과 감상을 자유롭게 공유하세요',
    },
    {
      icon: '💬',
      title: '도서 의견',
      description: '280자로 간단하게 책에 대한 의견을 남겨보세요',
    },
    {
      icon: '👥',
      title: '독서 커뮤니티',
      description: '같은 책을 읽은 사람들과 소통하고 교류하세요',
    },
    {
      icon: '🔍',
      title: '도서 검색',
      description: '다양한 도서를 검색하고 다른 사람들의 리뷰를 확인하세요',
    },
  ]

  return (
    <div className={cn('flex flex-col justify-center h-full', className)}>
      {/* 메인 타이틀 */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          ReadZone
        </h1>
        <p className="text-xl text-gray-600 mb-2">
          독서 후 생각을 나누는 공간
        </p>
        <p className="text-gray-500">
          책을 읽고 느낀 감정과 생각을 다른 독서가들과 함께 나눠보세요
        </p>
      </div>

      {/* 기능 소개 */}
      <div className="space-y-4">
        {features.map((feature, index) => (
          <Card key={index} className="p-4 hover:shadow-md transition-shadow">
            <CardContent className="p-0">
              <div className="flex items-start space-x-3">
                <div className="text-2xl">{feature.icon}</div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {feature.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 추가 정보 */}
      <div className="mt-8 p-4 bg-primary-50 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-primary-500">✨</span>
          <span className="font-medium text-primary-700">
            ReadZone과 함께 시작하세요
          </span>
        </div>
        <p className="text-sm text-primary-600">
          무료로 가입하고 독서의 즐거움을 다른 사람들과 함께 나누세요. 
          새로운 책 추천도 받아볼 수 있어요!
        </p>
      </div>
    </div>
  )
}
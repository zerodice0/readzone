import Link from 'next/link'
import { DemoContainer } from '@/components/design-system/demo-container'

interface QuickLink {
  title: string
  description: string
  href: string
  icon: string
}

const quickLinks: QuickLink[] = [
  {
    title: '컬러 시스템',
    description: '브랜드 컬러와 시맨틱 컬러 팔레트',
    href: '/design-system/colors',
    icon: '🎨'
  },
  {
    title: '타이포그래피',
    description: '폰트 스케일과 텍스트 스타일',
    href: '/design-system/typography',
    icon: '✏️'
  },
  {
    title: '컴포넌트',
    description: '재사용 가능한 UI 컴포넌트',
    href: '/design-system/components',
    icon: '🧩'
  },
  {
    title: '레이아웃',
    description: '페이지 구조와 그리드 시스템',
    href: '/design-system/layouts',
    icon: '📐'
  },
  {
    title: '인터랙션 패턴',
    description: '일관된 사용자 경험을 위한 패턴',
    href: '/design-system/patterns',
    icon: '✨'
  }
]

interface DesignPrinciple {
  title: string
  description: string
}

const designPrinciples: DesignPrinciple[] = [
  {
    title: '일관성',
    description: '모든 페이지와 컴포넌트에서 동일한 디자인 언어를 사용하여 사용자가 예측 가능한 경험을 할 수 있도록 합니다.'
  },
  {
    title: '접근성',
    description: '모든 사용자가 콘텐츠에 접근할 수 있도록 WCAG 2.1 AA 기준을 준수합니다.'
  },
  {
    title: '반응형',
    description: '다양한 디바이스와 화면 크기에서 최적의 경험을 제공합니다.'
  },
  {
    title: '성능',
    description: '빠른 로딩과 부드러운 인터랙션으로 사용자 경험을 향상시킵니다.'
  }
]

export default function DesignSystemPage(): JSX.Element {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          디자인 시스템 개요
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          ReadZone의 디자인 시스템은 일관되고 효율적인 사용자 경험을 제공하기 위한 
          가이드라인과 리소스의 모음입니다. 이 시스템을 통해 개발자와 디자이너가 
          빠르고 일관되게 제품을 만들 수 있습니다.
        </p>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          빠른 시작
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
            >
              <div className="flex items-start space-x-3">
                <span className="text-2xl">{link.icon}</span>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    {link.title}
                  </h4>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {link.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <DemoContainer
        title="디자인 원칙"
        description="ReadZone 디자인 시스템의 핵심 원칙"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {designPrinciples.map((principle, index) => (
            <div key={index} className="space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                {principle.title}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {principle.description}
              </p>
            </div>
          ))}
        </div>
      </DemoContainer>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          기술 스택
        </h3>
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <ul>
            <li><strong>프레임워크:</strong> Next.js 14+ (App Router)</li>
            <li><strong>스타일링:</strong> Tailwind CSS</li>
            <li><strong>컴포넌트:</strong> Radix UI (Headless Components)</li>
            <li><strong>타입스크립트:</strong> Strict Mode 활성화</li>
            <li><strong>다크 모드:</strong> 시스템 설정 연동 지원</li>
          </ul>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
          참고사항
        </h3>
        <p className="text-sm text-blue-800 dark:text-blue-200">
          이 디자인 시스템은 지속적으로 발전하고 있습니다. 새로운 컴포넌트나 패턴이 
          필요한 경우, 기존 시스템과의 일관성을 유지하면서 추가해주세요.
        </p>
      </div>
    </div>
  )
}
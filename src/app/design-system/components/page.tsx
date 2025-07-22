'use client'

import { useState } from 'react'
import { DemoContainer } from '@/components/design-system/demo-container'
import { CodePreview } from '@/components/design-system/code-preview'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

export default function ComponentsPage(): JSX.Element {
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLoadingClick = (): void => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 2000)
  }

  const buttonCode = `// Button 컴포넌트 사용
import { Button } from '@/components/ui/button'

// 기본 버튼
<Button>기본 버튼</Button>

// 변형 (Variants)
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="danger">Danger</Button>

// 크기
<Button size="sm">작은 버튼</Button>
<Button size="md">중간 버튼</Button>
<Button size="lg">큰 버튼</Button>

// 상태
<Button disabled>비활성화</Button>
<Button loading>로딩중...</Button>`

  const inputCode = `// Input 컴포넌트 사용
import { Input } from '@/components/ui/input'

// 기본 입력
<Input placeholder="텍스트를 입력하세요" />

// 타입
<Input type="email" placeholder="이메일" />
<Input type="password" placeholder="비밀번호" />
<Input type="search" placeholder="검색어" />

// 상태
<Input disabled placeholder="비활성화" />
<Input error placeholder="오류 상태" />

// 크기
<Input size="sm" placeholder="작은 입력" />
<Input size="md" placeholder="중간 입력" />
<Input size="lg" placeholder="큰 입력" />`

  const cardCode = `// Card 컴포넌트 사용
import { Card } from '@/components/ui/card'

// 기본 카드
<Card>
  <h3 className="font-semibold">카드 제목</h3>
  <p className="text-gray-600">카드 내용</p>
</Card>

// 패딩 옵션
<Card padding="sm">작은 패딩</Card>
<Card padding="md">중간 패딩</Card>
<Card padding="lg">큰 패딩</Card>

// 호버 효과
<Card hoverable>
  호버 시 그림자 효과
</Card>`

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          컴포넌트
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          ReadZone에서 사용하는 재사용 가능한 UI 컴포넌트들입니다. 
          모든 컴포넌트는 접근성을 고려하여 제작되었으며 다크 모드를 지원합니다.
        </p>
      </div>

      {/* Button Component */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Button
        </h3>
        
        <DemoContainer title="버튼 변형">
          <div className="flex flex-wrap gap-3">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
          </div>
        </DemoContainer>

        <DemoContainer title="버튼 크기">
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">작은 버튼</Button>
            <Button size="md">중간 버튼</Button>
            <Button size="lg">큰 버튼</Button>
          </div>
        </DemoContainer>

        <DemoContainer title="버튼 상태">
          <div className="flex flex-wrap gap-3">
            <Button disabled>비활성화</Button>
            <Button loading={isLoading} onClick={handleLoadingClick}>
              {isLoading ? '로딩중...' : '클릭하여 로딩'}
            </Button>
          </div>
        </DemoContainer>

        <CodePreview code={buttonCode} language="tsx" />
      </div>

      {/* Input Component */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Input
        </h3>
        
        <DemoContainer title="입력 필드 타입">
          <div className="space-y-3 max-w-md">
            <Input 
              placeholder="텍스트를 입력하세요" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <Input type="email" placeholder="이메일" />
            <Input type="password" placeholder="비밀번호" />
            <Input type="search" placeholder="검색어를 입력하세요" />
          </div>
        </DemoContainer>

        <DemoContainer title="입력 필드 크기">
          <div className="space-y-3 max-w-md">
            <Input size="sm" placeholder="작은 입력 필드" />
            <Input size="md" placeholder="중간 입력 필드" />
            <Input size="lg" placeholder="큰 입력 필드" />
          </div>
        </DemoContainer>

        <DemoContainer title="입력 필드 상태">
          <div className="space-y-3 max-w-md">
            <Input disabled placeholder="비활성화된 입력 필드" />
            <Input error placeholder="오류 상태 입력 필드" />
          </div>
        </DemoContainer>

        <CodePreview code={inputCode} language="tsx" />
      </div>

      {/* Card Component */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Card
        </h3>
        
        <DemoContainer title="카드 스타일">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <h4 className="font-semibold mb-2">기본 카드</h4>
              <p className="text-gray-600 dark:text-gray-400">
                기본 스타일의 카드 컴포넌트입니다.
              </p>
            </Card>
            <Card hoverable>
              <h4 className="font-semibold mb-2">호버 카드</h4>
              <p className="text-gray-600 dark:text-gray-400">
                마우스를 올리면 그림자가 나타납니다.
              </p>
            </Card>
          </div>
        </DemoContainer>

        <DemoContainer title="카드 패딩">
          <div className="space-y-4">
            <Card padding="sm">
              <div className="text-sm">작은 패딩 (12px)</div>
            </Card>
            <Card padding="md">
              <div className="text-sm">중간 패딩 (16px)</div>
            </Card>
            <Card padding="lg">
              <div className="text-sm">큰 패딩 (24px)</div>
            </Card>
          </div>
        </DemoContainer>

        <CodePreview code={cardCode} language="tsx" />
      </div>

      {/* Component Guidelines */}
      <DemoContainer
        title="컴포넌트 사용 가이드라인"
        description="일관된 사용자 경험을 위한 권장사항"
      >
        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
              일관성
            </h4>
            <ul className="space-y-1">
              <li>• 동일한 기능에는 동일한 컴포넌트 변형 사용</li>
              <li>• 페이지 내에서 일관된 크기와 스타일 유지</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
              접근성
            </h4>
            <ul className="space-y-1">
              <li>• 모든 인터랙티브 요소에 적절한 레이블 제공</li>
              <li>• 키보드 탐색 지원 확인</li>
              <li>• 충분한 클릭 영역 확보 (최소 44x44px)</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
              피드백
            </h4>
            <ul className="space-y-1">
              <li>• 사용자 액션에 즉각적인 시각적 피드백 제공</li>
              <li>• 로딩 상태 명확히 표시</li>
              <li>• 오류 상태와 해결 방법 안내</li>
            </ul>
          </div>
        </div>
      </DemoContainer>
    </div>
  )
}
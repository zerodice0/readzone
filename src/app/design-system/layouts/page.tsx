import { DemoContainer } from '@/components/design-system/demo-container'
import { CodePreview } from '@/components/design-system/code-preview'

export default function LayoutsPage(): JSX.Element {
  const containerCode = `// 컨테이너 레이아웃
<div className="container mx-auto px-4">
  {/* 최대 너비 1280px, 좌우 패딩 16px */}
</div>

// 섹션별 컨테이너
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  {/* 반응형 패딩 */}
</div>

// 좁은 컨테이너 (글 읽기용)
<div className="max-w-4xl mx-auto px-4">
  {/* 최적 읽기 너비 */}
</div>`

  const gridCode = `// 기본 그리드
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <div>아이템 1</div>
  <div>아이템 2</div>
  <div>아이템 3</div>
</div>

// 사이드바 레이아웃
<div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
  <aside>사이드바</aside>
  <main>메인 콘텐츠</main>
</div>

// 비대칭 그리드
<div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
  <div>주요 콘텐츠</div>
  <div>보조 콘텐츠</div>
</div>`

  const flexCode = `// 수평 정렬
<div className="flex items-center justify-between">
  <div>왼쪽</div>
  <div>오른쪽</div>
</div>

// 수직 스택
<div className="flex flex-col space-y-4">
  <div>항목 1</div>
  <div>항목 2</div>
  <div>항목 3</div>
</div>

// 반응형 플렉스
<div className="flex flex-col md:flex-row gap-4">
  <div className="flex-1">콘텐츠 1</div>
  <div className="flex-1">콘텐츠 2</div>
</div>`

  const pageStructureCode = `// 전체 페이지 구조
<div className="min-h-screen bg-white dark:bg-gray-950">
  {/* 헤더 */}
  <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b">
    <div className="container mx-auto px-4 h-16 flex items-center">
      {/* 헤더 콘텐츠 */}
    </div>
  </header>

  {/* 메인 콘텐츠 */}
  <main className="container mx-auto px-4 py-8">
    {/* 페이지별 콘텐츠 */}
  </main>

  {/* 푸터 */}
  <footer className="bg-gray-50 dark:bg-gray-900 border-t">
    <div className="container mx-auto px-4 py-8">
      {/* 푸터 콘텐츠 */}
    </div>
  </footer>
</div>`

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          레이아웃 시스템
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          ReadZone의 레이아웃 시스템은 일관된 페이지 구조와 반응형 디자인을 제공합니다.
          Tailwind CSS의 유틸리티 클래스를 활용하여 유연하고 확장 가능한 레이아웃을 구성합니다.
        </p>
      </div>

      {/* Container System */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          컨테이너 시스템
        </h3>
        <DemoContainer title="컨테이너 너비">
          <div className="space-y-4">
            <div className="bg-blue-100 dark:bg-blue-900/20 p-4 rounded">
              <div className="text-sm font-mono mb-2">container (max-w-7xl)</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                기본 컨테이너 - 최대 1280px
              </div>
            </div>
            <div className="max-w-4xl mx-auto bg-green-100 dark:bg-green-900/20 p-4 rounded">
              <div className="text-sm font-mono mb-2">max-w-4xl</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                콘텐츠 읽기용 - 최대 896px
              </div>
            </div>
            <div className="max-w-2xl mx-auto bg-purple-100 dark:bg-purple-900/20 p-4 rounded">
              <div className="text-sm font-mono mb-2">max-w-2xl</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                폼/모달용 - 최대 672px
              </div>
            </div>
          </div>
        </DemoContainer>
        <CodePreview code={containerCode} language="tsx" />
      </div>

      {/* Grid System */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          그리드 시스템
        </h3>
        <DemoContainer title="반응형 그리드">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-center"
              >
                아이템 {item}
              </div>
            ))}
          </div>
        </DemoContainer>
        <DemoContainer title="사이드바 레이아웃">
          <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-4 h-40">
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded">
              사이드바
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded">
              메인 콘텐츠
            </div>
          </div>
        </DemoContainer>
        <CodePreview code={gridCode} language="tsx" />
      </div>

      {/* Flexbox Layouts */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          플렉스박스 레이아웃
        </h3>
        <DemoContainer title="정렬 패턴">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded">
              <div>왼쪽 정렬</div>
              <div>오른쪽 정렬</div>
            </div>
            <div className="flex items-center justify-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded">
              <div>중앙</div>
              <div>정렬</div>
              <div>아이템</div>
            </div>
            <div className="flex items-center justify-around p-4 bg-gray-50 dark:bg-gray-800 rounded">
              <div>균등</div>
              <div>분배</div>
              <div>정렬</div>
            </div>
          </div>
        </DemoContainer>
        <CodePreview code={flexCode} language="tsx" />
      </div>

      {/* Page Structure */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          페이지 구조
        </h3>
        <DemoContainer title="기본 페이지 레이아웃">
          <div className="h-96 flex flex-col bg-gray-50 dark:bg-gray-900 rounded overflow-hidden">
            <div className="h-16 bg-white dark:bg-gray-800 border-b flex items-center px-4">
              헤더
            </div>
            <div className="flex-1 p-4 overflow-auto">
              메인 콘텐츠 영역
            </div>
            <div className="h-20 bg-gray-100 dark:bg-gray-800 border-t flex items-center px-4">
              푸터
            </div>
          </div>
        </DemoContainer>
        <CodePreview code={pageStructureCode} language="tsx" />
      </div>

      {/* Spacing System */}
      <DemoContainer
        title="여백 시스템"
        description="일관된 여백 사용을 위한 가이드"
      >
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
              기본 여백 단위
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div className="text-center">
                <div className="h-4 w-4 bg-blue-500 mx-auto mb-1"></div>
                <div>4px (1)</div>
              </div>
              <div className="text-center">
                <div className="h-8 w-8 bg-blue-500 mx-auto mb-1"></div>
                <div>8px (2)</div>
              </div>
              <div className="text-center">
                <div className="h-16 w-16 bg-blue-500 mx-auto mb-1"></div>
                <div>16px (4)</div>
              </div>
              <div className="text-center">
                <div className="h-24 w-24 bg-blue-500 mx-auto mb-1"></div>
                <div>24px (6)</div>
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
              사용 가이드
            </h4>
            <ul className="space-y-1">
              <li>• 컴포넌트 내부: 8-16px</li>
              <li>• 컴포넌트 간격: 16-24px</li>
              <li>• 섹션 간격: 32-48px</li>
              <li>• 페이지 패딩: 16-32px</li>
            </ul>
          </div>
        </div>
      </DemoContainer>

      {/* Responsive Design */}
      <DemoContainer
        title="반응형 디자인 브레이크포인트"
        description="Tailwind CSS 기본 브레이크포인트"
      >
        <div className="space-y-2 text-sm">
          <div className="flex items-center space-x-4">
            <span className="font-mono font-medium w-12">sm</span>
            <span className="text-gray-600 dark:text-gray-400">640px 이상</span>
            <span className="text-gray-500">모바일 가로 모드</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="font-mono font-medium w-12">md</span>
            <span className="text-gray-600 dark:text-gray-400">768px 이상</span>
            <span className="text-gray-500">태블릿</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="font-mono font-medium w-12">lg</span>
            <span className="text-gray-600 dark:text-gray-400">1024px 이상</span>
            <span className="text-gray-500">데스크탑</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="font-mono font-medium w-12">xl</span>
            <span className="text-gray-600 dark:text-gray-400">1280px 이상</span>
            <span className="text-gray-500">대형 데스크탑</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="font-mono font-medium w-12">2xl</span>
            <span className="text-gray-600 dark:text-gray-400">1536px 이상</span>
            <span className="text-gray-500">초대형 화면</span>
          </div>
        </div>
      </DemoContainer>
    </div>
  )
}
import { DemoContainer } from '@/components/design-system/demo-container'
import { CodePreview } from '@/components/design-system/code-preview'

interface TypographyScale {
  name: string
  class: string
  size: string
  lineHeight: string
  usage: string
}

const headingScale: TypographyScale[] = [
  {
    name: 'Heading 1',
    class: 'text-4xl font-bold',
    size: '36px',
    lineHeight: '40px',
    usage: '페이지 제목'
  },
  {
    name: 'Heading 2',
    class: 'text-3xl font-bold',
    size: '30px',
    lineHeight: '36px',
    usage: '섹션 제목'
  },
  {
    name: 'Heading 3',
    class: 'text-2xl font-semibold',
    size: '24px',
    lineHeight: '32px',
    usage: '서브섹션 제목'
  },
  {
    name: 'Heading 4',
    class: 'text-xl font-semibold',
    size: '20px',
    lineHeight: '28px',
    usage: '카드 제목'
  },
  {
    name: 'Heading 5',
    class: 'text-lg font-medium',
    size: '18px',
    lineHeight: '28px',
    usage: '리스트 제목'
  },
  {
    name: 'Heading 6',
    class: 'text-base font-medium',
    size: '16px',
    lineHeight: '24px',
    usage: '라벨'
  }
]

const bodyScale: TypographyScale[] = [
  {
    name: 'Body Large',
    class: 'text-lg',
    size: '18px',
    lineHeight: '28px',
    usage: '긴 본문 텍스트'
  },
  {
    name: 'Body',
    class: 'text-base',
    size: '16px',
    lineHeight: '24px',
    usage: '기본 본문'
  },
  {
    name: 'Body Small',
    class: 'text-sm',
    size: '14px',
    lineHeight: '20px',
    usage: '부가 설명'
  },
  {
    name: 'Caption',
    class: 'text-xs',
    size: '12px',
    lineHeight: '16px',
    usage: '캡션, 힌트'
  }
]

const TypographyDemo = ({ scale, type }: { scale: TypographyScale[]; type: string }): JSX.Element => (
  <DemoContainer title={`${type} 스케일`}>
    <div className="space-y-6">
      {scale.map((item) => (
        <div key={item.name} className="space-y-2">
          <div className={`${item.class} text-gray-900 dark:text-gray-100`}>
            {item.name} - 독서는 마음의 양식입니다
          </div>
          <div className="text-xs text-gray-500 space-x-4">
            <span>클래스: <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">{item.class}</code></span>
            <span>크기: {item.size}</span>
            <span>행간: {item.lineHeight}</span>
            <span>용도: {item.usage}</span>
          </div>
        </div>
      ))}
    </div>
  </DemoContainer>
)

export default function TypographyPage(): JSX.Element {
  const fontStackCode = `// globals.css
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/variable/pretendardvariable.css');

body {
  font-family: 'Pretendard Variable', -apple-system, BlinkMacSystemFont, 
    'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 
    'Droid Sans', 'Helvetica Neue', sans-serif;
}`

  const usageExampleCode = `// 제목과 본문 조합
<article className="space-y-4">
  <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
    독후감 제목
  </h1>
  <p className="text-lg text-gray-600 dark:text-gray-400">
    서브타이틀 또는 요약
  </p>
  <div className="prose prose-gray dark:prose-invert">
    <p className="text-base leading-relaxed">
      본문 내용이 들어갑니다. 적절한 행간과 여백으로 
      읽기 편한 환경을 제공합니다.
    </p>
  </div>
</article>`

  const textStylesCode = `// 텍스트 스타일 유틸리티
// 강조
<strong className="font-semibold">중요한 내용</strong>

// 링크
<a className="text-primary hover:text-primary-dark underline">
  링크 텍스트
</a>

// 인용구
<blockquote className="border-l-4 border-gray-300 pl-4 italic">
  인용된 텍스트
</blockquote>

// 코드
<code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-sm">
  인라인 코드
</code>`

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          타이포그래피
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          ReadZone은 한글 가독성에 최적화된 Pretendard 폰트를 사용합니다. 
          명확한 위계와 적절한 행간으로 편안한 읽기 경험을 제공합니다.
        </p>
      </div>

      <DemoContainer title="폰트 패밀리">
        <div className="space-y-4">
          <div className="text-2xl font-bold">Pretendard Variable</div>
          <div className="space-y-2 text-gray-600 dark:text-gray-400">
            <p>한글, 영문, 숫자에 최적화된 가변 폰트</p>
            <p>Weight: 100 ~ 900 (Variable)</p>
          </div>
        </div>
      </DemoContainer>

      <TypographyDemo scale={headingScale} type="헤딩" />
      <TypographyDemo scale={bodyScale} type="바디" />

      <DemoContainer title="폰트 굵기">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="font-thin">Thin (100) - 가장 얇은 굵기</div>
            <div className="font-extralight">Extra Light (200) - 매우 얇은 굵기</div>
            <div className="font-light">Light (300) - 얇은 굵기</div>
            <div className="font-normal">Normal (400) - 기본 굵기</div>
            <div className="font-medium">Medium (500) - 중간 굵기</div>
          </div>
          <div className="space-y-3">
            <div className="font-semibold">Semibold (600) - 약간 굵은 굵기</div>
            <div className="font-bold">Bold (700) - 굵은 굵기</div>
            <div className="font-extrabold">Extra Bold (800) - 매우 굵은 굵기</div>
            <div className="font-black">Black (900) - 가장 굵은 굵기</div>
          </div>
        </div>
      </DemoContainer>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          폰트 스택 설정
        </h3>
        <CodePreview code={fontStackCode} language="css" />
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          사용 예시
        </h3>
        <CodePreview code={usageExampleCode} language="tsx" />
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          텍스트 스타일
        </h3>
        <CodePreview code={textStylesCode} language="tsx" />
      </div>

      <DemoContainer
        title="가독성 가이드라인"
        description="최적의 읽기 경험을 위한 권장사항"
      >
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li>• 본문은 16px 이상 크기 사용 권장</li>
          <li>• 행간은 글자 크기의 1.5배 이상 유지</li>
          <li>• 한 줄에 45-75자 내외가 적절 (한글 기준 25-40자)</li>
          <li>• 충분한 여백으로 시각적 호흡 공간 제공</li>
          <li>• 긴 텍스트는 문단으로 나누어 가독성 향상</li>
        </ul>
      </DemoContainer>
    </div>
  )
}
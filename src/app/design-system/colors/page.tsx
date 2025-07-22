import { DemoContainer } from '@/components/design-system/demo-container'
import { CodePreview } from '@/components/design-system/code-preview'

interface ColorSwatch {
  name: string
  variable: string
  hex: string
  rgb: string
  usage: string
}

const brandColors: ColorSwatch[] = [
  {
    name: 'Primary',
    variable: 'primary',
    hex: '#2563eb',
    rgb: 'rgb(37, 99, 235)',
    usage: '주요 액션, 링크, 포커스 상태'
  },
  {
    name: 'Primary Dark',
    variable: 'primary-dark',
    hex: '#1d4ed8',
    rgb: 'rgb(29, 78, 216)',
    usage: '호버 상태, 강조'
  },
  {
    name: 'Primary Light',
    variable: 'primary-light',
    hex: '#3b82f6',
    rgb: 'rgb(59, 130, 246)',
    usage: '배경, 보더'
  }
]

const semanticColors: ColorSwatch[] = [
  {
    name: 'Success',
    variable: 'success',
    hex: '#10b981',
    rgb: 'rgb(16, 185, 129)',
    usage: '성공 메시지, 완료 상태'
  },
  {
    name: 'Warning',
    variable: 'warning',
    hex: '#f59e0b',
    rgb: 'rgb(245, 158, 11)',
    usage: '경고 메시지, 주의 상태'
  },
  {
    name: 'Error',
    variable: 'error',
    hex: '#ef4444',
    rgb: 'rgb(239, 68, 68)',
    usage: '오류 메시지, 실패 상태'
  },
  {
    name: 'Info',
    variable: 'info',
    hex: '#3b82f6',
    rgb: 'rgb(59, 130, 246)',
    usage: '정보 메시지, 안내'
  }
]

const grayScale: ColorSwatch[] = [
  { name: 'Gray 50', variable: 'gray-50', hex: '#f9fafb', rgb: 'rgb(249, 250, 251)', usage: '배경' },
  { name: 'Gray 100', variable: 'gray-100', hex: '#f3f4f6', rgb: 'rgb(243, 244, 246)', usage: '배경' },
  { name: 'Gray 200', variable: 'gray-200', hex: '#e5e7eb', rgb: 'rgb(229, 231, 235)', usage: '보더' },
  { name: 'Gray 300', variable: 'gray-300', hex: '#d1d5db', rgb: 'rgb(209, 213, 219)', usage: '보더' },
  { name: 'Gray 400', variable: 'gray-400', hex: '#9ca3af', rgb: 'rgb(156, 163, 175)', usage: '플레이스홀더' },
  { name: 'Gray 500', variable: 'gray-500', hex: '#6b7280', rgb: 'rgb(107, 114, 128)', usage: '서브 텍스트' },
  { name: 'Gray 600', variable: 'gray-600', hex: '#4b5563', rgb: 'rgb(75, 85, 99)', usage: '텍스트' },
  { name: 'Gray 700', variable: 'gray-700', hex: '#374151', rgb: 'rgb(55, 65, 81)', usage: '텍스트' },
  { name: 'Gray 800', variable: 'gray-800', hex: '#1f2937', rgb: 'rgb(31, 41, 55)', usage: '헤딩' },
  { name: 'Gray 900', variable: 'gray-900', hex: '#111827', rgb: 'rgb(17, 24, 39)', usage: '메인 텍스트' },
  { name: 'Gray 950', variable: 'gray-950', hex: '#030712', rgb: 'rgb(3, 7, 18)', usage: '다크모드 배경' }
]

const ColorSwatchGrid = ({ colors, title }: { colors: ColorSwatch[]; title: string }): JSX.Element => (
  <DemoContainer title={title}>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {colors.map((color) => (
        <div key={color.variable} className="space-y-2">
          <div
            className="h-20 rounded-lg border border-gray-200 dark:border-gray-700"
            style={{ backgroundColor: color.hex }}
          />
          <div className="space-y-1">
            <div className="font-medium text-gray-900 dark:text-gray-100">
              {color.name}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
              <div>CSS: <code className="font-mono">{color.variable}</code></div>
              <div>HEX: <code className="font-mono">{color.hex}</code></div>
              <div>RGB: <code className="font-mono">{color.rgb}</code></div>
              <div className="text-gray-500">용도: {color.usage}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </DemoContainer>
)

export default function ColorsPage(): JSX.Element {
  const tailwindConfigCode = `// tailwind.config.ts
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563eb',
          dark: '#1d4ed8',
          light: '#3b82f6',
        },
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
      }
    }
  }
}`

  const usageExampleCode = `// 컴포넌트에서 사용 예시
<button className="bg-primary hover:bg-primary-dark text-white">
  주요 버튼
</button>

<div className="border-2 border-success bg-success/10 text-success">
  성공 메시지
</div>

<p className="text-gray-600 dark:text-gray-400">
  서브 텍스트
</p>`

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          컬러 시스템
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          ReadZone의 컬러 시스템은 일관된 시각적 경험을 제공하고 브랜드 아이덴티티를 
          강화합니다. 모든 컬러는 접근성 기준을 충족하며 다크 모드를 지원합니다.
        </p>
      </div>

      <ColorSwatchGrid colors={brandColors} title="브랜드 컬러" />
      <ColorSwatchGrid colors={semanticColors} title="시맨틱 컬러" />
      <ColorSwatchGrid colors={grayScale} title="그레이 스케일" />

      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Tailwind 설정
        </h3>
        <CodePreview code={tailwindConfigCode} language="typescript" />
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          사용 예시
        </h3>
        <CodePreview code={usageExampleCode} language="tsx" />
      </div>

      <DemoContainer
        title="접근성 가이드라인"
        description="WCAG 2.1 AA 기준 준수"
      >
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li>• 텍스트와 배경 간 명도 대비는 최소 4.5:1 이상 유지</li>
          <li>• 중요한 정보는 색상만으로 전달하지 않고 아이콘이나 텍스트 함께 사용</li>
          <li>• 호버 상태는 색상 변화와 함께 다른 시각적 단서 제공</li>
          <li>• 다크 모드에서도 동일한 접근성 기준 적용</li>
        </ul>
      </DemoContainer>
    </div>
  )
}
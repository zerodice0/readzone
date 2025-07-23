import { type Metadata } from 'next'

export const metadata: Metadata = {
  title: '독후감 미리보기 | ReadZone',
  description: '작성 중인 독후감을 미리 확인해보세요.',
}

export default function PreviewPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">독후감 미리보기</h1>
        <p className="text-gray-600 dark:text-gray-400">
          작성 중인 독후감이 어떻게 보이는지 확인할 수 있습니다.
        </p>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <p className="text-blue-700 dark:text-blue-300">
          이 기능은 곧 구현될 예정입니다. 현재는 작성 페이지에서 마크다운 에디터의 미리보기 기능을 사용하실 수 있습니다.
        </p>
      </div>
    </div>
  )
}
import { type Metadata } from 'next'
import WriteReviewForm from './write-review-form'

export const metadata: Metadata = {
  title: '독후감 작성 | ReadZone',
  description: '독서 후 감상을 작성하고 다른 독자들과 공유해보세요.',
}

export default function WriteReviewPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">독후감 작성</h1>
        <p className="text-gray-600 dark:text-gray-400">
          독서 후 느낀 점을 자유롭게 작성하고 다른 독자들과 공유해보세요.
        </p>
      </div>

      <WriteReviewForm />
    </div>
  )
}
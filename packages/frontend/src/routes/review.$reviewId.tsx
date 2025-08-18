import { createFileRoute } from '@tanstack/react-router'

function ReviewDetailPage() {
  const { reviewId } = Route.useParams()
  
  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-4">독후감 상세</h2>
      <p className="text-muted-foreground">독후감 ID: {reviewId}</p>
    </div>
  )
}

export const Route = createFileRoute('/review/$reviewId')({
  component: ReviewDetailPage,
})
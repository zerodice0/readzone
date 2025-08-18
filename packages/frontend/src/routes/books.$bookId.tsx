import { createFileRoute } from '@tanstack/react-router'

function BookDetailPage() {
  const { bookId } = Route.useParams()
  
  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-4">도서 상세</h2>
      <p className="text-muted-foreground">도서 ID: {bookId}</p>
    </div>
  )
}

export const Route = createFileRoute('/books/$bookId')({
  component: BookDetailPage,
})
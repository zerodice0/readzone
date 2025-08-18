import { createFileRoute } from '@tanstack/react-router'

function ProfilePage() {
  const { userId } = Route.useParams()
  
  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-4">프로필</h2>
      <p className="text-muted-foreground">사용자 ID: {userId}</p>
    </div>
  )
}

export const Route = createFileRoute('/profile/$userId')({
  component: ProfilePage,
})
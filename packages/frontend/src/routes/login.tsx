import { createFileRoute } from '@tanstack/react-router'

function LoginPage() {
  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-4">로그인</h2>
      <p className="text-muted-foreground">로그인 페이지입니다.</p>
    </div>
  )
}

export const Route = createFileRoute('/login')({
  component: LoginPage,
})
import { createFileRoute } from '@tanstack/react-router'

function RegisterPage() {
  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-4">회원가입</h2>
      <p className="text-muted-foreground">회원가입 페이지입니다. (추후 구현)</p>
    </div>
  )
}

export const Route = createFileRoute('/register')({
  component: RegisterPage,
})
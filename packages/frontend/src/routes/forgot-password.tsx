import { createFileRoute } from '@tanstack/react-router'

function ForgotPasswordPage() {
  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-4">비밀번호 찾기</h2>
      <p className="text-muted-foreground">비밀번호 찾기 페이지입니다. (추후 구현)</p>
    </div>
  )
}

export const Route = createFileRoute('/forgot-password')({
  component: ForgotPasswordPage,
})
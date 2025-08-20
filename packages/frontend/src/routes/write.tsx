import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/write')({
  component: () => <div>독후감 작성 페이지 (구현 예정)</div>,
})
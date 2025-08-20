import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/search')({
  component: () => <div>도서 검색 페이지 (구현 예정)</div>,
})
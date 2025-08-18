import { createFileRoute } from '@tanstack/react-router'
import MainFeed from '@/pages/index'

export const Route = createFileRoute('/')({
  component: MainFeed,
})
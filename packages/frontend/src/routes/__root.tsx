import { createRootRoute, Outlet } from '@tanstack/react-router'
import { GlobalLoginRequiredModal } from '@/components/auth/LoginRequiredModal'
import { Header } from '@/components/layout/Header'

export const Route = createRootRoute({
  component: () => (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        <Outlet />
      </main>
      <GlobalLoginRequiredModal />
    </div>
  ),
})
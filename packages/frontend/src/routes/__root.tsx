import { createRootRoute, Outlet } from '@tanstack/react-router'
import { GlobalLoginRequiredModal } from '@/components/auth/LoginRequiredModal'
import { EmailVerificationBanner } from '@/components/auth/EmailVerificationBanner'
import { Header } from '@/components/layout/Header'

export const Route = createRootRoute({
  component: () => (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <EmailVerificationBanner />
      <main>
        <Outlet />
      </main>
      <GlobalLoginRequiredModal />
    </div>
  ),
})
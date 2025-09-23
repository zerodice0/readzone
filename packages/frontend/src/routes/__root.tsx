import { createRootRoute, Outlet } from '@tanstack/react-router'
import { GlobalLoginRequiredModal } from '@/components/auth/LoginRequiredModal'
import { EmailVerificationBanner } from '@/components/auth/EmailVerificationBanner'
import { Header } from '@/components/layout/Header'
import { SkipNavigation } from '@/components/ui/SkipNavigation'

export const Route = createRootRoute({
  component: () => (
    <div className="min-h-screen bg-background text-foreground">
      <SkipNavigation />
      <Header />
      <EmailVerificationBanner />
      <main id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
      <GlobalLoginRequiredModal />
    </div>
  ),
})
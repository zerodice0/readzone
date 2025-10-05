import { createFileRoute, redirect } from '@tanstack/react-router'
import { AdminPage } from '@/components/admin'
import { useAuthStore } from '@/store/authStore'

export const Route = createFileRoute('/admin')({
  beforeLoad: async () => {
    if (typeof window === 'undefined') {
      return
    }

    const authStore = useAuthStore.getState()

    // Check authentication first
    if (!authStore.isAuthenticated) {
      try {
        const refreshed = await authStore.refreshTokens()

        if (!refreshed) {
          throw redirect({ to: '/login', search: { redirect: undefined } })
        }
      } catch (error) {
        console.warn('[AdminRoute] Token refresh failed before load:', error)
        throw redirect({ to: '/login', search: { redirect: undefined } })
      }
    }

    // Check admin role
    if (!authStore.isAdmin()) {
      // Not an admin, redirect to home
      throw redirect({ to: '/' })
    }
  },
  component: AdminPage,
})

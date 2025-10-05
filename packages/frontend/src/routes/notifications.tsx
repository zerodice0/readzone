import { createFileRoute, redirect } from '@tanstack/react-router'
import NotificationsPage from '@/components/notifications/NotificationsPage'
import { useAuthStore } from '@/store/authStore'

export const Route = createFileRoute('/notifications')({
  beforeLoad: async () => {
    if (typeof window === 'undefined') {
      return
    }

    const authStore = useAuthStore.getState()

    if (authStore.isAuthenticated) {
      return
    }

    try {
      const refreshed = await authStore.refreshTokens()

      if (refreshed) {
        return
      }
    } catch (error) {
      console.warn('[NotificationsRoute] Token refresh failed before load:', error)
    }

    throw redirect({ to: '/' })
  },
  component: NotificationsPage,
})

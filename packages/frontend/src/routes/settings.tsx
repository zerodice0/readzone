import { createFileRoute, redirect } from '@tanstack/react-router'
import { SettingsPage } from '@/components/settings'
import { useAuthStore } from '@/store/authStore'

export const Route = createFileRoute('/settings')({
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
      console.warn('[SettingsRoute] Token refresh failed before load:', error)
    }

    throw redirect({ to: '/' })
  },
  component: SettingsPage,
})

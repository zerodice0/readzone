import { createFileRoute } from '@tanstack/react-router'
import { SettingsPage } from '@/components/settings'

function SettingsPageWithTab() {
  return <SettingsPage />
}

export const Route = createFileRoute('/settings/$tab')({
  component: SettingsPageWithTab,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      // Add any search parameter validation if needed
      ...search,
    }
  },
})
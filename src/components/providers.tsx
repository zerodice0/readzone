'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from 'next-themes'
import { queryClient } from '@/lib/query-client'
import { Toaster } from 'sonner'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps): JSX.Element {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
      storageKey="readzone-theme"
    >
      <SessionProvider>
        <QueryClientProvider client={queryClient}>
          {children}
          {/* Toast 알림 시스템 */}
          <Toaster 
            position="top-center"
            richColors
            closeButton
            expand={true}
            duration={4000}
          />
          {/* React Query 개발 도구 (개발 환경에서만 표시) */}
          {process.env.NODE_ENV === 'development' && (
            <ReactQueryDevtools 
              initialIsOpen={false}
            />
          )}
        </QueryClientProvider>
      </SessionProvider>
    </ThemeProvider>
  )
}
import { ReactNode } from 'react'
import { SidebarNav } from '@/components/design-system/sidebar-nav'

interface DesignSystemLayoutProps {
  children: ReactNode
}

export default function DesignSystemLayout({
  children
}: DesignSystemLayoutProps): JSX.Element {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            ReadZone 디자인 시스템
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            일관된 사용자 경험을 위한 디자인 가이드라인
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
          <aside className="lg:sticky lg:top-8 lg:h-[calc(100vh-8rem)]">
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
              <SidebarNav />
            </div>
          </aside>
          
          <main className="min-w-0">
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 lg:p-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
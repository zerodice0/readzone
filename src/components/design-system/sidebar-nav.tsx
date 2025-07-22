'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface NavItem {
  title: string
  href: string
  description?: string
}

const navItems: NavItem[] = [
  {
    title: '개요',
    href: '/design-system',
    description: '디자인 시스템 소개'
  },
  {
    title: '컬러',
    href: '/design-system/colors',
    description: '컬러 팔레트 및 사용 가이드'
  },
  {
    title: '타이포그래피',
    href: '/design-system/typography',
    description: '텍스트 스타일 및 폰트'
  },
  {
    title: '컴포넌트',
    href: '/design-system/components',
    description: 'UI 컴포넌트 쇼케이스'
  },
  {
    title: '레이아웃',
    href: '/design-system/layouts',
    description: '레이아웃 패턴 및 그리드'
  },
  {
    title: '패턴',
    href: '/design-system/patterns',
    description: '인터랙션 및 UX 패턴'
  }
]

export function SidebarNav(): JSX.Element {
  const pathname = usePathname()

  return (
    <nav className="space-y-1">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'block px-4 py-3 text-sm rounded-lg transition-colors',
            'hover:bg-gray-100 dark:hover:bg-gray-800',
            pathname === item.href
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium'
              : 'text-gray-600 dark:text-gray-400'
          )}
        >
          <div className="font-medium">{item.title}</div>
          {item.description && (
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
              {item.description}
            </div>
          )}
        </Link>
      ))}
    </nav>
  )
}
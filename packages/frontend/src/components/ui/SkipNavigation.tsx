import React from 'react'

interface SkipNavigationProps {
  links?: {
    href: string
    label: string
  }[]
}

const defaultLinks = [
  { href: '#main-content', label: '메인 콘텐츠로 건너뛰기' },
  { href: '#navigation', label: '네비게이션으로 건너뛰기' },
  { href: '#search', label: '검색으로 건너뛰기' },
]

export const SkipNavigation: React.FC<SkipNavigationProps> = ({
  links = defaultLinks
}) => {
  return (
    <div className="sr-only focus-within:not-sr-only">
      <div className="fixed top-0 left-0 z-[9999] bg-blue-600 text-white p-2 rounded-br">
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="block px-4 py-2 text-sm font-medium underline hover:bg-blue-700 focus:bg-blue-700 focus:outline-none rounded"
            onFocus={(e) => {
              // 링크가 포커스되었을 때 부모 컨테이너를 표시
              const parent = e.currentTarget.closest('.sr-only')

              if (parent) {
                parent.classList.remove('sr-only')
                parent.classList.add('not-sr-only')
              }
            }}
            onBlur={(e) => {
              // 포커스가 벗어났을 때 다시 숨김
              const parent = e.currentTarget.closest('.not-sr-only')

              if (parent && !parent.querySelector(':focus')) {
                setTimeout(() => {
                  if (!parent.querySelector(':focus')) {
                    parent.classList.add('sr-only')
                    parent.classList.remove('not-sr-only')
                  }
                }, 100)
              }
            }}
          >
            {link.label}
          </a>
        ))}
      </div>
    </div>
  )
}
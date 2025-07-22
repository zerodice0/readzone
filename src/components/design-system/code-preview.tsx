'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface CodePreviewProps {
  code: string
  language?: string
  showLineNumbers?: boolean
  className?: string
}

export function CodePreview({
  code,
  language = 'tsx',
  showLineNumbers = false,
  className
}: CodePreviewProps): JSX.Element {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy code:', error)
    }
  }

  const lines = code.split('\n')

  return (
    <div className={cn('relative group', className)}>
      <div className="absolute right-2 top-2 z-10">
        <button
          onClick={handleCopy}
          className={cn(
            'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
            'bg-gray-800 text-gray-200 hover:bg-gray-700',
            'dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600',
            'opacity-0 group-hover:opacity-100 focus:opacity-100'
          )}
        >
          {copied ? '복사됨!' : '복사'}
        </button>
      </div>
      <div className="overflow-x-auto">
        <pre className={cn(
          'p-4 rounded-lg text-sm',
          'bg-gray-900 text-gray-100',
          'dark:bg-black dark:text-gray-200'
        )}>
          <code className={`language-${language}`}>
            {showLineNumbers ? (
              <div className="flex">
                <div className="select-none pr-4 text-gray-500 text-right">
                  {lines.map((_, index) => (
                    <div key={index}>{index + 1}</div>
                  ))}
                </div>
                <div className="flex-1">
                  {lines.map((line, index) => (
                    <div key={index}>{line || ' '}</div>
                  ))}
                </div>
              </div>
            ) : (
              code
            )}
          </code>
        </pre>
      </div>
    </div>
  )
}
import React from 'react'
import { cn } from '@/lib/utils'

interface PasswordStrengthProps {
  password: string
  className?: string
}

interface PasswordRequirement {
  label: string
  test: (password: string) => boolean
}

const requirements: PasswordRequirement[] = [
  {
    label: '8자 이상',
    test: (password) => password.length >= 8,
  },
  {
    label: '영문 포함',
    test: (password) => /[a-zA-Z]/.test(password),
  },
  {
    label: '숫자 포함',
    test: (password) => /\d/.test(password),
  },
]

const getPasswordStrength = (password: string): {
  score: number
  level: 'weak' | 'medium' | 'strong'
  color: string
} => {
  const score = requirements.reduce((acc, req) => {
    return acc + (req.test(password) ? 1 : 0)
  }, 0)

  if (score === 0) {
    return { score: 0, level: 'weak', color: 'bg-gray-200' }
  } else if (score === 1) {
    return { score: 1, level: 'weak', color: 'bg-red-400' }
  } else if (score === 2) {
    return { score: 2, level: 'medium', color: 'bg-yellow-400' }
  } else {
    return { score: 3, level: 'strong', color: 'bg-green-400' }
  }
}

export function PasswordStrength({ password, className }: PasswordStrengthProps): JSX.Element {
  if (!password) {
    return <></>
  }

  const { score, level, color } = getPasswordStrength(password)

  const strengthText = {
    weak: '약함',
    medium: '보통',
    strong: '강함',
  }

  const strengthTextColor = {
    weak: 'text-red-600',
    medium: 'text-yellow-600',
    strong: 'text-green-600',
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* 비밀번호 강도 바 */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">비밀번호 강도</span>
          <span className={cn('text-sm font-medium', strengthTextColor[level])}>
            {strengthText[level]}
          </span>
        </div>
        <div className="flex space-x-1">
          {[1, 2, 3].map((index) => (
            <div
              key={index}
              className={cn(
                'h-2 flex-1 rounded-full transition-colors',
                index <= score ? color : 'bg-gray-200'
              )}
            />
          ))}
        </div>
      </div>

      {/* 요구사항 체크리스트 */}
      <div className="space-y-1">
        {requirements.map((requirement, index) => {
          const isValid = requirement.test(password)
          return (
            <div key={index} className="flex items-center space-x-2">
              <div
                className={cn(
                  'w-4 h-4 rounded-full flex items-center justify-center text-xs',
                  isValid 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-gray-100 text-gray-400'
                )}
              >
                {isValid ? '✓' : '○'}
              </div>
              <span
                className={cn(
                  'text-sm',
                  isValid ? 'text-green-600' : 'text-gray-500'
                )}
              >
                {requirement.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
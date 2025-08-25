import { calculatePasswordStrength } from '@/lib/password-utils'

interface PasswordStrengthIndicatorProps {
  password: string
  showFeedback?: boolean
  className?: string
}

export function PasswordStrengthIndicator({ 
  password, 
  showFeedback = true,
  className = ''
}: PasswordStrengthIndicatorProps) {
  const strength = calculatePasswordStrength(password)

  if (!password) {
    return null
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* 강도 표시 바 */}
      <div className="space-y-1">
        <div className="flex space-x-1">
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-sm transition-colors duration-200 ${
                i < strength.score
                  ? strength.color
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>
        
        {/* 강도 레이블 */}
        {strength.label && (
          <p className="text-xs text-muted-foreground">
            비밀번호 강도: <span className={`font-medium ${
              strength.level === 'weak' ? 'text-red-600 dark:text-red-400' :
              strength.level === 'fair' ? 'text-yellow-600 dark:text-yellow-400' :
              'text-green-600 dark:text-green-400'
            }`}>
              {strength.label}
            </span>
          </p>
        )}
      </div>

      {/* 피드백 메시지 */}
      {showFeedback && strength.feedback.length > 0 && (
        <div className="space-y-1">
          {strength.feedback.map((item, i) => (
            <p key={i} className="text-xs text-muted-foreground flex items-center">
              <span className="w-1 h-1 rounded-full bg-muted-foreground mr-2" />
              {item}
            </p>
          ))}
        </div>
      )}

      {/* 안전한 비밀번호 완성 메시지 */}
      {strength.level === 'strong' && showFeedback && (
        <p className="text-xs text-green-600 dark:text-green-400 font-medium">
          ✓ 안전한 비밀번호입니다
        </p>
      )}
    </div>
  )
}
interface PasswordStrength {
  score: number // 0-3
  level: 'weak' | 'fair' | 'good' | 'strong'
  feedback: string[]
  color: string
  label: string
}

export function calculatePasswordStrength(password: string): PasswordStrength {
  let score = 0
  const feedback: string[] = []

  // 길이 체크 (6자 이상)
  if (password.length >= 6) {
    score += 1
  } else if (password.length > 0) {
    feedback.push('최소 6자 이상 필요')
  }

  // 문자와 숫자 포함 체크
  if (/[a-zA-Z]/.test(password) && /\d/.test(password)) {
    score += 1
  } else if (password.length > 0) {
    if (!/[a-zA-Z]/.test(password)) {
      feedback.push('영문자 포함 필요')
    }
    if (!/\d/.test(password)) {
      feedback.push('숫자 포함 필요')
    }
  }

  // 특수문자 포함 체크 (보너스)
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1
  }

  // 최대 3점으로 제한
  score = Math.min(score, 3)

  // 레벨과 색상 결정
  let level: PasswordStrength['level']
  let color: string
  let label: string

  if (score === 0) {
    level = 'weak'
    color = 'bg-gray-200'
    label = ''
  } else if (score === 1) {
    level = 'weak'
    color = 'bg-red-500'
    label = '약함'
  } else if (score === 2) {
    level = 'fair'
    color = 'bg-yellow-500'
    label = '보통'
  } else {
    level = 'good'
    color = 'bg-green-500'
    label = '좋음'
  }

  return { score, level, feedback, color, label }
}

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

      {/* 좋은 비밀번호 완성 메시지 */}
      {strength.level === 'good' && showFeedback && (
        <p className="text-xs text-green-600 dark:text-green-400 font-medium">
          ✓ 안전한 비밀번호입니다
        </p>
      )}
    </div>
  )
}
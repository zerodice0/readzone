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
    label = '취약'
  } else if (score === 2) {
    level = 'fair'
    color = 'bg-yellow-500'
    label = '보통'
  } else {
    level = 'strong'
    color = 'bg-green-500'
    label = '강함'
  }

  return {
    score,
    level,
    feedback,
    color,
    label
  }
}

export type { PasswordStrength }
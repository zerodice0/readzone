import bcrypt from 'bcryptjs'

/**
 * 비밀번호 해싱 라운드 수
 * 보안과 성능의 균형을 고려한 값
 */
const SALT_ROUNDS = 12

/**
 * 비밀번호 해싱
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS)
    const hashedPassword = await bcrypt.hash(password, salt)

    return hashedPassword
  } catch (_error) {
    throw new Error('Failed to hash password')
  }
}

/**
 * 비밀번호 검증
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hashedPassword)
  } catch (_error) {
    throw new Error('Failed to verify password')
  }
}

/**
 * 비밀번호 강도 검증
 */
export interface PasswordStrengthResult {
  isValid: boolean
  score: number // 0-4
  errors: string[]
  suggestions: string[]
}

export function validatePasswordStrength(password: string): PasswordStrengthResult {
  const errors: string[] = []
  const suggestions: string[] = []
  let score = 0

  // 길이 체크
  if (password.length < 8) {
    errors.push('비밀번호는 최소 8자 이상이어야 합니다')
    suggestions.push('더 긴 비밀번호를 사용하세요')
  } else {
    score += 1
  }

  // 대문자 포함
  if (!/[A-Z]/.test(password)) {
    errors.push('대문자를 포함해야 합니다')
    suggestions.push('대문자(A-Z)를 추가하세요')
  } else {
    score += 1
  }

  // 소문자 포함
  if (!/[a-z]/.test(password)) {
    errors.push('소문자를 포함해야 합니다')
    suggestions.push('소문자(a-z)를 추가하세요')
  } else {
    score += 1
  }

  // 숫자 포함
  if (!/\d/.test(password)) {
    errors.push('숫자를 포함해야 합니다')
    suggestions.push('숫자(0-9)를 추가하세요')
  } else {
    score += 1
  }

  // 특수문자 포함
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('특수문자를 포함해야 합니다')
    suggestions.push('특수문자(!@#$%^&* 등)를 추가하세요')
  } else {
    score += 1
  }

  // 연속된 문자 체크
  if (/(.)\1{2,}/.test(password)) {
    errors.push('동일한 문자가 3회 이상 연속되면 안됩니다')
    suggestions.push('연속된 동일 문자를 피하세요')
    score = Math.max(0, score - 1)
  }

  // 일반적인 패턴 체크
  const commonPatterns = [
    /123456/,
    /password/i,
    /qwerty/i,
    /abc123/i,
    /admin/i,
    /letmein/i
  ]

  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      errors.push('일반적인 패턴이나 단어는 사용할 수 없습니다')
      suggestions.push('예측하기 어려운 조합을 사용하세요')
      score = Math.max(0, score - 1)
      break
    }
  }

  return {
    isValid: errors.length === 0 && score >= 4,
    score: Math.min(score, 4),
    errors,
    suggestions
  }
}

/**
 * 비밀번호 정책 검증 (ReadZone 기준)
 */
export function validatePasswordPolicy(password: string): { isValid: boolean; message?: string } {
  // 기본 길이 체크
  if (password.length < 6) {
    return {
      isValid: false,
      message: '비밀번호는 최소 6자 이상이어야 합니다'
    }
  }

  if (password.length > 128) {
    return {
      isValid: false,
      message: '비밀번호는 128자 이하여야 합니다'
    }
  }

  // ReadZone은 관대한 정책 사용 (사용자 경험 우선)
  // 하지만 최소한의 보안은 유지
  const hasLetterOrNumber = /[a-zA-Z0-9]/.test(password)

  if (!hasLetterOrNumber) {
    return {
      isValid: false,
      message: '비밀번호는 영문자 또는 숫자를 포함해야 합니다'
    }
  }

  return { isValid: true }
}
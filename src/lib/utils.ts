import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

// 비밀번호 해싱
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return await bcrypt.hash(password, saltRounds)
}

// 비밀번호 검증
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword)
}

// 이메일 인증 토큰 생성
export function generateEmailVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

// 랜덤 문자열 생성
export function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// 이메일 주소 검증
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// 닉네임 검증
export function isValidNickname(nickname: string): boolean {
  const nicknameRegex = /^[가-힣a-zA-Z0-9_-]{2,20}$/
  return nicknameRegex.test(nickname)
}

// 에러 메시지 처리
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return '알 수 없는 오류가 발생했습니다.'
}

// 텍스트 자르기
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}
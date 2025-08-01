/**
 * Prisma 유틸리티 함수들
 * 타입 안전성과 개발자 경험을 개선하기 위한 헬퍼 함수들
 */

import { prisma } from '@/lib/db'
import type { 
  PrismaTransaction, 
  PrismaTransactionFn, 
  PrismaTransactionOptions 
} from '@/types/prisma'

/**
 * 타입 안전성이 보장된 트랜잭션 실행 함수
 * 
 * 이 함수를 사용하면 트랜잭션 내에서 타입 안전성이 보장되며,
 * 개발자가 실수하기 쉬운 트랜잭션 타입 관련 오류를 방지할 수 있습니다.
 * 
 * @template T - 트랜잭션 결과 타입
 * @param fn - 실행할 트랜잭션 함수
 * @param options - 트랜잭션 옵션
 * @returns 트랜잭션 실행 결과
 * 
 * @example
 * ```typescript
 * const result = await executeTransaction(async (tx) => {
 *   const user = await tx.user.create({ ... })
 *   const profile = await tx.profile.create({ ... })
 *   return { user, profile }
 * })
 * ```
 */
export async function executeTransaction<T>(
  fn: PrismaTransactionFn<T>,
  options?: PrismaTransactionOptions
): Promise<T> {
  return prisma.$transaction(fn, options)
}

/**
 * 트랜잭션 내에서 안전하게 사용자 생성
 * 
 * 회원가입 시 자주 사용되는 패턴을 추상화한 헬퍼 함수입니다.
 * 사용자 생성과 관련된 추가 작업들을 트랜잭션으로 묶어 처리합니다.
 * 
 * @param userData - 사용자 생성 데이터
 * @param additionalOperations - 추가로 실행할 트랜잭션 작업들
 * @returns 생성된 사용자와 추가 작업 결과
 * 
 * @example
 * ```typescript
 * const result = await createUserWithTransaction(
 *   { email, password, nickname },
 *   async (tx, user) => {
 *     const verificationToken = await tx.verificationToken.create({ ... })
 *     return { verificationToken }
 *   }
 * )
 * ```
 */
export async function createUserWithTransaction<T = {}>(
  userData: {
    email: string
    password: string
    nickname: string
    name?: string
    emailVerified?: Date | null
  },
  additionalOperations?: (tx: PrismaTransaction, user: any) => Promise<T>
): Promise<{ user: any } & T> {
  return executeTransaction(async (tx) => {
    // 사용자 생성
    const user = await tx.user.create({
      data: {
        email: userData.email,
        password: userData.password,
        nickname: userData.nickname,
        name: userData.name || userData.nickname,
        emailVerified: userData.emailVerified || null,
      },
    })

    // 추가 작업 실행
    if (additionalOperations) {
      const additionalResults = await additionalOperations(tx, user)
      return { user, ...additionalResults }
    }

    return { user } as { user: any } & T
  })
}

/**
 * 트랜잭션 내에서 안전하게 이메일 인증 토큰 관리
 * 
 * 이메일 인증 토큰 생성/갱신 시 자주 사용되는 패턴을 추상화한 헬퍼 함수입니다.
 * 기존 토큰 삭제와 새 토큰 생성을 원자적으로 처리합니다.
 * 
 * @param email - 사용자 이메일
 * @param token - 새로 생성할 토큰
 * @param expires - 토큰 만료일
 * @returns 생성된 토큰 정보
 * 
 * @example
 * ```typescript
 * const tokenInfo = await manageVerificationToken(
 *   'user@example.com',
 *   'secure_token_123',
 *   new Date(Date.now() + 24 * 60 * 60 * 1000)
 * )
 * ```
 */
export async function manageVerificationToken(
  email: string,
  token: string,
  expires: Date
) {
  return executeTransaction(async (tx) => {
    // 기존 토큰들 삭제
    await tx.verificationToken.deleteMany({
      where: { identifier: email },
    })

    // 새 토큰 생성
    const verificationToken = await tx.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    })

    return verificationToken
  })
}

/**
 * 트랜잭션 내에서 안전하게 사용자 이메일 인증 완료 처리
 * 
 * 이메일 인증 완료 시 사용자 상태 업데이트와 토큰 삭제를 원자적으로 처리합니다.
 * 
 * @param userId - 사용자 ID
 * @param token - 삭제할 인증 토큰
 * @returns 업데이트된 사용자 정보
 * 
 * @example
 * ```typescript
 * const updatedUser = await completeEmailVerification(
 *   'user123',
 *   'verification_token_456'
 * )
 * ```
 */
export async function completeEmailVerification(
  userId: string,
  token: string
) {
  return executeTransaction(async (tx) => {
    // 사용자 이메일 인증 완료
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        emailVerified: new Date(),
      },
    })

    // 사용된 토큰 삭제
    await tx.verificationToken.delete({
      where: { token },
    })

    return updatedUser
  })
}

/**
 * 트랜잭션 실행 시간을 측정하는 래퍼 함수
 * 
 * 성능 모니터링을 위해 트랜잭션 실행 시간을 측정합니다.
 * 개발 환경에서 느린 트랜잭션을 감지하는 데 유용합니다.
 * 
 * @template T - 트랜잭션 결과 타입
 * @param name - 트랜잭션 이름 (로깅용)
 * @param fn - 실행할 트랜잭션 함수
 * @param options - 트랜잭션 옵션
 * @returns 트랜잭션 실행 결과와 성능 정보
 * 
 * @example
 * ```typescript
 * const { result, duration } = await measureTransaction(
 *   'user-registration',
 *   async (tx) => { ... }
 * )
 * ```
 */
export async function measureTransaction<T>(
  name: string,
  fn: PrismaTransactionFn<T>,
  options?: PrismaTransactionOptions
): Promise<{ result: T; duration: number }> {
  const startTime = Date.now()
  
  try {
    const result = await executeTransaction(fn, options)
    const duration = Date.now() - startTime
    
    // 개발 환경에서 느린 트랜잭션 경고
    if (process.env.NODE_ENV === 'development' && duration > 1000) {
      console.warn(`⚠️ Slow transaction "${name}": ${duration}ms`)
    }
    
    return { result, duration }
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`❌ Transaction "${name}" failed after ${duration}ms:`, error)
    throw error
  }
}
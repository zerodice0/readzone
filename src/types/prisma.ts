/**
 * Prisma 관련 타입 정의
 * 타입 안전성과 개발자 경험 개선을 위한 유틸리티 타입들
 */

import type { PrismaClient } from '@prisma/client'

/**
 * Prisma 트랜잭션 타입
 * 
 * Prisma의 $transaction 메서드 내에서 사용되는 트랜잭션 클라이언트의 타입입니다.
 * 트랜잭션 관련 메서드들($connect, $disconnect, $transaction 등)을 제외한 
 * 모든 Prisma 클라이언트 메서드를 사용할 수 있습니다.
 * 
 * @example
 * ```typescript
 * await prisma.$transaction(async (tx: PrismaTransaction) => {
 *   const user = await tx.user.create({ ... })
 *   const profile = await tx.profile.create({ ... })
 *   return { user, profile }
 * })
 * ```
 */
export type PrismaTransaction = Omit<
  PrismaClient, 
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>

/**
 * Prisma 트랜잭션 함수 타입
 * 
 * $transaction 메서드에 전달되는 함수의 타입입니다.
 * 
 * @template T - 트랜잭션 함수의 반환 타입
 */
export type PrismaTransactionFn<T = any> = (tx: PrismaTransaction) => Promise<T>

/**
 * Prisma 모델 이름 타입
 * 
 * Prisma 스키마에 정의된 모든 모델의 이름을 나타내는 유니온 타입입니다.
 */
export type PrismaModelName = keyof PrismaClient

/**
 * 트랜잭션 옵션 타입
 * 
 * Prisma 트랜잭션 실행 시 사용할 수 있는 옵션들입니다.
 */
export interface PrismaTransactionOptions {
  /** 트랜잭션 최대 대기 시간 (밀리초) */
  maxWait?: number
  /** 트랜잭션 타임아웃 시간 (밀리초) */
  timeout?: number
  /** 격리 수준 */
  isolationLevel?: 'ReadUncommitted' | 'ReadCommitted' | 'RepeatableRead' | 'Serializable'
}

/**
 * 트랜잭션 실행 헬퍼 함수 타입
 * 
 * 타입 안전성이 보장된 트랜잭션 실행 함수입니다.
 * 
 * @template T - 트랜잭션 결과 타입
 * @param fn - 실행할 트랜잭션 함수
 * @param options - 트랜잭션 옵션
 * @returns 트랜잭션 실행 결과
 */
export type ExecuteTransaction = <T>(
  fn: PrismaTransactionFn<T>,
  options?: PrismaTransactionOptions
) => Promise<T>
#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateUsersToAccounts() {
  console.log('🔄 기존 User 데이터를 Account 테이블로 마이그레이션 시작...')

  try {
    // 모든 User 가져오기
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        createdAt: true
      }
    })

    console.log(`📊 마이그레이션할 사용자 수: ${users.length}명`)

    if (users.length === 0) {
      console.log('✨ 마이그레이션할 데이터가 없습니다.')

      return
    }

    // 트랜잭션으로 처리
    const result = await prisma.$transaction(async (tx) => {
      const createdAccounts = []

      for (const user of users) {
        // 각 User에 대해 Account 생성
        const account = await tx.account.create({
          data: {
            userId: user.id,
            type: 'email',
            provider: 'email',
            providerAccountId: user.id, // email 타입의 경우 userId와 동일
            email: user.email,
            createdAt: user.createdAt, // 기존 생성 시간 유지
            updatedAt: user.createdAt
          }
        })

        createdAccounts.push(account)

        // User.primaryEmail 업데이트 (기존 email을 primaryEmail로)
        await tx.user.update({
          where: { id: user.id },
          data: {
            primaryEmail: user.email
          }
        })
      }

      return createdAccounts
    })

    console.log(`✅ 마이그레이션 완료: ${result.length}개의 Account 생성됨`)
    
    // 검증
    const accountCount = await prisma.account.count()
    const userCount = await prisma.user.count()
    
    console.log(`🔍 검증 결과:`)
    console.log(`   - User 수: ${userCount}`)
    console.log(`   - Account 수: ${accountCount}`)
    
    if (accountCount === userCount) {
      console.log('✅ 마이그레이션 성공: 모든 사용자에게 Account가 생성되었습니다.')
    } else {
      console.error('❌ 마이그레이션 오류: Account 수가 User 수와 맞지 않습니다.')
      process.exit(1)
    }

  } catch (error) {
    console.error('❌ 마이그레이션 중 오류 발생:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// 스크립트 직접 실행
migrateUsersToAccounts()
  .then(() => {
    console.log('🎉 마이그레이션이 완료되었습니다.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 마이그레이션 실패:', error)
    process.exit(1)
  })

export { migrateUsersToAccounts }
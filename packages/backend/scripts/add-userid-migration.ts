#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function addUseridField() {
  // 🔄 userid 필드 추가를 위한 데이터 마이그레이션 시작...

  try {
    // 1. 현재 사용자 데이터 확인
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        nickname: true
      }
    })

    // 📊 기존 사용자 수 확인
    
    if (users.length === 0) {
      // ✨ 기존 사용자가 없어 직접 마이그레이션 실행 가능
      return
    }

    // 2. 각 사용자의 nickname을 userid로 사용할 수 있는지 체크
    // 📋 기존 사용자 데이터 분석
    // users.forEach((user, index) => {
    //   console.log(`${index + 1}. ${user.nickname} (${user.email || 'no-email'})`)
    // })

    // 3. nickname이 userid 규칙에 맞는지 체크
    const useridPattern = /^[a-z0-9_-]{3,30}$/
    const validUsers = []
    const invalidUsers = []

    for (const user of users) {
      if (useridPattern.test(user.nickname)) {
        validUsers.push(user)
      } else {
        invalidUsers.push(user)
      }
    }

    // ✅ userid로 사용 가능한 사용자 수 확인
    // ❌ userid 규칙에 맞지 않는 사용자 수 확인

    if (invalidUsers.length > 0) {
      // ⚠️  다음 사용자들의 nickname은 userid 규칙에 맞지 않음 - 자동 변환 필요
      // invalidUsers.forEach(user => {
      //   const sanitized = user.nickname
      //     .toLowerCase()
      //     .replace(/[^a-z0-9_-]/g, '_')
      //     .substring(0, 30)
      //   console.log(`   - "${user.nickname}" → "${sanitized}" (자동 변환 제안)`)
      // })
    }

    // 🔧 마이그레이션 전략:
    // 1. SQL을 사용하여 userid 필드를 추가
    // 2. 기존 nickname을 userid의 기본값으로 설정
    // 3. nickname의 unique 제약을 제거
    // 4. 규칙에 맞지 않는 nickname은 자동 변환

  } finally {
    await prisma.$disconnect()
  }
}

// 스크립트 직접 실행
addUseridField()
  .then(() => {
    // 📋 마이그레이션 준비 완료. 이제 수동으로 SQL 실행이 필요
    process.exit(0)
  })
  .catch((error) => {
    // 💥 마이그레이션 체크 실패
    throw error
  })

export { addUseridField }
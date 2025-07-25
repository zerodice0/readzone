import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function cleanupTestData() {
  console.log('🧹 테스트 데이터 정리 시작...')

  try {
    // 1. 테스트 사용자 관련 데이터 삭제
    const testUserEmail = 'test@readzone.com'
    const testUser = await db.user.findUnique({
      where: { email: testUserEmail },
      select: { id: true, nickname: true }
    })

    if (testUser) {
      console.log(`👤 테스트 사용자 발견: ${testUser.nickname} (${testUserEmail})`)
      
      // 테스트 사용자의 독후감 삭제
      const deletedReviews = await db.bookReview.deleteMany({
        where: { userId: testUser.id }
      })
      console.log(`📝 독후감 ${deletedReviews.count}개 삭제`)

      // 테스트 사용자의 도서 의견 삭제
      const deletedOpinions = await db.bookOpinion.deleteMany({
        where: { userId: testUser.id }
      })
      console.log(`💭 도서 의견 ${deletedOpinions.count}개 삭제`)

      // 테스트 사용자의 좋아요 삭제
      const deletedLikes = await db.reviewLike.deleteMany({
        where: { userId: testUser.id }
      })
      console.log(`❤️ 좋아요 ${deletedLikes.count}개 삭제`)

      // 테스트 사용자의 댓글 삭제
      const deletedComments = await db.comment.deleteMany({
        where: { userId: testUser.id }
      })
      console.log(`💬 댓글 ${deletedComments.count}개 삭제`)

      // 테스트 사용자 삭제
      await db.user.delete({
        where: { id: testUser.id }
      })
      console.log(`❌ 테스트 사용자 삭제 완료`)
    }

    // 2. 샘플 도서 삭제 (book-1, book-2, book-3)
    const sampleBookIds = ['book-1', 'book-2', 'book-3']
    
    for (const bookId of sampleBookIds) {
      const book = await db.book.findUnique({
        where: { id: bookId },
        select: { id: true, title: true }
      })

      if (book) {
        console.log(`📚 샘플 도서 발견: ${book.title}`)
        
        // 관련 독후감 삭제
        const deletedReviews = await db.bookReview.deleteMany({
          where: { bookId: book.id }
        })
        console.log(`  📝 관련 독후감 ${deletedReviews.count}개 삭제`)

        // 관련 의견 삭제
        const deletedOpinions = await db.bookOpinion.deleteMany({
          where: { bookId: book.id }
        })
        console.log(`  💭 관련 의견 ${deletedOpinions.count}개 삭제`)

        // 도서 삭제
        await db.book.delete({
          where: { id: book.id }
        })
        console.log(`  ❌ 샘플 도서 삭제 완료`)
      }
    }

    // 3. 기타 테스트 계정들 확인
    const otherTestUsers = await db.user.findMany({
      where: {
        OR: [
          { email: { contains: 'test' } },
          { email: { contains: 'example.com' } }
        ]
      },
      select: { email: true, nickname: true }
    })

    if (otherTestUsers.length > 0) {
      console.log('\n⚠️  기타 테스트 계정 발견:')
      otherTestUsers.forEach(user => {
        console.log(`  - ${user.nickname} (${user.email})`)
      })
      console.log('💡 필요 시 수동으로 정리하세요.')
    }

    // 4. 정리 후 상태 확인
    const remainingStats = await db.$transaction([
      db.user.count(),
      db.book.count(),
      db.bookReview.count()
    ])

    console.log('\n✅ 정리 완료!')
    console.log(`📊 현재 데이터 상태:`)
    console.log(`  - 사용자: ${remainingStats[0]}명`)
    console.log(`  - 도서: ${remainingStats[1]}권`)
    console.log(`  - 독후감: ${remainingStats[2]}개`)

  } catch (error) {
    console.error('❌ 정리 중 에러:', error)
    throw error
  }
}

// 실행
cleanupTestData()
  .catch((e) => {
    console.error('❌ 스크립트 실행 실패:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
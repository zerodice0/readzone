import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create sample users
  const hashedPassword = await bcrypt.hash('password123', 12)

  const user1 = await prisma.user.create({
    data: {
      email: 'alice@example.com',
      nickname: '책읽는앨리스',
      password: hashedPassword,
      bio: '소설과 에세이를 즐겨 읽는 독서가입니다.',
      isVerified: true,
    },
  })

  const user2 = await prisma.user.create({
    data: {
      email: 'bob@example.com',
      nickname: '북러버밥',
      password: hashedPassword,
      bio: '자기계발서와 과학서적을 좋아합니다.',
      isVerified: true,
    },
  })

  // Create sample books
  const book1 = await prisma.book.create({
    data: {
      title: '어린왕자',
      author: '앙투안 드 생텍쥐페리',
      publisher: '문학동네',
      publishedAt: '1943',
      description: '어른들에게 잃어버린 동심을 일깨워주는 영원한 고전',
      category: '소설',
      pages: 120,
      source: 'MANUAL',
    },
  })

  const book2 = await prisma.book.create({
    data: {
      title: '코스모스',
      author: '칼 세이건',
      publisher: '사이언스북스',
      publishedAt: '1980',
      description: '우주에 대한 경이로운 탐험서',
      category: '과학',
      pages: 450,
      source: 'MANUAL',
    },
  })

  // Create sample reviews
  const review1 = await prisma.review.create({
    data: {
      title: '어린왕자를 다시 읽으며',
      content: '어른이 되어 다시 읽는 어린왕자는 어릴 때와는 다른 감동을 줍니다. 바오밥나무의 의미, 장미의 소중함, 그리고 본질을 보는 눈에 대해 다시 생각해보게 되었습니다.',
      isRecommended: true,
      rating: 5,
      tags: '["고전", "철학", "동화"]',
      userId: user1.id,
      bookId: book1.id,
    },
  })

  const review2 = await prisma.review.create({
    data: {
      title: '우주의 신비를 탐험하다',
      content: '칼 세이건의 코스모스는 과학을 어렵지 않게 설명해주는 명작입니다. 우주의 광대함과 인간의 작음을 동시에 느끼게 해주는 책입니다.',
      isRecommended: true,
      rating: 5,
      tags: '["과학", "우주", "천문학"]',
      userId: user2.id,
      bookId: book2.id,
    },
  })

  // Create sample likes
  await prisma.like.create({
    data: {
      userId: user2.id,
      reviewId: review1.id,
    },
  })

  await prisma.like.create({
    data: {
      userId: user1.id,
      reviewId: review2.id,
    },
  })

  // Create sample comments
  await prisma.comment.create({
    data: {
      content: '정말 공감가는 리뷰네요! 저도 어른이 되어 읽은 어린왕자가 더 깊게 와닿았어요.',
      userId: user2.id,
      reviewId: review1.id,
    },
  })

  await prisma.comment.create({
    data: {
      content: '코스모스는 정말 명작이죠. 과학에 대한 흥미를 불러일으켜 준 책입니다.',
      userId: user1.id,
      reviewId: review2.id,
    },
  })

  // Create sample follow relationship
  await prisma.follow.create({
    data: {
      followerId: user1.id,
      followingId: user2.id,
    },
  })

  console.log('✅ Database seed completed successfully!')
  console.log(`👤 Created users: ${user1.nickname}, ${user2.nickname}`)
  console.log(`📚 Created books: ${book1.title}, ${book2.title}`)
  console.log(`📝 Created reviews: 2`)
  console.log(`❤️ Created likes: 2`)
  console.log(`💬 Created comments: 2`)
  console.log(`👥 Created follows: 1`)
}

main()
  .catch((e) => {
    console.error('❌ Database seed failed:')
    console.error(e)
    process.exit(1)
  })
  .finally(() => {
    return prisma.$disconnect()
  })
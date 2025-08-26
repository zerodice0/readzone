import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🌱 Starting database seed...')

    // Clean existing data
    await prisma.notification.deleteMany()
    await prisma.comment.deleteMany()
    await prisma.like.deleteMany()
    await prisma.follow.deleteMany()
    await prisma.review.deleteMany()
    await prisma.book.deleteMany()
    await prisma.user.deleteMany()

    console.log('🧹 Cleaned existing data')

    // Create sample users
    const hashedPassword = await bcrypt.hash('password123', 12)

    const users = await Promise.all([
      prisma.user.create({
        data: {
          userid: 'bookworm_kim',
          email: 'reader1@readzone.com',
          nickname: '책벌레김',
          password: hashedPassword,
          bio: '매일 한 권씩 읽는 것이 목표입니다.',
          isVerified: true
        }
      }),
      prisma.user.create({
        data: {
          userid: 'literature_girl',
          email: 'reader2@readzone.com',
          nickname: '문학소녀',
          password: hashedPassword,
          bio: '소설과 에세이를 주로 읽습니다.',
          isVerified: true
        }
      }),
      prisma.user.create({
        data: {
          userid: 'knowledge_seeker',
          email: 'reader3@readzone.com',
          nickname: '지식탐구자',
          password: hashedPassword,
          bio: '자기계발서와 비즈니스 도서 위주로 읽어요.',
          isVerified: true
        }
      })
    ])

    console.log('👥 Created sample users')

    // Create sample books
    const books = await Promise.all([
      prisma.book.create({
        data: {
          title: '어린왕자',
          author: '앙투안 드 생텍쥐페리',
          publisher: '민음사',
          publishedAt: '1943',
          description: '사막에 불시착한 비행사가 만난 어린왕자와의 이야기',
          category: '소설',
          pages: 120,
          source: 'MANUAL'
        }
      }),
      prisma.book.create({
        data: {
          title: '미움받을 용기',
          author: '기시미 이치로, 고가 후미타케',
          publisher: '인플루엔셜',
          publishedAt: '2014',
          description: '아들러 심리학을 바탕으로 한 자기계발서',
          category: '자기계발',
          pages: 336,
          source: 'MANUAL'
        }
      }),
      prisma.book.create({
        data: {
          title: '1984',
          author: '조지 오웰',
          publisher: '민음사',
          publishedAt: '1949',
          description: '전체주의 사회를 그린 디스토피아 소설',
          category: '소설',
          pages: 424,
          source: 'MANUAL'
        }
      }),
      prisma.book.create({
        data: {
          title: '사피엔스',
          author: '유발 하라리',
          publisher: '김영사',
          publishedAt: '2011',
          description: '호모 사피엔스의 역사와 미래를 다룬 인문학서',
          category: '인문학',
          pages: 636,
          source: 'MANUAL'
        }
      }),
      prisma.book.create({
        data: {
          title: '아몬드',
          author: '손원평',
          publisher: '창비',
          publishedAt: '2017',
          description: '감정을 느끼지 못하는 소년의 성장 이야기',
          category: '소설',
          pages: 267,
          source: 'MANUAL'
        }
      })
    ])

    console.log('📚 Created sample books')

    // Create sample reviews with more diverse content
    const reviews = await Promise.all([
      prisma.review.create({
        data: {
          title: '어린왕자를 읽고',
          content: '어른이 되어 다시 읽는 어린왕자는 어린 시절과는 다른 감동을 줍니다. 어른들의 세계에 대한 날카로운 비판과 순수함에 대한 그리움이 마음 깊이 와 닿았습니다. 특히 "정말 중요한 것은 눈에 보이지 않는다"는 구절이 가슴에 남습니다.',
          isRecommended: true,
          rating: 5,
          tags: '["고전", "철학", "성찰"]',
          userId: users[0].id,
          bookId: books[0].id
        }
      }),
      prisma.review.create({
        data: {
          title: '미움받을 용기 - 인생을 바꾼 책',
          content: '아들러 심리학을 쉽게 풀어서 설명한 책입니다. 타인의 시선에 얽매이지 않고 자신만의 길을 걸어가는 용기에 대해 많은 것을 배웠습니다. 특히 과제분리 개념이 인상 깊었어요.',
          isRecommended: true,
          rating: 4,
          tags: '["심리학", "자기계발", "철학"]',
          userId: users[2].id,
          bookId: books[1].id
        }
      }),
      prisma.review.create({
        data: {
          title: '1984 - 현실이 된 예언',
          content: '조지 오웰의 1984는 70년이 지난 지금도 여전히 현실적입니다. 빅브라더의 감시 사회, 언어의 조작, 역사의 왜곡... 현재 우리 사회의 모습과 겹쳐보이는 부분들이 많아서 섬뜩했습니다.',
          isRecommended: true,
          rating: 5,
          tags: '["디스토피아", "정치", "고전"]',
          userId: users[1].id,
          bookId: books[2].id
        }
      }),
      prisma.review.create({
        data: {
          title: '사피엔스 - 인류사의 거대한 서사',
          content: '유발 하라리의 사피엔스는 인류의 역사를 새로운 관점에서 바라보게 해주는 책입니다. 농업 혁명부터 과학 혁명까지, 인류가 어떻게 지구의 지배종이 되었는지 흥미롭게 설명합니다. 다소 어려운 부분도 있지만 충분히 읽을 만합니다.',
          isRecommended: true,
          rating: 4,
          tags: '["역사", "인류학", "철학"]',
          userId: users[0].id,
          bookId: books[3].id
        }
      }),
      prisma.review.create({
        data: {
          title: '아몬드 - 따뜻한 성장소설',
          content: '감정을 느끼지 못하는 소년 윤재의 이야기가 담담하면서도 깊이 있게 그려집니다. 다름을 받아들이고 이해하려는 노력, 그리고 진정한 성장이 무엇인지 생각해보게 하는 소설이었습니다.',
          isRecommended: true,
          rating: 4,
          tags: '["성장소설", "청소년", "감동"]',
          userId: users[1].id,
          bookId: books[4].id
        }
      }),
      prisma.review.create({
        data: {
          title: '어린왕자 재독후기',
          content: '10년 만에 다시 읽은 어린왕자. 예전에는 그냥 동화로 읽었는데, 이번에는 어른의 시선으로 읽으니 완전히 다른 책이 된 것 같습니다. 바오밥나무 이야기는 정말 깊은 의미가 있네요.',
          isRecommended: true,
          rating: 5,
          tags: '["재독", "고전", "성찰"]',
          userId: users[2].id,
          bookId: books[0].id
        }
      })
    ])

    console.log('📝 Created sample reviews')

    // Create sample likes
    const likes = await Promise.all([
      prisma.like.create({
        data: {
          userId: users[1].id,
          reviewId: reviews[0].id
        }
      }),
      prisma.like.create({
        data: {
          userId: users[2].id,
          reviewId: reviews[0].id
        }
      }),
      prisma.like.create({
        data: {
          userId: users[0].id,
          reviewId: reviews[1].id
        }
      }),
      prisma.like.create({
        data: {
          userId: users[2].id,
          reviewId: reviews[2].id
        }
      })
    ])

    console.log('👍 Created sample likes')

    // Create sample comments
    const comments = await Promise.all([
      prisma.comment.create({
        data: {
          content: '정말 공감되는 리뷰네요! 저도 어른이 되어서 읽으니 완전히 다른 느낌이었어요.',
          userId: users[1].id,
          reviewId: reviews[0].id
        }
      }),
      prisma.comment.create({
        data: {
          content: '미움받을 용기 정말 추천합니다. 인생관이 바뀐 책 중 하나예요.',
          userId: users[0].id,
          reviewId: reviews[1].id
        }
      }),
      prisma.comment.create({
        data: {
          content: '1984는 정말 무서운 책이에요. 현실이 소설을 따라가고 있는 것 같아서...',
          userId: users[0].id,
          reviewId: reviews[2].id
        }
      })
    ])

    console.log('💬 Created sample comments')

    // Create sample follows
    await Promise.all([
      prisma.follow.create({
        data: {
          followerId: users[0].id,
          followingId: users[1].id
        }
      }),
      prisma.follow.create({
        data: {
          followerId: users[1].id,
          followingId: users[2].id
        }
      }),
      prisma.follow.create({
        data: {
          followerId: users[2].id,
          followingId: users[0].id
        }
      })
    ])

    console.log('🤝 Created sample follows')

    console.log('✅ Database seeded successfully!')
    console.log(`
📊 Created:
- ${users.length} users
- ${books.length} books  
- ${reviews.length} reviews
- ${likes.length} likes
- ${comments.length} comments
- 3 follows
    `)
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
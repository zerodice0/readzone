import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

async function main() {
  console.log('샘플 데이터 생성 시작...')

  // 테스트 사용자 생성
  const hashedPassword = await bcrypt.hash('test123456', 12)
  
  const testUser = await db.user.upsert({
    where: { email: 'test@readzone.com' },
    update: {},
    create: {
      email: 'test@readzone.com',
      password: hashedPassword,
      nickname: '테스트유저',
      name: '테스트 사용자',
      emailVerified: new Date(),
      bio: '독서를 사랑하는 테스트 사용자입니다.',
    }
  })

  // 샘플 도서 생성
  const sampleBooks = [
    {
      id: 'book-1',
      title: '클린 코드',
      authors: JSON.stringify(['로버트 C. 마틴']),
      publisher: '인사이트',
      genre: '프로그래밍',
      pageCount: 584,
      thumbnail: 'https://image.yes24.com/goods/11681152/XL',
      description: '애자일 소프트웨어 장인 정신',
      isManualEntry: false,
      isbn: '9788966260959'
    },
    {
      id: 'book-2', 
      title: '해리 포터와 마법사의 돌',
      authors: JSON.stringify(['J.K. 롤링']),
      publisher: '문학수첩',
      genre: '판타지',
      pageCount: 328,
      thumbnail: 'https://image.yes24.com/goods/8909344/XL',
      description: '마법사 해리 포터의 첫 번째 모험',
      isManualEntry: false,
      isbn: '9788983920775'
    },
    {
      id: 'book-3',
      title: '나미야 잡화점의 기적',
      authors: JSON.stringify(['히가시노 게이고']),
      publisher: '현대문학',
      genre: '소설',
      pageCount: 448,
      thumbnail: 'https://image.yes24.com/goods/8373336/XL',
      description: '시간을 초월한 기적 같은 이야기',
      isManualEntry: false,
      isbn: '9788972756194'
    }
  ]

  const books = await Promise.all(
    sampleBooks.map(book => 
      db.book.upsert({
        where: { id: book.id },
        update: {},
        create: book
      })
    )
  )

  // 샘플 독후감 생성
  const sampleReviews = [
    {
      title: '개발자라면 반드시 읽어야 할 필독서',
      content: `<h2>클린 코드에 대한 나의 생각</h2>
<p>이 책은 정말 <strong>개발자의 바이블</strong>이라고 할 수 있습니다. 코드를 작성하는 것과 <em>좋은 코드</em>를 작성하는 것은 완전히 다른 차원의 이야기라는 것을 깨닫게 해준 책입니다.</p>
<blockquote>
<p>"깨끗한 코드는 한 가지를 제대로 한다."</p>
</blockquote>
<p>특히 인상 깊었던 부분은:</p>
<ul>
<li>의미 있는 이름 짓기의 중요성</li>
<li>함수는 작게, 하나의 일만 하도록</li>
<li>주석보다는 코드 자체가 설명이 되도록</li>
</ul>
<p>실무에 바로 적용할 수 있는 실용적인 내용들이 가득해서 책상에 두고 계속 참고하고 있습니다.</p>`,
      isRecommended: true,
      tags: JSON.stringify(['프로그래밍', '개발', '클린코드', 'best-practice']),
      userId: testUser.id,
      bookId: books[0].id,
      purchaseLink: 'https://www.yes24.com/Product/Goods/11681152'
    },
    {
      title: '마법 같은 스토리텔링의 힘',
      content: `<h2>어른이 되어 다시 읽은 해리 포터</h2>
<p>어릴 때 읽었던 기억과는 또 다른 감동이 있었습니다. <strong>J.K. 롤링</strong>의 상상력은 정말 경이롭습니다.</p>
<p>특히 호그와트라는 <em>마법학교</em>의 설정이나, 각 캐릭터들의 개성이 너무나 생생해서 마치 실제로 존재하는 것처럼 느껴졌습니다.</p>
<h3>인상 깊었던 장면들</h3>
<ol>
<li>해리가 처음 대각선에서 마법 지팡이를 고르는 장면</li>
<li>호그와트 급행열차에서 론과 헤르미온느를 만나는 장면</li>
<li>마지막 퀴디치 경기에서의 스니치 캐치</li>
</ol>
<p>아이들뿐만 아니라 어른들도 충분히 즐길 수 있는 <strong>판타지 걸작</strong>입니다!</p>`,
      isRecommended: true,
      tags: JSON.stringify(['판타지', '소설', '해리포터', '마법']),
      userId: testUser.id,
      bookId: books[1].id,
      purchaseLink: 'https://www.yes24.com/Product/Goods/8909344'
    },
    {
      title: '감동적인 스토리, 아쉬운 결말',
      content: `<h2>시간을 초월한 연결의 의미</h2>
<p><strong>히가시노 게이고</strong>의 독특한 상상력이 돋보이는 작품이었습니다. 과거와 현재를 연결하는 편지라는 소재가 정말 신선했어요.</p>
<p>등장인물들의 고민과 갈등이 현실적이면서도, 그것을 해결해나가는 과정에서 <em>따뜻한 인간애</em>를 느낄 수 있었습니다.</p>
<blockquote>
<p>"누군가를 도울 수 있다는 것, 그 자체가 기적이다."</p>
</blockquote>
<p>다만 결말 부분에서 약간의 아쉬움이 있었습니다. 조금 더 명확한 설명이 있었다면 더 좋았을 것 같아요.</p>
<p>그래도 전체적으로는 <strong>추천할 만한 소설</strong>입니다. 특히 인간관계에 대해 생각해볼 수 있게 해주는 좋은 책이에요.</p>`,
      isRecommended: true,
      tags: JSON.stringify(['소설', '감동', '시간여행', '인간애']),
      userId: testUser.id,
      bookId: books[2].id,
      purchaseLink: 'https://www.yes24.com/Product/Goods/8373336'
    }
  ]

  const reviews = await Promise.all(
    sampleReviews.map(review => 
      db.bookReview.create({
        data: review
      })
    )
  )

  console.log('✅ 샘플 데이터 생성 완료!')
  console.log(`- 사용자: ${testUser.nickname} (${testUser.email})`)
  console.log(`- 도서: ${books.length}권`)
  console.log(`- 독후감: ${reviews.length}개`)
}

main()
  .catch((e) => {
    console.error('❌ 에러:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
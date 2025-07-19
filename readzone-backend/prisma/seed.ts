import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const sampleBooks = [
  {
    isbn: '9788937462788',
    title: '1Q84',
    authors: ['무라카미 하루키'],
    publisher: '민음사',
    publishedDate: new Date('2009-05-29'),
    description: '무라카미 하루키의 대표작 중 하나로, 현실과 환상이 교차하는 독특한 세계를 그린 소설',
    thumbnail: 'https://search1.kakaocdn.net/thumb/R120x174.q85/?fname=http%3A%2F%2Ft1.daumcdn.net%2Flbook%2Fimage%2F1467038%3Ftimestamp%3D20161104142724',
    categories: ['소설', '일본문학'],
    pageCount: 1200,
    price: 15000,
    salePrice: 13500,
    url: 'http://www.yes24.com/Product/Goods/2836301'
  },
  {
    isbn: '9788937437472',
    title: '미움받을 용기',
    authors: ['기시미 이치로', '고가 후미타케'],
    publisher: '인플루엔셜',
    publishedDate: new Date('2014-11-17'),
    description: '아들러 심리학을 바탕으로 한 자기계발서로, 타인의 시선에 얽매이지 않는 삶을 제시',
    thumbnail: 'https://search1.kakaocdn.net/thumb/R120x174.q85/?fname=http%3A%2F%2Ft1.daumcdn.net%2Flbook%2Fimage%2F1467038%3Ftimestamp%3D20161104142724',
    categories: ['자기계발', '심리학'],
    pageCount: 336,
    price: 14800,
    salePrice: 13320,
    url: 'http://www.yes24.com/Product/Goods/15980538'
  },
  {
    isbn: '9788932917245',
    title: '사피엔스',
    authors: ['유발 하라리'],
    publisher: '김영사',
    publishedDate: new Date('2015-11-02'),
    description: '인류의 역사를 거시적 관점에서 조망한 베스트셀러 교양서',
    thumbnail: 'https://search1.kakaocdn.net/thumb/R120x174.q85/?fname=http%3A%2F%2Ft1.daumcdn.net%2Flbook%2Fimage%2F1467038%3Ftimestamp%3D20161104142724',
    categories: ['역사', '인류학'],
    pageCount: 636,
    price: 22000,
    salePrice: 19800,
    url: 'http://www.yes24.com/Product/Goods/23030284'
  },
  {
    isbn: '9788954655044',
    title: '코스모스',
    authors: ['칼 세이건'],
    publisher: '사이언스북스',
    publishedDate: new Date('2006-12-20'),
    description: '천문학과 우주과학을 대중에게 알린 고전적 교양서',
    thumbnail: 'https://search1.kakaocdn.net/thumb/R120x174.q85/?fname=http%3A%2F%2Ft1.daumcdn.net%2Flbook%2Fimage%2F1467038%3Ftimestamp%3D20161104142724',
    categories: ['과학', '천문학'],
    pageCount: 512,
    price: 17000,
    salePrice: 15300,
    url: 'http://www.yes24.com/Product/Goods/2980140'
  },
  {
    isbn: '9788932473901',
    title: '데미안',
    authors: ['헤르만 헤세'],
    publisher: '민음사',
    publishedDate: new Date('2019-06-28'),
    description: '성장의 의미를 찾아가는 한 소년의 이야기를 통해 자아 발견의 여정을 그린 고전',
    thumbnail: 'https://search1.kakaocdn.net/thumb/R120x174.q85/?fname=http%3A%2F%2Ft1.daumcdn.net%2Flbook%2Fimage%2F1467038%3Ftimestamp%3D20161104142724',
    categories: ['소설', '독일문학'],
    pageCount: 248,
    price: 9800,
    salePrice: 8820,
    url: 'http://www.yes24.com/Product/Goods/75825874'
  }
];

const sampleUsers = [
  {
    email: 'alice@example.com',
    username: 'alice',
    displayName: '앨리스',
    bio: '책을 사랑하는 독서광입니다. 특히 소설과 에세이를 좋아해요.',
    avatar: null,
    isPublic: true
  },
  {
    email: 'bob@example.com',
    username: 'bob',
    displayName: '밥',
    bio: '과학 도서와 역사서를 즐겨 읽습니다.',
    avatar: null,
    isPublic: true
  },
  {
    email: 'charlie@example.com',
    username: 'charlie',
    displayName: '찰리',
    bio: '자기계발서와 비즈니스 도서에 관심이 많아요.',
    avatar: null,
    isPublic: true
  }
];

const samplePosts = [
  {
    userEmail: 'alice@example.com',
    bookIsbn: '9788937462788',
    content: '1Q84를 읽고 있는데 정말 흥미진진해요! 무라카미 하루키 특유의 환상적인 분위기가 매력적입니다. 현실과 환상의 경계가 모호한 느낌이 독특하고, 캐릭터들의 심리 묘사가 인상적이에요.',
    rating: 4,
    readingProgress: 65,
    tags: ['소설', '일본문학', '무라카미하루키'],
    isPublic: true
  },
  {
    userEmail: 'bob@example.com',
    bookIsbn: '9788932917245',
    content: '사피엔스를 완독했습니다. 인류의 역사를 이렇게 거시적으로 바라본 관점이 새로웠어요. 특히 인지혁명 부분이 인상 깊었습니다. 우리가 어떻게 지금의 문명을 이룩했는지 생각해보게 되는 책이네요.',
    rating: 5,
    readingProgress: 100,
    tags: ['역사', '인류학', '교양'],
    isPublic: true
  },
  {
    userEmail: 'charlie@example.com',
    bookIsbn: '9788937437472',
    content: '미움받을 용기를 읽으면서 많은 것을 배웠어요. 타인의 시선에 얽매이지 않고 자신의 길을 가는 것의 중요성을 깨달았습니다. 아들러 심리학이 이렇게 실용적일 줄 몰랐네요.',
    rating: 4,
    readingProgress: 80,
    tags: ['자기계발', '심리학', '아들러'],
    isPublic: true
  },
  {
    userEmail: 'alice@example.com',
    bookIsbn: '9788932473901',
    content: '데미안을 다시 읽어보니 예전에 놓쳤던 부분들이 보여요. 성장의 과정에서 겪는 갈등과 고민이 잘 표현되어 있고, 자아 발견의 여정이 깊이 있게 그려져 있습니다.',
    rating: 5,
    readingProgress: 100,
    tags: ['소설', '독일문학', '성장소설'],
    isPublic: true
  },
  {
    userEmail: 'bob@example.com',
    bookIsbn: '9788954655044',
    content: '코스모스를 읽으면서 우주의 광활함에 감탄했어요. 칼 세이건의 서정적인 문체로 과학을 설명하는 방식이 매력적입니다. 천문학에 대한 관심이 더욱 높아졌네요.',
    rating: 4,
    readingProgress: 45,
    tags: ['과학', '천문학', '칼세이건'],
    isPublic: true
  }
];

async function main() {
  console.log('🌱 시드 데이터 생성을 시작합니다...');

  // 기존 데이터 삭제 (개발 환경에서만)
  if (process.env.NODE_ENV === 'development') {
    console.log('🗑️ 기존 데이터를 삭제합니다...');
    await prisma.like.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.post.deleteMany();
    await prisma.libraryBook.deleteMany();
    await prisma.readingGoal.deleteMany();
    await prisma.follow.deleteMany();
    await prisma.book.deleteMany();
    await prisma.user.deleteMany();
  }

  // 사용자 생성
  console.log('👥 사용자 데이터를 생성합니다...');
  const users = [];
  for (const userData of sampleUsers) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
        emailVerified: true
      }
    });
    users.push(user);
    console.log(`  ✅ 사용자 생성: ${user.username}`);
  }

  // 책 생성
  console.log('📚 도서 데이터를 생성합니다...');
  const books = [];
  for (const bookData of sampleBooks) {
    const book = await prisma.book.create({
      data: bookData
    });
    books.push(book);
    console.log(`  ✅ 도서 생성: ${book.title}`);
  }

  // 게시글 생성
  console.log('📝 게시글 데이터를 생성합니다...');
  for (const postData of samplePosts) {
    const user = users.find(u => u.email === postData.userEmail);
    const book = books.find(b => b.isbn === postData.bookIsbn);
    
    if (user && book) {
      await prisma.post.create({
        data: {
          userId: user.id,
          bookId: book.id,
          content: postData.content,
          rating: postData.rating,
          readingProgress: postData.readingProgress,
          tags: postData.tags,
          isPublic: postData.isPublic
        }
      });
      console.log(`  ✅ 게시글 생성: ${user.username} - ${book.title}`);
    }
  }

  // 팔로우 관계 생성
  console.log('🤝 팔로우 관계를 생성합니다...');
  const alice = users.find(u => u.username === 'alice');
  const bob = users.find(u => u.username === 'bob');
  const charlie = users.find(u => u.username === 'charlie');

  if (alice && bob && charlie) {
    // Alice가 Bob을 팔로우
    await prisma.follow.create({
      data: {
        followerId: alice.id,
        followingId: bob.id
      }
    });
    
    // Bob이 Charlie를 팔로우
    await prisma.follow.create({
      data: {
        followerId: bob.id,
        followingId: charlie.id
      }
    });
    
    // Charlie가 Alice를 팔로우
    await prisma.follow.create({
      data: {
        followerId: charlie.id,
        followingId: alice.id
      }
    });
    
    console.log('  ✅ 팔로우 관계 생성 완료');
  }

  // 독서 목표 생성
  console.log('🎯 독서 목표를 생성합니다...');
  const currentYear = new Date().getFullYear();
  
  for (const user of users) {
    await prisma.readingGoal.create({
      data: {
        userId: user.id,
        year: currentYear,
        booksTarget: Math.floor(Math.random() * 20) + 10, // 10-30권 목표
        pagesTarget: Math.floor(Math.random() * 5000) + 3000, // 3000-8000페이지 목표
        booksRead: Math.floor(Math.random() * 8) + 1, // 1-8권 읽음
        pagesRead: Math.floor(Math.random() * 2000) + 500 // 500-2500페이지 읽음
      }
    });
    console.log(`  ✅ ${user.username}의 독서 목표 생성`);
  }

  // 일부 게시글에 좋아요 추가
  console.log('❤️ 좋아요 데이터를 생성합니다...');
  const posts = await prisma.post.findMany();
  
  const postsToLike = posts.slice(0, 3);
  for (let i = 0; i < postsToLike.length; i++) {
    const post = postsToLike[i];
    if (post) {
      // 각 게시글에 랜덤한 사용자들이 좋아요
      const randomUsers = users.sort(() => Math.random() - 0.5).slice(0, 2);
      
      for (const user of randomUsers) {
        if (user.id !== post.userId) { // 자신의 게시글에는 좋아요 하지 않음
          await prisma.like.create({
            data: {
              userId: user.id,
              postId: post.id
            }
          });
        }
      }
    }
  }
  console.log('  ✅ 좋아요 데이터 생성 완료');

  // 댓글 생성
  console.log('💬 댓글 데이터를 생성합니다...');
  const sampleComments = [
    '정말 좋은 책이네요! 저도 읽어보고 싶어요.',
    '리뷰가 너무 잘 쓰여져 있어서 도움이 됐어요.',
    '이 책 추천해주셔서 감사합니다!',
    '비슷한 책을 찾고 있었는데 딱 맞는 것 같아요.',
    '다음에 읽을 책 목록에 추가했어요.'
  ];
  
  const postsToComment = posts.slice(0, 3);
  for (let j = 0; j < postsToComment.length; j++) {
    const post = postsToComment[j];
    if (post) {
      const randomUser = users.find(u => u.id !== post.userId);
      if (randomUser) {
        const randomComment = sampleComments[Math.floor(Math.random() * sampleComments.length)];
        if (randomComment) {
          await prisma.comment.create({
            data: {
              postId: post.id,
              userId: randomUser.id,
              content: randomComment
            }
          });
        }
      }
    }
  }
  console.log('  ✅ 댓글 데이터 생성 완료');

  console.log('🎉 시드 데이터 생성이 완료되었습니다!');
  console.log('\n📊 생성된 데이터:');
  console.log(`  - 사용자: ${users.length}명`);
  console.log(`  - 도서: ${books.length}권`);
  console.log(`  - 게시글: ${samplePosts.length}개`);
  console.log(`  - 팔로우 관계: 3개`);
  console.log(`  - 독서 목표: ${users.length}개`);
  console.log('\n🔑 테스트 계정:');
  console.log('  - alice@example.com / password123');
  console.log('  - bob@example.com / password123');
  console.log('  - charlie@example.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ 시드 데이터 생성 중 오류가 발생했습니다:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
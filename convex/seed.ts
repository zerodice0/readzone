import { mutation, MutationCtx } from './_generated/server';
import { v } from 'convex/values';
import { Id } from './_generated/dataModel';

/**
 * Seed script for populating sample data
 * Run this manually from Convex dashboard or CLI:
 * npx convex run seed:seedAll
 */

// Sample book data (10 books)
const sampleBooks = [
  {
    title: '1984',
    author: '조지 오웰',
    isbn: '9788937460777',
    publisher: '민음사',
    publishedDate: new Date('2003-01-10').getTime(),
    coverImageUrl:
      'https://image.aladin.co.kr/product/31/64/cover500/8937460777_1.jpg',
    description:
      '전체주의 국가에서 개인의 자유와 사생활이 억압당하는 디스토피아를 그린 조지 오웰의 대표작. 빅 브라더의 감시 아래 진실이 왜곡되는 사회를 통해 권력의 본질을 날카롭게 파헤친다.',
    pageCount: 395,
    language: 'ko',
  },
  {
    title: '멋진 신세계',
    author: '올더스 헉슬리',
    isbn: '9788932917245',
    publisher: '소담출판사',
    publishedDate: new Date('2015-07-01').getTime(),
    coverImageUrl:
      'https://image.aladin.co.kr/product/7245/34/cover500/8932917248_1.jpg',
    description:
      '과학기술이 극도로 발달한 미래 사회의 어두운 단면을 그린 디스토피아 소설. 안락과 행복이 강요되는 세계에서 인간성의 의미를 묻는다.',
    pageCount: 356,
    language: 'ko',
  },
  {
    title: '호밀밭의 파수꾼',
    author: 'J.D. 샐린저',
    isbn: '9788937462672',
    publisher: '민음사',
    publishedDate: new Date('2001-05-01').getTime(),
    coverImageUrl:
      'https://image.aladin.co.kr/product/267/2/cover500/8937462672_1.jpg',
    description:
      '방황하는 청소년 홀든 콜필드의 3일간의 이야기를 통해 성장의 아픔과 순수함을 잃어가는 현대 사회를 비판한 현대 고전.',
    pageCount: 304,
    language: 'ko',
  },
  {
    title: '죽은 시인의 사회',
    author: 'N.H. 클라인바움',
    isbn: '9788934942467',
    publisher: '김영사',
    publishedDate: new Date('2010-03-19').getTime(),
    coverImageUrl:
      'https://image.aladin.co.kr/product/2467/42/cover500/8934942460_1.jpg',
    description:
      '억압적인 교육 환경 속에서 키팅 선생님을 통해 진정한 자유와 열정을 찾아가는 학생들의 이야기.',
    pageCount: 232,
    language: 'ko',
  },
  {
    title: '연금술사',
    author: '파울로 코엘료',
    isbn: '9788982814471',
    publisher: '문학동네',
    publishedDate: new Date('2001-11-26').getTime(),
    coverImageUrl:
      'https://image.aladin.co.kr/product/1447/14/cover500/8982814477_1.jpg',
    description:
      '꿈을 찾아 떠나는 소년 산티아고의 여정을 통해 자신의 운명을 발견하고 꿈을 실현하는 과정을 그린 우화적 소설.',
    pageCount: 228,
    language: 'ko',
  },
  {
    title: '어린 왕자',
    author: '생텍쥐페리',
    isbn: '9788932917245',
    publisher: '문학동네',
    publishedDate: new Date('2007-01-25').getTime(),
    coverImageUrl:
      'https://image.aladin.co.kr/product/172/45/cover500/8954618502_1.jpg',
    description:
      '사막에 불시착한 조종사가 만난 어린 왕자와의 대화를 통해 인간 본연의 순수함과 사랑의 의미를 전하는 세계적 베스트셀러.',
    pageCount: 120,
    language: 'ko',
  },
  {
    title: '데미안',
    author: '헤르만 헤세',
    isbn: '9788937460883',
    publisher: '민음사',
    publishedDate: new Date('2000-01-20').getTime(),
    coverImageUrl:
      'https://image.aladin.co.kr/product/883/60/cover500/8937460882_1.jpg',
    description:
      '소년 싱클레어가 친구 데미안을 통해 내면의 자아를 발견하고 성장하는 과정을 그린 성장 소설의 고전.',
    pageCount: 223,
    language: 'ko',
  },
  {
    title: '변신',
    author: '프란츠 카프카',
    isbn: '9788937462672',
    publisher: '민음사',
    publishedDate: new Date('1998-06-15').getTime(),
    coverImageUrl:
      'https://image.aladin.co.kr/product/267/2/cover500/8937462672_2.jpg',
    description:
      '어느 날 아침 벌레로 변한 그레고르 잠자의 비극적 운명을 통해 인간 소외와 실존의 문제를 탐구한 카프카의 대표작.',
    pageCount: 168,
    language: 'ko',
  },
  {
    title: '노인과 바다',
    author: '어니스트 헤밍웨이',
    isbn: '9788937461088',
    publisher: '민음사',
    publishedDate: new Date('2012-10-26').getTime(),
    coverImageUrl:
      'https://image.aladin.co.kr/product/1088/61/cover500/8937461080_1.jpg',
    description:
      '84일간 물고기를 잡지 못한 노어부 산티아고가 거대한 청새치와 사투를 벌이는 이야기. 인간의 존엄성과 불굴의 의지를 그린 명작.',
    pageCount: 132,
    language: 'ko',
  },
  {
    title: '위대한 개츠비',
    author: 'F. 스콧 피츠제럴드',
    isbn: '9788937462993',
    publisher: '민음사',
    publishedDate: new Date('2009-02-25').getTime(),
    coverImageUrl:
      'https://image.aladin.co.kr/product/2993/62/cover500/8937462990_1.jpg',
    description:
      '1920년대 미국 재즈 시대를 배경으로 사랑과 꿈, 환멸을 그린 미국 문학의 걸작. 개츠비의 비극적 사랑 이야기.',
    pageCount: 253,
    language: 'ko',
  },
];

// Sample review templates
const reviewTemplates = {
  positive: [
    {
      title: '인생 책으로 추천합니다',
      contentTemplate: (bookTitle: string) =>
        `${bookTitle}을(를) 읽고 정말 많은 것을 느꼈습니다. 작가의 통찰력 있는 시선과 깊이 있는 메시지가 오랫동안 기억에 남을 것 같습니다. 특히 현대 사회를 살아가는 우리에게 시사하는 바가 크다고 생각합니다.\n\n책을 읽는 내내 몰입감이 대단했고, 마지막 장을 덮고 나서도 여운이 길게 남았습니다. 많은 분들께 강력히 추천합니다.`,
      rating: 5,
      isRecommended: true,
    },
    {
      title: '다시 읽고 싶은 책',
      contentTemplate: (bookTitle: string) =>
        `${bookTitle}은(는) 읽을 때마다 새로운 의미를 발견하게 되는 책입니다. 처음 읽었을 때는 단순히 흥미로운 이야기로만 느껴졌지만, 다시 읽으면서 작가가 전달하고자 했던 깊은 메시지를 이해할 수 있었습니다.\n\n문장 하나하나가 아름답고, 등장인물들의 심리 묘사가 매우 섬세합니다. 시간이 지나도 색바래지 않을 명작이라고 생각합니다.`,
      rating: 5,
      isRecommended: true,
    },
    {
      title: '기대 이상이었습니다',
      contentTemplate: (bookTitle: string) =>
        `${bookTitle}을(를) 우연히 접하게 되었는데, 기대 이상으로 좋았습니다. 이야기 전개가 자연스럽고 인물들이 매우 입체적으로 그려져 있어 공감하면서 읽었습니다.\n\n특히 중반부 이후의 전개는 정말 손에서 책을 놓을 수 없을 정도로 긴장감 넘쳤습니다. 마지막까지 몰입해서 단숨에 읽었습니다. 강추!`,
      rating: 4,
      isRecommended: true,
    },
  ],
  mixed: [
    {
      title: '좋았지만 아쉬운 부분도',
      contentTemplate: (bookTitle: string) =>
        `${bookTitle}은(는) 전반적으로 좋은 책이었지만, 몇 가지 아쉬운 점도 있었습니다. 주제 의식은 명확하고 작가의 메시지도 잘 전달되었으나, 중간에 이야기 전개가 다소 느려지는 부분이 있어 집중력이 떨어졌습니다.\n\n그럼에도 불구하고 전체적인 완성도는 높았고, 읽을 만한 가치가 있는 책이라고 생각합니다.`,
      rating: 3,
      isRecommended: true,
    },
    {
      title: '호불호가 갈릴 것 같아요',
      contentTemplate: (bookTitle: string) =>
        `${bookTitle}을(를) 읽고 나서 많은 생각을 하게 되었습니다. 작가의 독특한 문체와 서술 방식이 인상적이었지만, 동시에 호불호가 갈릴 수 있을 것 같습니다.\n\n개인적으로는 흥미롭게 읽었지만, 모든 사람에게 추천하기는 어려울 것 같습니다. 이런 스타일을 좋아하시는 분들께는 좋을 것 같아요.`,
      rating: 3,
      isRecommended: false,
    },
  ],
};

// Helper function for seeding logic
async function performSeed(ctx: MutationCtx) {
  const createdBooks: Array<{
    id: Id<'books'>;
    title: string;
    author: string;
    coverImageUrl?: string;
    description?: string;
    publishedYear?: number;
    isbn?: string;
  }> = [];
  const createdReviews: Id<'reviews'>[] = [];

  // Create books
  for (const bookData of sampleBooks) {
    const bookId = await ctx.db.insert('books', bookData);
    createdBooks.push({ id: bookId, ...bookData });
    console.log(`Created book: ${bookData.title}`);
  }

  // Create reviews for each book
  // Use placeholder user IDs (in real app, these would be actual Clerk user IDs)
  const sampleUserIds = ['user_sample_1', 'user_sample_2', 'user_sample_3'];

  for (const book of createdBooks) {
    // 2-3 reviews per book
    const numReviews = Math.floor(Math.random() * 2) + 2; // 2 or 3

    for (let i = 0; i < numReviews; i++) {
      const isPositive = Math.random() > 0.3; // 70% positive reviews
      const templateCategory = isPositive ? 'positive' : 'mixed';
      const templates = reviewTemplates[templateCategory];
      const template = templates[Math.floor(Math.random() * templates.length)];

      const userId = sampleUserIds[i % sampleUserIds.length];
      const publishedAt = new Date(
        Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
      ).getTime(); // Random date within last 30 days

      const reviewId = await ctx.db.insert('reviews', {
        userId,
        bookId: book.id,
        title: template.title,
        content: template.contentTemplate(book.title),
        rating: template.rating,
        isRecommended: template.isRecommended,
        readStatus: 'COMPLETED',
        status: 'PUBLISHED',
        likeCount: Math.floor(Math.random() * 50), // Random likes 0-49
        bookmarkCount: Math.floor(Math.random() * 20), // Random bookmarks 0-19
        viewCount: Math.floor(Math.random() * 200), // Random views 0-199
        publishedAt,
      });

      createdReviews.push(reviewId);
      console.log(`Created review for: ${book.title}`);
    }
  }

  return {
    booksCreated: createdBooks.length,
    reviewsCreated: createdReviews.length,
  };
}

/**
 * Seed all sample data
 * Creates 10 books and 2-3 reviews per book
 */
export const seedAll = mutation({
  args: {},
  handler: async (ctx) => {
    console.log('Starting seed process...');

    // Check if data already exists
    const existingBooks = await ctx.db.query('books').collect();
    if (existingBooks.length > 0) {
      throw new Error(
        `Database already contains ${existingBooks.length} books. Clear data first or use seedIfEmpty.`
      );
    }

    const result = await performSeed(ctx);

    console.log(
      `Seed complete! Created ${result.booksCreated} books and ${result.reviewsCreated} reviews.`
    );

    return {
      success: true,
      booksCreated: result.booksCreated,
      reviewsCreated: result.reviewsCreated,
      message: `Successfully seeded ${result.booksCreated} books and ${result.reviewsCreated} reviews`,
    };
  },
});

/**
 * Seed data only if database is empty
 * Safe to run multiple times
 */
export const seedIfEmpty = mutation({
  args: {},
  handler: async (ctx) => {
    const existingBooks = await ctx.db.query('books').collect();

    if (existingBooks.length > 0) {
      return {
        success: false,
        message: `Database already contains ${existingBooks.length} books. Skipping seed.`,
      };
    }

    console.log('Database is empty, seeding data...');
    const result = await performSeed(ctx);

    return {
      success: true,
      booksCreated: result.booksCreated,
      reviewsCreated: result.reviewsCreated,
      message: `Successfully seeded ${result.booksCreated} books and ${result.reviewsCreated} reviews`,
    };
  },
});

/**
 * Clear all data (use with caution!)
 * Removes all books, reviews, likes, and bookmarks
 */
export const clearAll = mutation({
  args: {
    confirm: v.boolean(),
  },
  handler: async (ctx, args) => {
    if (!args.confirm) {
      throw new Error(
        'Must pass confirm: true to clear all data. This action cannot be undone!'
      );
    }

    // Delete all reviews first (foreign key constraint)
    const reviews = await ctx.db.query('reviews').collect();
    for (const review of reviews) {
      await ctx.db.delete(review._id);
    }

    // Delete all likes
    const likes = await ctx.db.query('likes').collect();
    for (const like of likes) {
      await ctx.db.delete(like._id);
    }

    // Delete all bookmarks
    const bookmarks = await ctx.db.query('bookmarks').collect();
    for (const bookmark of bookmarks) {
      await ctx.db.delete(bookmark._id);
    }

    // Delete all books
    const books = await ctx.db.query('books').collect();
    for (const book of books) {
      await ctx.db.delete(book._id);
    }

    console.log(
      `Cleared ${books.length} books, ${reviews.length} reviews, ${likes.length} likes, ${bookmarks.length} bookmarks`
    );

    return {
      success: true,
      message: `Cleared all data: ${books.length} books, ${reviews.length} reviews, ${likes.length} likes, ${bookmarks.length} bookmarks`,
    };
  },
});

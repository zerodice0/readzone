import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // 테스트 사용자 생성
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const user1 = await prisma.user.upsert({
    where: { email: 'test1@example.com' },
    update: {},
    create: {
      email: 'test1@example.com',
      password: hashedPassword,
      nickname: '독서광',
      emailVerified: new Date(),
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'test2@example.com' },
    update: {},
    create: {
      email: 'test2@example.com',
      password: hashedPassword,
      nickname: '책벌레',
      emailVerified: new Date(),
    },
  });

  // 테스트 도서 생성
  const books = await Promise.all([
    prisma.book.create({
      data: {
        title: '아몬드',
        authors: '손원평',
        publisher: '창비',
        genre: '소설',
        pageCount: 264,
        description: '감정을 느끼지 못하는 소년의 특별한 성장 이야기',
      },
    }),
    prisma.book.create({
      data: {
        title: '역행자',
        authors: '자청',
        publisher: '웅진지식하우스',
        genre: '자기계발',
        pageCount: 280,
        description: '돈, 시간, 정신의 자유를 얻는 역행자의 7단계 인생 공략법',
      },
    }),
    prisma.book.create({
      data: {
        title: '불편한 편의점',
        authors: '김호연',
        publisher: '나무옆의자',
        genre: '소설',
        pageCount: 288,
        description: '서울역 노숙인과 편의점이 만나 벌어지는 따뜻한 이야기',
      },
    }),
  ]);

  // 테스트 독후감 생성
  await Promise.all([
    prisma.bookReview.create({
      data: {
        userId: user1.id,
        bookId: books[0].id,
        title: '감정의 의미를 생각하게 하는 책',
        content: `아몬드를 읽고 나서 감정이란 무엇인지, 그리고 우리가 당연하게 여기는 감정들이 얼마나 소중한지 다시 한번 생각해보게 되었습니다.

주인공 윤재는 편도체가 작아 감정을 느끼지 못하는 아이입니다. 하지만 그런 윤재가 곤이를 만나고, 도라를 만나면서 조금씩 변화하는 모습이 인상적이었습니다.

특히 윤재가 감정을 이해하려고 노력하는 모습에서, 우리가 타인의 감정을 이해하려면 얼마나 많은 노력이 필요한지 깨달았습니다. 감정을 느끼지 못하는 윤재가 오히려 더 순수하게 타인을 바라볼 수 있었던 것처럼, 때로는 감정에 휩쓸리지 않고 상황을 객관적으로 바라보는 것도 필요하다는 생각이 들었습니다.`,
        isRecommended: true,
        tags: '["소설", "성장", "감동", "청소년"]',
        createdAt: new Date('2024-01-15'),
      },
    }),
    prisma.bookReview.create({
      data: {
        userId: user2.id,
        bookId: books[1].id,
        title: '인생을 바꾸는 역행의 지혜',
        content: `역행자는 단순한 자기계발서가 아니라 실용적인 인생 가이드북입니다. 저자가 제시하는 7단계 공략법은 매우 구체적이고 실천 가능한 방법들로 가득합니다.

특히 '역행자의 사고방식'이라는 개념이 인상적이었습니다. 남들과 다른 길을 가는 것이 아니라, 본질을 꿰뚫어보고 효율적인 방법을 찾아가는 것이 진정한 역행이라는 점에서 큰 깨달음을 얻었습니다.

무엇보다 이 책의 장점은 저자의 실제 경험에 기반한 조언들이라는 점입니다. 이론만 나열하는 것이 아니라, 직접 실천하고 검증한 방법들을 소개하기 때문에 신뢰가 갑니다.`,
        isRecommended: true,
        tags: '["자기계발", "동기부여", "실용", "성공"]',
        createdAt: new Date('2024-01-20'),
      },
    }),
    prisma.bookReview.create({
      data: {
        userId: user1.id,
        bookId: books[2].id,
        content: `불편한 편의점은 제목처럼 처음엔 불편하지만, 읽을수록 편안해지는 책입니다. 서울역 노숙인 독고와 편의점 알바생 시현의 만남은 우연처럼 보이지만, 사실 필연적이었던 것 같습니다.

이 책의 가장 큰 매력은 등장인물들의 따뜻함입니다. 독고 씨의 투박하지만 진실된 마음, 시현이의 순수함, 그리고 편의점을 찾는 다양한 사람들의 이야기가 하나로 어우러져 큰 감동을 줍니다.

편의점이라는 공간이 단순히 물건을 사고파는 곳이 아니라, 사람들의 삶이 교차하는 특별한 장소가 될 수 있다는 것을 보여줍니다. 우리 주변의 평범한 공간들도 누군가에게는 특별한 의미가 될 수 있다는 것을 깨닫게 해준 책입니다.`,
        isRecommended: true,
        tags: '["소설", "힐링", "감동", "일상"]',
        createdAt: new Date('2024-01-25'),
      },
    }),
  ]);

  console.log('Seed data created successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
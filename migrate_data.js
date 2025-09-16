const { PrismaClient } = require('@prisma/client');

// Neon에서 데이터 가져오기
async function exportFromNeon() {
  const neonPrisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://neondb_owner:npg_kwXI7vWLO3nJ@ep-summer-surf-a1uy261e-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
      }
    }
  });

  try {
    console.log('🔄 Connecting to Neon database...');
    
    const data = {
      users: await neonPrisma.user.findMany(),
      accounts: await neonPrisma.account.findMany(),
      books: await neonPrisma.book.findMany(),
      reviews: await neonPrisma.review.findMany(),
      reviewDrafts: await neonPrisma.reviewDraft.findMany(),
      comments: await neonPrisma.comment.findMany(),
      likes: await neonPrisma.like.findMany(),
      follows: await neonPrisma.follow.findMany(),
      notifications: await neonPrisma.notification.findMany(),
      refreshTokens: await neonPrisma.refreshToken.findMany()
    };

    console.log('📊 Neon data export summary:');
    Object.entries(data).forEach(([table, records]) => {
      console.log(`   ${table}: ${records.length} records`);
    });

    return data;
  } finally {
    await neonPrisma.$disconnect();
  }
}

// 로컬 데이터베이스에 데이터 삽입
async function importToLocal(data) {
  const localPrisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://readzone:***REMOVED_DB_PASSWORD***@localhost:5432/readzone_db?sslmode=disable"
      }
    }
  });

  try {
    console.log('🔄 Connecting to local database...');

    // 외래키 제약조건은 Prisma가 자동으로 처리합니다

    // 순서대로 데이터 삽입 (외래키 관계 고려)
    console.log('📥 Importing users...');
    for (const user of data.users) {
      await localPrisma.user.create({ data: user });
    }

    console.log('📥 Importing accounts...');
    for (const account of data.accounts) {
      await localPrisma.account.create({ data: account });
    }

    console.log('📥 Importing books...');
    for (const book of data.books) {
      await localPrisma.book.create({ data: book });
    }

    console.log('📥 Importing reviews...');
    for (const review of data.reviews) {
      await localPrisma.review.create({ data: review });
    }

    console.log('📥 Importing review drafts...');
    for (const draft of data.reviewDrafts) {
      await localPrisma.reviewDraft.create({ data: draft });
    }

    console.log('📥 Importing comments...');
    for (const comment of data.comments) {
      await localPrisma.comment.create({ data: comment });
    }

    console.log('📥 Importing likes...');
    for (const like of data.likes) {
      await localPrisma.like.create({ data: like });
    }

    console.log('📥 Importing follows...');
    for (const follow of data.follows) {
      await localPrisma.follow.create({ data: follow });
    }

    console.log('📥 Importing notifications...');
    for (const notification of data.notifications) {
      await localPrisma.notification.create({ data: notification });
    }

    console.log('📥 Importing refresh tokens...');
    for (const token of data.refreshTokens) {
      await localPrisma.refreshToken.create({ data: token });
    }

    // 데이터 삽입 완료

    console.log('✅ Data migration completed successfully!');

    // 데이터 카운트 확인
    const counts = {
      users: await localPrisma.user.count(),
      accounts: await localPrisma.account.count(),
      books: await localPrisma.book.count(),
      reviews: await localPrisma.review.count(),
      reviewDrafts: await localPrisma.reviewDraft.count(),
      comments: await localPrisma.comment.count(),
      likes: await localPrisma.like.count(),
      follows: await localPrisma.follow.count(),
      notifications: await localPrisma.notification.count(),
      refreshTokens: await localPrisma.refreshToken.count()
    };

    console.log('📊 Local database summary:');
    Object.entries(counts).forEach(([table, count]) => {
      console.log(`   ${table}: ${count} records`);
    });

  } finally {
    await localPrisma.$disconnect();
  }
}

async function main() {
  try {
    console.log('🚀 Starting data migration from Neon to Local PostgreSQL...');
    
    const data = await exportFromNeon();
    await importToLocal(data);
    
    console.log('🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

main();
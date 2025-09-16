const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://readzone:***REMOVED_DB_PASSWORD***@localhost:5432/readzone_db?sslmode=disable"
      }
    }
  });
  
  try {
    console.log('🔄 Testing local database connection...');
    
    // 기본 연결 테스트
    const userCount = await prisma.user.count();
    const bookCount = await prisma.book.count();
    const reviewCount = await prisma.review.count();
    
    console.log('✅ Database connection successful!');
    console.log(`📊 Current data:
  - Users: ${userCount}
  - Books: ${bookCount} 
  - Reviews: ${reviewCount}`);
    
    // 관계 테스트
    const userWithReviews = await prisma.user.findFirst({
      include: {
        reviews: {
          include: {
            book: true
          }
        }
      }
    });
    
    if (userWithReviews) {
      console.log(`✅ Relationships working: User "${userWithReviews.nickname}" has ${userWithReviews.reviews.length} review(s)`);
    }
    
    console.log('🎉 All tests passed! Migration is successful.');
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
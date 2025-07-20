import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Test user data
export const testUsers = {
  user1: {
    email: 'test1@example.com',
    username: 'testuser1',
    password: 'password123',
    displayName: 'Test User 1'
  },
  user2: {
    email: 'test2@example.com',
    username: 'testuser2',
    password: 'password123',
    displayName: 'Test User 2'
  }
};

// Test book data
export const testBooks = {
  book1: {
    isbn: '9788934942467',
    title: '테스트 도서 1',
    author: '테스트 작가 1',
    publisher: '테스트 출판사',
    publishedDate: '2023-01-01',
    description: '테스트용 도서 설명',
    thumbnail: 'https://example.com/book1.jpg',
    pageCount: 300
  },
  book2: {
    isbn: '9788934942468',
    title: '테스트 도서 2',
    author: '테스트 작가 2',
    publisher: '테스트 출판사',
    publishedDate: '2023-02-01',
    description: '테스트용 도서 설명 2',
    thumbnail: 'https://example.com/book2.jpg',
    pageCount: 250
  }
};

// Create test user and return user data with token
export async function createTestUser(userData = testUsers.user1) {
  const hashedPassword = await bcrypt.hash(userData.password, 10);
  
  const user = await prisma.user.create({
    data: {
      email: userData.email,
      username: userData.username,
      password: hashedPassword,
      displayName: userData.displayName
    }
  });

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );

  return { user, token };
}

// Create multiple test users
export async function createTestUsers() {
  const user1Data = await createTestUser(testUsers.user1);
  const user2Data = await createTestUser(testUsers.user2);
  
  return {
    user1: user1Data,
    user2: user2Data
  };
}

// Create test book
export async function createTestBook(bookData = testBooks.book1) {
  return await prisma.book.create({
    data: bookData
  });
}

// Create test post
export async function createTestPost(userId: string, bookId: string, content = '테스트 독서 기록') {
  return await prisma.post.create({
    data: {
      content,
      userId,
      bookId,
      isPublic: true
    }
  });
}

// Create test reading goal
export async function createTestReadingGoal(userId: string, year = 2024, targetCount = 12) {
  return await prisma.readingGoal.create({
    data: {
      userId,
      year,
      targetCount,
      currentCount: 0
    }
  });
}

// Generate authorization header
export function getAuthHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}

// Wait for a specified time (useful for rate limiting tests)
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Assert error response format
export function expectErrorResponse(response: any, statusCode: number, errorMessage?: string) {
  expect(response.status).toBe(statusCode);
  expect(response.body).toHaveProperty('success', false);
  expect(response.body).toHaveProperty('error');
  expect(response.body.error).toHaveProperty('message');
  
  if (errorMessage) {
    expect(response.body.error.message).toContain(errorMessage);
  }
}

// Assert success response format
export function expectSuccessResponse(response: any, statusCode = 200) {
  expect(response.status).toBe(statusCode);
  expect(response.body).toHaveProperty('success', true);
  expect(response.body).toHaveProperty('data');
}

// Clean up specific data
export async function cleanupTestData() {
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.libraryBook.deleteMany();
  await prisma.readingGoal.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.book.deleteMany();
  await prisma.user.deleteMany();
}
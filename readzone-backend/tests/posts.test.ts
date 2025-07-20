import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import postRoutes from '../src/routes/postRoutes';
import { auth } from '../src/middleware/auth';
import { errorHandler } from '../src/middleware/errorHandler';
import { 
  createTestUser, 
  createTestUsers,
  createTestBook,
  createTestPost,
  testBooks,
  getAuthHeader,
  expectErrorResponse, 
  expectSuccessResponse,
  cleanupTestData 
} from './helpers/testHelpers';

// Create test app
const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/posts', postRoutes);

// Error handling
app.use(errorHandler);

describe('Posts Endpoints', () => {
  let user1: any, user2: any;
  let book1: any, book2: any;

  beforeEach(async () => {
    await cleanupTestData();
    
    // Create test users
    const users = await createTestUsers();
    user1 = users.user1;
    user2 = users.user2;
    
    // Create test books
    book1 = await createTestBook(testBooks.book1);
    book2 = await createTestBook(testBooks.book2);
  });

  describe('POST /api/posts', () => {
    it('should create a new post successfully', async () => {
      const postData = {
        content: '정말 좋은 책이었습니다. 추천해요!',
        bookId: book1.id,
        isPublic: true,
        rating: 5,
        tags: ['추천', '감동']
      };

      const response = await request(app)
        .post('/api/posts')
        .set(getAuthHeader(user1.token))
        .send(postData);

      expectSuccessResponse(response, 201);
      expect(response.body.data.post.content).toBe(postData.content);
      expect(response.body.data.post.bookId).toBe(book1.id);
      expect(response.body.data.post.userId).toBe(user1.user.id);
      expect(response.body.data.post.isPublic).toBe(true);
      expect(response.body.data.post.rating).toBe(5);
    });

    it('should create a private post', async () => {
      const postData = {
        content: '개인적인 독서 기록',
        bookId: book1.id,
        isPublic: false
      };

      const response = await request(app)
        .post('/api/posts')
        .set(getAuthHeader(user1.token))
        .send(postData);

      expectSuccessResponse(response, 201);
      expect(response.body.data.post.isPublic).toBe(false);
    });

    it('should return 400 for missing required fields', async () => {
      const postData = {
        content: '내용은 있지만 bookId가 없음'
        // Missing bookId
      };

      const response = await request(app)
        .post('/api/posts')
        .set(getAuthHeader(user1.token))
        .send(postData);

      expectErrorResponse(response, 400);
    });

    it('should return 400 for invalid bookId', async () => {
      const postData = {
        content: '내용',
        bookId: 'invalid-book-id'
      };

      const response = await request(app)
        .post('/api/posts')
        .set(getAuthHeader(user1.token))
        .send(postData);

      expectErrorResponse(response, 400);
    });

    it('should return 401 for unauthenticated user', async () => {
      const postData = {
        content: '내용',
        bookId: book1.id
      };

      const response = await request(app)
        .post('/api/posts')
        .send(postData);

      expectErrorResponse(response, 401);
    });
  });

  describe('GET /api/posts', () => {
    beforeEach(async () => {
      // Create some test posts
      await createTestPost(user1.user.id, book1.id, '공개 포스트 1');
      await createTestPost(user1.user.id, book2.id, '공개 포스트 2');
      await createTestPost(user2.user.id, book1.id, '다른 사용자 포스트');
    });

    it('should return public posts with pagination', async () => {
      const response = await request(app)
        .get('/api/posts')
        .query({ page: 1, limit: 10 });

      expectSuccessResponse(response);
      expect(response.body.data.posts).toBeInstanceOf(Array);
      expect(response.body.data.posts.length).toBeGreaterThan(0);
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page');
      expect(response.body.data.pagination).toHaveProperty('limit');
      expect(response.body.data.pagination).toHaveProperty('total');
    });

    it('should include user and book information in posts', async () => {
      const response = await request(app)
        .get('/api/posts');

      expectSuccessResponse(response);
      const post = response.body.data.posts[0];
      expect(post).toHaveProperty('user');
      expect(post).toHaveProperty('book');
      expect(post.user).toHaveProperty('username');
      expect(post.book).toHaveProperty('title');
    });

    it('should support search by query', async () => {
      const response = await request(app)
        .get('/api/posts')
        .query({ q: '공개' });

      expectSuccessResponse(response);
      expect(response.body.data.posts.length).toBeGreaterThan(0);
      response.body.data.posts.forEach((post: any) => {
        expect(post.content).toMatch(/공개/);
      });
    });

    it('should filter by userId', async () => {
      const response = await request(app)
        .get('/api/posts')
        .query({ userId: user1.user.id });

      expectSuccessResponse(response);
      response.body.data.posts.forEach((post: any) => {
        expect(post.userId).toBe(user1.user.id);
      });
    });
  });

  describe('GET /api/posts/:id', () => {
    let testPost: any;

    beforeEach(async () => {
      testPost = await createTestPost(user1.user.id, book1.id, '테스트 포스트 상세');
    });

    it('should return post details', async () => {
      const response = await request(app)
        .get(`/api/posts/${testPost.id}`);

      expectSuccessResponse(response);
      expect(response.body.data.post.id).toBe(testPost.id);
      expect(response.body.data.post.content).toBe('테스트 포스트 상세');
      expect(response.body.data.post).toHaveProperty('user');
      expect(response.body.data.post).toHaveProperty('book');
      expect(response.body.data.post).toHaveProperty('comments');
    });

    it('should return 404 for non-existent post', async () => {
      const response = await request(app)
        .get('/api/posts/non-existent-id');

      expectErrorResponse(response, 404, '게시글을 찾을 수 없습니다');
    });
  });

  describe('PUT /api/posts/:id', () => {
    let testPost: any;

    beforeEach(async () => {
      testPost = await createTestPost(user1.user.id, book1.id, '수정 전 내용');
    });

    it('should update own post successfully', async () => {
      const updateData = {
        content: '수정된 내용',
        isPublic: false,
        rating: 4
      };

      const response = await request(app)
        .put(`/api/posts/${testPost.id}`)
        .set(getAuthHeader(user1.token))
        .send(updateData);

      expectSuccessResponse(response);
      expect(response.body.data.post.content).toBe('수정된 내용');
      expect(response.body.data.post.isPublic).toBe(false);
      expect(response.body.data.post.rating).toBe(4);
    });

    it('should return 403 when trying to update another user\'s post', async () => {
      const updateData = {
        content: '다른 사용자가 수정 시도'
      };

      const response = await request(app)
        .put(`/api/posts/${testPost.id}`)
        .set(getAuthHeader(user2.token))
        .send(updateData);

      expectErrorResponse(response, 403, '이 게시글을 수정할 권한이 없습니다');
    });

    it('should return 404 for non-existent post', async () => {
      const updateData = {
        content: '수정 내용'
      };

      const response = await request(app)
        .put('/api/posts/non-existent-id')
        .set(getAuthHeader(user1.token))
        .send(updateData);

      expectErrorResponse(response, 404, '게시글을 찾을 수 없습니다');
    });

    it('should return 401 for unauthenticated user', async () => {
      const updateData = {
        content: '수정 내용'
      };

      const response = await request(app)
        .put(`/api/posts/${testPost.id}`)
        .send(updateData);

      expectErrorResponse(response, 401);
    });
  });

  describe('DELETE /api/posts/:id', () => {
    let testPost: any;

    beforeEach(async () => {
      testPost = await createTestPost(user1.user.id, book1.id, '삭제될 포스트');
    });

    it('should delete own post successfully', async () => {
      const response = await request(app)
        .delete(`/api/posts/${testPost.id}`)
        .set(getAuthHeader(user1.token));

      expectSuccessResponse(response, 204);
    });

    it('should return 403 when trying to delete another user\'s post', async () => {
      const response = await request(app)
        .delete(`/api/posts/${testPost.id}`)
        .set(getAuthHeader(user2.token));

      expectErrorResponse(response, 403, '이 게시글을 삭제할 권한이 없습니다');
    });

    it('should return 404 for non-existent post', async () => {
      const response = await request(app)
        .delete('/api/posts/non-existent-id')
        .set(getAuthHeader(user1.token));

      expectErrorResponse(response, 404, '게시글을 찾을 수 없습니다');
    });

    it('should return 401 for unauthenticated user', async () => {
      const response = await request(app)
        .delete(`/api/posts/${testPost.id}`);

      expectErrorResponse(response, 401);
    });
  });
});
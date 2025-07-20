import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import userRoutes from '../src/routes/userRoutes';
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
app.use('/api/users', userRoutes);

// Error handling
app.use(errorHandler);

describe('Users Endpoints', () => {
  let user1: any, user2: any;
  let book1: any;

  beforeEach(async () => {
    await cleanupTestData();
    
    // Create test users
    const users = await createTestUsers();
    user1 = users.user1;
    user2 = users.user2;
    
    // Create test book
    book1 = await createTestBook(testBooks.book1);
  });

  describe('GET /api/users/:id', () => {
    it('should get user profile successfully', async () => {
      const response = await request(app)
        .get(`/api/users/${user1.user.id}`);

      expectSuccessResponse(response);
      expect(response.body.data.user.id).toBe(user1.user.id);
      expect(response.body.data.user.username).toBe(user1.user.username);
      expect(response.body.data.user.email).toBe(user1.user.email);
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should include user statistics', async () => {
      // Create some posts for the user
      await createTestPost(user1.user.id, book1.id, '포스트 1');
      await createTestPost(user1.user.id, book1.id, '포스트 2');

      const response = await request(app)
        .get(`/api/users/${user1.user.id}`);

      expectSuccessResponse(response);
      expect(response.body.data.user).toHaveProperty('_count');
      expect(response.body.data.user._count).toHaveProperty('posts');
      expect(response.body.data.user._count).toHaveProperty('followers');
      expect(response.body.data.user._count).toHaveProperty('following');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/users/non-existent-id');

      expectErrorResponse(response, 404, '사용자를 찾을 수 없습니다');
    });
  });

  describe('GET /api/users/:id/posts', () => {
    beforeEach(async () => {
      // Create some posts
      await createTestPost(user1.user.id, book1.id, '공개 포스트');
      await createTestPost(user1.user.id, book1.id, '비공개 포스트');
    });

    it('should get user posts with pagination', async () => {
      const response = await request(app)
        .get(`/api/users/${user1.user.id}/posts`)
        .query({ page: 1, limit: 10 });

      expectSuccessResponse(response);
      expect(response.body.data.posts).toBeInstanceOf(Array);
      expect(response.body.data).toHaveProperty('pagination');
      
      // All posts should belong to the user
      response.body.data.posts.forEach((post: any) => {
        expect(post.userId).toBe(user1.user.id);
      });
    });

    it('should include book information in posts', async () => {
      const response = await request(app)
        .get(`/api/users/${user1.user.id}/posts`);

      expectSuccessResponse(response);
      
      if (response.body.data.posts.length > 0) {
        const post = response.body.data.posts[0];
        expect(post).toHaveProperty('book');
        expect(post.book).toHaveProperty('title');
      }
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/users/non-existent-id/posts');

      expectErrorResponse(response, 404, '사용자를 찾을 수 없습니다');
    });
  });

  describe('POST /api/users/:id/follow', () => {
    it('should follow user successfully', async () => {
      const response = await request(app)
        .post(`/api/users/${user2.user.id}/follow`)
        .set(getAuthHeader(user1.token));

      expectSuccessResponse(response, 201);
      expect(response.body.data.following).toBe(true);
    });

    it('should return 400 when trying to follow yourself', async () => {
      const response = await request(app)
        .post(`/api/users/${user1.user.id}/follow`)
        .set(getAuthHeader(user1.token));

      expectErrorResponse(response, 400, '자기 자신을 팔로우할 수 없습니다');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .post('/api/users/non-existent-id/follow')
        .set(getAuthHeader(user1.token));

      expectErrorResponse(response, 404, '사용자를 찾을 수 없습니다');
    });

    it('should return 401 for unauthenticated user', async () => {
      const response = await request(app)
        .post(`/api/users/${user2.user.id}/follow`);

      expectErrorResponse(response, 401);
    });
  });

  describe('DELETE /api/users/:id/follow', () => {
    beforeEach(async () => {
      // Create follow relationship
      await request(app)
        .post(`/api/users/${user2.user.id}/follow`)
        .set(getAuthHeader(user1.token));
    });

    it('should unfollow user successfully', async () => {
      const response = await request(app)
        .delete(`/api/users/${user2.user.id}/follow`)
        .set(getAuthHeader(user1.token));

      expectSuccessResponse(response);
      expect(response.body.data.following).toBe(false);
    });

    it('should return 400 when trying to unfollow yourself', async () => {
      const response = await request(app)
        .delete(`/api/users/${user1.user.id}/follow`)
        .set(getAuthHeader(user1.token));

      expectErrorResponse(response, 400, '자기 자신을 언팔로우할 수 없습니다');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .delete('/api/users/non-existent-id/follow')
        .set(getAuthHeader(user1.token));

      expectErrorResponse(response, 404, '사용자를 찾을 수 없습니다');
    });

    it('should return 401 for unauthenticated user', async () => {
      const response = await request(app)
        .delete(`/api/users/${user2.user.id}/follow`);

      expectErrorResponse(response, 401);
    });
  });

  describe('GET /api/users/:id/followers', () => {
    beforeEach(async () => {
      // Create follow relationship
      await request(app)
        .post(`/api/users/${user2.user.id}/follow`)
        .set(getAuthHeader(user1.token));
    });

    it('should get user followers', async () => {
      const response = await request(app)
        .get(`/api/users/${user2.user.id}/followers`)
        .query({ page: 1, limit: 10 });

      expectSuccessResponse(response);
      expect(response.body.data.followers).toBeInstanceOf(Array);
      expect(response.body.data).toHaveProperty('pagination');
      
      if (response.body.data.followers.length > 0) {
        const follower = response.body.data.followers[0];
        expect(follower).toHaveProperty('follower');
        expect(follower.follower.id).toBe(user1.user.id);
      }
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/users/non-existent-id/followers');

      expectErrorResponse(response, 404, '사용자를 찾을 수 없습니다');
    });
  });

  describe('GET /api/users/:id/following', () => {
    beforeEach(async () => {
      // Create follow relationship
      await request(app)
        .post(`/api/users/${user2.user.id}/follow`)
        .set(getAuthHeader(user1.token));
    });

    it('should get user following', async () => {
      const response = await request(app)
        .get(`/api/users/${user1.user.id}/following`)
        .query({ page: 1, limit: 10 });

      expectSuccessResponse(response);
      expect(response.body.data.following).toBeInstanceOf(Array);
      expect(response.body.data).toHaveProperty('pagination');
      
      if (response.body.data.following.length > 0) {
        const following = response.body.data.following[0];
        expect(following).toHaveProperty('following');
        expect(following.following.id).toBe(user2.user.id);
      }
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/users/non-existent-id/following');

      expectErrorResponse(response, 404, '사용자를 찾을 수 없습니다');
    });
  });
});
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import authRoutes from '../src/routes/authRoutes';
import { errorHandler } from '../src/middleware/errorHandler';
import { 
  testUsers, 
  createTestUser, 
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

// Disable rate limiting for tests
app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // High limit for tests
  message: { success: false, error: { message: '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.' } }
}));

// Routes
app.use('/api/auth', authRoutes);

// Error handling
app.use(errorHandler);

describe('Authentication Endpoints', () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        username: 'newuser',
        password: 'password123',
        displayName: 'New User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expectSuccessResponse(response, 201);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.username).toBe(userData.username);
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should return 400 for invalid email format', async () => {
      const userData = {
        email: 'invalid-email',
        username: 'testuser',
        password: 'password123',
        displayName: 'Test User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expectErrorResponse(response, 400);
    });

    it('should return 400 for short password', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        password: '123',
        displayName: 'Test User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expectErrorResponse(response, 400);
    });

    it('should return 400 for missing required fields', async () => {
      const userData = {
        email: 'test@example.com'
        // Missing username, password, displayName
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expectErrorResponse(response, 400);
    });

    it('should return 409 for duplicate email', async () => {
      // First registration
      await createTestUser(testUsers.user1);

      // Try to register with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUsers.user1);

      expectErrorResponse(response, 409, '이미 사용 중인 이메일입니다');
    });

    it('should return 409 for duplicate username', async () => {
      // First registration
      await createTestUser(testUsers.user1);

      // Try to register with same username but different email
      const userData = {
        ...testUsers.user1,
        email: 'different@example.com'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expectErrorResponse(response, 409, '이미 사용 중인 사용자명입니다');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await createTestUser(testUsers.user1);
    });

    it('should login with valid credentials', async () => {
      const loginData = {
        email: testUsers.user1.email,
        password: testUsers.user1.password
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expectSuccessResponse(response);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe(testUsers.user1.email);
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should login with username instead of email', async () => {
      const loginData = {
        email: testUsers.user1.username, // Using username
        password: testUsers.user1.password
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expectSuccessResponse(response);
      expect(response.body.data.user.username).toBe(testUsers.user1.username);
    });

    it('should return 401 for invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: testUsers.user1.password
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expectErrorResponse(response, 401, '이메일 또는 비밀번호가 올바르지 않습니다');
    });

    it('should return 401 for invalid password', async () => {
      const loginData = {
        email: testUsers.user1.email,
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expectErrorResponse(response, 401, '이메일 또는 비밀번호가 올바르지 않습니다');
    });

    it('should return 400 for missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({});

      expectErrorResponse(response, 400);
    });
  });

  describe('GET /api/auth/me', () => {
    let authToken: string;
    let userId: string;

    beforeEach(async () => {
      const { user, token } = await createTestUser(testUsers.user1);
      authToken = token;
      userId = user.id;
    });

    it('should return user info for authenticated user', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expectSuccessResponse(response);
      expect(response.body.data.user.id).toBe(userId);
      expect(response.body.data.user.email).toBe(testUsers.user1.email);
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should return 401 for missing token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expectErrorResponse(response, 401, '토큰이 필요합니다');
    });

    it('should return 403 for invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expectErrorResponse(response, 403, '유효하지 않은 토큰입니다');
    });

    it('should return 403 for malformed token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'InvalidFormat');

      expectErrorResponse(response, 401, '토큰이 필요합니다');
    });
  });
});
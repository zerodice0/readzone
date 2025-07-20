import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { auth } from '../src/middleware/auth';
import { errorHandler } from '../src/middleware/errorHandler';
import { createTestUser, expectErrorResponse, expectSuccessResponse, cleanupTestData } from './helpers/testHelpers';

describe('Middleware Tests', () => {
  let app: express.Application;

  beforeEach(async () => {
    await cleanupTestData();
    
    // Create fresh app for each test
    app = express();
    app.use(express.json());
  });

  describe('Auth Middleware', () => {
    let validToken: string;
    let validUserId: string;

    beforeEach(async () => {
      const { user, token } = await createTestUser();
      validToken = token;
      validUserId = user.id;

      // Create test route that uses auth middleware
      app.get('/test-auth', auth, (req: any, res) => {
        res.json({
          success: true,
          data: {
            userId: req.user.userId,
            email: req.user.email
          }
        });
      });

      app.use(errorHandler);
    });

    it('should allow access with valid token', async () => {
      const response = await request(app)
        .get('/test-auth')
        .set('Authorization', `Bearer ${validToken}`);

      expectSuccessResponse(response);
      expect(response.body.data.userId).toBe(validUserId);
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/test-auth');

      expectErrorResponse(response, 401, '토큰이 필요합니다');
    });

    it('should reject request with invalid token format', async () => {
      const response = await request(app)
        .get('/test-auth')
        .set('Authorization', 'InvalidFormat');

      expectErrorResponse(response, 401, '토큰이 필요합니다');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/test-auth')
        .set('Authorization', 'Bearer invalid-token-here');

      expectErrorResponse(response, 403, '유효하지 않은 토큰입니다');
    });

    it('should reject request with expired token', async () => {
      // Create expired token
      const expiredToken = jwt.sign(
        { userId: validUserId, email: 'test@example.com' },
        process.env.JWT_SECRET!,
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      const response = await request(app)
        .get('/test-auth')
        .set('Authorization', `Bearer ${expiredToken}`);

      expectErrorResponse(response, 403, '유효하지 않은 토큰입니다');
    });

    it('should reject request with malformed JWT', async () => {
      const response = await request(app)
        .get('/test-auth')
        .set('Authorization', 'Bearer not.a.jwt');

      expectErrorResponse(response, 403, '유효하지 않은 토큰입니다');
    });

    it('should attach user info to request object', async () => {
      const response = await request(app)
        .get('/test-auth')
        .set('Authorization', `Bearer ${validToken}`);

      expectSuccessResponse(response);
      expect(response.body.data).toHaveProperty('userId');
      expect(response.body.data).toHaveProperty('email');
      expect(response.body.data.userId).toBe(validUserId);
    });
  });

  describe('Error Handler Middleware', () => {
    beforeEach(() => {
      // Create test routes that throw different types of errors
      app.get('/test-validation-error', (req, res, next) => {
        const error = new Error('Validation failed');
        (error as any).status = 400;
        (error as any).details = { field: 'email', message: 'Invalid email format' };
        next(error);
      });

      app.get('/test-not-found-error', (req, res, next) => {
        const error = new Error('Resource not found');
        (error as any).status = 404;
        next(error);
      });

      app.get('/test-unauthorized-error', (req, res, next) => {
        const error = new Error('Unauthorized access');
        (error as any).status = 401;
        next(error);
      });

      app.get('/test-generic-error', (req, res, next) => {
        const error = new Error('Something went wrong');
        next(error);
      });

      app.get('/test-async-error', async (req, res, next) => {
        try {
          throw new Error('Async error occurred');
        } catch (error) {
          next(error);
        }
      });

      app.use(errorHandler);
    });

    it('should handle validation errors (400)', async () => {
      const response = await request(app)
        .get('/test-validation-error');

      expectErrorResponse(response, 400, 'Validation failed');
      expect(response.body.error).toHaveProperty('details');
    });

    it('should handle not found errors (404)', async () => {
      const response = await request(app)
        .get('/test-not-found-error');

      expectErrorResponse(response, 404, 'Resource not found');
    });

    it('should handle unauthorized errors (401)', async () => {
      const response = await request(app)
        .get('/test-unauthorized-error');

      expectErrorResponse(response, 401, 'Unauthorized access');
    });

    it('should handle generic errors as 500', async () => {
      const response = await request(app)
        .get('/test-generic-error');

      expectErrorResponse(response, 500, 'Something went wrong');
    });

    it('should handle async errors', async () => {
      const response = await request(app)
        .get('/test-async-error');

      expectErrorResponse(response, 500, 'Async error occurred');
    });

    it('should return proper error format', async () => {
      const response = await request(app)
        .get('/test-validation-error');

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message');
      expect(typeof response.body.error.message).toBe('string');
    });

    it('should handle non-existent routes', async () => {
      const response = await request(app)
        .get('/non-existent-route');

      // This should return 404 since no route handler exists
      expect(response.status).toBe(404);
    });
  });

  describe('CORS and Security Headers', () => {
    beforeEach(() => {
      // Add security middleware
      app.use(require('helmet')());
      app.use(require('cors')());
      
      app.get('/test-security', (req, res) => {
        res.json({ success: true, data: { message: 'Security test' } });
      });
    });

    it('should include security headers', async () => {
      const response = await request(app)
        .get('/test-security');

      expectSuccessResponse(response);
      
      // Check for common security headers set by helmet
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
    });

    it('should handle CORS preflight requests', async () => {
      const response = await request(app)
        .options('/test-security')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET');

      expect(response.status).toBe(204);
      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });
});
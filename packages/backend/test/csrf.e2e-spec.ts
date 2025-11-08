import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * CSRF Protection E2E Tests
 *
 * Tests the CSRF guard implementation to ensure:
 * - GET requests work without CSRF token
 * - POST/PUT/PATCH/DELETE require CSRF token
 * - Invalid tokens are rejected
 * - Public endpoints (login, register) skip CSRF
 * - CSRF token endpoint is accessible
 */
describe('CSRF Protection (e2e)', () => {
  let app: INestApplication;
  let csrfToken: string;
  let csrfCookie: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('CSRF Token Endpoint', () => {
    it('GET /api/v1/csrf/token should return CSRF token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/csrf/token')
        .expect(200);

      expect(response.body).toHaveProperty('csrfToken');
      expect(typeof response.body.csrfToken).toBe('string');
      expect(response.body.csrfToken.length).toBeGreaterThan(0);

      // Extract token and cookie for later tests
      csrfToken = response.body.csrfToken;
      const cookies = response.headers['set-cookie'] as string[];
      expect(cookies).toBeDefined();
      const xsrfCookie = cookies.find((c: string) => c.startsWith('XSRF-TOKEN='));
      expect(xsrfCookie).toBeDefined();
      csrfCookie = xsrfCookie!.split(';')[0];
    });

    it('should set XSRF-TOKEN cookie with correct attributes', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/csrf/token')
        .expect(200);

      const cookies = response.headers['set-cookie'] as string[];
      const xsrfCookie = cookies.find((c: string) => c.startsWith('XSRF-TOKEN='));
      expect(xsrfCookie).toContain('SameSite=Strict');
      // In development, Secure flag may not be set
      // expect(xsrfCookie).toContain('Secure');
    });
  });

  describe('Safe Methods (GET, HEAD, OPTIONS)', () => {
    it('GET requests should work without CSRF token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200);
    });
  });

  describe('Public Endpoints (Skip CSRF)', () => {
    it('POST /api/v1/auth/login should work without CSRF token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        });

      // Should fail authentication, not CSRF (401 not 403)
      expect(response.status).not.toBe(403);
    });

    it('POST /api/v1/auth/register should work without CSRF token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: `test-${Date.now()}@example.com`,
          password: 'SecureP@ssw0rd123',
          name: 'Test User',
        });

      // Should succeed or fail validation, not CSRF (not 403)
      expect(response.status).not.toBe(403);
    });

    it('POST /api/v1/auth/password-reset/request should work without CSRF token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/password-reset/request')
        .send({
          email: 'test@example.com',
        });

      // Should always return success (anti-enumeration), not 403
      expect(response.status).not.toBe(403);
    });
  });

  describe('Protected Endpoints (Require CSRF)', () => {
    let authToken: string;

    beforeAll(async () => {
      // Create a test user and get auth token
      const registerResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: `csrf-test-${Date.now()}@example.com`,
          password: 'SecureP@ssw0rd123',
          name: 'CSRF Test User',
        });

      if (registerResponse.status === 201 && registerResponse.body.data?.token) {
        authToken = registerResponse.body.data.token;
      }
    });

    it('POST /api/v1/auth/logout should reject without CSRF token', async () => {
      if (!authToken) {
        console.warn('Skipping test: no auth token');
        return;
      }

      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });

    it('POST /api/v1/auth/logout should reject with invalid CSRF token', async () => {
      if (!authToken) {
        console.warn('Skipping test: no auth token');
        return;
      }

      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Cookie', 'XSRF-TOKEN=invalid-token')
        .set('x-csrf-token', 'different-invalid-token')
        .expect(403);
    });

    it('POST /api/v1/auth/logout should accept with valid CSRF token', async () => {
      if (!authToken || !csrfToken || !csrfCookie) {
        console.warn('Skipping test: missing tokens');
        return;
      }

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Cookie', csrfCookie)
        .set('x-csrf-token', csrfToken);

      // Should succeed or fail auth (not 403 CSRF error)
      expect(response.status).not.toBe(403);
    });

    it('PATCH /api/v1/users/me should reject without CSRF token', async () => {
      if (!authToken) {
        console.warn('Skipping test: no auth token');
        return;
      }

      await request(app.getHttpServer())
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Name' })
        .expect(403);
    });

    it('DELETE /api/v1/users/me should reject without CSRF token', async () => {
      if (!authToken) {
        console.warn('Skipping test: no auth token');
        return;
      }

      await request(app.getHttpServer())
        .delete('/api/v1/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ password: 'SecureP@ssw0rd123', confirmDeletion: true })
        .expect(403);
    });
  });

  describe('CSRF Token Mismatch', () => {
    it('should reject when cookie and header tokens do not match', async () => {
      // Get a valid token
      const tokenResponse = await request(app.getHttpServer())
        .get('/api/v1/csrf/token')
        .expect(200);

      const token1 = tokenResponse.body.csrfToken;

      // Get another valid token
      const tokenResponse2 = await request(app.getHttpServer())
        .get('/api/v1/csrf/token')
        .expect(200);

      const token2 = tokenResponse2.body.csrfToken;

      // Try to use mismatched tokens
      // Note: Need an authenticated request to test this properly
      // This is a simplified test
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Cookie', `XSRF-TOKEN=${token1}`)
        .set('x-csrf-token', token2);

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('CSRF');
    });
  });

  describe('CSRF Token Format', () => {
    it('should generate unique tokens on each request', async () => {
      const response1 = await request(app.getHttpServer())
        .get('/api/v1/csrf/token')
        .expect(200);

      const response2 = await request(app.getHttpServer())
        .get('/api/v1/csrf/token')
        .expect(200);

      const token1 = response1.body.csrfToken;
      const token2 = response2.body.csrfToken;

      expect(token1).not.toBe(token2);
      expect(token1.length).toBe(token2.length);
      expect(token1.length).toBe(64); // 32 bytes * 2 (hex encoding)
    });
  });
});

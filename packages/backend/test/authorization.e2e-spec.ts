import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/utils/prisma';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('Authorization & RBAC (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let anonymousToken: string;
  let userToken: string;
  let moderatorToken: string;
  let adminToken: string;
  let superadminToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    await app.init();

    // Create users with different roles
    const password = await bcrypt.hash('TestPassword123!', 10);

    const anonymousUser = await prisma.user.create({
      data: {
        email: 'anonymous@example.com',
        passwordHash: password,
        role: UserRole.ANONYMOUS,
      },
    });

    const regularUser = await prisma.user.create({
      data: {
        email: 'user@example.com',
        passwordHash: password,
        role: UserRole.USER,
      },
    });
    userId = regularUser.id;

    const moderator = await prisma.user.create({
      data: {
        email: 'moderator@example.com',
        passwordHash: password,
        role: UserRole.MODERATOR,
      },
    });

    const admin = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        passwordHash: password,
        role: UserRole.ADMIN,
      },
    });

    const superadmin = await prisma.user.create({
      data: {
        email: 'superadmin@example.com',
        passwordHash: password,
        role: UserRole.SUPERADMIN,
      },
    });

    // Login as each role
    const anonymousLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'anonymous@example.com', password: 'TestPassword123!' });
    anonymousToken = anonymousLogin.body.tokens.accessToken;

    const userLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'user@example.com', password: 'TestPassword123!' });
    userToken = userLogin.body.tokens.accessToken;

    const moderatorLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'moderator@example.com', password: 'TestPassword123!' });
    moderatorToken = moderatorLogin.body.tokens.accessToken;

    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@example.com', password: 'TestPassword123!' });
    adminToken = adminLogin.body.tokens.accessToken;

    const superadminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'superadmin@example.com', password: 'TestPassword123!' });
    superadminToken = superadminLogin.body.tokens.accessToken;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            'anonymous@example.com',
            'user@example.com',
            'moderator@example.com',
            'admin@example.com',
            'superadmin@example.com',
          ],
        },
      },
    });
    await app.close();
  });

  describe('User Profile Endpoints (Self-Service)', () => {
    it('should allow all authenticated users to access GET /users/me', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${moderatorToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should allow all authenticated users to access PATCH /users/me', async () => {
      await request(app.getHttpServer())
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Updated Name' })
        .expect(200);
    });

    it('should allow all authenticated users to access DELETE /users/me', async () => {
      // Create a test user for deletion
      const deleteUser = await prisma.user.create({
        data: {
          email: 'delete-me@example.com',
          passwordHash: await bcrypt.hash('Password123!', 10),
        },
      });

      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'delete-me@example.com',
          password: 'Password123!',
        })
        .expect(200);

      const deleteToken = loginResponse.body.tokens.accessToken;

      await request(app.getHttpServer())
        .delete('/api/v1/users/me')
        .set('Authorization', `Bearer ${deleteToken}`)
        .send({
          password: 'Password123!',
          confirmDeletion: true,
        })
        .expect(200);

      // Clean up
      await prisma.user.delete({ where: { id: deleteUser.id } });
    });
  });

  describe('Admin Endpoints - RolesGuard Protection (T063)', () => {
    it('should forbid ANONYMOUS from accessing admin endpoints', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${anonymousToken}`)
        .expect(403);
    });

    it('should forbid USER from accessing admin endpoints', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should forbid MODERATOR from accessing admin endpoints', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${moderatorToken}`)
        .expect(403);
    });

    it('should allow ADMIN to access admin endpoints', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should allow SUPERADMIN to access admin endpoints', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${superadminToken}`)
        .expect(200);
    });
  });

  describe('@Roles() Decorator Functionality', () => {
    it('should enforce role requirements on GET /admin/users/:id', async () => {
      // ADMIN should succeed
      await request(app.getHttpServer())
        .get(`/api/v1/admin/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // USER should fail
      await request(app.getHttpServer())
        .get(`/api/v1/admin/users/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should enforce role requirements on PATCH /admin/users/:id', async () => {
      // ADMIN should succeed
      await request(app.getHttpServer())
        .patch(`/api/v1/admin/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ emailVerified: true })
        .expect(200);

      // USER should fail
      await request(app.getHttpServer())
        .patch(`/api/v1/admin/users/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ emailVerified: false })
        .expect(403);
    });

    it('should enforce role requirements on DELETE /admin/users/:id/force-delete', async () => {
      // Create a user for deletion test
      const forceDeleteUser = await prisma.user.create({
        data: {
          email: 'force-delete-test@example.com',
          passwordHash: await bcrypt.hash('Password123!', 10),
        },
      });

      // USER should fail
      await request(app.getHttpServer())
        .delete(`/api/v1/admin/users/${forceDeleteUser.id}/force-delete`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      // ADMIN should succeed
      await request(app.getHttpServer())
        .delete(`/api/v1/admin/users/${forceDeleteUser.id}/force-delete`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('Role Hierarchy Enforcement', () => {
    it('should prevent privilege escalation through role change', async () => {
      // Regular user should not be able to change their own role to ADMIN
      await request(app.getHttpServer())
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ role: UserRole.ADMIN })
        .expect(403);
    });

    it('should allow SUPERADMIN to modify ADMIN roles', async () => {
      // Create an admin user for testing
      const testAdmin = await prisma.user.create({
        data: {
          email: 'test-admin@example.com',
          passwordHash: await bcrypt.hash('Password123!', 10),
          role: UserRole.ADMIN,
        },
      });

      // SUPERADMIN should be able to change ADMIN role
      await request(app.getHttpServer())
        .patch(`/api/v1/admin/users/${testAdmin.id}`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({ role: UserRole.MODERATOR })
        .expect(200);

      // Clean up
      await prisma.user.delete({ where: { id: testAdmin.id } });
    });
  });

  describe('Unauthenticated Access', () => {
    it('should reject unauthenticated requests to protected endpoints', async () => {
      await request(app.getHttpServer()).get('/api/v1/users/me').expect(401);

      await request(app.getHttpServer()).get('/api/v1/admin/users').expect(401);
    });

    it('should reject invalid tokens', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing Authorization header', async () => {
      await request(app.getHttpServer()).get('/api/v1/users/me').expect(401);
    });

    it('should handle malformed Authorization header', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', 'InvalidFormat')
        .expect(401);
    });

    it('should handle expired tokens', async () => {
      // This test would require creating an expired token
      // For now, we'll skip it or implement it with a mock
      // TODO: Implement expired token test
    });
  });
});

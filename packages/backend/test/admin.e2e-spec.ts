import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/utils/prisma';
import { UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('Admin API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let userToken: string;
  let adminUserId: string;
  let regularUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    await app.init();

    // Create admin user
    const adminPasswordHash = await bcrypt.hash('AdminPassword123!', 10);
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        passwordHash: adminPasswordHash,
        name: 'Admin User',
        role: UserRole.ADMIN,
        emailVerified: true,
      },
    });
    adminUserId = adminUser.id;

    // Login as admin
    const adminLoginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'AdminPassword123!',
      })
      .expect(200);

    adminToken = adminLoginResponse.body.tokens.accessToken;

    // Create regular user
    const userPasswordHash = await bcrypt.hash('UserPassword123!', 10);
    const regularUser = await prisma.user.create({
      data: {
        email: 'user@example.com',
        passwordHash: userPasswordHash,
        name: 'Regular User',
        role: UserRole.USER,
        emailVerified: false,
      },
    });
    regularUserId = regularUser.id;

    // Login as regular user
    const userLoginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'user@example.com',
        password: 'UserPassword123!',
      })
      .expect(200);

    userToken = userLoginResponse.body.tokens.accessToken;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            'admin@example.com',
            'user@example.com',
            'test-user-1@example.com',
            'test-user-2@example.com',
            'moderator@example.com',
          ],
        },
      },
    });
    await app.close();
  });

  describe('GET /admin/users - List users (T059)', () => {
    beforeAll(async () => {
      // Create additional test users for listing
      const password = await bcrypt.hash('TestPassword123!', 10);
      await prisma.user.createMany({
        data: [
          {
            email: 'test-user-1@example.com',
            passwordHash: password,
            name: 'Test User 1',
            role: UserRole.USER,
          },
          {
            email: 'test-user-2@example.com',
            passwordHash: password,
            name: 'Test User 2',
            role: UserRole.MODERATOR,
            status: UserStatus.SUSPENDED,
          },
        ],
      });
    });

    it('should allow admin to list users', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 20,
      });
    });

    it('should forbid regular user from listing users', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/users?page=1&limit=2')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(2);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 2,
      });
    });

    it('should filter by role', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/users?role=ADMIN')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      response.body.data.forEach((user: { role: string }) => {
        expect(user.role).toBe('ADMIN');
      });
    });

    it('should filter by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/users?status=SUSPENDED')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      response.body.data.forEach((user: { status: string }) => {
        expect(user.status).toBe('SUSPENDED');
      });
    });

    it('should support search by email or name', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/users?search=test-user')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      response.body.data.forEach((user: { email: string; name: string }) => {
        const matchesSearch =
          user.email.includes('test-user') ||
          (user.name && user.name.includes('Test User'));
        expect(matchesSearch).toBe(true);
      });
    });

    it('should support sorting', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/users?sortBy=email&sortOrder=asc')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const emails = response.body.data.map(
        (user: { email: string }) => user.email
      );
      const sortedEmails = [...emails].sort();
      expect(emails).toEqual(sortedEmails);
    });
  });

  describe('GET /admin/users/:id - Get user details (T060)', () => {
    it('should allow admin to view user details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/admin/users/${regularUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.id).toBe(regularUserId);
      expect(response.body.user.email).toBe('user@example.com');
      expect(response.body).toHaveProperty('oauthConnections');
      expect(response.body).toHaveProperty('recentSessions');
      expect(response.body).toHaveProperty('recentAuditLogs');
    });

    it('should return 404 for non-existent user', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/users/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should never expose password hash', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/admin/users/${regularUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.user).not.toHaveProperty('passwordHash');
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should include recent sessions', async () => {
      // Create a session for the user
      await prisma.session.create({
        data: {
          userId: regularUserId,
          ipAddress: '127.0.0.1',
          userAgent: 'Test Browser',
          deviceInfo: { browser: 'Chrome', os: 'Windows' },
          expiresAt: new Date(Date.now() + 3600000),
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/api/v1/admin/users/${regularUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.recentSessions).toBeDefined();
      expect(Array.isArray(response.body.recentSessions)).toBe(true);
    });

    it('should include recent audit logs', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/admin/users/${regularUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.recentAuditLogs).toBeDefined();
      expect(Array.isArray(response.body.recentAuditLogs)).toBe(true);
    });
  });

  describe('PATCH /admin/users/:id - Update user (T061)', () => {
    it('should allow admin to change user role', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/admin/users/${regularUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: UserRole.MODERATOR,
        })
        .expect(200);

      expect(response.body.user.role).toBe('MODERATOR');

      // Verify audit log for role change
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          userId: regularUserId,
          action: 'ROLE_CHANGE',
          severity: 'CRITICAL',
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(auditLog).toBeDefined();

      // Revert role change
      await request(app.getHttpServer())
        .patch(`/api/v1/admin/users/${regularUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: UserRole.USER,
        })
        .expect(200);
    });

    it('should prevent admin from modifying their own account', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/admin/users/${adminUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: UserRole.SUPERADMIN,
        })
        .expect(400);
    });

    it('should revoke sessions when suspending user', async () => {
      // Create a session for the user
      const session = await prisma.session.create({
        data: {
          userId: regularUserId,
          ipAddress: '127.0.0.1',
          userAgent: 'Test Browser',
          deviceInfo: { browser: 'Chrome', os: 'Windows' },
          expiresAt: new Date(Date.now() + 3600000),
        },
      });

      // Suspend user
      await request(app.getHttpServer())
        .patch(`/api/v1/admin/users/${regularUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: UserStatus.SUSPENDED,
        })
        .expect(200);

      // Verify sessions are revoked
      const updatedSession = await prisma.session.findUnique({
        where: { id: session.id },
      });
      expect(updatedSession?.expiresAt).toBeDefined();
      expect(updatedSession?.expiresAt!.getTime()).toBeLessThan(Date.now());

      // Verify audit log for suspension
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          userId: regularUserId,
          action: 'ACCOUNT_SUSPEND',
          severity: 'CRITICAL',
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(auditLog).toBeDefined();

      // Revert suspension
      await request(app.getHttpServer())
        .patch(`/api/v1/admin/users/${regularUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: UserStatus.ACTIVE,
        })
        .expect(200);
    });

    it('should create CRITICAL audit log for role change', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/admin/users/${regularUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: UserRole.MODERATOR,
        })
        .expect(200);

      const auditLog = await prisma.auditLog.findFirst({
        where: {
          userId: regularUserId,
          action: 'ROLE_CHANGE',
          severity: 'CRITICAL',
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(auditLog).toBeDefined();
      expect(auditLog?.metadata).toHaveProperty('adminId', adminUserId);

      // Revert
      await request(app.getHttpServer())
        .patch(`/api/v1/admin/users/${regularUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: UserRole.USER,
        })
        .expect(200);
    });

    it('should prevent assigning ANONYMOUS role', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/admin/users/${regularUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: UserRole.ANONYMOUS,
        })
        .expect(400);
    });
  });

  describe('DELETE /admin/users/:id/force-delete - Force delete user (T062)', () => {
    it('should allow admin to force delete user', async () => {
      // Create a user for deletion
      const deleteUser = await prisma.user.create({
        data: {
          email: 'to-delete@example.com',
          passwordHash: await bcrypt.hash('Password123!', 10),
          name: 'To Delete',
        },
      });

      const response = await request(app.getHttpServer())
        .delete(`/api/v1/admin/users/${deleteUser.id}/force-delete`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.message).toContain('permanently deleted');

      // Verify user is physically deleted
      const deletedUser = await prisma.user.findUnique({
        where: { id: deleteUser.id },
      });
      expect(deletedUser).toBeNull();
    });

    it('should prevent admin from deleting their own account', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/admin/users/${adminUserId}/force-delete`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });

    it('should return 404 for non-existent user', async () => {
      await request(app.getHttpServer())
        .delete(
          '/api/v1/admin/users/00000000-0000-0000-0000-000000000000/force-delete'
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should CASCADE delete related records', async () => {
      // Create a user with related records
      const cascadeUser = await prisma.user.create({
        data: {
          email: 'cascade-user@example.com',
          passwordHash: await bcrypt.hash('Password123!', 10),
          name: 'Cascade User',
          sessions: {
            create: {
              ipAddress: '127.0.0.1',
              userAgent: 'Test',
              deviceInfo: { browser: 'Chrome', os: 'Windows' },
              expiresAt: new Date(Date.now() + 3600000),
            },
          },
          oauthConnections: {
            create: {
              provider: 'GOOGLE',
              providerId: 'google-123',
              email: 'cascade-user@example.com',
              profile: { name: 'Cascade User' },
            },
          },
        },
      });

      // Force delete user
      await request(app.getHttpServer())
        .delete(`/api/v1/admin/users/${cascadeUser.id}/force-delete`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify CASCADE deletion
      const sessions = await prisma.session.findMany({
        where: { userId: cascadeUser.id },
      });
      expect(sessions).toHaveLength(0);

      const oauthConnections = await prisma.oAuthConnection.findMany({
        where: { userId: cascadeUser.id },
      });
      expect(oauthConnections).toHaveLength(0);
    });

    it('should preserve audit logs with userId set to null', async () => {
      // Create a user with audit logs
      const auditUser = await prisma.user.create({
        data: {
          email: 'audit-preservation@example.com',
          passwordHash: await bcrypt.hash('Password123!', 10),
          name: 'Audit User',
        },
      });

      // Create an audit log
      await prisma.auditLog.create({
        data: {
          userId: auditUser.id,
          action: 'LOGIN',
          ipAddress: '127.0.0.1',
          userAgent: 'Test',
        },
      });

      // Force delete user
      await request(app.getHttpServer())
        .delete(`/api/v1/admin/users/${auditUser.id}/force-delete`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify audit logs are preserved but userId is null
      const auditLogs = await prisma.auditLog.findMany({
        where: {
          action: 'LOGIN',
          ipAddress: '127.0.0.1',
          userId: null,
        },
      });
      expect(auditLogs.length).toBeGreaterThan(0);
    });
  });
});

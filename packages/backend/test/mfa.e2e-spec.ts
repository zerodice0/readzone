import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/utils/prisma';

describe('MFA (Multi-Factor Authentication) (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: string;
  let userEmail: string;
  let userPassword: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);

    await app.init();

    // Create test user
    userEmail = `mfa-test-${Date.now()}@example.com`;
    userPassword = 'TestPassword123!';

    const registerResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: userEmail,
        password: userPassword,
        name: 'MFA Test User',
      });

    userId = registerResponse.body.data.id;

    // Login to get auth token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: userEmail,
        password: userPassword,
        rememberMe: false,
      });

    authToken = loginResponse.body.data.tokens.accessToken;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.user.deleteMany({
      where: { email: userEmail },
    });
    await app.close();
  });

  describe('T085: POST /api/v1/users/me/mfa/enable', () => {
    it('should generate TOTP secret and QR code', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/users/me/mfa/enable')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('qrCodeDataUri');
      expect(response.body.data).toHaveProperty('secret');
      expect(response.body.data).toHaveProperty('backupCodes');

      expect(response.body.data.qrCodeDataUri).toMatch(/^data:image\/png;base64,/);
      expect(response.body.data.secret).toMatch(/^[A-Z2-7]{32,}$/);
      expect(response.body.data.backupCodes).toHaveLength(10);
      expect(response.body.data.backupCodes[0]).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    });

    it('should reject if user already has MFA enabled', async () => {
      // First enable MFA
      await request(app.getHttpServer())
        .post('/api/v1/users/me/mfa/enable')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Generate a valid TOTP code
      const mfaSettings = await prisma.mFASettings.findUnique({
        where: { userId },
      });
      expect(mfaSettings).toBeTruthy();

      const speakeasy = require('speakeasy');
      const validCode = speakeasy.totp({
        secret: mfaSettings!.secret,
        encoding: 'base32',
      });

      // Verify to enable MFA
      await request(app.getHttpServer())
        .post('/api/v1/users/me/mfa/verify')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ code: validCode })
        .expect(200);

      // Try to enable again
      await request(app.getHttpServer())
        .post('/api/v1/users/me/mfa/enable')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should reject without authentication', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/users/me/mfa/enable')
        .expect(401);
    });
  });

  describe('T086: POST /api/v1/users/me/mfa/verify', () => {
    let testAuthToken: string;
    let testUserId: string;
    let testEmail: string;

    beforeEach(async () => {
      // Create fresh user for each test
      testEmail = `mfa-verify-${Date.now()}@example.com`;
      const registerResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: testEmail,
          password: userPassword,
          name: 'MFA Verify Test',
        });

      testUserId = registerResponse.body.data.id;

      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: userPassword,
          rememberMe: false,
        });

      testAuthToken = loginResponse.body.data.tokens.accessToken;
    });

    afterEach(async () => {
      await prisma.user.deleteMany({
        where: { email: testEmail },
      });
    });

    it('should verify valid TOTP code and enable MFA', async () => {
      // Enable MFA setup
      await request(app.getHttpServer())
        .post('/api/v1/users/me/mfa/enable')
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(200);

      // Get the secret
      const mfaSettings = await prisma.mFASettings.findUnique({
        where: { userId: testUserId },
      });

      const speakeasy = require('speakeasy');
      const validCode = speakeasy.totp({
        secret: mfaSettings!.secret,
        encoding: 'base32',
      });

      // Verify code
      const response = await request(app.getHttpServer())
        .post('/api/v1/users/me/mfa/verify')
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ code: validCode })
        .expect(200);

      expect(response.body.data.success).toBe(true);

      // Verify MFA is enabled
      const user = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { mfaEnabled: true },
      });

      expect(user?.mfaEnabled).toBe(true);
    });

    it('should reject invalid TOTP code', async () => {
      // Enable MFA setup
      await request(app.getHttpServer())
        .post('/api/v1/users/me/mfa/enable')
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(200);

      // Try with invalid code
      await request(app.getHttpServer())
        .post('/api/v1/users/me/mfa/verify')
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ code: '000000' })
        .expect(401);
    });

    it('should reject if MFA setup not initiated', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/users/me/mfa/verify')
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ code: '123456' })
        .expect(400);
    });
  });

  describe('T087: POST /api/v1/users/me/mfa/disable', () => {
    let testAuthToken: string;
    let testUserId: string;
    let testEmail: string;

    beforeEach(async () => {
      // Create user with MFA enabled
      testEmail = `mfa-disable-${Date.now()}@example.com`;
      const registerResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: testEmail,
          password: userPassword,
          name: 'MFA Disable Test',
        });

      testUserId = registerResponse.body.data.id;

      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: userPassword,
          rememberMe: false,
        });

      testAuthToken = loginResponse.body.data.tokens.accessToken;

      // Enable MFA
      await request(app.getHttpServer())
        .post('/api/v1/users/me/mfa/enable')
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(200);

      const mfaSettings = await prisma.mFASettings.findUnique({
        where: { userId: testUserId },
      });

      const speakeasy = require('speakeasy');
      const validCode = speakeasy.totp({
        secret: mfaSettings!.secret,
        encoding: 'base32',
      });

      await request(app.getHttpServer())
        .post('/api/v1/users/me/mfa/verify')
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ code: validCode })
        .expect(200);
    });

    afterEach(async () => {
      await prisma.user.deleteMany({
        where: { email: testEmail },
      });
    });

    it('should disable MFA with valid password', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/users/me/mfa/disable')
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ password: userPassword })
        .expect(200);

      expect(response.body.data.success).toBe(true);

      // Verify MFA is disabled
      const user = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { mfaEnabled: true },
      });

      expect(user?.mfaEnabled).toBe(false);
    });

    it('should reject invalid password', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/users/me/mfa/disable')
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ password: 'WrongPassword123!' })
        .expect(401);
    });

    it('should reject if MFA not enabled', async () => {
      // Disable MFA first
      await request(app.getHttpServer())
        .post('/api/v1/users/me/mfa/disable')
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ password: userPassword })
        .expect(200);

      // Try to disable again
      await request(app.getHttpServer())
        .post('/api/v1/users/me/mfa/disable')
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ password: userPassword })
        .expect(400);
    });
  });

  describe('T088: MFA Challenge in Login Flow', () => {
    let testEmail: string;
    let testUserId: string;

    beforeEach(async () => {
      // Create user with MFA enabled
      testEmail = `mfa-login-${Date.now()}@example.com`;
      const registerResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: testEmail,
          password: userPassword,
          name: 'MFA Login Test',
        });

      testUserId = registerResponse.body.data.id;

      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: userPassword,
          rememberMe: false,
        });

      const tempToken = loginResponse.body.data.tokens.accessToken;

      // Enable MFA
      await request(app.getHttpServer())
        .post('/api/v1/users/me/mfa/enable')
        .set('Authorization', `Bearer ${tempToken}`)
        .expect(200);

      const mfaSettings = await prisma.mFASettings.findUnique({
        where: { userId: testUserId },
      });

      const speakeasy = require('speakeasy');
      const validCode = speakeasy.totp({
        secret: mfaSettings!.secret,
        encoding: 'base32',
      });

      await request(app.getHttpServer())
        .post('/api/v1/users/me/mfa/verify')
        .set('Authorization', `Bearer ${tempToken}`)
        .send({ code: validCode })
        .expect(200);
    });

    afterEach(async () => {
      await prisma.user.deleteMany({
        where: { email: testEmail },
      });
    });

    it('should return mfaRequired on login when MFA enabled', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: userPassword,
          rememberMe: false,
        })
        .expect(200);

      expect(response.body.data).toHaveProperty('mfaRequired', true);
      expect(response.body.data).toHaveProperty('userId');
      expect(response.body.data).not.toHaveProperty('tokens');
    });

    it('should complete login after valid MFA verification', async () => {
      // Initial login
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: userPassword,
          rememberMe: false,
        })
        .expect(200);

      const returnedUserId = loginResponse.body.data.userId;

      // Get TOTP code
      const mfaSettings = await prisma.mFASettings.findUnique({
        where: { userId: testUserId },
      });

      const speakeasy = require('speakeasy');
      const validCode = speakeasy.totp({
        secret: mfaSettings!.secret,
        encoding: 'base32',
      });

      // Verify MFA
      const mfaResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/mfa/verify')
        .send({
          userId: returnedUserId,
          code: validCode,
          rememberMe: false,
        })
        .expect(200);

      expect(mfaResponse.body.data).toHaveProperty('tokens');
      expect(mfaResponse.body.data).toHaveProperty('user');
      expect(mfaResponse.body.data.tokens).toHaveProperty('accessToken');
    });

    it('should reject invalid MFA code during login', async () => {
      // Initial login
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: userPassword,
          rememberMe: false,
        })
        .expect(200);

      const returnedUserId = loginResponse.body.data.userId;

      // Try invalid code
      await request(app.getHttpServer())
        .post('/api/v1/auth/mfa/verify')
        .send({
          userId: returnedUserId,
          code: '000000',
          rememberMe: false,
        })
        .expect(401);
    });
  });

  describe('T091: GET /api/v1/users/me/mfa/backup-codes', () => {
    let testAuthToken: string;
    let testUserId: string;
    let testEmail: string;

    beforeEach(async () => {
      // Create user with MFA enabled
      testEmail = `mfa-backup-${Date.now()}@example.com`;
      const registerResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: testEmail,
          password: userPassword,
          name: 'MFA Backup Test',
        });

      testUserId = registerResponse.body.data.id;

      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: userPassword,
          rememberMe: false,
        });

      testAuthToken = loginResponse.body.data.tokens.accessToken;

      // Enable MFA
      await request(app.getHttpServer())
        .post('/api/v1/users/me/mfa/enable')
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(200);

      const mfaSettings = await prisma.mFASettings.findUnique({
        where: { userId: testUserId },
      });

      const speakeasy = require('speakeasy');
      const validCode = speakeasy.totp({
        secret: mfaSettings!.secret,
        encoding: 'base32',
      });

      await request(app.getHttpServer())
        .post('/api/v1/users/me/mfa/verify')
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ code: validCode })
        .expect(200);
    });

    afterEach(async () => {
      await prisma.user.deleteMany({
        where: { email: testEmail },
      });
    });

    it('should regenerate backup codes', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users/me/mfa/backup-codes')
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('backupCodes');
      expect(response.body.data.backupCodes).toHaveLength(10);
      expect(response.body.data.backupCodes[0]).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    });

    it('should reject if MFA not enabled', async () => {
      // Disable MFA
      await request(app.getHttpServer())
        .post('/api/v1/users/me/mfa/disable')
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ password: userPassword })
        .expect(200);

      await request(app.getHttpServer())
        .get('/api/v1/users/me/mfa/backup-codes')
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(400);
    });
  });

  describe('T090: Backup Code Verification', () => {
    let testEmail: string;
    let testUserId: string;
    let backupCode: string;

    beforeEach(async () => {
      // Create user with MFA and backup codes
      testEmail = `mfa-backup-login-${Date.now()}@example.com`;
      const registerResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: testEmail,
          password: userPassword,
          name: 'Backup Code Test',
        });

      testUserId = registerResponse.body.data.id;

      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: userPassword,
          rememberMe: false,
        });

      const tempToken = loginResponse.body.data.tokens.accessToken;

      // Enable MFA and get backup codes
      const enableResponse = await request(app.getHttpServer())
        .post('/api/v1/users/me/mfa/enable')
        .set('Authorization', `Bearer ${tempToken}`)
        .expect(200);

      backupCode = enableResponse.body.data.backupCodes[0];

      const mfaSettings = await prisma.mFASettings.findUnique({
        where: { userId: testUserId },
      });

      const speakeasy = require('speakeasy');
      const validCode = speakeasy.totp({
        secret: mfaSettings!.secret,
        encoding: 'base32',
      });

      await request(app.getHttpServer())
        .post('/api/v1/users/me/mfa/verify')
        .set('Authorization', `Bearer ${tempToken}`)
        .send({ code: validCode })
        .expect(200);
    });

    afterEach(async () => {
      await prisma.user.deleteMany({
        where: { email: testEmail },
      });
    });

    it('should allow login with backup code', async () => {
      // Initial login
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: userPassword,
          rememberMe: false,
        })
        .expect(200);

      const returnedUserId = loginResponse.body.data.userId;

      // Verify with backup code
      const mfaResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/mfa/verify')
        .send({
          userId: returnedUserId,
          code: backupCode,
          rememberMe: false,
        })
        .expect(200);

      expect(mfaResponse.body.data).toHaveProperty('tokens');
      expect(mfaResponse.body.data.tokens).toHaveProperty('accessToken');
    });

    it('should consume backup code after use', async () => {
      // Use backup code once
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: userPassword,
          rememberMe: false,
        })
        .expect(200);

      await request(app.getHttpServer())
        .post('/api/v1/auth/mfa/verify')
        .send({
          userId: loginResponse.body.data.userId,
          code: backupCode,
          rememberMe: false,
        })
        .expect(200);

      // Try to use same code again
      const secondLoginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: userPassword,
          rememberMe: false,
        })
        .expect(200);

      await request(app.getHttpServer())
        .post('/api/v1/auth/mfa/verify')
        .send({
          userId: secondLoginResponse.body.data.userId,
          code: backupCode,
          rememberMe: false,
        })
        .expect(401);
    });
  });
});

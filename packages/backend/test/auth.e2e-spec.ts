import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request, { Response } from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { hashPassword } from '../src/common/utils/password';
import { config } from 'dotenv';
import path from 'path';

// 테스트 환경 변수 로드
config({ path: path.resolve(__dirname, '../.env.test') });
process.env.NODE_ENV = 'test';

interface AuthResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    userid: string;
    email: string;
    nickname: string;
    isVerified: boolean;
  };
  tokens?: {
    accessToken: string;
    refreshToken: string;
  };
  data?: Record<string, boolean>;
}

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Global pipes and prefix setup (same as main.ts)
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.setGlobalPrefix('api');

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();
  });

  afterEach(async () => {
    // Clean up test data
    if (prisma) {
      await prisma.account.deleteMany({});
      await prisma.user.deleteMany({});
    }
    if (app) {
      await app.close();
    }
  });

  describe('POST /api/auth/register', () => {
    const validRegisterData = {
      userid: 'testuser123',
      email: 'test@example.com',
      nickname: 'TestUser',
      password: 'Password123!',
    };

    it('should successfully register with valid data', async () => {
      const response: Response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(validRegisterData)
        .expect(201);

      const body = response.body as AuthResponse;
      expect(body.success).toBe(true);
      expect(body.message).toContain('회원가입이 완료');
      expect(body.user).toMatchObject({
        userid: validRegisterData.userid,
        email: validRegisterData.email,
        nickname: validRegisterData.nickname,
        isVerified: false,
      });

      // Check if user was created in database
      const user = await prisma.user.findUnique({
        where: { userid: validRegisterData.userid },
      });
      expect(user).toBeTruthy();
      expect(user?.password).not.toBe(validRegisterData.password); // Password should be hashed
    });

    it('should fail with duplicate userid', async () => {
      // Create user first
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(validRegisterData);

      // Try to register with same userid
      const response: Response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          ...validRegisterData,
          email: 'different@example.com',
          nickname: 'DifferentUser',
        })
        .expect(409);

      const body = response.body as AuthResponse;
      expect(body.message).toContain('이미 사용 중인 사용자 ID');
    });

    it('should fail with duplicate email', async () => {
      // Create user first
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(validRegisterData);

      // Try to register with same email
      const response: Response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          ...validRegisterData,
          userid: 'differentuser',
          nickname: 'DifferentUser',
        })
        .expect(409);

      const body = response.body as AuthResponse;
      expect(body.message).toContain('이미 사용 중인 이메일');
    });

    it('should fail with duplicate nickname', async () => {
      // Create user first
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(validRegisterData);

      // Try to register with same nickname
      const response: Response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          ...validRegisterData,
          userid: 'differentuser',
          email: 'different@example.com',
        })
        .expect(409);

      const body = response.body as AuthResponse;
      expect(body.message).toContain('이미 사용 중인 닉네임');
    });

    it('should fail with invalid email format', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          ...validRegisterData,
          email: 'invalid-email',
        })
        .expect(400);
    });

    it('should fail with short password', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          ...validRegisterData,
          password: 'Pass1!', // Too short (6 chars)
        })
        .expect(400);
    });

    it('should fail with invalid userid format', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          ...validRegisterData,
          userid: 'invalid user!', // Contains invalid characters
        })
        .expect(400);
    });
  });

  describe('POST /api/auth/login', () => {
    const userCredentials = {
      userid: 'testuser123',
      email: 'test@example.com',
      nickname: 'TestUser',
      password: 'Password123!',
    };

    beforeEach(async () => {
      // Create a verified user for login tests
      const hashedPassword = await hashPassword(userCredentials.password);
      const user = await prisma.user.create({
        data: {
          userid: userCredentials.userid,
          email: userCredentials.email,
          nickname: userCredentials.nickname,
          password: hashedPassword,
          isVerified: true,
          verificationToken: null,
        },
      });

      await prisma.account.create({
        data: {
          userId: user.id,
          type: 'email',
          provider: 'email',
          providerAccountId: user.id,
          email: userCredentials.email,
        },
      });
    });

    it('should successfully login with valid credentials', async () => {
      const response: Response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          userid: userCredentials.userid,
          password: userCredentials.password,
        })
        .expect(200);

      const body = response.body as AuthResponse;
      expect(body.success).toBe(true);
      expect(body.message).toContain('로그인에 성공');
      expect(body.user).toMatchObject({
        userid: userCredentials.userid,
        email: userCredentials.email,
        nickname: userCredentials.nickname,
        isVerified: true,
      });
      expect(body.tokens).toHaveProperty('accessToken');
      expect(body.tokens).toHaveProperty('refreshToken');
    });

    it('should fail with invalid userid', async () => {
      const response: Response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          userid: 'nonexistentuser',
          password: userCredentials.password,
        })
        .expect(401);

      const body = response.body as AuthResponse;
      expect(body.message).toContain(
        '아이디 또는 비밀번호가 올바르지 않습니다',
      );
    });

    it('should fail with invalid password', async () => {
      const response: Response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          userid: userCredentials.userid,
          password: 'wrongpassword',
        })
        .expect(401);

      const body = response.body as AuthResponse;
      expect(body.message).toContain(
        '아이디 또는 비밀번호가 올바르지 않습니다',
      );
    });

    it('should fail with missing fields', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          userid: userCredentials.userid,
          // missing password
        })
        .expect(400);
    });
  });

  describe('POST /api/auth/check-duplicate', () => {
    const existingUser = {
      userid: 'existinguser',
      email: 'existing@example.com',
      nickname: 'ExistingUser',
      password: 'Password123!',
    };

    beforeEach(async () => {
      // Create existing user
      const hashedPassword = await hashPassword(existingUser.password);
      await prisma.user.create({
        data: {
          userid: existingUser.userid,
          email: existingUser.email,
          nickname: existingUser.nickname,
          password: hashedPassword,
          isVerified: false,
        },
      });
    });

    it('should check userid duplication correctly', async () => {
      // Check existing userid
      const existingResponse: Response = await request(app.getHttpServer())
        .post('/api/auth/check-duplicate')
        .send({ userid: existingUser.userid })
        .expect(200);

      const existingBody = existingResponse.body as AuthResponse;
      expect(existingBody.success).toBe(true);
      expect(existingBody.data?.userid).toBe(true);

      // Check new userid
      const newResponse: Response = await request(app.getHttpServer())
        .post('/api/auth/check-duplicate')
        .send({ userid: 'newuser' })
        .expect(200);

      const newBody = newResponse.body as AuthResponse;
      expect(newBody.success).toBe(true);
      expect(newBody.data?.userid).toBe(false);
    });

    it('should check email duplication correctly', async () => {
      // Check existing email
      const existingResponse: Response = await request(app.getHttpServer())
        .post('/api/auth/check-duplicate')
        .send({ email: existingUser.email })
        .expect(200);

      const existingBody = existingResponse.body as AuthResponse;
      expect(existingBody.success).toBe(true);
      expect(existingBody.data?.email).toBe(true);

      // Check new email
      const newResponse: Response = await request(app.getHttpServer())
        .post('/api/auth/check-duplicate')
        .send({ email: 'new@example.com' })
        .expect(200);

      const newBody = newResponse.body as AuthResponse;
      expect(newBody.success).toBe(true);
      expect(newBody.data?.email).toBe(false);
    });

    it('should check nickname duplication correctly', async () => {
      // Check existing nickname
      const existingResponse: Response = await request(app.getHttpServer())
        .post('/api/auth/check-duplicate')
        .send({ nickname: existingUser.nickname })
        .expect(200);

      const existingBody = existingResponse.body as AuthResponse;
      expect(existingBody.success).toBe(true);
      expect(existingBody.data?.nickname).toBe(true);

      // Check new nickname
      const newResponse: Response = await request(app.getHttpServer())
        .post('/api/auth/check-duplicate')
        .send({ nickname: 'NewUser' })
        .expect(200);

      const newBody = newResponse.body as AuthResponse;
      expect(newBody.success).toBe(true);
      expect(newBody.data?.nickname).toBe(false);
    });

    it('should fail with no fields provided', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/check-duplicate')
        .send({})
        .expect(400);
    });
  });

  describe('GET /api/auth/verify-email', () => {
    let verificationToken: string;

    beforeEach(async () => {
      // Create unverified user with token
      const hashedPassword = await hashPassword('Password123!');
      await prisma.user.create({
        data: {
          userid: 'unverified',
          email: 'unverified@example.com',
          nickname: 'Unverified',
          password: hashedPassword,
          isVerified: false,
          verificationToken: 'test-token',
        },
      });
      verificationToken = 'test-token';
    });

    it('should verify email with valid token', async () => {
      const response: Response = await request(app.getHttpServer())
        .get(`/api/auth/verify-email?token=${verificationToken}`)
        .expect(200);

      const body = response.body as AuthResponse;
      expect(body.success).toBe(true);
      expect(body.message).toContain('이메일 인증이 완료');

      // Check if user is verified in database
      const user = await prisma.user.findFirst({
        where: { verificationToken: null, isVerified: true },
      });
      expect(user).toBeTruthy();
    });

    it('should fail with invalid token', async () => {
      const response: Response = await request(app.getHttpServer())
        .get('/api/auth/verify-email?token=invalid-token')
        .expect(400);

      const body = response.body as AuthResponse;
      expect(body.message).toContain('유효하지 않은 인증 토큰');
    });

    it('should fail with already verified user', async () => {
      // Verify user first (keep token but set isVerified to true)
      await prisma.user.updateMany({
        where: { verificationToken },
        data: { isVerified: true },
      });

      const response: Response = await request(app.getHttpServer())
        .get(`/api/auth/verify-email?token=${verificationToken}`)
        .expect(400);

      const body = response.body as AuthResponse;
      expect(body.message).toContain('이미 인증된 계정');
    });
  });
});

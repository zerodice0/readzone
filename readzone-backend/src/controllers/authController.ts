import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import { createError, asyncHandler } from '@/middleware/errorHandler';
import { validateData, registerSchema, loginSchema, updateProfileSchema } from '@/utils/validation';
import type { AuthenticatedRequest } from '@/middleware/auth';

const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '7d';

// 업로드 디렉토리 설정
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'avatars');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// 업로드 디렉토리 생성
const ensureUploadDir = async () => {
  try {
    await fs.access(UPLOAD_DIR);
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }
};

// Multer 설정
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('지원하지 않는 파일 형식입니다. JPEG, PNG, WebP 파일만 업로드 가능합니다.'));
    }
  },
});

// JWT 토큰 생성 함수
const generateToken = (userId: string, email: string): string => {
  const jwtSecret = process.env.JWT_SECRET;
  
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not defined');
  }
  
  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN as any
  };
  
  return jwt.sign(
    { userId, email },
    jwtSecret,
    options
  );
};

// 회원가입
export const register = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = validateData(registerSchema, req.body);
  const { email, username, nickname, password } = validatedData;

  // 이메일 중복 체크
  const existingUserByEmail = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUserByEmail) {
    throw createError(409, 'AUTH_004', '이미 사용 중인 이메일입니다.');
  }

  // 아이디 중복 체크
  const existingUserByUsername = await prisma.user.findUnique({
    where: { username },
  });

  if (existingUserByUsername) {
    throw createError(409, 'AUTH_005', '이미 사용 중인 아이디입니다.');
  }

  // 닉네임 중복 체크
  const existingUserByNickname = await prisma.user.findFirst({
    where: { nickname },
  });

  if (existingUserByNickname) {
    throw createError(409, 'AUTH_006', '이미 사용 중인 닉네임입니다.');
  }

  // 비밀번호 해싱
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // 사용자 생성
  const user = await prisma.user.create({
    data: {
      email,
      username,
      nickname,
      password: hashedPassword,
    },
    select: {
      id: true,
      email: true,
      username: true,
      nickname: true,
      bio: true,
      avatar: true,
      isPublic: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // JWT 토큰 생성
  const token = generateToken(user.id, user.email);

  logger.info(`새 사용자 등록: ${user.email} (${user.username})`);

  res.status(201).json({
    success: true,
    data: {
      user,
      token,
    },
    message: '회원가입이 완료되었습니다.',
  });
});

// 로그인
export const login = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = validateData(loginSchema, req.body);
  const { username, password } = validatedData;

  // 아이디로 사용자 찾기
  const user = await prisma.user.findFirst({
    where: {
      username,
      isActive: true,
    },
  });

  if (!user) {
    throw createError(401, 'AUTH_007', '아이디 또는 비밀번호가 올바르지 않습니다.');
  }

  // 비밀번호 확인
  const isValidPassword = await bcrypt.compare(password, user.password);

  if (!isValidPassword) {
    throw createError(401, 'AUTH_007', '아이디 또는 비밀번호가 올바르지 않습니다.');
  }

  // 마지막 로그인 시간 업데이트
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  // JWT 토큰 생성
  const token = generateToken(user.id, user.email);

  // 비밀번호 제외하고 응답
  const { password: _, ...userWithoutPassword } = user;

  logger.info(`사용자 로그인: ${user.email} (${user.username})`);

  res.json({
    success: true,
    data: {
      user: userWithoutPassword,
      token,
    },
    message: '로그인이 완료되었습니다.',
  });
});

// 로그아웃
export const logout = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // JWT 토큰 기반에서는 클라이언트에서 토큰을 삭제하는 것으로 충분
  // 필요시 토큰 블랙리스트 기능을 추가할 수 있음

  logger.info(`사용자 로그아웃: ${req.user?.email}`);

  res.json({
    success: true,
    message: '로그아웃이 완료되었습니다.',
  });
});

// 내 정보 조회
export const getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      nickname: true,
      bio: true,
      avatar: true,
      isPublic: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw createError(404, 'RESOURCE_001', '사용자를 찾을 수 없습니다.');
  }

  res.json({
    success: true,
    data: user,
  });
});

// 프로필 수정
export const updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const validatedData = validateData(updateProfileSchema, req.body);

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: validatedData,
    select: {
      id: true,
      email: true,
      username: true,
      nickname: true,
      bio: true,
      avatar: true,
      isPublic: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  logger.info(`프로필 업데이트: ${updatedUser.email}`);

  res.json({
    success: true,
    data: updatedUser,
    message: '프로필이 업데이트되었습니다.',
  });
});

// 비밀번호 변경
export const changePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { currentPassword, newPassword } = req.body;

  // 입력 검증
  if (!currentPassword || !newPassword) {
    throw createError(400, 'VALIDATION_001', '현재 비밀번호와 새 비밀번호를 입력해주세요.');
  }

  if (newPassword.length < 8) {
    throw createError(400, 'VALIDATION_003', '새 비밀번호는 최소 8자 이상이어야 합니다.');
  }

  // 현재 사용자 정보 조회
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw createError(404, 'RESOURCE_001', '사용자를 찾을 수 없습니다.');
  }

  // 현재 비밀번호 확인
  const isValidCurrentPassword = await bcrypt.compare(currentPassword, user.password);

  if (!isValidCurrentPassword) {
    throw createError(401, 'AUTH_006', '현재 비밀번호가 올바르지 않습니다.');
  }

  // 새 비밀번호 해싱
  const saltRounds = 12;
  const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

  // 비밀번호 업데이트
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedNewPassword },
  });

  logger.info(`비밀번호 변경: ${user.email}`);

  res.json({
    success: true,
    message: '비밀번호가 변경되었습니다.',
  });
});/
/ 아바타 업로드
export const uploadAvatar = [
  upload.single('avatar'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const file = req.file;

    if (!file) {
      throw createError(400, 'FILE_001', '업로드할 파일을 선택해주세요.');
    }

    try {
      // 업로드 디렉토리 확인
      await ensureUploadDir();

      // 파일명 생성 (사용자 ID + 타임스탬프)
      const fileExtension = path.extname(file.originalname) || '.jpg';
      const fileName = `${userId}_${Date.now()}${fileExtension}`;
      const filePath = path.join(UPLOAD_DIR, fileName);

      // 이미지 리사이징 및 최적화
      await sharp(file.buffer)
        .resize(200, 200, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({ quality: 85 })
        .toFile(filePath);

      // 기존 아바타 파일 삭제
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { avatar: true },
      });

      if (currentUser?.avatar) {
        const oldFilePath = path.join(process.cwd(), currentUser.avatar);
        try {
          await fs.unlink(oldFilePath);
        } catch (error) {
          // 기존 파일 삭제 실패는 로그만 남기고 계속 진행
          logger.warn(`기존 아바타 파일 삭제 실패: ${oldFilePath}`);
        }
      }

      // 데이터베이스 업데이트
      const avatarUrl = `/uploads/avatars/${fileName}`;
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { avatar: avatarUrl },
        select: {
          id: true,
          email: true,
          username: true,
          nickname: true,
          bio: true,
          avatar: true,
          isPublic: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      logger.info(`아바타 업로드 완료: ${req.user?.email} - ${fileName}`);

      res.json({
        success: true,
        data: updatedUser,
        message: '아바타가 업로드되었습니다.',
      });
    } catch (error) {
      logger.error('아바타 업로드 실패:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('지원하지 않는 파일 형식')) {
          throw createError(400, 'FILE_001', error.message);
        }
        if (error.message.includes('File too large')) {
          throw createError(400, 'FILE_002', '파일 크기가 너무 큽니다. 5MB 이하의 파일을 업로드해주세요.');
        }
      }
      
      throw createError(500, 'FILE_003', '아바타 업로드 중 오류가 발생했습니다.');
    }
  })
];

// 아바타 삭제
export const deleteAvatar = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  // 현재 사용자 정보 조회
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatar: true },
  });

  if (!currentUser?.avatar) {
    throw createError(404, 'RESOURCE_001', '삭제할 아바타가 없습니다.');
  }

  try {
    // 파일 삭제
    const filePath = path.join(process.cwd(), currentUser.avatar);
    await fs.unlink(filePath);
  } catch (error) {
    // 파일 삭제 실패는 로그만 남기고 계속 진행
    logger.warn(`아바타 파일 삭제 실패: ${currentUser.avatar}`);
  }

  // 데이터베이스 업데이트
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { avatar: null },
    select: {
      id: true,
      email: true,
      username: true,
      nickname: true,
      bio: true,
      avatar: true,
      isPublic: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  logger.info(`아바타 삭제 완료: ${req.user?.email}`);

  res.json({
    success: true,
    data: updatedUser,
    message: '아바타가 삭제되었습니다.',
  });
});
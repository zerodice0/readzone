import jwt, { type SignOptions, type VerifyOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import type ms from 'ms';

// JWT 페이로드 타입
export interface JWTPayload {
  userId: string;
  email: string | null;
  nickname: string;
  role?: string;
  type: 'access' | 'refresh' | 'email-verification' | 'password-reset';
  iat?: number;
  exp?: number;
  jti?: string;
}

// 환경변수 접근을 지연시켜 ConfigModule 초기화 이후 값을 사용
function getEnv(name: string, fallback: string): string {
  const val = process.env[name];
  return val && val.length > 0 ? val : fallback;
}

function getJwtSecret(): string {
  return getEnv('JWT_SECRET', 'default-secret-change-in-production');
}

function getAccessExpiresIn(): string {
  // Access token: 기본 15분
  return getEnv('JWT_EXPIRES_IN', '15m');
}

function getRefreshExpiresIn(): string {
  // Refresh token: 기본 7일
  return getEnv('JWT_REFRESH_EXPIRES_IN', '7d');
}

function getEmailTokenExpiresIn(): string {
  // 이메일 인증: 기본 24시간
  return getEnv('EMAIL_TOKEN_EXPIRES_IN', '24h');
}

/**
 * JWT 토큰 생성
 */
export function generateAccessToken(
  payload: Omit<JWTPayload, 'type' | 'iat' | 'exp'>,
): string {
  const payloadData = { ...payload, type: 'access' as const };
  const options: SignOptions = {
    expiresIn: getAccessExpiresIn() as ms.StringValue,
    issuer: 'readzone-api',
    audience: 'readzone-client',
    jwtid: crypto.randomUUID(), // 유니크 ID 추가
  };

  return jwt.sign(payloadData, getJwtSecret(), options);
}

/**
 * 리프레시 토큰 생성
 */
export function generateRefreshToken(
  payload: Omit<JWTPayload, 'type' | 'iat' | 'exp'>,
  expiresInOverride?: ms.StringValue | number,
): string {
  const payloadData = { ...payload, type: 'refresh' as const };
  const options: SignOptions = {
    expiresIn: (expiresInOverride ?? getRefreshExpiresIn()) as
      | ms.StringValue
      | number,
    issuer: 'readzone-api',
    audience: 'readzone-client',
    jwtid: crypto.randomUUID(), // 유니크 ID 추가
  };

  return jwt.sign(payloadData, getJwtSecret(), options);
}

/**
 * 이메일 인증 토큰 생성
 */
export function generateEmailVerificationToken(
  payload: Omit<JWTPayload, 'type' | 'iat' | 'exp'>,
): string {
  const payloadData = { ...payload, type: 'email-verification' as const };
  const options: SignOptions = {
    expiresIn: getEmailTokenExpiresIn() as ms.StringValue,
    issuer: 'readzone-api',
    audience: 'readzone-client',
  };

  return jwt.sign(payloadData, getJwtSecret(), options);
}

/**
 * 비밀번호 재설정 토큰 생성
 */
export function generatePasswordResetToken(
  payload: Omit<JWTPayload, 'type' | 'iat' | 'exp'>,
): string {
  const payloadData = { ...payload, type: 'password-reset' as const };
  const options: SignOptions = {
    expiresIn: '1h', // 비밀번호 재설정: 1시간
    issuer: 'readzone-api',
    audience: 'readzone-client',
  };

  return jwt.sign(payloadData, getJwtSecret(), options);
}

/**
 * JWT 토큰 검증
 */
export function verifyToken(token: string): JWTPayload {
  const options: VerifyOptions = {
    issuer: 'readzone-api',
    audience: 'readzone-client',
  };
  const decoded = jwt.verify(token, getJwtSecret(), options) as JWTPayload;

  return decoded;
}

/**
 * 토큰에서 사용자 ID 추출
 */
export function extractUserIdFromToken(token: string): string | null {
  try {
    const payload = verifyToken(token);

    return payload.userId;
  } catch {
    return null;
  }
}

/**
 * Access/Refresh 토큰 쌍 생성
 */
export function generateTokenPair(
  payload: Omit<JWTPayload, 'type' | 'iat' | 'exp'>,
  refreshExpiresInOverride?: ms.StringValue | number,
) {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload, refreshExpiresInOverride),
    expiresIn: getAccessExpiresIn(),
    tokenType: 'Bearer',
  };
}

/**
 * 토큰 만료 시간 계산 (초 단위)
 */
export function getTokenExpirationTime(expiresIn: string): number {
  const unit = expiresIn.slice(-1);
  const value = parseInt(expiresIn.slice(0, -1));

  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 60 * 60;
    case 'd':
      return value * 60 * 60 * 24;
    default:
      return 900; // 기본값: 15분
  }
}

/**
 * 토큰 만료 시간 계산 (밀리초 단위) - Cookie maxAge용
 */
export function getTokenExpirationTimeMs(expiresIn: string): number {
  return getTokenExpirationTime(expiresIn) * 1000;
}

/**
 * 안전한 랜덤 토큰 생성 (이메일 인증 등에 사용)
 */
export function generateSecureToken(length = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * 토큰 타입 검증
 */
export function validateTokenType(
  token: string,
  expectedType: JWTPayload['type'],
): boolean {
  try {
    const payload = verifyToken(token);

    return payload.type === expectedType;
  } catch {
    return false;
  }
}

/**
 * 토큰 만료까지 남은 시간 (초)
 */
export function getTimeUntilExpiration(token: string): number | null {
  try {
    const payload = verifyToken(token);

    if (!payload.exp) {
      return null;
    }

    const now = Math.floor(Date.now() / 1000);

    return Math.max(0, payload.exp - now);
  } catch {
    return null;
  }
}

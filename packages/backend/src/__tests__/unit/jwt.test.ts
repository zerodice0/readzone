import { describe, it, expect, beforeEach } from 'vitest'
import { generateTokenPair, generateEmailVerificationToken, verifyToken } from '@/lib/jwt'
import type { JWTPayload } from '@/lib/jwt'

describe('JWT Library', () => {
  const testUser = {
    userId: 'user123',
    email: 'test@example.com',
    nickname: 'testuser'
  }

  beforeEach(() => {
    // JWT 관련 환경변수가 setup.ts에서 설정됨
  })

  describe('generateTokenPair', () => {
    it('should generate access and refresh tokens', () => {
      const tokens = generateTokenPair(testUser)

      expect(tokens).toHaveProperty('accessToken')
      expect(tokens).toHaveProperty('refreshToken')
      expect(tokens).toHaveProperty('expiresIn')
      expect(tokens).toHaveProperty('tokenType', 'Bearer')

      expect(typeof tokens.accessToken).toBe('string')
      expect(typeof tokens.refreshToken).toBe('string')
      expect(tokens.accessToken).not.toBe(tokens.refreshToken)
    })

    it('should generate valid tokens that can be verified', () => {
      const tokens = generateTokenPair(testUser)

      const accessPayload = verifyToken(tokens.accessToken) as JWTPayload
      const refreshPayload = verifyToken(tokens.refreshToken) as JWTPayload

      expect(accessPayload.type).toBe('access')
      expect(accessPayload.userId).toBe(testUser.userId)
      expect(accessPayload.email).toBe(testUser.email)
      expect(accessPayload.nickname).toBe(testUser.nickname)

      expect(refreshPayload.type).toBe('refresh')
      expect(refreshPayload.userId).toBe(testUser.userId)
      expect(refreshPayload.email).toBe(testUser.email)
      expect(refreshPayload.nickname).toBe(testUser.nickname)
    })
  })

  describe('generateEmailVerificationToken', () => {
    it('should generate email verification token', () => {
      const token = generateEmailVerificationToken(testUser)

      expect(typeof token).toBe('string')
      expect(token.length).toBeGreaterThan(0)
    })

    it('should generate valid verification token', () => {
      const token = generateEmailVerificationToken(testUser)
      const payload = verifyToken(token) as JWTPayload

      expect(payload.type).toBe('email-verification')
      expect(payload.userId).toBe(testUser.userId)
      expect(payload.email).toBe(testUser.email)
      expect(payload.nickname).toBe(testUser.nickname)
    })
  })

  describe('verifyToken', () => {
    it('should verify valid tokens', () => {
      const tokens = generateTokenPair(testUser)
      
      expect(() => verifyToken(tokens.accessToken)).not.toThrow()
      expect(() => verifyToken(tokens.refreshToken)).not.toThrow()
    })

    it('should throw error for invalid tokens', () => {
      expect(() => verifyToken('invalid.token.here')).toThrow()
      expect(() => verifyToken('')).toThrow()
      expect(() => verifyToken('not-a-jwt')).toThrow()
    })

    it('should throw error for malformed tokens', () => {
      expect(() => verifyToken('header.payload')).toThrow() // Missing signature
      expect(() => verifyToken('header')).toThrow() // Invalid format
    })

    it('should return correct payload structure', () => {
      const tokens = generateTokenPair(testUser)
      const payload = verifyToken(tokens.accessToken) as JWTPayload

      expect(payload).toHaveProperty('iss', 'readzone-api')
      expect(payload).toHaveProperty('aud', 'readzone-client')
      expect(payload).toHaveProperty('iat')
      expect(payload).toHaveProperty('exp')
      expect(payload).toHaveProperty('type', 'access')
      expect(payload).toHaveProperty('userId', testUser.userId)
      expect(payload).toHaveProperty('email', testUser.email)
      expect(payload).toHaveProperty('nickname', testUser.nickname)
    })
  })

  describe('token expiration', () => {
    it('should have different expiration times for access and refresh tokens', () => {
      const tokens = generateTokenPair(testUser)
      
      const accessPayload = verifyToken(tokens.accessToken) as JWTPayload
      const refreshPayload = verifyToken(tokens.refreshToken) as JWTPayload

      // Refresh token should expire after access token
      expect(refreshPayload.exp).toBeGreaterThan(accessPayload.exp)
    })

    it('should include expiration info in token response', () => {
      const tokens = generateTokenPair(testUser)
      
      expect(tokens.expiresIn).toBe('1h') // 환경변수에서 설정된 값
    })
  })

  describe('token uniqueness', () => {
    it('should generate unique tokens for same user', () => {
      const tokens1 = generateTokenPair(testUser)
      const tokens2 = generateTokenPair(testUser)

      expect(tokens1.accessToken).not.toBe(tokens2.accessToken)
      expect(tokens1.refreshToken).not.toBe(tokens2.refreshToken)
    })

    it('should generate different tokens for different users', () => {
      const user2 = {
        userId: 'user456',
        email: 'test2@example.com',
        nickname: 'testuser2'
      }

      const tokens1 = generateTokenPair(testUser)
      const tokens2 = generateTokenPair(user2)

      expect(tokens1.accessToken).not.toBe(tokens2.accessToken)
      expect(tokens1.refreshToken).not.toBe(tokens2.refreshToken)

      const payload1 = verifyToken(tokens1.accessToken) as JWTPayload
      const payload2 = verifyToken(tokens2.accessToken) as JWTPayload

      expect(payload1.userId).not.toBe(payload2.userId)
      expect(payload1.email).not.toBe(payload2.email)
    })
  })
})
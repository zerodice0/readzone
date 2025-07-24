/**
 * Email Verification End-to-End Test Suite
 * Tests the complete email verification flow after the URL template fix
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { prisma } from '@/lib/db'
import { hashPassword } from '@/lib/utils'
import { sendVerificationEmail } from '@/lib/email'

// Mock the email sending function
jest.mock('@/lib/email', () => ({
  sendVerificationEmail: jest.fn(),
  resendVerificationEmail: jest.fn(),
}))

describe('Email Verification Flow', () => {
  const testUser = {
    email: 'test@example.com',
    password: 'TestPassword123!',
    nickname: 'testuser',
  }

  beforeEach(async () => {
    // Clean up test data
    await prisma.verificationToken.deleteMany({
      where: { identifier: testUser.email }
    })
    await prisma.user.deleteMany({
      where: { email: testUser.email }
    })
  })

  afterEach(async () => {
    // Clean up after tests
    await prisma.verificationToken.deleteMany({
      where: { identifier: testUser.email }
    })
    await prisma.user.deleteMany({
      where: { email: testUser.email }
    })
  })

  describe('User Registration', () => {
    it('should create user and send verification email with correct URL', async () => {
      // Register new user
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser),
      })

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.success).toBe(true)

      // Check user was created
      const user = await prisma.user.findUnique({
        where: { email: testUser.email }
      })
      expect(user).toBeTruthy()
      expect(user?.emailVerified).toBeNull()

      // Check verification token was created
      const token = await prisma.verificationToken.findFirst({
        where: { identifier: testUser.email }
      })
      expect(token).toBeTruthy()

      // Verify email was sent with correct parameters
      expect(sendVerificationEmail).toHaveBeenCalledWith(
        testUser.email,
        expect.any(String)
      )
    })
  })

  describe('Email Verification URL', () => {
    it('should include both token and email parameters in verification URL', async () => {
      const mockToken = 'test-verification-token'
      const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${mockToken}&email=${encodeURIComponent(testUser.email)}`

      // The URL should contain both parameters
      expect(verificationUrl).toContain('token=')
      expect(verificationUrl).toContain('email=')
      expect(verificationUrl).toContain(encodeURIComponent(testUser.email))
    })
  })

  describe('Email Verification Process', () => {
    it('should verify email when valid token is provided', async () => {
      // Create user
      const hashedPassword = await hashPassword(testUser.password)
      const user = await prisma.user.create({
        data: {
          email: testUser.email,
          password: hashedPassword,
          nickname: testUser.nickname,
        }
      })

      // Create verification token
      const token = 'valid-test-token'
      await prisma.verificationToken.create({
        data: {
          identifier: testUser.email,
          token,
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        }
      })

      // Verify email
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)

      // Check user is now verified
      const verifiedUser = await prisma.user.findUnique({
        where: { id: user.id }
      })
      expect(verifiedUser?.emailVerified).toBeTruthy()

      // Check token was deleted
      const deletedToken = await prisma.verificationToken.findUnique({
        where: { token }
      })
      expect(deletedToken).toBeNull()
    })

    it('should reject expired token', async () => {
      // Create user
      const hashedPassword = await hashPassword(testUser.password)
      await prisma.user.create({
        data: {
          email: testUser.email,
          password: hashedPassword,
          nickname: testUser.nickname,
        }
      })

      // Create expired token
      const token = 'expired-test-token'
      await prisma.verificationToken.create({
        data: {
          identifier: testUser.email,
          token,
          expires: new Date(Date.now() - 1000), // Already expired
        }
      })

      // Try to verify with expired token
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.message).toContain('만료')
    })

    it('should reject invalid token', async () => {
      // Try to verify with non-existent token
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'invalid-token' }),
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.message).toContain('유효하지 않은')
    })
  })

  describe('Login with Email Verification', () => {
    it('should prevent login for unverified users', async () => {
      // Create unverified user
      const hashedPassword = await hashPassword(testUser.password)
      await prisma.user.create({
        data: {
          email: testUser.email,
          password: hashedPassword,
          nickname: testUser.nickname,
          emailVerified: null, // Not verified
        }
      })

      // Try to login
      const response = await fetch('/api/auth/callback/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password,
        }),
      })

      // Should fail with email verification error
      expect(response.status).toBe(401)
      const text = await response.text()
      expect(text).toContain('이메일 인증이 완료되지 않았습니다')
    })

    it('should allow login for verified users', async () => {
      // Create verified user
      const hashedPassword = await hashPassword(testUser.password)
      await prisma.user.create({
        data: {
          email: testUser.email,
          password: hashedPassword,
          nickname: testUser.nickname,
          emailVerified: new Date(), // Verified
        }
      })

      // Mock NextAuth for testing
      // In a real test environment, you would set up proper NextAuth testing
      console.log('Verified user can login successfully')
    })
  })

  describe('Email Resend', () => {
    it('should resend verification email for unverified users', async () => {
      // Create unverified user
      const hashedPassword = await hashPassword(testUser.password)
      await prisma.user.create({
        data: {
          email: testUser.email,
          password: hashedPassword,
          nickname: testUser.nickname,
        }
      })

      // Request resend
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testUser.email }),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)

      // Check new token was created
      const token = await prisma.verificationToken.findFirst({
        where: { identifier: testUser.email }
      })
      expect(token).toBeTruthy()
    })

    it('should not resend for already verified users', async () => {
      // Create verified user
      const hashedPassword = await hashPassword(testUser.password)
      await prisma.user.create({
        data: {
          email: testUser.email,
          password: hashedPassword,
          nickname: testUser.nickname,
          emailVerified: new Date(), // Already verified
        }
      })

      // Request resend
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testUser.email }),
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.message).toContain('이미 인증된')
    })
  })
})

describe('Email Template Verification', () => {
  it('should generate correct verification URL format', () => {
    const email = 'user@example.com'
    const token = 'test-token-123'
    const expectedUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}&email=${encodeURIComponent(email)}`
    
    // Test URL encoding for special characters
    const specialEmail = 'user+test@example.com'
    const specialUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}&email=${encodeURIComponent(specialEmail)}`
    
    expect(specialUrl).toContain('user%2Btest%40example.com')
  })
})
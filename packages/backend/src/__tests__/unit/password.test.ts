import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword, validatePasswordPolicy } from '@/lib/password'

describe('Password Library', () => {
  describe('hashPassword', () => {
    it('should hash password correctly', async () => {
      const password = 'testPassword123!'
      const hash = await hashPassword(password)

      expect(typeof hash).toBe('string')
      expect(hash.length).toBeGreaterThan(50) // bcrypt hash is typically 60 characters
      expect(hash).not.toBe(password) // Hash should be different from original
    })

    it('should generate different hashes for same password', async () => {
      const password = 'testPassword123!'
      
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)

      expect(hash1).not.toBe(hash2) // Salt should make each hash unique
    })

    it('should handle special characters', async () => {
      const passwordWithSpecialChars = 'P@ssw0rd!@#$%^&*()'
      const hash = await hashPassword(passwordWithSpecialChars)

      expect(typeof hash).toBe('string')
      expect(hash.length).toBeGreaterThan(50)
    })

    it('should handle empty password', async () => {
      const hash = await hashPassword('')
      
      expect(typeof hash).toBe('string')
      expect(hash.length).toBeGreaterThan(50)
    })
  })

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'testPassword123!'
      const hash = await hashPassword(password)

      const isValid = await verifyPassword(password, hash)
      expect(isValid).toBe(true)
    })

    it('should reject incorrect password', async () => {
      const password = 'testPassword123!'
      const wrongPassword = 'wrongPassword123!'
      const hash = await hashPassword(password)

      const isValid = await verifyPassword(wrongPassword, hash)
      expect(isValid).toBe(false)
    })

    it('should reject empty password against hash', async () => {
      const password = 'testPassword123!'
      const hash = await hashPassword(password)

      const isValid = await verifyPassword('', hash)
      expect(isValid).toBe(false)
    })

    it('should handle case sensitivity', async () => {
      const password = 'TestPassword123!'
      const hash = await hashPassword(password)

      const isValidLower = await verifyPassword('testpassword123!', hash)
      const isValidUpper = await verifyPassword('TESTPASSWORD123!', hash)

      expect(isValidLower).toBe(false)
      expect(isValidUpper).toBe(false)
    })

    it('should handle special characters correctly', async () => {
      const password = 'P@ssw0rd!@#$%^&*()'
      const hash = await hashPassword(password)

      const isValid = await verifyPassword(password, hash)
      expect(isValid).toBe(true)
    })
  })

  describe('validatePasswordPolicy', () => {
    describe('valid passwords', () => {
      const validPasswords = [
        'Password123!',
        'MyStr0ng@Pass',
        'TestP@ssw0rd',
        '123456Ab!',
        'abcdef123!',
        'P@ssword1',
        'VeryStr0ng#Password',
        'Simple123@',
        '123456', // ReadZone은 관대한 정책 사용
        'abcdef',
        '한글비번123'
      ]

      validPasswords.forEach(password => {
        it(`should accept valid password: "${password}"`, () => {
          const result = validatePasswordPolicy(password)
          
          expect(result.isValid).toBe(true)
          expect(result.message).toBeUndefined()
        })
      })
    })

    describe('invalid passwords - length', () => {
      const shortPasswords = [
        '',
        'a',
        'ab',
        'abc',
        'abcd',
        'abcde'
      ]

      shortPasswords.forEach(password => {
        it(`should reject too short password: "${password}"`, () => {
          const result = validatePasswordPolicy(password)
          
          expect(result.isValid).toBe(false)
          expect(result.message).toBe('비밀번호는 최소 6자 이상이어야 합니다')
        })
      })

      it('should reject too long password', () => {
        const longPassword = 'a'.repeat(129)
        const result = validatePasswordPolicy(longPassword)
        
        expect(result.isValid).toBe(false)
        expect(result.message).toBe('비밀번호는 128자 이하여야 합니다')
      })
    })

    describe('invalid passwords - content requirements', () => {
      it('should reject password without letters or numbers', () => {
        const password = '!@#$%^&*()'
        const result = validatePasswordPolicy(password)
        
        expect(result.isValid).toBe(false)
        expect(result.message).toBe('비밀번호는 영문자 또는 숫자를 포함해야 합니다')
      })

      it('should reject password with only special characters', () => {
        const password = '!@#$%^'
        const result = validatePasswordPolicy(password)
        
        expect(result.isValid).toBe(false)
        expect(result.message).toBe('비밀번호는 영문자 또는 숫자를 포함해야 합니다')
      })
    })

    describe('edge case validation', () => {
      it('should prioritize length validation', () => {
        const shortSpecialPassword = '!@#'
        const result = validatePasswordPolicy(shortSpecialPassword)
        
        expect(result.isValid).toBe(false)
        expect(result.message).toBe('비밀번호는 최소 6자 이상이어야 합니다')
      })

      it('should check content after length validation passes', () => {
        const longSpecialPassword = '!@#$%^&*()'
        const result = validatePasswordPolicy(longSpecialPassword)
        
        expect(result.isValid).toBe(false)
        expect(result.message).toBe('비밀번호는 영문자 또는 숫자를 포함해야 합니다')
      })
    })

    describe('edge cases', () => {
      it('should handle null/undefined input gracefully', () => {
        expect(() => validatePasswordPolicy(null as unknown as string)).toThrow()
        expect(() => validatePasswordPolicy(undefined as unknown as string)).toThrow()
      })

      it('should handle whitespace in password', () => {
        const passwordWithSpaces = 'Pass word123!'
        const result = validatePasswordPolicy(passwordWithSpaces)
        
        expect(result.isValid).toBe(true) // 공백 허용
      })

      it('should handle unicode characters', () => {
        const unicodePassword = 'Pássw0rd123!한글'
        const result = validatePasswordPolicy(unicodePassword)
        
        expect(result.isValid).toBe(true) // 유니코드 허용
      })
    })
  })

  describe('integration tests', () => {
    it('should work with real password flow', async () => {
      const password = 'MySecureP@ssw0rd123'
      
      // 1. Validate password policy
      const validation = validatePasswordPolicy(password)
      expect(validation.isValid).toBe(true)
      
      // 2. Hash password
      const hash = await hashPassword(password)
      expect(hash).toBeDefined()
      
      // 3. Verify password
      const isValid = await verifyPassword(password, hash)
      expect(isValid).toBe(true)
      
      // 4. Verify wrong password fails
      const isInvalid = await verifyPassword('WrongPassword123!', hash)
      expect(isInvalid).toBe(false)
    })
  })
})
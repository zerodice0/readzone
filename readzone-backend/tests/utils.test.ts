import { parsePaginationParams, createPaginationMeta } from '../src/utils/pagination';
import { validateData, registerSchema, loginSchema } from '../src/utils/validation';

describe('Utility Functions Tests', () => {
  describe('Pagination Utils', () => {
    describe('parsePaginationParams', () => {
      it('should return valid pagination with default values', () => {
        const result = parsePaginationParams({});
        
        expect(result.page).toBe(1);
        expect(result.limit).toBe(20);
        expect(result.skip).toBe(0);
      });

      it('should return valid pagination with custom values', () => {
        const result = parsePaginationParams({ page: 2, limit: 10 });
        
        expect(result.page).toBe(2);
        expect(result.limit).toBe(10);
        expect(result.skip).toBe(10);
      });

      it('should handle string inputs', () => {
        const result = parsePaginationParams({ page: '3' as any, limit: '15' as any });
        
        expect(result.page).toBe(3);
        expect(result.limit).toBe(15);
        expect(result.skip).toBe(30);
      });

      it('should enforce minimum page value', () => {
        const result = parsePaginationParams({ page: 0 });
        
        expect(result.page).toBe(1);
        expect(result.skip).toBe(0);
      });

      it('should enforce negative page value', () => {
        const result = parsePaginationParams({ page: -5 });
        
        expect(result.page).toBe(1);
        expect(result.skip).toBe(0);
      });

      it('should enforce minimum limit value', () => {
        const result = parsePaginationParams({ page: 1, limit: 0 });
        
        expect(result.limit).toBe(20); // 기본값으로 설정됨
      });

      it('should enforce maximum limit value', () => {
        const result = parsePaginationParams({ page: 1, limit: 200 });
        
        expect(result.limit).toBe(100);
      });

      it('should handle invalid string inputs', () => {
        const result = parsePaginationParams({ page: 'invalid' as any, limit: 'also-invalid' as any });
        
        expect(result.page).toBe(1);
        expect(result.limit).toBe(20);
        expect(result.skip).toBe(0);
      });

      it('should calculate correct skip value', () => {
        const testCases = [
          { page: 1, limit: 20, expectedSkip: 0 },
          { page: 2, limit: 20, expectedSkip: 20 },
          { page: 3, limit: 15, expectedSkip: 30 },
          { page: 5, limit: 10, expectedSkip: 40 },
        ];

        testCases.forEach(({ page, limit, expectedSkip }) => {
          const result = parsePaginationParams({ page, limit });
          expect(result.skip).toBe(expectedSkip);
        });
      });
    });

    describe('createPaginationMeta', () => {
      it('should create correct pagination response', () => {
        const result = createPaginationMeta(1, 20, 85);
        
        expect(result.page).toBe(1);
        expect(result.limit).toBe(20);
        expect(result.total).toBe(85);
        expect(result.totalPages).toBe(5);
        expect(result.hasNext).toBe(true);
        expect(result.hasPrev).toBe(false);
      });

      it('should handle last page correctly', () => {
        const result = createPaginationMeta(5, 20, 85);
        
        expect(result.page).toBe(5);
        expect(result.totalPages).toBe(5);
        expect(result.hasNext).toBe(false);
        expect(result.hasPrev).toBe(true);
      });

      it('should handle middle page correctly', () => {
        const result = createPaginationMeta(3, 20, 100);
        
        expect(result.page).toBe(3);
        expect(result.totalPages).toBe(5);
        expect(result.hasNext).toBe(true);
        expect(result.hasPrev).toBe(true);
      });

      it('should handle single page correctly', () => {
        const result = createPaginationMeta(1, 20, 10);
        
        expect(result.page).toBe(1);
        expect(result.totalPages).toBe(1);
        expect(result.hasNext).toBe(false);
        expect(result.hasPrev).toBe(false);
      });

      it('should handle zero total correctly', () => {
        const result = createPaginationMeta(1, 20, 0);
        
        expect(result.page).toBe(1);
        expect(result.total).toBe(0);
        expect(result.totalPages).toBe(0);
        expect(result.hasNext).toBe(false);
        expect(result.hasPrev).toBe(false);
      });

      it('should calculate total pages correctly for exact division', () => {
        const result = createPaginationMeta(1, 20, 60);
        
        expect(result.totalPages).toBe(3);
      });
    });
  });

  describe('Validation Utils', () => {
    describe('validateData with registerSchema', () => {
      it('should validate valid registration data', () => {
        const validData = {
          email: 'user@example.com',
          username: 'testuser123',
          password: 'password123'
        };

        expect(() => validateData(registerSchema, validData)).not.toThrow();
      });

      it('should reject invalid email format', () => {
        const invalidData = {
          email: 'invalid-email',
          username: 'testuser',
          password: 'password123'
        };

        expect(() => validateData(registerSchema, invalidData)).toThrow();
      });

      it('should reject short password', () => {
        const invalidData = {
          email: 'user@example.com',
          username: 'testuser',
          password: '123'
        };

        expect(() => validateData(registerSchema, invalidData)).toThrow();
      });

      it('should reject invalid username', () => {
        const invalidData = {
          email: 'user@example.com',
          username: 'us', // too short
          password: 'password123'
        };

        expect(() => validateData(registerSchema, invalidData)).toThrow();
      });

      it('should reject missing required fields', () => {
        const invalidData = {
          email: 'user@example.com'
          // missing username and password
        };

        expect(() => validateData(registerSchema, invalidData)).toThrow();
      });
    });

    describe('validateData with loginSchema', () => {
      it('should validate valid login data', () => {
        const validData = {
          email: 'user@example.com',
          password: 'password123'
        };

        expect(() => validateData(loginSchema, validData)).not.toThrow();
      });

      it('should accept username as email field', () => {
        const validData = {
          email: 'username',
          password: 'password123'
        };

        expect(() => validateData(loginSchema, validData)).not.toThrow();
      });

      it('should reject missing email', () => {
        const invalidData = {
          password: 'password123'
        };

        expect(() => validateData(loginSchema, invalidData)).toThrow();
      });

      it('should reject missing password', () => {
        const invalidData = {
          email: 'user@example.com'
        };

        expect(() => validateData(loginSchema, invalidData)).toThrow();
      });

      it('should reject empty credentials', () => {
        const invalidData = {};

        expect(() => validateData(loginSchema, invalidData)).toThrow();
      });
    });

    describe('validateData error handling', () => {
      it('should return detailed error messages', () => {
        const invalidData = {
          email: 'invalid-email',
          username: 'us',
          password: '123'
        };

        try {
          validateData(registerSchema, invalidData);
        } catch (error: any) {
          expect(error.message).toContain('유효한 이메일');
          expect(error.message).toContain('최소 3자');
          expect(error.message).toContain('최소 8자');
        }
      });

      it('should handle multiple validation errors', () => {
        const invalidData = {
          // All fields invalid or missing
        };

        expect(() => validateData(registerSchema, invalidData)).toThrow();
      });
    });
  });
});
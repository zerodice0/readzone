import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RolesGuard } from '../roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let mockReflector: {
    getAllAndOverride: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockReflector = {
      getAllAndOverride: vi.fn(),
    };
    guard = new RolesGuard(mockReflector as unknown as Reflector);
  });

  const createMockExecutionContext = (
    user: { role: UserRole } | null,
    roles?: UserRole[],
  ): ExecutionContext => {
    // Set up mock return value for getAllAndOverride
    mockReflector.getAllAndOverride.mockReturnValue(
      roles !== undefined ? roles : undefined,
    );

    const mockExecutionContext = {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue({ user }),
      }),
    } as unknown as ExecutionContext;

    return mockExecutionContext;
  };

  describe('canActivate', () => {
    it('should allow access when no roles are required', () => {
      const context = createMockExecutionContext(
        { role: UserRole.USER },
        undefined,
      );

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should deny access when user is not authenticated', () => {
      const context = createMockExecutionContext(null, [UserRole.ADMIN]);

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should allow access when user has required role (ADMIN)', () => {
      const context = createMockExecutionContext(
        { role: UserRole.ADMIN },
        [UserRole.ADMIN],
      );

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow access when user has one of multiple required roles', () => {
      const context = createMockExecutionContext(
        { role: UserRole.ADMIN },
        [UserRole.ADMIN, UserRole.SUPERADMIN],
      );

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should deny access when user role does not match required roles', () => {
      const context = createMockExecutionContext(
        { role: UserRole.USER },
        [UserRole.ADMIN],
      );

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should deny access when USER tries to access MODERATOR endpoint', () => {
      const context = createMockExecutionContext(
        { role: UserRole.USER },
        [UserRole.MODERATOR],
      );

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should allow access when SUPERADMIN accesses ADMIN endpoint', () => {
      const context = createMockExecutionContext(
        { role: UserRole.SUPERADMIN },
        [UserRole.ADMIN, UserRole.SUPERADMIN],
      );

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should deny access when MODERATOR tries to access ADMIN endpoint', () => {
      const context = createMockExecutionContext(
        { role: UserRole.MODERATOR },
        [UserRole.ADMIN, UserRole.SUPERADMIN],
      );

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });
  });
});

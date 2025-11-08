import { IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { UserRole, UserStatus } from '@prisma/client';

/**
 * DTO for updating user (Admin only)
 *
 * Allows admin to modify user role, status, and email verification.
 * Includes safety rules to prevent privilege escalation and self-modification.
 */
export class UpdateUserDto {
  /**
   * Update user role
   *
   * Restrictions:
   * - Cannot assign ANONYMOUS role (reserved for non-logged-in)
   * - Cannot assign DELETED status (use soft-delete endpoint)
   * - Admin cannot modify their own role (prevent privilege loss)
   */
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  /**
   * Update user status
   *
   * Restrictions:
   * - Cannot assign DELETED status (use soft-delete or force-delete endpoints)
   * - Setting SUSPENDED immediately revokes all active sessions
   */
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  /**
   * Force set email verification status
   *
   * Use case: Manual verification after support ticket
   */
  @IsOptional()
  @IsBoolean()
  emailVerified?: boolean;
}

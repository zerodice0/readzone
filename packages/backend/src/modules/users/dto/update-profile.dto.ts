import { IsEmail, IsOptional, IsString } from 'class-validator';

/**
 * Update profile DTO
 *
 * Allows authenticated users to update their email address.
 * Email changes require re-verification.
 */
export class UpdateProfileDto {
  /**
   * New email address (optional)
   *
   * When email is changed:
   * - Must be unique (not used by another user)
   * - emailVerified flag is reset to false
   * - New verification email is sent
   * - Audit log is created
   */
  @IsOptional()
  @IsEmail()
  @IsString()
  email?: string;
}

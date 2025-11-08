import { UserRole } from '@prisma/client';

/**
 * User profile response DTO
 *
 * Returns public profile information for the authenticated user.
 * Used by GET /users/me endpoint.
 */
export class UserProfileDto {
  /**
   * User email address
   */
  email!: string;

  /**
   * User role (ANONYMOUS, USER, MODERATOR, ADMIN, SUPERADMIN)
   */
  role!: UserRole;

  /**
   * Email verification status
   */
  emailVerified!: boolean;

  /**
   * MFA (Multi-Factor Authentication) enabled status
   */
  mfaEnabled!: boolean;

  /**
   * Connected OAuth providers
   * @example ['GOOGLE', 'KAKAO']
   */
  oauthConnections!: string[];

  /**
   * Whether user has a password (false for OAuth-only accounts)
   */
  hasPassword!: boolean;

  /**
   * Account creation timestamp
   */
  createdAt!: Date;

  constructor(partial: Partial<UserProfileDto>) {
    Object.assign(this, partial);
  }
}

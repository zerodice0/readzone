import { randomBytes } from 'crypto';

/**
 * Token generation utility
 * Uses crypto.randomBytes for cryptographically secure random token generation
 */

/**
 * Generate a secure random token
 * @param bytes Number of random bytes to generate (default: 32)
 * @returns URL-safe base64url encoded token
 *
 * @example
 * const token = generateSecureToken(); // 32 bytes = 256 bits
 * // Returns: "kX9vL2mN8pQ4rT6sU7wY3zA5bC1dE0fG2hI4jK6lM8n"
 */
export function generateSecureToken(bytes: number = 32): string {
  // Generate cryptographically secure random bytes
  const buffer = randomBytes(bytes);

  // Convert to base64url encoding (URL-safe, no padding)
  // base64url: Replace '+' with '-', '/' with '_', remove '=' padding
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Generate email verification token
 * @returns 32-byte URL-safe token (256 bits of entropy)
 *
 * @example
 * const token = generateEmailVerificationToken();
 * // Store token hash in database with expiration (24 hours)
 */
export function generateEmailVerificationToken(): string {
  return generateSecureToken(32);
}

/**
 * Generate password reset token
 * @returns 32-byte URL-safe token (256 bits of entropy)
 *
 * @example
 * const token = generatePasswordResetToken();
 * // Store token hash in database with expiration (1 hour)
 */
export function generatePasswordResetToken(): string {
  return generateSecureToken(32);
}

/**
 * Calculate token expiration timestamp
 * @param hours Number of hours until expiration
 * @returns ISO 8601 timestamp
 *
 * @example
 * const expiresAt = getTokenExpiration(24); // 24 hours from now
 * // Returns: "2025-11-07T15:35:00.000Z"
 */
export function getTokenExpiration(hours: number): Date {
  const now = new Date();
  now.setHours(now.getHours() + hours);
  return now;
}

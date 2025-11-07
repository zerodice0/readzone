import { randomBytes } from 'crypto';

/**
 * Generate a URL-safe random token
 *
 * Generates a cryptographically secure random token suitable for
 * email verification, password reset, and other security-sensitive operations.
 *
 * @param length - Length of the random bytes (default: 32)
 * @returns URL-safe base64-encoded random string
 *
 * @example
 * const token = generateToken(); // 32-byte token (43 chars in base64url)
 * const shortToken = generateToken(16); // 16-byte token (22 chars in base64url)
 */
export function generateToken(length: number = 32): string {
  return randomBytes(length).toString('base64url');
}

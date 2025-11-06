import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

/**
 * Password hashing and verification service
 * Uses bcrypt with secure defaults
 */
@Injectable()
export class PasswordService {
  private readonly saltRounds = 12; // Recommended bcrypt cost factor

  /**
   * Hash a plain text password
   * @param password Plain text password
   * @returns Hashed password
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  /**
   * Verify a password against a hash
   * Uses constant-time comparison to prevent timing attacks
   * @param password Plain text password
   * @param hash Hashed password to compare against
   * @returns True if password matches
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}

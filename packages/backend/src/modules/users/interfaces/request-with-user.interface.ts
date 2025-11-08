import { Request } from 'express';

/**
 * User information attached to request by JWT strategy
 */
export interface JwtUser {
  userId: string;
  email: string;
  name: string | null;
  role: string;
  emailVerified: boolean;
  sessionId: string;
}

/**
 * Express Request extended with authenticated user
 */
export interface RequestWithUser extends Request {
  user: JwtUser;
}

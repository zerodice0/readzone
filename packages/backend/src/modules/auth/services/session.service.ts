import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../../common/utils/prisma';
import { LoggerService } from '../../../common/utils/logger';

export interface CreateSessionData {
  userId: string;
  ipAddress: string;
  userAgent: string;
  deviceInfo: {
    browser?: string;
    os?: string;
    device?: string;
  };
  expiresAt: Date;
  rememberMe?: boolean;
}

export interface SessionInfo {
  id: string;
  userId: string;
  expiresAt: Date;
  isActive: boolean;
}

/**
 * Session management service
 * Manages user sessions in PostgreSQL (and optionally Redis for caching)
 */
@Injectable()
export class SessionService {
  private readonly logger = new LoggerService('SessionService');

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  /**
   * Create a new session
   * @param data Session creation data
   * @returns Created session ID
   */
  async createSession(data: CreateSessionData): Promise<string> {
    const session = await this.prisma.session.create({
      data: {
        userId: data.userId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        deviceInfo: data.deviceInfo,
        expiresAt: data.expiresAt,
        refreshExpiresAt: data.rememberMe
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days for remember me
          : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days default
        isActive: true,
      },
    });

    this.logger.log(`Session created: ${session.id} for user ${data.userId}`);
    return session.id;
  }

  /**
   * Validate a session
   * @param sessionId Session ID
   * @returns Session info if valid, null otherwise
   */
  async validateSession(sessionId: string): Promise<SessionInfo | null> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        userId: true,
        expiresAt: true,
        isActive: true,
        revokedAt: true,
      },
    });

    if (!session) {
      return null;
    }

    // Check if session is expired or revoked
    if (
      !session.isActive ||
      session.revokedAt ||
      session.expiresAt < new Date()
    ) {
      return null;
    }

    return {
      id: session.id,
      userId: session.userId,
      expiresAt: session.expiresAt,
      isActive: session.isActive,
    };
  }

  /**
   * Revoke a session (logout)
   * @param sessionId Session ID
   */
  async revokeSession(sessionId: string): Promise<void> {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        isActive: false,
        revokedAt: new Date(),
      },
    });

    this.logger.log(`Session revoked: ${sessionId}`);
  }

  /**
   * Revoke all sessions for a user
   * @param userId User ID
   */
  async revokeAllUserSessions(userId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: {
        userId,
        isActive: true,
      },
      data: {
        isActive: false,
        revokedAt: new Date(),
      },
    });

    this.logger.log(`All sessions revoked for user: ${userId}`);
  }

  /**
   * Get active sessions for a user
   * @param userId User ID
   * @returns List of active session IDs
   */
  async getUserActiveSessions(userId: string): Promise<string[]> {
    const sessions = await this.prisma.session.findMany({
      where: {
        userId,
        isActive: true,
        expiresAt: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
      },
    });

    return sessions.map((s) => s.id);
  }

  /**
   * Clean up expired sessions (cron job)
   */
  async cleanupExpiredSessions(): Promise<void> {
    const result = await this.prisma.session.updateMany({
      where: {
        isActive: true,
        expiresAt: {
          lt: new Date(),
        },
      },
      data: {
        isActive: false,
      },
    });

    this.logger.log(`Cleaned up ${result.count} expired sessions`);
  }
}

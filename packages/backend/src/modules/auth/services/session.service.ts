import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../../common/utils/prisma';
import { LoggerService } from '../../../common/utils/logger';
import { UAParser } from 'ua-parser-js';

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
   * T094: Parse User-Agent to extract device information
   * @param userAgent User-Agent string
   * @returns Parsed device info
   */
  parseDeviceInfo(userAgent: string): {
    browser?: string;
    os?: string;
    device?: string;
  } {
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    return {
      browser: result.browser.name
        ? `${result.browser.name} ${result.browser.version || ''}`
        : undefined,
      os: result.os.name
        ? `${result.os.name} ${result.os.version || ''}`
        : undefined,
      device: result.device.type || result.device.model || 'Desktop',
    };
  }

  /**
   * T097: Enforce concurrent session limit (10 sessions per user)
   * Deletes oldest sessions if limit exceeded
   * @param userId User ID
   */
  private async enforceSessionLimit(userId: string): Promise<void> {
    const MAX_SESSIONS = 10;

    // Get all active sessions for user, ordered by creation date
    const sessions = await this.prisma.session.findMany({
      where: {
        userId,
        isActive: true,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'asc', // Oldest first
      },
      select: {
        id: true,
        createdAt: true,
      },
    });

    // If we have MAX_SESSIONS or more, we need to delete the oldest before creating new one
    if (sessions.length >= MAX_SESSIONS) {
      const sessionsToDelete = sessions.slice(
        0,
        sessions.length - MAX_SESSIONS + 1
      );
      const sessionIds = sessionsToDelete.map((s) => s.id);

      await this.prisma.session.updateMany({
        where: {
          id: {
            in: sessionIds,
          },
        },
        data: {
          isActive: false,
          revokedAt: new Date(),
        },
      });

      this.logger.log(
        `Revoked ${sessionIds.length} oldest sessions for user ${userId} to enforce limit`
      );
    }
  }

  /**
   * Create a new session
   * T097: Enforces 10 session limit per user
   * @param data Session creation data
   * @returns Created session ID
   */
  async createSession(data: CreateSessionData): Promise<string> {
    // T097: Enforce session limit before creating new session
    await this.enforceSessionLimit(data.userId);

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
   * T093: Get detailed active sessions for a user
   * @param userId User ID
   * @returns List of active sessions with details
   */
  async getUserSessions(userId: string): Promise<
    Array<{
      id: string;
      ipAddress: string;
      deviceInfo: {
        browser?: string;
        os?: string;
        device?: string;
      };
      createdAt: Date;
      expiresAt: Date;
      lastActivityAt: Date;
    }>
  > {
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
        ipAddress: true,
        deviceInfo: true,
        createdAt: true,
        expiresAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc', // Most recent first
      },
    });

    return sessions.map((s) => ({
      id: s.id,
      ipAddress: s.ipAddress,
      deviceInfo: s.deviceInfo as {
        browser?: string;
        os?: string;
        device?: string;
      },
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
      lastActivityAt: s.updatedAt,
    }));
  }

  /**
   * Get active sessions for a user (legacy method for backward compatibility)
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
   * T095: Revoke a specific session by ID (only if owned by user)
   * @param sessionId Session ID
   * @param userId User ID (for ownership validation)
   * @returns True if session was revoked, false if not found or not owned
   */
  async revokeUserSession(sessionId: string, userId: string): Promise<boolean> {
    const session = await this.prisma.session.findFirst({
      where: {
        id: sessionId,
        userId,
        isActive: true,
      },
    });

    if (!session) {
      return false;
    }

    await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        isActive: false,
        revokedAt: new Date(),
      },
    });

    this.logger.log(`Session ${sessionId} revoked by user ${userId}`);
    return true;
  }

  /**
   * T096: Revoke all sessions for a user except the current one
   * @param userId User ID
   * @param currentSessionId Current session ID to preserve
   * @returns Number of sessions revoked
   */
  async revokeAllUserSessionsExceptCurrent(
    userId: string,
    currentSessionId: string
  ): Promise<number> {
    const result = await this.prisma.session.updateMany({
      where: {
        userId,
        isActive: true,
        id: {
          not: currentSessionId,
        },
      },
      data: {
        isActive: false,
        revokedAt: new Date(),
      },
    });

    this.logger.log(
      `Revoked ${result.count} sessions for user ${userId}, keeping session ${currentSessionId}`
    );
    return result.count;
  }

  /**
   * T098: Update session last activity timestamp
   * @param sessionId Session ID
   */
  async updateLastActivity(sessionId: string): Promise<void> {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        updatedAt: new Date(),
      },
    });
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

import {
  Controller,
  Get,
  Delete,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard.js';
import { SessionService } from '../services/session.service.js';
import { AuditService } from '../../../common/services/audit.service.js';
import type { Request } from 'express';

interface RequestWithUser extends Request {
  user: { userId: string; sessionId: string };
}

/**
 * T093-T096: Sessions management controller
 * Provides endpoints for users to manage their active sessions
 */
@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class SessionsController {
  constructor(
    private readonly sessionService: SessionService,
    private readonly auditService: AuditService
  ) {}

  /**
   * T093: Get all active sessions for the current user
   * GET /api/v1/sessions
   */
  @Get()
  async listSessions(@Req() req: RequestWithUser) {
    const userId = req.user.userId;
    const currentSessionId = req.user.sessionId;

    const sessions = await this.sessionService.getUserSessions(userId);

    // Mark the current session
    const sessionsWithCurrent = sessions.map((session) => ({
      ...session,
      isCurrent: session.id === currentSessionId,
    }));

    return {
      sessions: sessionsWithCurrent,
      total: sessionsWithCurrent.length,
    };
  }

  /**
   * T095: Logout a specific session
   * DELETE /api/v1/sessions/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async logoutSession(
    @Param('id') sessionId: string,
    @Req() req: RequestWithUser
  ) {
    const userId = req.user.userId;
    const ipAddress = req.ip || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    const revoked = await this.sessionService.revokeUserSession(
      sessionId,
      userId
    );

    if (!revoked) {
      throw new NotFoundException('Session not found or already logged out');
    }

    // T099: Audit log for session deletion
    await this.auditService.log({
      userId,
      action: 'SESSION_LOGOUT',
      metadata: { sessionId, method: 'individual' },
      ipAddress,
      userAgent,
      severity: 'INFO',
    });

    return {
      success: true,
      message: 'Session logged out successfully',
    };
  }

  /**
   * T096: Logout all sessions except the current one
   * DELETE /api/v1/sessions
   */
  @Delete()
  @HttpCode(HttpStatus.OK)
  async logoutAllSessions(@Req() req: RequestWithUser) {
    const userId = req.user.userId;
    const currentSessionId = req.user.sessionId;
    const ipAddress = req.ip || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    const revokedCount =
      await this.sessionService.revokeAllUserSessionsExceptCurrent(
        userId,
        currentSessionId
      );

    // T099: Audit log for bulk session deletion
    await this.auditService.log({
      userId,
      action: 'SESSION_LOGOUT_ALL',
      metadata: {
        revokedCount,
        keptSessionId: currentSessionId,
        method: 'all_except_current',
      },
      ipAddress,
      userAgent,
      severity: 'MEDIUM',
    });

    return {
      success: true,
      message: `Logged out ${revokedCount} session(s)`,
      revokedCount,
    };
  }
}

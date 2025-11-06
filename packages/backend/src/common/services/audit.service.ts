import { Injectable, Inject } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../utils/prisma';
import { LoggerService } from '../utils/logger';

export interface AuditLogData {
  userId?: string;
  action:
    | 'LOGIN'
    | 'LOGOUT'
    | 'LOGIN_FAILED'
    | 'PASSWORD_CHANGE'
    | 'MFA_ENABLE'
    | 'MFA_DISABLE'
    | 'ROLE_CHANGE'
    | 'ACCOUNT_SUSPEND'
    | 'ACCOUNT_DELETE'
    | 'OAUTH_CONNECT'
    | 'OAUTH_DISCONNECT'
    | 'PASSWORD_RESET'
    | 'EMAIL_VERIFY';
  ipAddress: string;
  userAgent: string;
  metadata?: Record<string, unknown>;
  severity?: 'INFO' | 'WARNING' | 'CRITICAL';
}

/**
 * Audit logging service
 * Records security-related events for compliance and monitoring
 */
@Injectable()
export class AuditService {
  private readonly logger = new LoggerService('AuditService');

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  /**
   * Log an audit event
   * @param data Audit log data
   */
  async log(data: AuditLogData): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: data.userId,
          action: data.action,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          metadata: (data.metadata || {}) as Prisma.InputJsonValue,
          severity: data.severity || 'INFO',
        },
      });

      this.logger.log(
        `Audit: ${data.action} by ${data.userId || 'anonymous'} from ${data.ipAddress}`
      );
    } catch (error) {
      // Don't throw on audit log failures to avoid breaking the main flow
      this.logger.error(
        'Failed to create audit log',
        error instanceof Error ? error.stack : undefined
      );
    }
  }

  /**
   * Log a login event
   */
  async logLogin(
    userId: string,
    ipAddress: string,
    userAgent: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.log({
      userId,
      action: 'LOGIN',
      ipAddress,
      userAgent,
      metadata,
      severity: 'INFO',
    });
  }

  /**
   * Log a failed login attempt
   */
  async logLoginFailed(
    email: string,
    ipAddress: string,
    userAgent: string,
    reason?: string
  ): Promise<void> {
    await this.log({
      action: 'LOGIN_FAILED',
      ipAddress,
      userAgent,
      metadata: { email, reason },
      severity: 'WARNING',
    });
  }

  /**
   * Log a logout event
   */
  async logLogout(
    userId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    await this.log({
      userId,
      action: 'LOGOUT',
      ipAddress,
      userAgent,
      severity: 'INFO',
    });
  }
}

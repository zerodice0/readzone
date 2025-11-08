import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { QueryAuditLogsDto } from '../dto/query-audit-logs.dto';
import { PrismaService } from '../../../common/utils/prisma';
import { success } from '../../../common/utils/response';

/**
 * Admin controller
 * Provides administrative endpoints for system management
 * All endpoints require ADMIN role
 */
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  /**
   * Query audit logs with filtering and pagination
   * GET /api/v1/admin/audit-logs
   * Requires ADMIN role
   */
  @Get('audit-logs')
  @HttpCode(HttpStatus.OK)
  async queryAuditLogs(@Query() query: QueryAuditLogsDto) {
    const {
      userId,
      action,
      severity,
      ipAddress,
      page = 1,
      limit = 20,
    } = query;

    const skip = (page - 1) * limit;

    // Build where clause for filtering
    const where: {
      userId?: string;
      action?: string;
      severity?: string;
      ipAddress?: string;
    } = {};

    if (userId) {
      where.userId = userId;
    }
    if (action) {
      where.action = action;
    }
    if (severity) {
      where.severity = severity;
    }
    if (ipAddress) {
      where.ipAddress = ipAddress;
    }

    // Query audit logs with pagination
    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          userId: true,
          action: true,
          ipAddress: true,
          userAgent: true,
          metadata: true,
          severity: true,
          createdAt: true,
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return success({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  }
}

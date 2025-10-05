import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

interface CreateAuditLogDto {
  adminId: string;
  action: string;
  targetType: string;
  targetId: string;
  reason?: string;
  metadata?: Prisma.InputJsonValue;
}

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 관리자 액션 로그 기록
   */
  async createLog(data: CreateAuditLogDto) {
    return this.prisma.auditLog.create({
      data: {
        adminId: data.adminId,
        action: data.action,
        targetType: data.targetType,
        targetId: data.targetId,
        reason: data.reason,
        metadata: data.metadata,
      },
    });
  }

  /**
   * 특정 관리자의 액션 로그 조회
   */
  async getLogsByAdmin(adminId: string, limit = 50) {
    return this.prisma.auditLog.findMany({
      where: { adminId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        admin: {
          select: {
            id: true,
            userid: true,
            nickname: true,
          },
        },
      },
    });
  }

  /**
   * 특정 대상에 대한 액션 로그 조회
   */
  async getLogsByTarget(targetType: string, targetId: string) {
    return this.prisma.auditLog.findMany({
      where: {
        targetType,
        targetId,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        admin: {
          select: {
            id: true,
            userid: true,
            nickname: true,
          },
        },
      },
    });
  }
}

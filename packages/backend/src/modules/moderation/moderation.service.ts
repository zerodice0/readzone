import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from './audit-log.service';
import { CreateReportDto } from './dto/create-report.dto';
import { BlockUserDto } from './dto/block-user.dto';
import { ReviewReportDto, GetReportsDto } from './dto/review-report.dto';
import { SuspendUserDto } from './dto/suspend-user.dto';
import { ReportStatus } from '@prisma/client';

@Injectable()
export class ModerationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  /**
   * 신고 생성 (일반 사용자)
   */
  async createReport(reporterId: string, dto: CreateReportDto) {
    // 자기 자신을 신고할 수 없음
    if (reporterId === dto.reportedUserId) {
      throw new BadRequestException('자기 자신을 신고할 수 없습니다.');
    }

    // 신고 대상 사용자 확인
    const reportedUser = await this.prisma.user.findUnique({
      where: { id: dto.reportedUserId },
    });

    if (!reportedUser) {
      throw new NotFoundException('신고 대상 사용자를 찾을 수 없습니다.');
    }

    // 중복 신고 확인 (동일한 타겟에 대해 PENDING 상태의 신고가 있는지)
    const existingReport = await this.prisma.report.findFirst({
      where: {
        reporterId,
        targetType: dto.targetType,
        targetId: dto.targetId,
        status: ReportStatus.PENDING,
      },
    });

    if (existingReport) {
      throw new ConflictException('이미 신고한 내용입니다.');
    }

    return this.prisma.report.create({
      data: {
        reporterId,
        reportedUserId: dto.reportedUserId,
        targetType: dto.targetType,
        targetId: dto.targetId,
        type: dto.type,
        reason: dto.reason,
      },
      include: {
        reporter: {
          select: {
            id: true,
            userid: true,
            nickname: true,
          },
        },
        reportedUser: {
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
   * 내가 작성한 신고 목록 조회
   */
  async getMyReports(userId: string, dto: GetReportsDto) {
    const limit = dto.limit ?? 20;
    const where = {
      reporterId: userId,
      ...(dto.status && { status: dto.status }),
    };

    const reports = await this.prisma.report.findMany({
      where,
      take: limit + 1,
      ...(dto.cursor && { cursor: { id: dto.cursor }, skip: 1 }),
      orderBy: { createdAt: 'desc' },
      include: {
        reportedUser: {
          select: {
            id: true,
            userid: true,
            nickname: true,
          },
        },
      },
    });

    const hasMore = reports.length > limit;
    const items = hasMore ? reports.slice(0, limit) : reports;
    const nextCursor = hasMore ? items[items.length - 1]?.id : undefined;

    return {
      reports: items,
      pagination: {
        nextCursor,
        hasMore,
      },
    };
  }

  /**
   * 모든 신고 목록 조회 (관리자 전용)
   */
  async getAllReports(dto: GetReportsDto) {
    const limit = dto.limit ?? 20;
    const where = {
      ...(dto.status && { status: dto.status }),
      ...(dto.reportedUserId && { reportedUserId: dto.reportedUserId }),
    };

    const reports = await this.prisma.report.findMany({
      where,
      take: limit + 1,
      ...(dto.cursor && { cursor: { id: dto.cursor }, skip: 1 }),
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: {
          select: {
            id: true,
            userid: true,
            nickname: true,
          },
        },
        reportedUser: {
          select: {
            id: true,
            userid: true,
            nickname: true,
          },
        },
      },
    });

    const hasMore = reports.length > limit;
    const items = hasMore ? reports.slice(0, limit) : reports;
    const nextCursor = hasMore ? items[items.length - 1]?.id : undefined;

    return {
      reports: items,
      pagination: {
        nextCursor,
        hasMore,
      },
    };
  }

  /**
   * 신고 검토 (관리자 전용)
   */
  async reviewReport(adminId: string, reportId: string, dto: ReviewReportDto) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      include: {
        reportedUser: {
          select: {
            id: true,
            userid: true,
            nickname: true,
          },
        },
      },
    });

    if (!report) {
      throw new NotFoundException('신고를 찾을 수 없습니다.');
    }

    if (report.status !== ReportStatus.PENDING) {
      throw new BadRequestException('이미 처리된 신고입니다.');
    }

    const updatedReport = await this.prisma.report.update({
      where: { id: reportId },
      data: {
        status: dto.status,
        reviewedById: adminId,
        reviewedAt: new Date(),
        adminNotes: dto.adminNotes,
      },
      include: {
        reporter: {
          select: {
            id: true,
            userid: true,
            nickname: true,
          },
        },
        reportedUser: {
          select: {
            id: true,
            userid: true,
            nickname: true,
          },
        },
      },
    });

    // Audit log 기록
    await this.auditLog.createLog({
      adminId,
      action: 'REVIEW_REPORT',
      targetType: 'REPORT',
      targetId: reportId,
      reason: dto.adminNotes,
      metadata: {
        status: dto.status,
        reportedUser: report.reportedUser.userid,
      },
    });

    return updatedReport;
  }

  /**
   * 사용자 차단 (일반 사용자)
   */
  async blockUser(blockerId: string, dto: BlockUserDto) {
    // 자기 자신을 차단할 수 없음
    if (blockerId === dto.blockedId) {
      throw new BadRequestException('자기 자신을 차단할 수 없습니다.');
    }

    // 차단 대상 사용자 확인
    const blockedUser = await this.prisma.user.findUnique({
      where: { id: dto.blockedId },
    });

    if (!blockedUser) {
      throw new NotFoundException('차단할 사용자를 찾을 수 없습니다.');
    }

    // 이미 차단했는지 확인
    const existingBlock = await this.prisma.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId: dto.blockedId,
        },
      },
    });

    if (existingBlock) {
      throw new ConflictException('이미 차단한 사용자입니다.');
    }

    return this.prisma.block.create({
      data: {
        blockerId,
        blockedId: dto.blockedId,
        reason: dto.reason,
      },
      include: {
        blocked: {
          select: {
            id: true,
            userid: true,
            nickname: true,
            profileImage: true,
          },
        },
      },
    });
  }

  /**
   * 사용자 차단 해제
   */
  async unblockUser(blockerId: string, blockedId: string) {
    const block = await this.prisma.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId,
        },
      },
    });

    if (!block) {
      throw new NotFoundException('차단 내역을 찾을 수 없습니다.');
    }

    await this.prisma.block.delete({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId,
        },
      },
    });

    return { success: true, message: '차단이 해제되었습니다.' };
  }

  /**
   * 내가 차단한 사용자 목록
   */
  async getMyBlocks(blockerId: string) {
    return this.prisma.block.findMany({
      where: { blockerId },
      orderBy: { createdAt: 'desc' },
      include: {
        blocked: {
          select: {
            id: true,
            userid: true,
            nickname: true,
            profileImage: true,
          },
        },
      },
    });
  }

  /**
   * 사용자 정지 (관리자 전용)
   */
  async suspendUser(adminId: string, userId: string, dto: SuspendUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        isSuspended: dto.isSuspended,
        suspendedUntil: dto.suspendedUntil
          ? new Date(dto.suspendedUntil)
          : null,
      },
      select: {
        id: true,
        userid: true,
        nickname: true,
        isSuspended: true,
        suspendedUntil: true,
      },
    });

    // Audit log 기록
    await this.auditLog.createLog({
      adminId,
      action: dto.isSuspended ? 'SUSPEND_USER' : 'UNSUSPEND_USER',
      targetType: 'USER',
      targetId: userId,
      reason: dto.reason,
      metadata: {
        suspendedUntil: dto.suspendedUntil,
        username: user.userid,
      },
    });

    return updatedUser;
  }

  /**
   * 위반 사항 생성 (관리자 전용)
   */
  async createViolation(
    adminId: string,
    userId: string,
    data: {
      type: string;
      severity: string;
      description: string;
      reportId?: string;
      expiresAt?: string;
    },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    const violation = await this.prisma.violation.create({
      data: {
        userId,
        type: data.type as never,
        severity: data.severity as never,
        description: data.description,
        reportId: data.reportId,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
    });

    // Audit log 기록
    await this.auditLog.createLog({
      adminId,
      action: 'CREATE_VIOLATION',
      targetType: 'USER',
      targetId: userId,
      reason: data.description,
      metadata: {
        violationType: data.type,
        severity: data.severity,
        username: user.userid,
      },
    });

    return violation;
  }

  /**
   * 사용자의 위반 사항 목록 조회
   */
  async getUserViolations(userId: string) {
    return this.prisma.violation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}

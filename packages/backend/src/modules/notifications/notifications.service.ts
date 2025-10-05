import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  GetNotificationsDto,
  NotificationTab,
  NotificationType,
} from './dto/get-notifications.dto';
import { NotificationAction } from './dto/update-notification.dto';
import { BulkUpdateNotificationsDto } from './dto/bulk-update-notifications.dto';
import {
  NotificationDto,
  NotificationsResponseDto,
  UpdateNotificationResponseDto,
  BulkUpdateNotificationsResponseDto,
  UnreadCountResponseDto,
  ActorDto,
  NotificationTargetDto,
} from './dto/notification-response.dto';
import { Notification, Prisma } from '@prisma/client';

// Notification with sender (selected fields)
type NotificationWithSender = Prisma.NotificationGetPayload<{
  include: {
    sender: {
      select: {
        id: true;
        userid: true;
        nickname: true;
        profileImage: true;
      };
    };
  };
}>;

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 알림 목록 조회
   */
  async getNotifications(
    userId: string,
    dto: GetNotificationsDto,
  ): Promise<NotificationsResponseDto> {
    const limit = dto.limit ?? 20;

    // WHERE 조건 구성
    const where: {
      userId: string;
      isRead?: boolean;
      type?: string;
      createdAt?: { gte?: Date; lte?: Date };
    } = {
      userId,
    };

    // 탭 필터
    if (dto.tab === NotificationTab.UNREAD) {
      where.isRead = false;
    } else if (dto.tab === NotificationTab.READ) {
      where.isRead = true;
    }

    // 타입 필터
    if (dto.type) {
      where.type = dto.type;
    }

    // 날짜 범위 필터
    if (dto.dateFrom ?? dto.dateTo) {
      where.createdAt = {};
      if (dto.dateFrom) {
        where.createdAt.gte = new Date(dto.dateFrom);
      }
      if (dto.dateTo) {
        where.createdAt.lte = new Date(dto.dateTo);
      }
    }

    // 커서 페이지네이션
    const cursorOption = dto.cursor ? { id: dto.cursor } : undefined;

    // 알림 조회 (limit + 1로 hasMore 판단)
    const notifications = await this.prisma.notification.findMany({
      where,
      take: limit + 1,
      ...(cursorOption && { cursor: cursorOption, skip: 1 }),
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: {
            id: true,
            userid: true,
            nickname: true,
            profileImage: true,
          },
        },
      },
    });

    const hasMore = notifications.length > limit;
    const items = hasMore ? notifications.slice(0, limit) : notifications;
    const nextCursor = hasMore ? items[items.length - 1]?.id : undefined;

    // 전체 수 조회
    const total = await this.prisma.notification.count({ where });

    // Summary 계산
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [unreadCount, todayCount, thisWeekCount] = await Promise.all([
      this.prisma.notification.count({
        where: { userId, isRead: false },
      }),
      this.prisma.notification.count({
        where: { userId, createdAt: { gte: today } },
      }),
      this.prisma.notification.count({
        where: { userId, createdAt: { gte: weekAgo } },
      }),
    ]);

    return {
      notifications: items.map((n) => this.mapToNotificationDto(n)),
      pagination: {
        nextCursor,
        hasMore,
        total,
      },
      summary: {
        unreadCount,
        todayCount,
        thisWeekCount,
      },
    };
  }

  /**
   * 알림 업데이트 (읽음/미읽음/삭제)
   */
  async updateNotification(
    userId: string,
    notificationId: string,
    action: NotificationAction,
  ): Promise<UpdateNotificationResponseDto> {
    // 알림 존재 여부 및 소유권 확인
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
      include: {
        sender: {
          select: {
            id: true,
            userid: true,
            nickname: true,
            profileImage: true,
          },
        },
      },
    });

    if (!notification) {
      throw new NotFoundException('알림을 찾을 수 없습니다.');
    }

    if (notification.userId !== userId) {
      throw new NotFoundException('알림을 찾을 수 없습니다.');
    }

    let updatedNotification: typeof notification | null = null;

    if (action === NotificationAction.DELETE) {
      await this.prisma.notification.delete({
        where: { id: notificationId },
      });
    } else {
      const isRead = action === NotificationAction.READ;
      updatedNotification = await this.prisma.notification.update({
        where: { id: notificationId },
        data: { isRead },
        include: {
          sender: {
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

    const unreadCount = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });

    return {
      success: true,
      notification: updatedNotification
        ? this.mapToNotificationDto(updatedNotification)
        : undefined,
      unreadCount,
    };
  }

  /**
   * 일괄 업데이트
   */
  async bulkUpdateNotifications(
    userId: string,
    dto: BulkUpdateNotificationsDto,
  ): Promise<BulkUpdateNotificationsResponseDto> {
    // WHERE 조건 구성
    const where: {
      userId: string;
      id?: { in: string[] };
      type?: string;
      createdAt?: { gte?: Date; lte?: Date };
    } = {
      userId,
    };

    if (dto.notificationIds && dto.notificationIds.length > 0) {
      where.id = { in: dto.notificationIds };
    }

    if (dto.type) {
      where.type = dto.type;
    }

    if (dto.dateFrom ?? dto.dateTo) {
      where.createdAt = {};
      if (dto.dateFrom) {
        where.createdAt.gte = new Date(dto.dateFrom);
      }
      if (dto.dateTo) {
        where.createdAt.lte = new Date(dto.dateTo);
      }
    }

    let affectedCount = 0;

    if (dto.action === NotificationAction.DELETE) {
      const result = await this.prisma.notification.deleteMany({ where });
      affectedCount = result.count;
    } else {
      const isRead = dto.action === NotificationAction.READ;
      const result = await this.prisma.notification.updateMany({
        where,
        data: { isRead },
      });
      affectedCount = result.count;
    }

    const unreadCount = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });

    return {
      success: true,
      affectedCount,
      unreadCount,
    };
  }

  /**
   * 미읽음 알림 수 조회
   */
  async getUnreadCount(userId: string): Promise<UnreadCountResponseDto> {
    const [total, likes, comments, follows] = await Promise.all([
      this.prisma.notification.count({
        where: { userId, isRead: false },
      }),
      this.prisma.notification.count({
        where: { userId, isRead: false, type: NotificationType.LIKE },
      }),
      this.prisma.notification.count({
        where: {
          userId,
          isRead: false,
          type: { in: [NotificationType.COMMENT, NotificationType.REPLY] },
        },
      }),
      this.prisma.notification.count({
        where: { userId, isRead: false, type: NotificationType.FOLLOW },
      }),
    ]);

    // hasNew: 최근 5분 내 새 알림이 있는지 확인
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentCount = await this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
        createdAt: { gte: fiveMinutesAgo },
      },
    });

    return {
      count: total,
      breakdown: {
        likes,
        comments,
        follows,
      },
      hasNew: recentCount > 0,
    };
  }

  /**
   * 알림 생성 (내부 사용)
   */
  async createNotification(data: {
    userId: string;
    senderId?: string;
    type: string;
    message: string;
    reviewId?: string;
    commentId?: string;
    data?: string;
  }): Promise<Notification> {
    return this.prisma.notification.create({
      data: {
        userId: data.userId,
        senderId: data.senderId,
        type: data.type,
        message: data.message,
        reviewId: data.reviewId,
        commentId: data.commentId,
        data: data.data,
      },
    });
  }

  /**
   * Notification을 NotificationDto로 매핑
   */
  private mapToNotificationDto(
    notification: NotificationWithSender,
  ): NotificationDto {
    const actor: ActorDto | null = notification.sender
      ? {
          id: notification.sender.id,
          username: notification.sender.nickname,
          profileImage: notification.sender.profileImage ?? undefined,
        }
      : null;

    // actionUrl 생성
    let actionUrl = '/';
    if (notification.type === 'follow' && actor) {
      actionUrl = `/profile/${actor.username}`;
    } else if (notification.reviewId) {
      actionUrl = `/review/${notification.reviewId}`;
      if (notification.commentId) {
        actionUrl += `#comment-${notification.commentId}`;
      }
    }

    // data 파싱 (JSON 문자열)
    let parsedData: { target?: NotificationTargetDto } = {};
    if (notification.data) {
      try {
        parsedData = JSON.parse(notification.data) as {
          target?: NotificationTargetDto;
        };
      } catch {
        // 파싱 실패 시 무시
      }
    }

    return {
      id: notification.id,
      type: notification.type as 'like' | 'comment' | 'reply' | 'follow',
      isRead: notification.isRead,
      createdAt: notification.createdAt.toISOString(),
      actor: actor ?? {
        id: '',
        username: '알 수 없음',
      },
      target: parsedData.target,
      message: notification.message,
      actionUrl,
    };
  }
}

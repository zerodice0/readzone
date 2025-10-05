import {
  Controller,
  Get,
  Put,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GetNotificationsDto } from './dto/get-notifications.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { BulkUpdateNotificationsDto } from './dto/bulk-update-notifications.dto';
import {
  NotificationsResponseDto,
  UpdateNotificationResponseDto,
  BulkUpdateNotificationsResponseDto,
  UnreadCountResponseDto,
} from './dto/notification-response.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * GET /api/notifications
   * 알림 목록 조회
   */
  @Get()
  async getNotifications(
    @CurrentUser('id') userId: string,
    @Query() dto: GetNotificationsDto,
  ): Promise<NotificationsResponseDto> {
    return this.notificationsService.getNotifications(userId, dto);
  }

  /**
   * GET /api/notifications/unread-count
   * 미읽음 알림 수 조회
   */
  @Get('unread-count')
  async getUnreadCount(
    @CurrentUser('id') userId: string,
  ): Promise<UnreadCountResponseDto> {
    return this.notificationsService.getUnreadCount(userId);
  }

  /**
   * PUT /api/notifications/bulk
   * 알림 일괄 업데이트
   */
  @Put('bulk')
  @HttpCode(HttpStatus.OK)
  async bulkUpdateNotifications(
    @CurrentUser('id') userId: string,
    @Body() dto: BulkUpdateNotificationsDto,
  ): Promise<BulkUpdateNotificationsResponseDto> {
    return this.notificationsService.bulkUpdateNotifications(userId, dto);
  }

  /**
   * PUT /api/notifications/:id
   * 알림 업데이트 (읽음/미읽음/삭제)
   */
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async updateNotification(
    @CurrentUser('id') userId: string,
    @Param('id') notificationId: string,
    @Body() dto: UpdateNotificationDto,
  ): Promise<UpdateNotificationResponseDto> {
    return this.notificationsService.updateNotification(
      userId,
      notificationId,
      dto.action,
    );
  }
}

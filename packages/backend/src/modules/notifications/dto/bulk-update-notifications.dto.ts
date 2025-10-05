import {
  IsEnum,
  IsOptional,
  IsArray,
  IsString,
  IsDateString,
} from 'class-validator';
import { NotificationAction } from './update-notification.dto';
import { NotificationType } from './get-notifications.dto';

export class BulkUpdateNotificationsDto {
  @IsEnum(NotificationAction)
  action: NotificationAction;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  notificationIds?: string[];

  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;
}

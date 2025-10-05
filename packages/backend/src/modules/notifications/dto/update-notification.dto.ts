import { IsEnum } from 'class-validator';

export enum NotificationAction {
  READ = 'read',
  UNREAD = 'unread',
  DELETE = 'delete',
}

export class UpdateNotificationDto {
  @IsEnum(NotificationAction)
  action: NotificationAction;
}

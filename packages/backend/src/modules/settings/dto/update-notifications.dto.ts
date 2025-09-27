import {
  IsOptional,
  ValidateNested,
  IsBoolean,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

class NotificationTypeDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  email?: boolean;

  @IsOptional()
  @IsBoolean()
  push?: boolean;
}

class QuietHoursDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;
}

export class UpdateNotificationsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationTypeDto)
  likes?: NotificationTypeDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationTypeDto)
  comments?: NotificationTypeDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationTypeDto)
  follows?: NotificationTypeDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => QuietHoursDto)
  quietHours?: QuietHoursDto;
}

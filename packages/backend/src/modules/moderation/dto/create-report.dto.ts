import {
  IsEnum,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ReportType, ReportTargetType } from '@prisma/client';

export class CreateReportDto {
  @IsString()
  @IsNotEmpty()
  reportedUserId: string;

  @IsEnum(ReportTargetType)
  targetType: ReportTargetType;

  @IsString()
  @IsNotEmpty()
  targetId: string;

  @IsEnum(ReportType)
  type: ReportType;

  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  reason: string;
}

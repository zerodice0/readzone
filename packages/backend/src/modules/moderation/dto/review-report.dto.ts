import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ReportStatus } from '@prisma/client';

export class ReviewReportDto {
  @IsEnum(ReportStatus)
  status: ReportStatus;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  adminNotes?: string;
}

export class GetReportsDto {
  @IsEnum(ReportStatus)
  @IsOptional()
  status?: ReportStatus;

  @IsString()
  @IsOptional()
  reportedUserId?: string;

  @IsString()
  @IsOptional()
  cursor?: string;

  @IsOptional()
  limit?: number;
}

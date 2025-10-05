import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class SuspendUserDto {
  @IsBoolean()
  isSuspended: boolean;

  @IsDateString()
  @IsOptional()
  suspendedUntil?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason: string;
}

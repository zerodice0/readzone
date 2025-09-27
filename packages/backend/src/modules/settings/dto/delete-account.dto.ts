import { IsString, MinLength, IsOptional } from 'class-validator';

export class DeleteAccountDto {
  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  feedback?: string;
}

export class DeleteAccountResponseDto {
  success: boolean;
  deletionDate: string;
  cancellationToken: string;
}

import { IsString } from 'class-validator';

export class CancelDeletionDto {
  @IsString()
  cancellationToken: string;
}

export class CancelDeletionResponseDto {
  success: boolean;
  message: string;
}

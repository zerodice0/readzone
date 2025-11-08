import { IsString, IsNotEmpty, Length } from 'class-validator';

/**
 * DTO for confirming email verification
 */
export class ConfirmEmailVerificationDto {
  @IsString()
  @IsNotEmpty()
  @Length(32, 64, { message: 'Token must be between 32 and 64 characters' })
  token!: string;
}

import { IsEmail, IsString, MinLength } from 'class-validator';

export class UpdateEmailDto {
  @IsEmail()
  newEmail: string;

  @IsString()
  @MinLength(8)
  password: string;
}

export class UpdateEmailResponseDto {
  success: boolean;
  message: string;
  requiresVerification: boolean;
  verificationSent: boolean;
}

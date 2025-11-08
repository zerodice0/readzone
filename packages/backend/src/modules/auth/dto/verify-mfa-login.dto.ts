import { IsString, IsBoolean, IsUUID, Length } from 'class-validator';

export class VerifyMfaLoginDto {
  @IsUUID()
  userId!: string;

  @IsString()
  @Length(6, 19) // 6 digits for TOTP, up to 19 for backup codes with hyphens (XXXX-XXXX-XXXX-XXXX)
  code!: string;

  @IsBoolean()
  rememberMe!: boolean;
}

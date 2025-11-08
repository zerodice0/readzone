import { IsString, Length, Matches } from 'class-validator';

export class MfaVerifyDto {
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: 'TOTP code must be 6 digits' })
  code!: string;
}

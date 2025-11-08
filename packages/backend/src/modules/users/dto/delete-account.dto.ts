import { IsBoolean, IsString, MinLength } from 'class-validator';

/**
 * DTO for account deletion
 *
 * Requires password confirmation and explicit confirmation flag
 * to prevent accidental account deletion.
 */
export class DeleteAccountDto {
  /**
   * Current password for authentication
   *
   * Must match the user's current password to proceed with deletion.
   */
  @IsString()
  @MinLength(8)
  password!: string;

  /**
   * Explicit confirmation flag
   *
   * Must be set to true to confirm account deletion intent.
   * This provides an additional safeguard against accidental deletion.
   */
  @IsBoolean()
  confirmDeletion!: boolean;
}

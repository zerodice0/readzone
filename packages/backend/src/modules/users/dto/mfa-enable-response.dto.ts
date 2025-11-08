export class MfaEnableResponseDto {
  /**
   * QR code as data URI for TOTP app scanning
   * Format: data:image/png;base64,...
   */
  qrCodeDataUri!: string;

  /**
   * TOTP secret (for manual entry if QR fails)
   */
  secret!: string;

  /**
   * Backup codes (shown once, user must save)
   * 10 codes, 16-character alphanumeric
   */
  backupCodes!: string[];
}

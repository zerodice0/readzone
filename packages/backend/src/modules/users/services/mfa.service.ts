import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/utils/prisma.js';
import { AuditService } from '../../../common/services/audit.service.js';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import type { MfaEnableResponseDto } from '../dto/mfa-enable-response.dto.js';

@Injectable()
export class MfaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  /**
   * Generate TOTP secret and QR code for MFA setup
   * T085: POST /users/me/mfa/enable
   */
  async enableMfaSetup(userId: string): Promise<MfaEnableResponseDto> {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, mfaEnabled: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.mfaEnabled) {
      throw new BadRequestException('MFA is already enabled');
    }

    // Generate TOTP secret
    const secret = speakeasy.generateSecret({
      name: `ReadZone (${user.email})`,
      issuer: 'ReadZone',
      length: 32,
    });

    if (!secret.base32) {
      throw new BadRequestException('Failed to generate MFA secret');
    }

    // Generate QR code as data URI
    const qrCodeDataUri = await QRCode.toDataURL(secret.otpauth_url as string);

    // Generate 10 backup codes
    const backupCodes = this.generateBackupCodes(10);
    const hashedBackupCodes = await Promise.all(
      backupCodes.map((code) => bcrypt.hash(code, 10))
    );

    // Store MFA settings (not enabled yet, requires verification)
    await this.prisma.mFASettings.upsert({
      where: { userId },
      create: {
        userId,
        enabled: false,
        secret: secret.base32,
        backupCodes: hashedBackupCodes,
      },
      update: {
        enabled: false,
        secret: secret.base32,
        backupCodes: hashedBackupCodes,
        verifiedAt: null,
      },
    });

    return {
      qrCodeDataUri,
      secret: secret.base32,
      backupCodes,
    };
  }

  /**
   * Verify TOTP code and enable MFA
   * T086: POST /users/me/mfa/verify
   */
  async verifyAndEnableMfa(
    userId: string,
    code: string,
    ipAddress: string,
    userAgent: string
  ): Promise<{ success: boolean }> {
    const mfaSettings = await this.prisma.mFASettings.findUnique({
      where: { userId },
    });

    if (!mfaSettings) {
      throw new BadRequestException('MFA setup not initiated');
    }

    if (mfaSettings.enabled) {
      throw new BadRequestException('MFA is already enabled');
    }

    // Verify TOTP code with ±1 window tolerance (90 seconds total)
    const isValid = speakeasy.totp.verify({
      secret: mfaSettings.secret,
      encoding: 'base32',
      token: code,
      window: 1, // ±30 seconds
    });

    if (!isValid) {
      // Log failed verification attempt
      await this.auditService.log({
        userId,
        action: 'MFA_ENABLE',
        ipAddress,
        userAgent,
        metadata: { success: false, reason: 'Invalid TOTP code' },
        severity: 'WARNING',
      });

      throw new UnauthorizedException('Invalid TOTP code');
    }

    // Enable MFA
    await this.prisma.$transaction([
      this.prisma.mFASettings.update({
        where: { userId },
        data: {
          enabled: true,
          verifiedAt: new Date(),
        },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { mfaEnabled: true },
      }),
    ]);

    // Log successful MFA enable
    await this.auditService.log({
      userId,
      action: 'MFA_ENABLE',
      ipAddress,
      userAgent,
      metadata: { success: true },
      severity: 'INFO',
    });

    return { success: true };
  }

  /**
   * Disable MFA after password confirmation
   * T087: POST /users/me/mfa/disable
   */
  async disableMfa(
    userId: string,
    password: string,
    ipAddress: string,
    userAgent: string
  ): Promise<{ success: boolean }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true, mfaEnabled: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.mfaEnabled) {
      throw new BadRequestException('MFA is not enabled');
    }

    if (!user.passwordHash) {
      throw new BadRequestException(
        'Cannot disable MFA for OAuth-only accounts'
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      await this.auditService.log({
        userId,
        action: 'MFA_DISABLE',
        ipAddress,
        userAgent,
        metadata: { success: false, reason: 'Invalid password' },
        severity: 'WARNING',
      });

      throw new UnauthorizedException('Invalid password');
    }

    // Disable MFA
    await this.prisma.$transaction([
      this.prisma.mFASettings.delete({
        where: { userId },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { mfaEnabled: false },
      }),
    ]);

    // Log successful MFA disable
    await this.auditService.log({
      userId,
      action: 'MFA_DISABLE',
      ipAddress,
      userAgent,
      metadata: { success: true },
      severity: 'INFO',
    });

    return { success: true };
  }

  /**
   * Verify TOTP or backup code during login
   * T088, T090: MFA challenge verification
   */
  async verifyMfaChallenge(
    userId: string,
    code: string,
    ipAddress: string,
    userAgent: string
  ): Promise<boolean> {
    const mfaSettings = await this.prisma.mFASettings.findUnique({
      where: { userId },
    });

    if (!mfaSettings || !mfaSettings.enabled) {
      throw new BadRequestException('MFA is not enabled');
    }

    // Try TOTP verification first
    const isTotpValid = speakeasy.totp.verify({
      secret: mfaSettings.secret,
      encoding: 'base32',
      token: code,
      window: 1,
    });

    if (isTotpValid) {
      return true;
    }

    // Try backup code verification
    const isBackupCodeValid = await this.verifyBackupCode(
      userId,
      code,
      mfaSettings.backupCodes
    );

    if (isBackupCodeValid) {
      return true;
    }

    // Log failed verification
    await this.auditService.log({
      userId,
      action: 'MFA_VERIFY',
      ipAddress,
      userAgent,
      metadata: { success: false, reason: 'Invalid MFA code' },
      severity: 'WARNING',
    });

    return false;
  }

  /**
   * Regenerate backup codes
   * T091: GET /users/me/mfa/backup-codes
   */
  async regenerateBackupCodes(
    userId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<string[]> {
    const mfaSettings = await this.prisma.mFASettings.findUnique({
      where: { userId },
    });

    if (!mfaSettings || !mfaSettings.enabled) {
      throw new BadRequestException('MFA is not enabled');
    }

    // Generate new backup codes
    const backupCodes = this.generateBackupCodes(10);
    const hashedBackupCodes = await Promise.all(
      backupCodes.map((code) => bcrypt.hash(code, 10))
    );

    // Update backup codes
    await this.prisma.mFASettings.update({
      where: { userId },
      data: { backupCodes: hashedBackupCodes },
    });

    // Log backup code regeneration
    await this.auditService.log({
      userId,
      action: 'MFA_BACKUP_REGENERATE',
      ipAddress,
      userAgent,
      metadata: { success: true },
      severity: 'INFO',
    });

    return backupCodes;
  }

  /**
   * Generate random backup codes
   * T089: 16-character alphanumeric codes
   */
  private generateBackupCodes(count: number): string[] {
    const codes: string[] = [];
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    for (let i = 0; i < count; i++) {
      const bytes = randomBytes(16);
      let code = '';
      for (let j = 0; j < 16; j++) {
        code += chars[bytes[j] % chars.length];
      }
      // Format as XXXX-XXXX-XXXX-XXXX for better readability
      const formatted = code.match(/.{1,4}/g)?.join('-') ?? code;
      codes.push(formatted);
    }

    return codes;
  }

  /**
   * Verify and consume backup code
   * T090: Backup code verification
   */
  private async verifyBackupCode(
    userId: string,
    code: string,
    hashedCodes: string[]
  ): Promise<boolean> {
    // Remove hyphens from input code
    const normalizedCode = code.replace(/-/g, '');

    // Check each hashed backup code
    for (let i = 0; i < hashedCodes.length; i++) {
      const isMatch = await bcrypt.compare(normalizedCode, hashedCodes[i]);
      if (isMatch) {
        // Remove used backup code
        const updatedCodes = hashedCodes.filter((_, index) => index !== i);
        await this.prisma.mFASettings.update({
          where: { userId },
          data: { backupCodes: updatedCodes },
        });
        return true;
      }
    }

    return false;
  }
}

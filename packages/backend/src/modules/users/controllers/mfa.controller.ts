import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { MfaService } from '../services/mfa.service.js';
import { MfaVerifyDto } from '../dto/mfa-verify.dto.js';
import { MfaDisableDto } from '../dto/mfa-disable.dto.js';
import type { MfaEnableResponseDto } from '../dto/mfa-enable-response.dto.js';
import type { Request } from 'express';

interface RequestWithUser extends Request {
  user: { userId: string };
}

@Controller('users/me/mfa')
@UseGuards(JwtAuthGuard)
export class MfaController {
  constructor(private readonly mfaService: MfaService) {}

  /**
   * T085: Generate TOTP secret and QR code for MFA setup
   * POST /api/v1/users/me/mfa/enable
   */
  @Post('enable')
  @HttpCode(HttpStatus.OK)
  async enableMfaSetup(
    @Req() req: RequestWithUser
  ): Promise<MfaEnableResponseDto> {
    const userId = req.user.userId;
    return this.mfaService.enableMfaSetup(userId);
  }

  /**
   * T086: Verify TOTP code and enable MFA
   * POST /api/v1/users/me/mfa/verify
   */
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verifyAndEnableMfa(
    @Req() req: RequestWithUser,
    @Body() dto: MfaVerifyDto
  ): Promise<{ success: boolean }> {
    const userId = req.user.userId;
    const ipAddress = req.ip || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    return this.mfaService.verifyAndEnableMfa(
      userId,
      dto.code,
      ipAddress,
      userAgent
    );
  }

  /**
   * T087: Disable MFA after password confirmation
   * POST /api/v1/users/me/mfa/disable
   */
  @Post('disable')
  @HttpCode(HttpStatus.OK)
  async disableMfa(
    @Req() req: RequestWithUser,
    @Body() dto: MfaDisableDto
  ): Promise<{ success: boolean }> {
    const userId = req.user.userId;
    const ipAddress = req.ip || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    return this.mfaService.disableMfa(
      userId,
      dto.password,
      ipAddress,
      userAgent
    );
  }

  /**
   * T091: Regenerate backup codes (admin action, requires authentication)
   * GET /api/v1/users/me/mfa/backup-codes
   */
  @Get('backup-codes')
  @HttpCode(HttpStatus.OK)
  async regenerateBackupCodes(
    @Req() req: RequestWithUser
  ): Promise<{ backupCodes: string[] }> {
    const userId = req.user.userId;
    const ipAddress = req.ip || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    const backupCodes = await this.mfaService.regenerateBackupCodes(
      userId,
      ipAddress,
      userAgent
    );

    return { backupCodes };
  }
}

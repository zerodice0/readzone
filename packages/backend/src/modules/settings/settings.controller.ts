import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SettingsService } from './settings.service';
import { UserSettingsResponseDto } from './dto/get-settings.dto';
import {
  UpdateProfileDto,
  UpdateProfileResponseDto,
} from './dto/update-profile.dto';
import { UpdateEmailDto, UpdateEmailResponseDto } from './dto/update-email.dto';
import {
  UpdatePasswordDto,
  UpdatePasswordResponseDto,
} from './dto/update-password.dto';
import { UpdatePrivacyDto } from './dto/update-privacy.dto';
import { UpdateNotificationsDto } from './dto/update-notifications.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import {
  ConnectAccountDto,
  ConnectAccountResponseDto,
} from './dto/connect-account.dto';
import {
  DisconnectAccountDto,
  DisconnectAccountResponseDto,
} from './dto/disconnect-account.dto';
import { DataExportResponseDto } from './dto/data-export.dto';
import {
  DeleteAccountDto,
  DeleteAccountResponseDto,
} from './dto/delete-account.dto';
import {
  CancelDeletionDto,
  CancelDeletionResponseDto,
} from './dto/cancel-deletion.dto';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    username: string;
  };
}

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async getSettings(
    @Request() req: AuthenticatedRequest,
  ): Promise<UserSettingsResponseDto> {
    return this.settingsService.getSettings(req.user.userId);
  }

  @Put('profile')
  async updateProfile(
    @Request() req: AuthenticatedRequest,
    @Body() dto: UpdateProfileDto,
  ): Promise<UpdateProfileResponseDto> {
    return this.settingsService.updateProfile(req.user.userId, dto);
  }

  @Put('email')
  async updateEmail(
    @Request() req: AuthenticatedRequest,
    @Body() dto: UpdateEmailDto,
  ): Promise<UpdateEmailResponseDto> {
    return this.settingsService.updateEmail(req.user.userId, dto);
  }

  @Put('password')
  async updatePassword(
    @Request() req: AuthenticatedRequest,
    @Body() dto: UpdatePasswordDto,
  ): Promise<UpdatePasswordResponseDto> {
    return this.settingsService.updatePassword(req.user.userId, dto);
  }

  @Put('privacy')
  @HttpCode(HttpStatus.OK)
  async updatePrivacy(
    @Request() req: AuthenticatedRequest,
    @Body() dto: UpdatePrivacyDto,
  ): Promise<{ success: boolean }> {
    await this.settingsService.updatePrivacy(req.user.userId, dto);
    return { success: true };
  }

  @Put('notifications')
  @HttpCode(HttpStatus.OK)
  async updateNotifications(
    @Request() req: AuthenticatedRequest,
    @Body() dto: UpdateNotificationsDto,
  ): Promise<{ success: boolean }> {
    await this.settingsService.updateNotifications(req.user.userId, dto);
    return { success: true };
  }

  @Put('preferences')
  @HttpCode(HttpStatus.OK)
  async updatePreferences(
    @Request() req: AuthenticatedRequest,
    @Body() dto: UpdatePreferencesDto,
  ): Promise<{ success: boolean }> {
    await this.settingsService.updatePreferences(req.user.userId, dto);
    return { success: true };
  }

  @Post('account/connect')
  async connectAccount(
    @Request() req: AuthenticatedRequest,
    @Body() dto: ConnectAccountDto,
  ): Promise<ConnectAccountResponseDto> {
    return this.settingsService.connectAccount(req.user.userId, dto);
  }

  @Delete('account/disconnect')
  async disconnectAccount(
    @Request() req: AuthenticatedRequest,
    @Body() dto: DisconnectAccountDto,
  ): Promise<DisconnectAccountResponseDto> {
    return this.settingsService.disconnectAccount(req.user.userId, dto);
  }

  @Get('data-export')
  exportData(@Request() req: AuthenticatedRequest): DataExportResponseDto {
    return this.settingsService.exportData(req.user.userId);
  }

  @Post('account/delete')
  async deleteAccount(
    @Request() req: AuthenticatedRequest,
    @Body() dto: DeleteAccountDto,
  ): Promise<DeleteAccountResponseDto> {
    return this.settingsService.deleteAccount(req.user.userId, dto);
  }

  @Post('account/cancel-deletion')
  @HttpCode(HttpStatus.OK)
  async cancelDeletion(
    @Body() dto: CancelDeletionDto,
  ): Promise<CancelDeletionResponseDto> {
    return this.settingsService.cancelDeletion(dto);
  }
}

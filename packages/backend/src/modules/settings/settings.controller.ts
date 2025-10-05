import {
  Controller,
  Get,
  Put,
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

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    userid: string;
    email: string;
    nickname: string;
    bio: string | null;
    profileImage: string | null;
    isVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
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
    return this.settingsService.getSettings(req.user.id);
  }

  @Put('profile')
  async updateProfile(
    @Request() req: AuthenticatedRequest,
    @Body() dto: UpdateProfileDto,
  ): Promise<UpdateProfileResponseDto> {
    console.log('🔍 Profile update request:', JSON.stringify(dto, null, 2));
    console.log('🔍 Request body type:', typeof dto);
    console.log('🔍 ProfileImage value:', dto.profileImage);
    console.log('🔍 ProfileImage type:', typeof dto.profileImage);
    return this.settingsService.updateProfile(req.user.id, dto);
  }

  @Put('email')
  async updateEmail(
    @Request() req: AuthenticatedRequest,
    @Body() dto: UpdateEmailDto,
  ): Promise<UpdateEmailResponseDto> {
    return this.settingsService.updateEmail(req.user.id, dto);
  }

  @Put('password')
  async updatePassword(
    @Request() req: AuthenticatedRequest,
    @Body() dto: UpdatePasswordDto,
  ): Promise<UpdatePasswordResponseDto> {
    return this.settingsService.updatePassword(req.user.id, dto);
  }

  @Put('privacy')
  @HttpCode(HttpStatus.OK)
  async updatePrivacy(
    @Request() req: AuthenticatedRequest,
    @Body() dto: UpdatePrivacyDto,
  ): Promise<{ success: boolean }> {
    await this.settingsService.updatePrivacy(req.user.id, dto);
    return { success: true };
  }

  @Put('notifications')
  @HttpCode(HttpStatus.OK)
  async updateNotifications(
    @Request() req: AuthenticatedRequest,
    @Body() dto: UpdateNotificationsDto,
  ): Promise<{ success: boolean }> {
    await this.settingsService.updateNotifications(req.user.id, dto);
    return { success: true };
  }

  @Put('preferences')
  @HttpCode(HttpStatus.OK)
  async updatePreferences(
    @Request() req: AuthenticatedRequest,
    @Body() dto: UpdatePreferencesDto,
  ): Promise<{ success: boolean }> {
    await this.settingsService.updatePreferences(req.user.id, dto);
    return { success: true };
  }
}

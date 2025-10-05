import {
  Injectable,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { hashPassword, verifyPassword } from '../../common/utils/password';
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

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async getSettings(userId: string): Promise<UserSettingsResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        settings: true,
        notificationSettings: true,
      },
    });

    if (!user) {
      throw new BadRequestException('사용자를 찾을 수 없습니다.');
    }

    // Ensure settings exist with defaults
    const settings = user.settings || {
      profileVisibility: 'PUBLIC',
      activityVisibility: 'PUBLIC',
      searchable: true,
      showEmail: false,
      showFollowers: true,
      showFollowing: true,
      theme: 'AUTO',
      language: 'KO',
    };

    const notificationSettings = user.notificationSettings || {
      likesEnabled: true,
      likesEmail: false,
      likesPush: true,
      commentsEnabled: true,
      commentsEmail: false,
      commentsPush: true,
      followsEnabled: true,
      followsEmail: false,
      followsPush: true,
      quietHoursEnabled: false,
      quietStartTime: '22:00',
      quietEndTime: '08:00',
    };

    return {
      user: {
        id: user.id,
        userid: user.userid,
        nickname: user.nickname,
        email: user.email || '',
        bio: user.bio ?? undefined,
        profileImage: user.profileImage ?? undefined,
        createdAt: user.createdAt.toISOString(),
      },
      privacy: {
        profileVisibility: settings.profileVisibility,
        activityVisibility: settings.activityVisibility,
        searchable: settings.searchable,
        showEmail: settings.showEmail,
        showFollowers: settings.showFollowers,
        showFollowing: settings.showFollowing,
      },
      notifications: {
        likes: {
          enabled: notificationSettings.likesEnabled,
          email: notificationSettings.likesEmail,
          push: notificationSettings.likesPush,
        },
        comments: {
          enabled: notificationSettings.commentsEnabled,
          email: notificationSettings.commentsEmail,
          push: notificationSettings.commentsPush,
        },
        follows: {
          enabled: notificationSettings.followsEnabled,
          email: notificationSettings.followsEmail,
          push: notificationSettings.followsPush,
        },
        quietHours: {
          enabled: notificationSettings.quietHoursEnabled,
          startTime: notificationSettings.quietStartTime,
          endTime: notificationSettings.quietEndTime,
        },
      },
      preferences: {
        theme: settings.theme,
        language: settings.language,
      },
    };
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<UpdateProfileResponseDto> {
    const errors: Array<{ field: string; message: string }> = [];

    try {
      // Check nickname uniqueness if provided
      if (dto.nickname) {
        const existingUser = await this.prisma.user.findFirst({
          where: {
            nickname: dto.nickname,
            NOT: { id: userId },
          },
        });

        if (existingUser) {
          errors.push({
            field: 'nickname',
            message: '이미 사용 중인 닉네임입니다.',
          });
        }
      }

      if (errors.length > 0) {
        return {
          success: false,
          user: {
            nickname: dto.nickname || '',
            bio: undefined,
            profileImage: undefined,
          },
          errors,
        };
      }

      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...(dto.nickname && { nickname: dto.nickname }),
          ...(dto.bio !== undefined && { bio: dto.bio }),
          ...(dto.profileImage !== undefined && {
            profileImage: dto.profileImage,
          }),
        },
        select: {
          nickname: true,
          bio: true,
          profileImage: true,
        },
      });

      return {
        success: true,
        user: {
          nickname: updatedUser.nickname,
          bio: updatedUser.bio ?? undefined,
          profileImage: updatedUser.profileImage ?? undefined,
        },
      };
    } catch (error) {
      this.logger.error(`프로필 업데이트 실패 (userId: ${userId}):`, error);
      throw new BadRequestException('프로필 업데이트에 실패했습니다.');
    }
  }

  async updateEmail(
    userId: string,
    dto: UpdateEmailDto,
  ): Promise<UpdateEmailResponseDto> {
    // Verify current password
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    });

    if (!user || !user.password) {
      throw new BadRequestException('사용자를 찾을 수 없습니다.');
    }

    const isPasswordValid = await verifyPassword(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('현재 비밀번호가 올바르지 않습니다.');
    }

    // Check email uniqueness
    const existingEmail = await this.prisma.user.findFirst({
      where: {
        email: dto.newEmail,
        NOT: { id: userId },
      },
    });

    if (existingEmail) {
      throw new ConflictException('이미 사용 중인 이메일입니다.');
    }

    // For now, directly update email (in production, implement email verification)
    await this.prisma.user.update({
      where: { id: userId },
      data: { email: dto.newEmail },
    });

    return {
      success: true,
      message: '이메일이 성공적으로 변경되었습니다.',
      requiresVerification: false,
      verificationSent: false,
    };
  }

  async updatePassword(
    userId: string,
    dto: UpdatePasswordDto,
  ): Promise<UpdatePasswordResponseDto> {
    const errors: Array<{ field: string; message: string }> = [];

    // Validate password confirmation
    if (dto.newPassword !== dto.confirmPassword) {
      errors.push({
        field: 'confirmPassword',
        message: '새 비밀번호가 일치하지 않습니다.',
      });
    }

    if (errors.length > 0) {
      return { success: false, message: '', errors };
    }

    // Verify current password
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    });

    if (!user || !user.password) {
      throw new BadRequestException('사용자를 찾을 수 없습니다.');
    }

    const isPasswordValid = await verifyPassword(
      dto.currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('현재 비밀번호가 올바르지 않습니다.');
    }

    // Hash and update new password
    const hashedPassword = await hashPassword(dto.newPassword);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // In a real app, you'd invalidate all refresh tokens here
    return {
      success: true,
      message: '비밀번호가 성공적으로 변경되었습니다.',
    };
  }

  async updatePrivacy(userId: string, dto: UpdatePrivacyDto): Promise<void> {
    await this.prisma.userSettings.upsert({
      where: { userId },
      create: {
        userId,
        ...dto,
      },
      update: dto,
    });
  }

  async updateNotifications(
    userId: string,
    dto: UpdateNotificationsDto,
  ): Promise<void> {
    const updateData: Partial<
      Omit<Prisma.NotificationSettingsCreateInput, 'user'>
    > = {};

    if (dto.likes) {
      if (dto.likes.enabled !== undefined)
        updateData.likesEnabled = dto.likes.enabled;
      if (dto.likes.email !== undefined)
        updateData.likesEmail = dto.likes.email;
      if (dto.likes.push !== undefined) updateData.likesPush = dto.likes.push;
    }

    if (dto.comments) {
      if (dto.comments.enabled !== undefined)
        updateData.commentsEnabled = dto.comments.enabled;
      if (dto.comments.email !== undefined)
        updateData.commentsEmail = dto.comments.email;
      if (dto.comments.push !== undefined)
        updateData.commentsPush = dto.comments.push;
    }

    if (dto.follows) {
      if (dto.follows.enabled !== undefined)
        updateData.followsEnabled = dto.follows.enabled;
      if (dto.follows.email !== undefined)
        updateData.followsEmail = dto.follows.email;
      if (dto.follows.push !== undefined)
        updateData.followsPush = dto.follows.push;
    }

    if (dto.quietHours) {
      if (dto.quietHours.enabled !== undefined)
        updateData.quietHoursEnabled = dto.quietHours.enabled;
      if (dto.quietHours.startTime !== undefined)
        updateData.quietStartTime = dto.quietHours.startTime;
      if (dto.quietHours.endTime !== undefined)
        updateData.quietEndTime = dto.quietHours.endTime;
    }

    await this.prisma.notificationSettings.upsert({
      where: { userId },
      create: {
        userId,
        ...updateData,
      },
      update: updateData,
    });
  }

  async updatePreferences(
    userId: string,
    dto: UpdatePreferencesDto,
  ): Promise<void> {
    const updateData: Partial<Omit<Prisma.UserSettingsCreateInput, 'user'>> =
      {};

    if (dto.theme !== undefined) updateData.theme = dto.theme;
    if (dto.language !== undefined) updateData.language = dto.language;

    await this.prisma.userSettings.upsert({
      where: { userId },
      create: {
        userId,
        ...updateData,
      },
      update: updateData,
    });
  }
}

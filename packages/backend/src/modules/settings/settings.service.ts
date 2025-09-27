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
import crypto from 'crypto';

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
        connectedAccounts: true,
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
      defaultFeedTab: 'RECOMMENDED',
      hideNSFW: true,
      hideSpoilers: false,
      hideNegativeReviews: false,
      imageQuality: 'MEDIUM',
      autoplayVideos: false,
      preloadImages: true,
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
        username: user.userid,
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
        defaultFeedTab: settings.defaultFeedTab,
        contentFilter: {
          hideNSFW: settings.hideNSFW,
          hideSpoilers: settings.hideSpoilers,
          hideNegativeReviews: settings.hideNegativeReviews,
        },
        dataUsage: {
          imageQuality: settings.imageQuality,
          autoplayVideos: settings.autoplayVideos,
          preloadImages: settings.preloadImages,
        },
      },
      connectedAccounts: user.connectedAccounts.map((account) => ({
        provider: account.provider,
        email: account.email,
        connectedAt: account.connectedAt.toISOString(),
      })),
    };
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<UpdateProfileResponseDto> {
    const errors: Array<{ field: string; message: string }> = [];

    try {
      // Check username uniqueness if provided
      if (dto.username) {
        const existingUser = await this.prisma.user.findFirst({
          where: {
            userid: dto.username,
            NOT: { id: userId },
          },
        });

        if (existingUser) {
          errors.push({
            field: 'username',
            message: '이미 사용 중인 사용자명입니다.',
          });
        }
      }

      if (errors.length > 0) {
        return {
          success: false,
          user: {
            username: dto.username || '',
            bio: undefined,
            profileImage: undefined,
          },
          errors,
        };
      }

      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...(dto.username && { userid: dto.username }),
          ...(dto.bio !== undefined && { bio: dto.bio }),
          ...(dto.profileImage !== undefined && {
            profileImage: dto.profileImage,
          }),
        },
        select: {
          userid: true,
          bio: true,
          profileImage: true,
        },
      });

      return {
        success: true,
        user: {
          username: updatedUser.userid,
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
    if (dto.defaultFeedTab !== undefined)
      updateData.defaultFeedTab = dto.defaultFeedTab;

    if (dto.contentFilter) {
      if (dto.contentFilter.hideNSFW !== undefined)
        updateData.hideNSFW = dto.contentFilter.hideNSFW;
      if (dto.contentFilter.hideSpoilers !== undefined)
        updateData.hideSpoilers = dto.contentFilter.hideSpoilers;
      if (dto.contentFilter.hideNegativeReviews !== undefined)
        updateData.hideNegativeReviews = dto.contentFilter.hideNegativeReviews;
    }

    if (dto.dataUsage) {
      if (dto.dataUsage.imageQuality !== undefined)
        updateData.imageQuality = dto.dataUsage.imageQuality;
      if (dto.dataUsage.autoplayVideos !== undefined)
        updateData.autoplayVideos = dto.dataUsage.autoplayVideos;
      if (dto.dataUsage.preloadImages !== undefined)
        updateData.preloadImages = dto.dataUsage.preloadImages;
    }

    await this.prisma.userSettings.upsert({
      where: { userId },
      create: {
        userId,
        ...updateData,
      },
      update: updateData,
    });
  }

  async connectAccount(
    userId: string,
    dto: ConnectAccountDto,
  ): Promise<ConnectAccountResponseDto> {
    // In a real implementation, you'd validate the OAuth token here
    // For now, we'll create a mock connected account
    const mockEmail = `user@${dto.provider.toLowerCase()}.com`;

    const connectedAccount = await this.prisma.connectedAccount.create({
      data: {
        userId,
        provider: dto.provider,
        email: mockEmail,
        providerId: crypto.randomUUID(),
      },
    });

    return {
      success: true,
      connectedAccount: {
        provider: connectedAccount.provider,
        email: connectedAccount.email,
        connectedAt: connectedAccount.connectedAt.toISOString(),
      },
    };
  }

  async disconnectAccount(
    userId: string,
    dto: DisconnectAccountDto,
  ): Promise<DisconnectAccountResponseDto> {
    // Check if this is the last login method
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        connectedAccounts: true,
      },
    });

    if (!user) {
      throw new BadRequestException('사용자를 찾을 수 없습니다.');
    }

    const hasPassword = !!user.password;
    const connectedAccountsCount = user.connectedAccounts.length;
    const remainingMethods: string[] = [];

    if (hasPassword) remainingMethods.push('password');
    user.connectedAccounts.forEach((account) => {
      if (account.provider !== dto.provider) {
        remainingMethods.push(account.provider.toLowerCase());
      }
    });

    // Prevent disconnecting if it's the only login method
    if (!hasPassword && connectedAccountsCount <= 1) {
      throw new BadRequestException(
        '마지막 로그인 방법은 해제할 수 없습니다. 다른 로그인 방법을 먼저 추가해주세요.',
      );
    }

    await this.prisma.connectedAccount.deleteMany({
      where: {
        userId,
        provider: dto.provider,
      },
    });

    const warning =
      remainingMethods.length <= 1
        ? '로그인 방법이 하나만 남았습니다.'
        : undefined;

    return {
      success: true,
      remainingMethods,
      warning,
    };
  }

  exportData(userId: string): DataExportResponseDto {
    // In a real implementation, you'd generate and upload the file
    // For now, return a mock response
    const mockUrl = `https://api.readzone.com/exports/user-${userId}-${Date.now()}.json`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    return {
      downloadUrl: mockUrl,
      expiresAt: expiresAt.toISOString(),
      fileSize: 1024 * 50, // 50KB mock
      format: 'json',
    };
  }

  async deleteAccount(
    userId: string,
    dto: DeleteAccountDto,
  ): Promise<DeleteAccountResponseDto> {
    // Verify password
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    });

    if (!user || !user.password) {
      throw new BadRequestException('사용자를 찾을 수 없습니다.');
    }

    const isPasswordValid = await verifyPassword(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('비밀번호가 올바르지 않습니다.');
    }

    // Schedule deletion 30 days from now
    const scheduledAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const cancellationToken = crypto.randomBytes(32).toString('hex');

    await this.prisma.accountDeletion.create({
      data: {
        userId,
        scheduledAt,
        reason: dto.reason,
        feedback: dto.feedback,
        cancellationToken,
      },
    });

    return {
      success: true,
      deletionDate: scheduledAt.toISOString(),
      cancellationToken,
    };
  }

  async cancelDeletion(
    dto: CancelDeletionDto,
  ): Promise<CancelDeletionResponseDto> {
    const deletion = await this.prisma.accountDeletion.findUnique({
      where: { cancellationToken: dto.cancellationToken },
    });

    if (!deletion) {
      throw new BadRequestException('유효하지 않은 취소 토큰입니다.');
    }

    await this.prisma.accountDeletion.delete({
      where: { id: deletion.id },
    });

    return {
      success: true,
      message: '계정 삭제가 성공적으로 취소되었습니다.',
    };
  }
}

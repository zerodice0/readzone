import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { AuditAction, AuditSeverity } from '@prisma/client';
import { PrismaService } from '../../../common/utils/prisma';
import { AuditService } from '../../../common/services/audit.service';
import { EmailService } from '../../../common/services/email.service';
import { UserProfileDto } from '../dto/user-profile.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { generateToken } from '../../../common/utils/token.util';

/**
 * Users service
 *
 * Handles user CRUD operations, profile management, and admin functions.
 */
@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly emailService: EmailService
  ) {}

  /**
   * Get user profile by user ID
   *
   * Returns public profile information including email, role, verification status,
   * MFA status, OAuth connections, and password status.
   *
   * @param userId - User ID from JWT token
   * @returns User profile DTO
   * @throws NotFoundException if user not found
   */
  async getProfile(userId: string): Promise<UserProfileDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        oauthConnections: {
          select: {
            provider: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return new UserProfileDto({
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      mfaEnabled: user.mfaEnabled,
      oauthConnections: user.oauthConnections.map((conn) => conn.provider),
      hasPassword: user.passwordHash !== null,
      createdAt: user.createdAt,
    });
  }

  /**
   * Update user profile
   *
   * Allows users to update their email address.
   * When email is changed:
   * - Checks for duplicate email
   * - Resets emailVerified to false
   * - Sends new verification email
   * - Creates audit log entry
   *
   * @param userId - User ID from JWT token
   * @param updateProfileDto - Profile update data
   * @param ipAddress - User's IP address for audit log
   * @param userAgent - User agent string for audit log
   * @returns Updated user profile
   * @throws NotFoundException if user not found
   * @throws ConflictException if email already exists
   */
  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
    ipAddress: string,
    userAgent: string
  ): Promise<UserProfileDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { email } = updateProfileDto;

    // If email is being changed
    if (email && email !== user.email) {
      // Check for duplicate email
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new ConflictException('Email already in use');
      }

      // Generate verification token
      const verificationToken = generateToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours expiry

      // Update user email and reset verification
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          email,
          emailVerified: false,
          emailVerifiedAt: null,
        },
        include: {
          oauthConnections: {
            select: {
              provider: true,
            },
          },
        },
      });

      // Create verification token
      await this.prisma.emailVerificationToken.create({
        data: {
          userId,
          token: verificationToken,
          expiresAt,
        },
      });

      // Send verification email
      await this.emailService.sendVerificationEmail({
        to: email,
        token: verificationToken,
        userId,
      });

      // Create audit log
      await this.auditService.log({
        userId,
        action: AuditAction.PROFILE_UPDATE,
        severity: AuditSeverity.MEDIUM,
        ipAddress,
        userAgent,
        metadata: {
          oldEmail: user.email,
          newEmail: email,
          emailVerificationSent: true,
        },
      });

      return new UserProfileDto({
        email: updatedUser.email,
        role: updatedUser.role,
        emailVerified: updatedUser.emailVerified,
        mfaEnabled: updatedUser.mfaEnabled,
        oauthConnections: updatedUser.oauthConnections.map(
          (conn) => conn.provider
        ),
        hasPassword: updatedUser.passwordHash !== null,
        createdAt: updatedUser.createdAt,
      });
    }

    // No changes, return current profile
    return this.getProfile(userId);
  }
}

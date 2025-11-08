import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import {
  AuditAction,
  AuditSeverity,
  UserStatus,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../../../common/utils/prisma';
import { AuditService } from '../../../common/services/audit.service';
import { EmailService } from '../../../common/services/email.service';
import { PasswordService } from '../../auth/services/password.service';
import { UserProfileDto } from '../dto/user-profile.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { DeleteAccountDto } from '../dto/delete-account.dto';
import { ListUsersQueryDto } from '../dto/list-users-query.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
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
    private readonly emailService: EmailService,
    private readonly passwordService: PasswordService
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

  /**
   * Delete user account (soft-delete)
   *
   * Implements soft-delete with 30-day grace period:
   * - Verifies password for security
   * - Requires explicit confirmation flag
   * - Marks account as DELETED status
   * - Sets deletedAt timestamp
   * - Revokes all active sessions immediately
   * - Creates critical audit log entry
   *
   * Physical deletion occurs after 30 days via cron job (T058).
   *
   * @param userId - User ID from JWT token
   * @param deleteAccountDto - Deletion request with password and confirmation
   * @param ipAddress - User's IP address for audit log
   * @param userAgent - User agent string for audit log
   * @returns Success message with deletion timestamp
   * @throws NotFoundException if user not found
   * @throws UnauthorizedException if password is incorrect
   * @throws BadRequestException if confirmation flag is false
   */
  async deleteAccount(
    userId: string,
    deleteAccountDto: DeleteAccountDto,
    ipAddress: string,
    userAgent: string
  ): Promise<{ message: string; deletedAt: Date }> {
    const { password, confirmDeletion } = deleteAccountDto;

    // Validate confirmation flag
    if (!confirmDeletion) {
      throw new BadRequestException(
        'Deletion confirmation required. Set confirmDeletion to true.'
      );
    }

    // Get user with password hash
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // OAuth-only users have no password - allow deletion without password verification
    if (user.passwordHash) {
      // Verify password for security
      const isPasswordValid = await this.passwordService.verifyPassword(
        password,
        user.passwordHash
      );

      if (!isPasswordValid) {
        // Log failed deletion attempt
        await this.auditService.log({
          userId,
          action: AuditAction.ACCOUNT_DELETE,
          severity: AuditSeverity.WARNING,
          ipAddress,
          userAgent,
          metadata: {
            success: false,
            reason: 'Invalid password',
          },
        });

        throw new UnauthorizedException('Invalid password');
      }
    }

    const deletedAt = new Date();

    // Mark account as deleted (soft-delete)
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        status: UserStatus.DELETED,
        deletedAt,
      },
    });

    // Revoke all active sessions immediately
    await this.prisma.session.updateMany({
      where: {
        userId,
        expiresAt: {
          gt: new Date(), // Only active sessions
        },
      },
      data: {
        expiresAt: new Date(), // Expire immediately
      },
    });

    // Create critical audit log entry
    await this.auditService.log({
      userId,
      action: AuditAction.ACCOUNT_DELETE,
      severity: AuditSeverity.CRITICAL,
      ipAddress,
      userAgent,
      metadata: {
        success: true,
        deletedAt: deletedAt.toISOString(),
        gracePeriodEnds: new Date(
          deletedAt.getTime() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(), // 30 days
        sessionsRevoked: true,
      },
    });

    return {
      message:
        'Account marked for deletion. You have 30 days to restore your account by logging in.',
      deletedAt,
    };
  }

  /**
   * List users with pagination, filtering, and sorting (Admin only)
   *
   * Supports:
   * - Pagination: offset-based (page, limit)
   * - Filters: role, status, search (email or name)
   * - Sorting: by createdAt, email, role, status
   *
   * @param query - Query parameters for listing users
   * @returns Paginated user list with metadata
   */
  async listUsers(query: ListUsersQueryDto) {
    const {
      page = 1,
      limit = 20,
      role,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    // Build where clause for filtering
    const where: {
      role?: typeof role;
      status?: typeof status;
      OR?: Array<{
        email?: { contains: string; mode: 'insensitive' };
        name?: { contains: string; mode: 'insensitive' };
      }>;
    } = {};

    if (role) {
      where.role = role;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const take = limit;

    // Execute queries in parallel
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: {
          [sortBy]: sortOrder,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          emailVerified: true,
          mfaEnabled: true,
          createdAt: true,
          deletedAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    };
  }

  /**
   * Get detailed user information (Admin only)
   *
   * Returns comprehensive user data including:
   * - User profile (email, role, status, verification, MFA)
   * - Last 5 active sessions (device, IP, lastActivity)
   * - Last 10 audit logs (action, severity, timestamp, metadata)
   * - OAuth connections (provider, providerId, email)
   * - MFA settings (enabled status, no secrets)
   *
   * Security:
   * - Password hash is NEVER included
   * - TOTP secrets are NEVER included
   * - Backup codes are NEVER included
   *
   * @param userId - User ID to retrieve details for
   * @returns Detailed user information
   * @throws NotFoundException if user not found
   */
  async getUserDetails(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        emailVerified: true,
        emailVerifiedAt: true,
        mfaEnabled: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        // Include related data
        oauthConnections: {
          select: {
            id: true,
            provider: true,
            providerId: true,
            email: true,
            createdAt: true,
          },
        },
        sessions: {
          take: 5,
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            id: true,
            deviceInfo: true,
            ipAddress: true,
            userAgent: true,
            createdAt: true,
            expiresAt: true,
            isActive: true,
          },
        },
        auditLogs: {
          take: 10,
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            id: true,
            action: true,
            severity: true,
            ipAddress: true,
            userAgent: true,
            metadata: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Return user details with formatted data
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        emailVerified: user.emailVerified,
        emailVerifiedAt: user.emailVerifiedAt,
        mfaEnabled: user.mfaEnabled,
        hasPassword: user.name !== null, // Inferred from OAuth-only vs password
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        deletedAt: user.deletedAt,
      },
      oauthConnections: user.oauthConnections,
      recentSessions: user.sessions,
      recentAuditLogs: user.auditLogs,
    };
  }

  /**
   * Update user (Admin only)
   *
   * Allows admin to modify user role, status, and email verification.
   *
   * Safety Rules:
   * - Cannot modify own account (adminId !== userId)
   * - Cannot assign ANONYMOUS role
   * - Cannot assign DELETED status
   * - Setting SUSPENDED revokes all active sessions
   * - Role changes create CRITICAL audit logs
   *
   * @param userId - User ID to update
   * @param adminId - Admin user ID (from JWT)
   * @param updateUserDto - Update data
   * @param ipAddress - Admin IP address for audit log
   * @param userAgent - User agent string for audit log
   * @returns Updated user information
   * @throws NotFoundException if user not found
   * @throws BadRequestException if safety rules violated
   */
  async updateUser(
    userId: string,
    adminId: string,
    updateUserDto: UpdateUserDto,
    ipAddress: string,
    userAgent: string
  ): Promise<{
    message: string;
    user: {
      id: string;
      email: string;
      role: UserRole;
      status: UserStatus;
      emailVerified: boolean;
    };
  }> {
    const { role, status, emailVerified } = updateUserDto;

    // Safety check: Cannot modify own account
    if (userId === adminId) {
      throw new BadRequestException(
        'Cannot modify your own account. Use /users/me endpoint instead.'
      );
    }

    // Get user before update
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validation: Cannot assign ANONYMOUS role
    if (role === UserRole.ANONYMOUS) {
      throw new BadRequestException(
        'Cannot assign ANONYMOUS role. This role is reserved for non-logged-in users.'
      );
    }

    // Validation: Cannot assign DELETED status
    if (status === UserStatus.DELETED) {
      throw new BadRequestException(
        'Cannot assign DELETED status. Use DELETE /users/me or DELETE /admin/users/:id/force-delete instead.'
      );
    }

    // Build update data
    const updateData: {
      role?: UserRole;
      status?: UserStatus;
      emailVerified?: boolean;
      emailVerifiedAt?: Date | null;
    } = {};

    if (role !== undefined) {
      updateData.role = role;
    }

    if (status !== undefined) {
      updateData.status = status;

      // If suspending user, revoke all active sessions
      if (status === UserStatus.SUSPENDED) {
        await this.prisma.session.updateMany({
          where: {
            userId,
            expiresAt: {
              gt: new Date(),
            },
          },
          data: {
            expiresAt: new Date(), // Expire immediately
          },
        });
      }
    }

    if (emailVerified !== undefined) {
      updateData.emailVerified = emailVerified;
      updateData.emailVerifiedAt = emailVerified ? new Date() : null;
    }

    // Update user
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Create audit log (use ROLE_CHANGE for role modifications, ACCOUNT_SUSPEND for status changes)
    let auditAction: AuditAction = AuditAction.PROFILE_UPDATE;
    let severity: AuditSeverity = AuditSeverity.MEDIUM;

    if (role !== undefined && role !== user.role) {
      auditAction = AuditAction.ROLE_CHANGE;
      severity = AuditSeverity.CRITICAL;
    } else if (status !== undefined && status === UserStatus.SUSPENDED) {
      auditAction = AuditAction.ACCOUNT_SUSPEND;
      severity = AuditSeverity.CRITICAL;
    }

    await this.auditService.log({
      userId,
      action: auditAction,
      severity,
      ipAddress,
      userAgent,
      metadata: {
        adminId,
        changes: updateData,
        previousValues: {
          role: user.role,
          status: user.status,
          emailVerified: user.emailVerified,
        },
      },
    });

    return {
      message: 'User updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status,
        emailVerified: updatedUser.emailVerified,
      },
    };
  }

  /**
   * Force delete user (Admin only)
   *
   * Permanently deletes user account immediately (no grace period).
   *
   * CASCADE Deletes (handled by Prisma schema):
   * - Sessions
   * - OAuth connections
   * - MFA settings
   * - Email/password reset tokens
   *
   * PRESERVES:
   * - Audit logs (sets userId = null for historical record)
   *
   * Safety Rules:
   * - Cannot delete own account (adminId !== userId)
   * - Creates CRITICAL audit log entry
   * - Irreversible operation (GDPR compliance)
   *
   * @param userId - User ID to permanently delete
   * @param adminId - Admin user ID (from JWT)
   * @param ipAddress - Admin IP address for audit log
   * @param userAgent - User agent string for audit log
   * @returns Deletion confirmation
   * @throws NotFoundException if user not found
   * @throws BadRequestException if trying to delete own account
   */
  async forceDeleteUser(
    userId: string,
    adminId: string,
    ipAddress: string,
    userAgent: string
  ) {
    // Safety check: Cannot delete own account
    if (userId === adminId) {
      throw new BadRequestException(
        'Cannot delete your own account. Use DELETE /users/me endpoint instead.'
      );
    }

    // Get user before deletion
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Preserve audit logs by setting userId to null
    await this.prisma.auditLog.updateMany({
      where: { userId },
      data: { userId: null },
    });

    // Create final audit log before deletion
    await this.auditService.log({
      userId,
      action: AuditAction.ACCOUNT_FORCE_DELETE,
      severity: AuditSeverity.CRITICAL,
      ipAddress,
      userAgent,
      metadata: {
        adminId,
        deletionType: 'force_delete',
        userEmail: user.email,
        userRole: user.role,
        irreversible: true,
      },
    });

    // Physically delete user (CASCADE handled by Prisma schema)
    await this.prisma.user.delete({
      where: { id: userId },
    });

    return {
      message: 'User permanently deleted',
      deletedUser: {
        id: userId,
        email: user.email,
      },
    };
  }
}

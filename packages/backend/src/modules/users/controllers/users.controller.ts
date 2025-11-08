import {
  Controller,
  Get,
  Patch,
  Delete,
  UseGuards,
  Request,
  Body,
  Ip,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UsersService } from '../services/users.service';
import { UserProfileDto } from '../dto/user-profile.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { DeleteAccountDto } from '../dto/delete-account.dto';
import { RequestWithUser } from '../interfaces/request-with-user.interface';

/**
 * Users controller
 *
 * Handles user profile and account management endpoints.
 */
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * GET /users/me
   *
   * Get current user's profile.
   *
   * @param req - Request with user from JWT
   * @returns User profile DTO
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req: RequestWithUser): Promise<UserProfileDto> {
    return this.usersService.getProfile(req.user.userId);
  }

  /**
   * PATCH /users/me
   *
   * Update current user's profile.
   * Supports email change with re-verification.
   *
   * @param req - Request with user from JWT
   * @param updateProfileDto - Profile update data
   * @param ipAddress - Client IP address
   * @param userAgent - User agent string from request headers
   * @returns Updated user profile DTO
   */
  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Request() req: RequestWithUser,
    @Body() updateProfileDto: UpdateProfileDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string
  ): Promise<UserProfileDto> {
    return this.usersService.updateProfile(
      req.user.userId,
      updateProfileDto,
      ipAddress,
      userAgent || 'Unknown'
    );
  }

  /**
   * DELETE /users/me
   *
   * Delete current user's account (soft-delete with 30-day grace period).
   *
   * Requires:
   * - Password confirmation (for password-based accounts)
   * - Explicit confirmation flag (confirmDeletion: true)
   *
   * Effects:
   * - Marks account as DELETED (status)
   * - Sets deletedAt timestamp
   * - Revokes all active sessions immediately
   * - Creates critical audit log entry
   * - Allows 30-day recovery period
   *
   * Physical deletion occurs after 30 days via cron job (T058).
   *
   * @param req - Request with user from JWT
   * @param deleteAccountDto - Deletion request data
   * @param ipAddress - Client IP address
   * @param userAgent - User agent string from request headers
   * @returns Deletion confirmation message with timestamp
   */
  @Delete('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteAccount(
    @Request() req: RequestWithUser,
    @Body() deleteAccountDto: DeleteAccountDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string
  ): Promise<{ message: string; deletedAt: Date }> {
    return this.usersService.deleteAccount(
      req.user.userId,
      deleteAccountDto,
      ipAddress,
      userAgent || 'Unknown'
    );
  }
}

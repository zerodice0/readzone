import {
  Controller,
  Get,
  Patch,
  UseGuards,
  Request,
  Body,
  Ip,
  Headers,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UsersService } from '../services/users.service';
import { UserProfileDto } from '../dto/user-profile.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
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
}

import {
  Controller,
  Get,
  Patch,
  Delete,
  UseGuards,
  Query,
  Param,
  Body,
  Request,
  Ip,
  Headers,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { UsersService } from '../services/users.service';
import { ListUsersQueryDto } from '../dto/list-users-query.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { RequestWithUser } from '../interfaces/request-with-user.interface';

/**
 * Admin controller
 *
 * Handles admin-only user management endpoints.
 * All endpoints require ADMIN or SUPERADMIN role.
 */
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
export class AdminController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * GET /admin/users
   *
   * List all users with pagination, filtering, and sorting.
   *
   * Query Parameters:
   * - page: Page number (default: 1)
   * - limit: Items per page (default: 20, max: 100)
   * - role: Filter by user role (ANONYMOUS, USER, MODERATOR, ADMIN, SUPERADMIN)
   * - status: Filter by user status (ACTIVE, SUSPENDED, DELETED)
   * - search: Search by email or name (case-insensitive)
   * - sortBy: Sort field (createdAt, email, role, status)
   * - sortOrder: Sort order (asc, desc)
   *
   * @param query - Query parameters for filtering, pagination, sorting
   * @returns Paginated user list with metadata
   */
  @Get()
  async listUsers(@Query() query: ListUsersQueryDto) {
    return this.usersService.listUsers(query);
  }

  /**
   * GET /admin/users/:id
   *
   * Get detailed user information including:
   * - User profile
   * - Last 5 active sessions (device, IP, last activity)
   * - Last 10 audit logs
   * - OAuth connections
   * - MFA status
   *
   * Note: Password hash is never included in response.
   *
   * @param id - User ID
   * @returns Detailed user information
   */
  @Get(':id')
  async getUserDetails(@Param('id') id: string) {
    return this.usersService.getUserDetails(id);
  }

  /**
   * PATCH /admin/users/:id
   *
   * Update user information (role, status, email verification).
   *
   * Safety Rules:
   * - Cannot modify own account (prevent privilege loss)
   * - Cannot assign ANONYMOUS role (reserved for non-logged-in)
   * - Cannot assign DELETED status (use delete endpoints)
   * - Setting SUSPENDED revokes all active sessions
   * - Critical actions (role change) create CRITICAL audit logs
   *
   * @param id - User ID to update
   * @param req - Request with admin user from JWT
   * @param updateUserDto - Update data
   * @param ipAddress - Client IP address
   * @param userAgent - User agent string
   * @returns Updated user profile
   */
  @Patch(':id')
  async updateUser(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
    @Body() updateUserDto: UpdateUserDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string
  ) {
    return this.usersService.updateUser(
      id,
      req.user.userId,
      updateUserDto,
      ipAddress,
      userAgent || 'Unknown'
    );
  }

  /**
   * DELETE /admin/users/:id/force-delete
   *
   * Permanently delete user account immediately (no grace period).
   *
   * Effects:
   * - Physically deletes user record from database
   * - CASCADE deletes: sessions, OAuth connections, MFA settings, tokens
   * - PRESERVES audit logs (sets userId = null for historical record)
   * - Irreversible operation (GDPR compliance)
   *
   * Safety Rules:
   * - Cannot delete own account (prevent self-destruction)
   * - Creates CRITICAL audit log entry
   * - Requires ADMIN or SUPERADMIN role
   *
   * @param id - User ID to permanently delete
   * @param req - Request with admin user from JWT
   * @param ipAddress - Client IP address
   * @param userAgent - User agent string
   * @returns Deletion confirmation
   */
  @Delete(':id/force-delete')
  async forceDeleteUser(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string
  ) {
    return this.usersService.forceDeleteUser(
      id,
      req.user.userId,
      ipAddress,
      userAgent || 'Unknown'
    );
  }
}

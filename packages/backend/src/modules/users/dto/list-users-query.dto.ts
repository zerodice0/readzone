import { IsOptional, IsEnum, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole, UserStatus } from '@prisma/client';

/**
 * DTO for listing users query parameters
 *
 * Supports pagination, filtering, sorting for admin user list endpoint.
 */
export class ListUsersQueryDto {
  /**
   * Page number (1-based)
   * Default: 1
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  /**
   * Items per page
   * Default: 20, Max: 100
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  /**
   * Filter by user role
   */
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  /**
   * Filter by user status
   */
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  /**
   * Search by email or name
   * Case-insensitive partial match
   */
  @IsOptional()
  @IsString()
  search?: string;

  /**
   * Sort field
   * Default: createdAt
   */
  @IsOptional()
  @IsEnum(['createdAt', 'email', 'role', 'status'])
  sortBy?: 'createdAt' | 'email' | 'role' | 'status' = 'createdAt';

  /**
   * Sort order
   * Default: desc
   */
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

/**
 * Roles decorator for role-based access control
 *
 * Specifies which user roles are allowed to access a controller or route.
 * Must be used with RolesGuard to enforce authorization.
 *
 * @param roles - One or more user roles that are allowed access
 *
 * @example
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
 * async adminEndpoint() { ... }
 */
export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);

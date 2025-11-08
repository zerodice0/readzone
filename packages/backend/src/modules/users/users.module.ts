import { Module } from '@nestjs/common';
import { UsersController } from './controllers/users.controller';
import { AdminController } from './controllers/admin.controller';
import { MfaController } from './controllers/mfa.controller';
import { UsersService } from './services/users.service';
import { MfaService } from './services/mfa.service';
import { PrismaService } from '../../common/utils/prisma';
import { AuthModule } from '../auth/auth.module';

/**
 * Users module
 *
 * Handles user profile management, CRUD operations, admin functions, and MFA.
 * Imports AuthModule for PasswordService dependency.
 */
@Module({
  imports: [AuthModule],
  controllers: [UsersController, AdminController, MfaController],
  providers: [UsersService, MfaService, PrismaService],
  exports: [UsersService, MfaService],
})
export class UsersModule {}

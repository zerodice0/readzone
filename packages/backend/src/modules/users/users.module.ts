import { Module } from '@nestjs/common';
import { UsersController } from './controllers/users.controller';
import { AdminController } from './controllers/admin.controller';
import { UsersService } from './services/users.service';
import { PrismaService } from '../../common/utils/prisma';
import { AuthModule } from '../auth/auth.module';

/**
 * Users module
 *
 * Handles user profile management, CRUD operations, and admin functions.
 * Imports AuthModule for PasswordService dependency.
 */
@Module({
  imports: [AuthModule],
  controllers: [UsersController, AdminController],
  providers: [UsersService, PrismaService],
  exports: [UsersService],
})
export class UsersModule {}

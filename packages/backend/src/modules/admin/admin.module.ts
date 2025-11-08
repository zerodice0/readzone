import { Module } from '@nestjs/common';
import { AdminController } from './controllers/admin.controller';

/**
 * Admin module
 * Provides administrative endpoints for system management
 */
@Module({
  controllers: [AdminController],
})
export class AdminModule {}

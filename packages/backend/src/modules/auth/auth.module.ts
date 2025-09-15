import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenCleanupService } from './token-cleanup.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [ConfigModule, PassportModule, PrismaModule],
  controllers: [AuthController],
  providers: [AuthService, TokenCleanupService, JwtStrategy],
  exports: [AuthService, TokenCleanupService],
})
export class AuthModule {}

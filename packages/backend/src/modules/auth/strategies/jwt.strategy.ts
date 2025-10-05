import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../prisma/prisma.service';

interface JwtPayload {
  userId: string;
  email: string;
  nickname: string;
  role?: string;
  type: 'access' | 'refresh';
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_SECRET') ||
        'default-secret-change-in-production',
    });
  }

  async validate(payload: JwtPayload) {
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Invalid token type');
    }

    const user = await this.prismaService.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        userid: true,
        email: true,
        nickname: true,
        bio: true,
        profileImage: true,
        isVerified: true,
        role: true,
        isSuspended: true,
        suspendedUntil: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Check if user is suspended
    if (user.isSuspended) {
      if (user.suspendedUntil && user.suspendedUntil > new Date()) {
        throw new UnauthorizedException(
          `Account is suspended until ${user.suspendedUntil.toISOString()}`,
        );
      } else if (!user.suspendedUntil) {
        throw new UnauthorizedException('Account is permanently suspended');
      }
    }

    return user;
  }
}

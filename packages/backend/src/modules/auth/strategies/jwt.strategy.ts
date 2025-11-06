import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { SessionService } from '../services/session.service';
import { PrismaService } from '../../../common/utils/prisma';
import { JwtPayload } from '../services/auth.service';

/**
 * JWT Strategy for Passport
 * Validates JWT tokens and attaches user info to request
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(ConfigService) configService: ConfigService,
    @Inject(SessionService) private readonly sessionService: SessionService,
    @Inject(PrismaService) private readonly prisma: PrismaService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  /**
   * Validate JWT payload
   * Called automatically by Passport after JWT verification
   * @param payload Decoded JWT payload
   * @returns User info to attach to request
   */
  async validate(payload: JwtPayload) {
    // Validate session
    const session = await this.sessionService.validateSession(
      payload.sessionId
    );

    if (!session) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    // Get user info
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        emailVerified: true,
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Return user info to be attached to request.user
    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerified: user.emailVerified,
      sessionId: payload.sessionId,
    };
  }
}

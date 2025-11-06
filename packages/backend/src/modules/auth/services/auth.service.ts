import {
  Injectable,
  Inject,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../common/utils/prisma';
import { LoggerService } from '../../../common/utils/logger';
import { AuditService } from '../../../common/services/audit.service';
import { PasswordService } from './password.service';
import { SessionService } from './session.service';
import { RegisterDto, LoginDto } from '../dto';

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface JwtPayload {
  sub: string; // userId
  sessionId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Authentication service
 * Handles user registration, login, logout, and token management
 */
@Injectable()
export class AuthService {
  private readonly logger = new LoggerService('AuthService');

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(PasswordService) private readonly passwordService: PasswordService,
    @Inject(SessionService) private readonly sessionService: SessionService,
    @Inject(AuditService) private readonly auditService: AuditService
  ) {}

  /**
   * Register a new user
   * @param dto Registration data
   * @returns Created user (without password hash)
   */
  async register(dto: RegisterDto) {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const passwordHash = await this.passwordService.hashPassword(dto.password);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        name: dto.name,
        emailVerified: false,
        role: 'USER',
        status: 'ACTIVE',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    this.logger.log(`User registered: ${user.email}`);
    return user;
  }

  /**
   * Login user
   * @param dto Login data
   * @param ipAddress Client IP address
   * @param userAgent Client user agent
   * @returns JWT tokens and user info
   */
  async login(
    dto: LoginDto,
    ipAddress: string,
    userAgent: string
  ): Promise<{ tokens: AuthTokens; user: any }> {
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
        role: true,
        status: true,
        emailVerified: true,
      },
    });

    if (!user || !user.passwordHash) {
      // Log failed login attempt
      await this.auditService.logLoginFailed(
        dto.email,
        ipAddress,
        userAgent,
        'Invalid credentials'
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check account status
    if (user.status !== 'ACTIVE') {
      await this.auditService.logLoginFailed(
        dto.email,
        ipAddress,
        userAgent,
        'Account suspended or deleted'
      );
      throw new UnauthorizedException('Account is suspended or deleted');
    }

    // Verify password
    const isPasswordValid = await this.passwordService.verifyPassword(
      dto.password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      await this.auditService.logLoginFailed(
        dto.email,
        ipAddress,
        userAgent,
        'Invalid password'
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    // Parse device info from user agent (simplified)
    const deviceInfo = this.parseUserAgent(userAgent);

    // Calculate expiration
    const expiresAt = new Date(
      Date.now() + (dto.rememberMe ? 30 : 1) * 24 * 60 * 60 * 1000
    );

    // Create session
    const sessionId = await this.sessionService.createSession({
      userId: user.id,
      ipAddress,
      userAgent,
      deviceInfo,
      expiresAt,
      rememberMe: dto.rememberMe,
    });

    // Generate JWT
    const tokens = await this.generateTokens({
      sub: user.id,
      sessionId,
      email: user.email,
      role: user.role,
    });

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
      },
    });

    // Log successful login
    await this.auditService.logLogin(user.id, ipAddress, userAgent, {
      rememberMe: dto.rememberMe,
    });

    this.logger.log(`User logged in: ${user.email}`);

    // Remove password hash from response
    const { passwordHash, ...userWithoutPassword} = user;

    return {
      tokens,
      user: userWithoutPassword,
    };
  }

  /**
   * Logout user
   * @param sessionId Session ID from JWT
   * @param userId User ID for audit logging
   * @param ipAddress IP address for audit logging
   * @param userAgent User agent for audit logging
   */
  async logout(
    sessionId: string,
    userId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    await this.sessionService.revokeSession(sessionId);
    await this.auditService.logLogout(userId, ipAddress, userAgent);
    this.logger.log(`User logged out, session: ${sessionId}`);
  }

  /**
   * Validate JWT token
   * @param token JWT token
   * @returns Decoded payload if valid
   */
  async validateToken(token: string): Promise<JwtPayload> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(token);

      // Validate session
      const session = await this.sessionService.validateSession(
        payload.sessionId
      );

      if (!session) {
        throw new UnauthorizedException('Invalid session');
      }

      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * Generate JWT access and refresh tokens
   * @param payload JWT payload
   * @returns Access and refresh tokens
   */
  private async generateTokens(payload: JwtPayload): Promise<AuthTokens> {
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '1h', // Short-lived access token
    });

    // Note: Refresh token logic can be added later
    return {
      accessToken,
    };
  }

  /**
   * Parse user agent string (simplified)
   * @param userAgent User agent string
   * @returns Device info object
   */
  private parseUserAgent(userAgent: string): {
    browser?: string;
    os?: string;
    device?: string;
  } {
    // Simplified parsing - in production, use a library like ua-parser-js
    return {
      browser: userAgent.includes('Chrome')
        ? 'Chrome'
        : userAgent.includes('Firefox')
          ? 'Firefox'
          : userAgent.includes('Safari')
            ? 'Safari'
            : 'Unknown',
      os: userAgent.includes('Windows')
        ? 'Windows'
        : userAgent.includes('Mac')
          ? 'macOS'
          : userAgent.includes('Linux')
            ? 'Linux'
            : 'Unknown',
      device: userAgent.includes('Mobile') ? 'Mobile' : 'Desktop',
    };
  }
}

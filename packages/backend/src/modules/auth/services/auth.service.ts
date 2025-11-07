import {
  Injectable,
  Inject,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../common/utils/prisma.js';
import { LoggerService } from '../../../common/utils/logger.js';
import { AuditService } from '../../../common/services/audit.service.js';
import { EmailService } from '../../../common/services/email.service.js';
import { PasswordService } from './password.service.js';
import { SessionService } from './session.service.js';
import { RegisterDto, LoginDto } from '../dto/index.js';
import {
  generateEmailVerificationToken,
  generatePasswordResetToken,
  getTokenExpiration,
} from '../../../common/utils/token.js';

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
    @Inject(AuditService) private readonly auditService: AuditService,
    @Inject(EmailService) private readonly emailService: EmailService
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
  ): Promise<{
    tokens: AuthTokens;
    user: {
      id: string;
      email: string;
      name: string | null;
      role: string;
      emailVerified: boolean;
    };
  }> {
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
    const deviceInfo = AuthService.parseUserAgent(userAgent);

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
    const tokens = this.generateTokens({
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
    const { passwordHash, ...userWithoutPassword } = user;

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
  private generateTokens(payload: JwtPayload): AuthTokens {
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '1h', // Short-lived access token
    });

    // Note: Refresh token logic can be added later
    return {
      accessToken,
    };
  }

  /**
   * Send email verification email
   * @param userId User ID
   * @param ipAddress Client IP address
   * @param userAgent Client user agent
   */
  async sendVerificationEmail(
    userId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    // Get user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, emailVerified: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    // Generate token
    const token = generateEmailVerificationToken();
    const expiresAt = getTokenExpiration(24); // 24 hours

    // Store token in database
    await this.prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Send email
    await this.emailService.sendVerificationEmail({
      to: user.email,
      token,
      userId: user.id,
    });

    // Log email verification request
    await this.auditService.log({
      userId: user.id,
      action: 'EMAIL_VERIFY_REQUEST',
      ipAddress,
      userAgent,
      severity: 'INFO',
    });

    this.logger.log(
      `Verification email sent to ${user.email} (userId: ${user.id})`
    );
  }

  /**
   * Confirm email verification
   * @param token Verification token
   * @param ipAddress Client IP address
   */
  async confirmEmailVerification(
    token: string,
    ipAddress: string
  ): Promise<void> {
    // Find token
    const verificationToken =
      await this.prisma.emailVerificationToken.findUnique({
        where: { token },
        include: { user: true },
      });

    if (!verificationToken) {
      throw new BadRequestException('Invalid or expired token');
    }

    // Check if already used
    if (verificationToken.usedAt) {
      throw new BadRequestException('Token already used');
    }

    // Check expiration
    if (verificationToken.expiresAt < new Date()) {
      throw new BadRequestException('Token expired');
    }

    // Update user email verification status
    await this.prisma.user.update({
      where: { id: verificationToken.userId },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });

    // Mark token as used
    await this.prisma.emailVerificationToken.update({
      where: { id: verificationToken.id },
      data: {
        usedAt: new Date(),
        ipAddress,
      },
    });

    // Log audit event
    await this.auditService.log({
      userId: verificationToken.userId,
      action: 'EMAIL_VERIFY',
      ipAddress,
      userAgent: 'N/A', // We don't have user agent in token confirmation
      severity: 'INFO',
    });

    this.logger.log(
      `Email verified for user ${verificationToken.user.email} (userId: ${verificationToken.userId})`
    );
  }

  /**
   * Parse user agent string (simplified)
   * @param userAgent User agent string
   * @returns Device info object
   */
  private static parseUserAgent(userAgent: string): {
    browser?: string;
    os?: string;
    device?: string;
  } {
    // Simplified parsing - in production, use a library like ua-parser-js
    let browser = 'Unknown';
    if (userAgent.includes('Chrome')) {
      browser = 'Chrome';
    } else if (userAgent.includes('Firefox')) {
      browser = 'Firefox';
    } else if (userAgent.includes('Safari')) {
      browser = 'Safari';
    }

    let os = 'Unknown';
    if (userAgent.includes('Windows')) {
      os = 'Windows';
    } else if (userAgent.includes('Mac')) {
      os = 'macOS';
    } else if (userAgent.includes('Linux')) {
      os = 'Linux';
    }

    const device = userAgent.includes('Mobile') ? 'Mobile' : 'Desktop';

    return { browser, os, device };
  }

  /**
   * Request password reset
   * @param email User email
   * @param ipAddress Client IP address (for audit logging)
   * @param userAgent Client user agent (for audit logging)
   * @remarks For security, always returns success even if email doesn't exist
   */
  async requestPasswordReset(
    email: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true, status: true },
    });

    // Security: Don't reveal if email exists or not
    if (!user || user.status !== 'ACTIVE') {
      this.logger.log(
        `Password reset requested for non-existent or inactive user: ${email}`
      );
      // Log failed attempt (security monitoring)
      await this.auditService.log({
        userId: null, // No user ID for non-existent users
        action: 'PASSWORD_RESET_REQUEST_FAILED',
        ipAddress,
        userAgent,
        severity: 'WARNING',
        metadata: {
          email: email.toLowerCase(),
          reason: 'user_not_found_or_inactive',
        },
      });
      // Still return success to prevent email enumeration
      return;
    }

    // Generate token
    const token = generatePasswordResetToken();
    const expiresAt = getTokenExpiration(1); // 1 hour

    // Store token in database
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Send password reset email
    await this.emailService.sendPasswordResetEmail({
      to: user.email,
      token,
      userId: user.id,
    });

    // Log successful password reset request
    await this.auditService.log({
      userId: user.id,
      action: 'PASSWORD_RESET_REQUEST',
      ipAddress,
      userAgent,
      severity: 'INFO',
    });

    this.logger.log(
      `Password reset email sent to ${user.email} (userId: ${user.id})`
    );
  }

  /**
   * Confirm password reset
   * @param token Password reset token
   * @param newPassword New password
   * @param ipAddress Client IP address
   */
  async confirmPasswordReset(
    token: string,
    newPassword: string,
    ipAddress: string
  ): Promise<void> {
    // Find token
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      throw new BadRequestException('Invalid or expired token');
    }

    // Check if already used
    if (resetToken.usedAt) {
      throw new BadRequestException('Token already used');
    }

    // Check expiration
    if (resetToken.expiresAt < new Date()) {
      throw new BadRequestException('Token expired');
    }

    // Hash new password
    const passwordHash = await this.passwordService.hashPassword(newPassword);

    // Update user password
    await this.prisma.user.update({
      where: { id: resetToken.userId },
      data: {
        passwordHash,
      },
    });

    // Mark token as used
    await this.prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: {
        usedAt: new Date(),
        ipAddress,
      },
    });

    // Invalidate all existing sessions (security: force re-login)
    await this.sessionService.revokeAllUserSessions(resetToken.userId);

    // Log audit event
    await this.auditService.log({
      userId: resetToken.userId,
      action: 'PASSWORD_RESET',
      ipAddress,
      userAgent: 'N/A', // We don't have user agent in token confirmation
      severity: 'WARNING', // Password reset is a security-sensitive action
    });

    this.logger.log(
      `Password reset confirmed for user ${resetToken.user.email} (userId: ${resetToken.userId})`
    );
  }
}

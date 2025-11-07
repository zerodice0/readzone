import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Ip,
  Headers,
  UseGuards,
  Request,
  Inject,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service.js';
import { RegisterDto, LoginDto } from '../dto/index.js';
import { ConfirmEmailVerificationDto } from '../dto/confirm-email-verification.dto.js';
import { RequestPasswordResetDto } from '../dto/request-password-reset.dto.js';
import { ConfirmPasswordResetDto } from '../dto/confirm-password-reset.dto.js';
import { JwtAuthGuard } from '../guards/jwt-auth.guard.js';
import { success } from '../../../common/utils/response.js';

/**
 * Authenticated request interface with user data from JWT
 */
interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    sessionId: string;
    email: string;
    emailVerified: boolean;
  };
}

/**
 * Authentication controller
 * Handles user registration, login, and logout endpoints
 */
@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  /**
   * Register a new user
   * POST /api/v1/auth/register
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto) {
    const user = await this.authService.register(dto);
    return success(user);
  }

  /**
   * Login user
   * POST /api/v1/auth/login
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string = 'Unknown'
  ) {
    const result = await this.authService.login(dto, ipAddress, userAgent);
    return success(result);
  }

  /**
   * Logout user
   * POST /api/v1/auth/logout
   * Requires authentication
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @Request() req: AuthenticatedRequest,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string = 'Unknown'
  ) {
    const { sessionId, userId } = req.user;
    await this.authService.logout(sessionId, userId, ipAddress, userAgent);
    return success(null);
  }

  /**
   * Get current user info
   * GET /api/v1/auth/me
   * Requires authentication
   */
  @Post('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  // eslint-disable-next-line class-methods-use-this
  getCurrentUser(@Request() req: AuthenticatedRequest) {
    return success(req.user);
  }

  /**
   * Send email verification email
   * POST /api/v1/auth/verify-email/send
   * Requires authentication
   */
  @Post('verify-email/send')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async sendVerificationEmail(
    @Request() req: AuthenticatedRequest,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string = 'Unknown'
  ) {
    const { userId } = req.user;
    await this.authService.sendVerificationEmail(userId, ipAddress, userAgent);
    return success({ message: 'Verification email sent' });
  }

  /**
   * Confirm email verification
   * POST /api/v1/auth/verify-email/confirm
   * Public endpoint (no authentication required)
   */
  @Post('verify-email/confirm')
  @HttpCode(HttpStatus.OK)
  async confirmVerificationEmail(
    @Body() dto: ConfirmEmailVerificationDto,
    @Ip() ipAddress: string
  ) {
    await this.authService.confirmEmailVerification(dto.token, ipAddress);
    return success({ message: 'Email verified successfully' });
  }

  /**
   * Request password reset
   * POST /api/v1/auth/password-reset/request
   * Public endpoint (no authentication required)
   *
   * TODO(WP08): Add rate limiting - 3 requests per 5 minutes per email
   */
  @Post('password-reset/request')
  @HttpCode(HttpStatus.OK)
  async requestPasswordReset(
    @Body() dto: RequestPasswordResetDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string = 'Unknown'
  ) {
    await this.authService.requestPasswordReset(
      dto.email,
      ipAddress,
      userAgent
    );
    // Always return success to prevent email enumeration
    return success({
      message: 'If the email exists, a password reset link has been sent',
    });
  }

  /**
   * Confirm password reset
   * POST /api/v1/auth/password-reset/confirm
   * Public endpoint (no authentication required)
   */
  @Post('password-reset/confirm')
  @HttpCode(HttpStatus.OK)
  async confirmPasswordReset(
    @Body() dto: ConfirmPasswordResetDto,
    @Ip() ipAddress: string
  ) {
    await this.authService.confirmPasswordReset(
      dto.token,
      dto.newPassword,
      ipAddress
    );
    return success({
      message:
        'Password reset successfully. Please login with your new password',
    });
  }
}

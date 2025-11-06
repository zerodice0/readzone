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
import { AuthService } from '../services/auth.service';
import { RegisterDto, LoginDto } from '../dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { success } from '../../../common/utils/response';

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
    @Request() req: any,
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
  async getCurrentUser(@Request() req: any) {
    return success(req.user);
  }
}

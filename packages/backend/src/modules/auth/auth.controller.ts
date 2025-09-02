import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Request,
  Response,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Response as ExpressResponse } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CheckDuplicateDto } from './dto/check-duplicate.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { getTokenExpirationTimeMs } from '../../common/utils/jwt';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

// DTOs for email verification flows
class ResendVerificationDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}

class VerifyEmailDto {
  @IsString()
  @IsNotEmpty()
  token!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Response({ passthrough: true }) res: ExpressResponse,
  ) {
    const result = await this.authService.login(loginDto);

    // RefreshToken을 HttpOnly Cookie로 설정 (환경변수 기반 만료시간)
    const refreshTokenMaxAge = getTokenExpirationTimeMs(
      process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
    );
    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: refreshTokenMaxAge,
      path: '/',
    });

    // Response body에는 AccessToken만 포함
    return {
      success: true,
      message: result.message,
      user: result.user,
      tokens: {
        accessToken: result.tokens.accessToken,
        // refreshToken은 Cookie로 전송되므로 제외
      },
    };
  }

  @Post('check-duplicate')
  @HttpCode(HttpStatus.OK)
  async checkDuplicate(@Body() checkDuplicateDto: CheckDuplicateDto) {
    return this.authService.checkDuplicate(checkDuplicateDto);
  }

  // 비밀번호 재설정 요청
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body() body: ForgotPasswordDto,
    @Request() req: { headers?: Record<string, string>; ip?: string },
  ) {
    const userAgent = req.headers?.['user-agent'];
    const ip = req.ip;

    return this.authService.requestPasswordReset(
      body.email,
      body.recaptchaToken,
      {
        userAgent,
        ip,
      },
    );
  }

  // 재설정 토큰 검증
  @Get('reset-password')
  @HttpCode(HttpStatus.OK)
  async validateResetToken(@Query('token') token: string) {
    return this.authService.checkResetToken(token);
  }

  // 비밀번호 재설정 처리 + 자동 로그인
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() body: ResetPasswordDto,
    @Response({ passthrough: true }) res: ExpressResponse,
  ) {
    const result = await this.authService.resetPassword(
      body.token,
      body.newPassword,
      body.confirmPassword,
    );

    // 자동 로그인: RefreshToken을 Cookie로 설정
    const refreshTokenMaxAge = getTokenExpirationTimeMs(
      process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
    );

    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: refreshTokenMaxAge,
      path: '/',
    });

    return {
      success: true,
      message: result.message,
      user: result.user,
      tokens: {
        accessToken: result.tokens.accessToken,
      },
      invalidatedSessions: result.invalidatedSessions,
    };
  }

  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail((token || '').trim());
  }

  // Email verification via POST body (for client convenience)
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmailPost(@Body() body: VerifyEmailDto) {
    const token = (body.token || '').trim();
    const result = await this.authService.verifyEmail(token);

    return {
      success: true,
      data: {
        message: result.message,
      },
    } as const;
  }

  // Initial send of verification email
  @Post('send-verification')
  @HttpCode(HttpStatus.OK)
  async sendVerification(
    @Body() body: ResendVerificationDto,
    @Request() req: { headers?: Record<string, string>; ip?: string },
  ) {
    const result = await this.authService.requestEmailVerification(body.email, {
      ip: req.ip,
      userAgent: req.headers?.['user-agent'],
    });

    return {
      success: true,
      data: result,
    } as const;
  }

  // Resend verification email
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerification(
    @Body() body: ResendVerificationDto,
    @Request() req: { headers?: Record<string, string>; ip?: string },
  ) {
    const result = await this.authService.requestEmailVerification(body.email, {
      ip: req.ip,
      userAgent: req.headers?.['user-agent'],
    });

    return {
      success: true,
      data: result,
    } as const;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Request() req: { cookies?: { refreshToken?: string } },
    @Response({ passthrough: true }) res: ExpressResponse,
  ) {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    const result = await this.authService.refresh(refreshToken);

    // 새 RefreshToken 발급 (Token Rotation)
    // 절대 만료 유지: 서비스에서 계산한 남은 수명(ms) 사용
    const refreshTokenMaxAge = result.refreshTokenMaxAgeMs;

    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: refreshTokenMaxAge,
      path: '/',
    });

    return {
      success: true,
      data: {
        user: result.user,
        tokens: {
          accessToken: result.tokens.accessToken,
          // refreshToken은 Cookie로 전송되므로 제외
        },
      },
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Response({ passthrough: true }) res: ExpressResponse) {
    // Cookie 삭제
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path: '/',
    });

    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  @Post('verify-token')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  verifyToken(@Request() req: { user: unknown }) {
    return {
      success: true,
      data: {
        valid: true,
        user: req.user,
      },
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getCurrentUser(@Request() req: { user: unknown }) {
    return {
      success: true,
      data: {
        user: req.user,
      },
    };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Request() req: { user: unknown }) {
    return {
      success: true,
      user: req.user,
    };
  }
}

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
  UseGuards,
} from '@nestjs/common';
import type { Response as ExpressResponse } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CheckDuplicateDto } from './dto/check-duplicate.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

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

    // RefreshToken을 HttpOnly Cookie로 설정
    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
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

  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Request() req: { cookies?: { refreshToken?: string } },
    @Response({ passthrough: true }) res: ExpressResponse,
  ) {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new Error('No refresh token provided');
    }

    const result = await this.authService.refresh(refreshToken);

    // 새 RefreshToken 발급 (Token Rotation)
    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
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

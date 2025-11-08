import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { CsrfGuard } from '../../../common/guards/csrf.guard';
import { SkipCsrf } from '../../../common/decorators/skip-csrf.decorator';

/**
 * CSRF Token Controller
 *
 * Provides endpoint to obtain CSRF tokens for client applications.
 */
@Controller('csrf')
export class CsrfController {
  /**
   * Get CSRF Token
   *
   * Returns a new CSRF token in both response body and cookie.
   * Client must include this token in X-CSRF-Token header for state-changing requests.
   *
   * @returns { csrfToken: string }
   */
  @Get('token')
  @SkipCsrf()
  getCsrfToken(@Res({ passthrough: true }) response: Response): {
    csrfToken: string;
  } {
    const token = CsrfGuard.generateToken();

    // Set CSRF token in cookie
    response.cookie('XSRF-TOKEN', token, {
      httpOnly: false, // Client needs to read this
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    // Also return in response body
    return { csrfToken: token };
  }
}

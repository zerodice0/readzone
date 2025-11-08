import { SetMetadata } from '@nestjs/common';

/**
 * Skip CSRF Protection Decorator
 *
 * Use this decorator to skip CSRF validation for specific routes.
 *
 * Example:
 * @SkipCsrf()
 * @Post('webhook')
 * handleWebhook() { ... }
 */
export const SkipCsrf = () => SetMetadata('skipCsrf', true);

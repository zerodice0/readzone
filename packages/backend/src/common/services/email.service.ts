import { Injectable } from '@nestjs/common';
import { LoggerService } from '../utils/logger';

export interface SendVerificationEmailParams {
  to: string;
  token: string;
  userId: string;
}

export interface SendPasswordResetEmailParams {
  to: string;
  token: string;
  userId: string;
}

/**
 * Email service abstraction
 * Development: Console.log mock implementation
 * Production: Integration with SendGrid/AWS SES
 */
@Injectable()
export class EmailService {
  private readonly logger = new LoggerService('EmailService');

  /**
   * Send email verification email
   * @param params Email parameters
   */
  sendVerificationEmail(params: SendVerificationEmailParams): Promise<void> {
    return Promise.resolve().then(() => {
      const { to, token, userId } = params;

      // Mock implementation for development
      const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/verify-email?token=${token}`;

      this.logger.log(
        `[DEV] Sending verification email to ${to} (userId: ${userId})`
      );
      this.logger.log(`\n${'='.repeat(80)}`);
      this.logger.log('📧 EMAIL VERIFICATION');
      this.logger.log('='.repeat(80));
      this.logger.log(`To: ${to}`);
      this.logger.log(`Subject: Verify Your Email Address`);
      this.logger.log('\nBody:');
      this.logger.log(`Hello,\n`);
      this.logger.log(
        `Please verify your email address by clicking the link below:\n`
      );
      this.logger.log(`${verificationUrl}\n`);
      this.logger.log(`This link will expire in 24 hours.\n`);
      this.logger.log(`If you did not request this, please ignore this email.`);
      this.logger.log(`${'='.repeat(80)}\n`);

      // TODO: Replace with actual email service in production
      // Example:
      // await this.sendGridService.send({
      //   to,
      //   subject: 'Verify Your Email Address',
      //   html: emailTemplate
      // });
    });
  }

  /**
   * Send password reset email
   * @param params Email parameters
   */
  sendPasswordResetEmail(params: SendPasswordResetEmailParams): Promise<void> {
    return Promise.resolve().then(() => {
      const { to, token, userId } = params;

      // Mock implementation for development
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}`;

      this.logger.log(
        `[DEV] Sending password reset email to ${to} (userId: ${userId})`
      );
      this.logger.log(`\n${'='.repeat(80)}`);
      this.logger.log('🔐 PASSWORD RESET');
      this.logger.log('='.repeat(80));
      this.logger.log(`To: ${to}`);
      this.logger.log(`Subject: Reset Your Password`);
      this.logger.log('\nBody:');
      this.logger.log(`Hello,\n`);
      this.logger.log(
        `You requested to reset your password. Click the link below:\n`
      );
      this.logger.log(`${resetUrl}\n`);
      this.logger.log(`This link will expire in 1 hour.\n`);
      this.logger.log(
        `If you did not request this, please ignore this email and your password will remain unchanged.`
      );
      this.logger.log(`${'='.repeat(80)}\n`);

      // TODO: Replace with actual email service in production
      // Example:
      // await this.sendGridService.send({
      //   to,
      //   subject: 'Reset Your Password',
      //   html: emailTemplate
      // });
    });
  }
}

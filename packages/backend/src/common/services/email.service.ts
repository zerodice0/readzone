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
  async sendVerificationEmail(
    params: SendVerificationEmailParams
  ): Promise<void> {
    const { to, token, userId } = params;

    // Mock implementation for development
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/verify-email?token=${token}`;

    this.logger.log(
      `[DEV] Sending verification email to ${to} (userId: ${userId})`
    );
    console.log('\n' + '='.repeat(80));
    console.log('📧 EMAIL VERIFICATION');
    console.log('='.repeat(80));
    console.log(`To: ${to}`);
    console.log(`Subject: Verify Your Email Address`);
    console.log('\nBody:');
    console.log(`Hello,\n`);
    console.log(
      `Please verify your email address by clicking the link below:\n`
    );
    console.log(`${verificationUrl}\n`);
    console.log(`This link will expire in 24 hours.\n`);
    console.log(`If you did not request this, please ignore this email.`);
    console.log('='.repeat(80) + '\n');

    // TODO: Replace with actual email service in production
    // Example:
    // await this.sendGridService.send({
    //   to,
    //   subject: 'Verify Your Email Address',
    //   html: emailTemplate
    // });
  }

  /**
   * Send password reset email
   * @param params Email parameters
   */
  async sendPasswordResetEmail(
    params: SendPasswordResetEmailParams
  ): Promise<void> {
    const { to, token, userId } = params;

    // Mock implementation for development
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}`;

    this.logger.log(
      `[DEV] Sending password reset email to ${to} (userId: ${userId})`
    );
    console.log('\n' + '='.repeat(80));
    console.log('🔐 PASSWORD RESET');
    console.log('='.repeat(80));
    console.log(`To: ${to}`);
    console.log(`Subject: Reset Your Password`);
    console.log('\nBody:');
    console.log(`Hello,\n`);
    console.log(`You requested to reset your password. Click the link below:\n`);
    console.log(`${resetUrl}\n`);
    console.log(`This link will expire in 1 hour.\n`);
    console.log(
      `If you did not request this, please ignore this email and your password will remain unchanged.`
    );
    console.log('='.repeat(80) + '\n');

    // TODO: Replace with actual email service in production
    // Example:
    // await this.sendGridService.send({
    //   to,
    //   subject: 'Reset Your Password',
    //   html: emailTemplate
    // });
  }
}

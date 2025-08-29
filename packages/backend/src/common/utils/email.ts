import { Resend } from 'resend';
import { ConfigService } from '@nestjs/config';
import {
  createEmailVerificationTemplate,
  createPasswordResetTemplate,
} from './template-loader';

// 이메일 템플릿 인터페이스
interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

/**
 * 이메일 발송 함수
 */
export async function sendEmail(
  to: string,
  template: EmailTemplate,
  configService: ConfigService,
  fromName = 'ReadZone',
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const nodeEnv = configService.get<string>('NODE_ENV');
    const enableDevEmail = configService.get<string>('ENABLE_DEV_EMAIL');
    const resendApiKey = configService.get<string>('RESEND_API_KEY');

    // 테스트 또는 개발 환경에서 ENABLE_DEV_EMAIL이 설정되지 않은 경우 콘솔 로깅으로 대체
    if (nodeEnv === 'test' || (nodeEnv === 'development' && !enableDevEmail)) {
      // 테스트/개발 환경에서는 항상 성공으로 처리하고 로깅만 수행
      return {
        success: true,
        messageId: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      };
    }

    // 프로덕션 환경에서만 실제 이메일 발송
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    // ConfigService에서 가져온 API 키로 Resend 클라이언트 생성
    const resend = new Resend(resendApiKey);

    // ConfigService에서 발신 이메일 주소 가져오기
    const fromEmail =
      configService.get<string>('RESEND_FROM_EMAIL') ||
      `${fromName} <onboarding@resend.dev>`;

    const result = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (result.error) {
      console.error('Resend API error:', result.error);

      return {
        success: false,
        error: result.error.message || 'Email sending failed',
      };
    }

    return {
      success: true,
      messageId: result.data?.id,
    };
  } catch (error) {
    console.error('Email sending error:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown email error',
    };
  }
}

/**
 * 이메일 인증 발송
 */
export async function sendEmailVerification(
  email: string,
  nickname: string,
  verificationToken: string,
  configService: ConfigService,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const nodeEnv = configService.get<string>('NODE_ENV');
  const baseUrl =
    nodeEnv === 'production'
      ? 'https://readzone.vercel.app'
      : 'http://localhost:3000';

  const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;
  const template = createEmailVerificationTemplate(nickname, verificationUrl);

  return await sendEmail(email, template, configService);
}

/**
 * 비밀번호 재설정 이메일 발송
 */
export async function sendPasswordResetEmail(
  email: string,
  nickname: string,
  resetToken: string,
  configService: ConfigService,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const nodeEnv = configService.get<string>('NODE_ENV');
  const baseUrl =
    nodeEnv === 'production'
      ? 'https://readzone.vercel.app'
      : 'http://localhost:3000';

  const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
  const template = createPasswordResetTemplate(nickname, resetUrl);

  return await sendEmail(email, template, configService);
}

// 이메일 유효성 검증
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return emailRegex.test(email) && email.length <= 320;
}

/**
 * 개발 환경에서의 이메일 로깅 (향상된 버전)
 */
export function logEmailInDevelopment(
  to: string,
  subject: string,
  verificationUrl?: string,
  configService?: ConfigService,
) {
  const nodeEnv =
    configService?.get<string>('NODE_ENV') || process.env.NODE_ENV;
  if (nodeEnv === 'development') {
    const timestamp = new Date().toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    // 콘솔 색상 코드
    const colors = {
      reset: '\x1b[0m',
      bright: '\x1b[1m',
      cyan: '\x1b[36m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      gray: '\x1b[90m',
    };

    // 이메일 로그 출력 (컬러 포맷)
    console.log(
      `\n${colors.cyan}╭─────────────────────────────────────────────────────────────╮${colors.reset}`,
    );
    console.log(
      `${colors.cyan}│${colors.reset} ${colors.bright}📧 EMAIL SENT ${colors.gray}(Development Mode)${colors.reset}                   ${colors.cyan}│${colors.reset}`,
    );
    console.log(
      `${colors.cyan}├─────────────────────────────────────────────────────────────┤${colors.reset}`,
    );
    console.log(
      `${colors.cyan}│${colors.reset} ${colors.yellow}Time:${colors.reset} ${timestamp}                          ${colors.cyan}│${colors.reset}`,
    );
    console.log(
      `${colors.cyan}│${colors.reset} ${colors.yellow}To:${colors.reset}   ${colors.green}${to}${colors.reset}${' '.repeat(Math.max(0, 48 - to.length))}${colors.cyan}│${colors.reset}`,
    );
    console.log(
      `${colors.cyan}│${colors.reset} ${colors.yellow}Subject:${colors.reset} ${subject}${' '.repeat(Math.max(0, 44 - subject.length))}${colors.cyan}│${colors.reset}`,
    );

    if (verificationUrl) {
      console.log(
        `${colors.cyan}├─────────────────────────────────────────────────────────────┤${colors.reset}`,
      );
      console.log(
        `${colors.cyan}│${colors.reset} ${colors.blue}🔗 Verification Link:${colors.reset}                             ${colors.cyan}│${colors.reset}`,
      );

      // URL이 너무 길면 줄바꿈
      const maxUrlLength = 55;

      if (verificationUrl.length > maxUrlLength) {
        const chunks: string[] = [];

        for (let i = 0; i < verificationUrl.length; i += maxUrlLength) {
          chunks.push(verificationUrl.slice(i, i + maxUrlLength));
        }
        chunks.forEach((chunk) => {
          const padding = ' '.repeat(Math.max(0, 59 - chunk.length));

          console.log(
            `${colors.cyan}│${colors.reset} ${colors.gray}${chunk}${colors.reset}${padding}${colors.cyan}│${colors.reset}`,
          );
        });
      } else {
        const padding = ' '.repeat(Math.max(0, 59 - verificationUrl.length));

        console.log(
          `${colors.cyan}│${colors.reset} ${colors.gray}${verificationUrl}${colors.reset}${padding}${colors.cyan}│${colors.reset}`,
        );
      }
    }

    console.log(
      `${colors.cyan}├─────────────────────────────────────────────────────────────┤${colors.reset}`,
    );
    console.log(
      `${colors.cyan}│${colors.reset} ${colors.gray}💡 Click the link above to verify your email${colors.reset}        ${colors.cyan}│${colors.reset}`,
    );
    console.log(
      `${colors.cyan}╰─────────────────────────────────────────────────────────────╯${colors.reset}\n`,
    );
  }
}

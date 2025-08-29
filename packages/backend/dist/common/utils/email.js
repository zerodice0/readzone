"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
exports.sendEmailVerification = sendEmailVerification;
exports.sendPasswordResetEmail = sendPasswordResetEmail;
exports.isValidEmail = isValidEmail;
exports.logEmailInDevelopment = logEmailInDevelopment;
const resend_1 = require("resend");
const template_loader_1 = require("./template-loader");
async function sendEmail(to, template, configService, fromName = 'ReadZone') {
    try {
        const nodeEnv = configService.get('NODE_ENV');
        const enableDevEmail = configService.get('ENABLE_DEV_EMAIL');
        const resendApiKey = configService.get('RESEND_API_KEY');
        if (nodeEnv === 'test' || (nodeEnv === 'development' && !enableDevEmail)) {
            return {
                success: true,
                messageId: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            };
        }
        if (!resendApiKey) {
            throw new Error('RESEND_API_KEY is not configured');
        }
        const resend = new resend_1.Resend(resendApiKey);
        const fromEmail = configService.get('RESEND_FROM_EMAIL') ||
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
    }
    catch (error) {
        console.error('Email sending error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown email error',
        };
    }
}
async function sendEmailVerification(email, nickname, verificationToken, configService) {
    const nodeEnv = configService.get('NODE_ENV');
    const baseUrl = nodeEnv === 'production'
        ? 'https://readzone.vercel.app'
        : 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;
    const template = (0, template_loader_1.createEmailVerificationTemplate)(nickname, verificationUrl);
    return await sendEmail(email, template, configService);
}
async function sendPasswordResetEmail(email, nickname, resetToken, configService) {
    const nodeEnv = configService.get('NODE_ENV');
    const baseUrl = nodeEnv === 'production'
        ? 'https://readzone.vercel.app'
        : 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
    const template = (0, template_loader_1.createPasswordResetTemplate)(nickname, resetUrl);
    return await sendEmail(email, template, configService);
}
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 320;
}
function logEmailInDevelopment(to, subject, verificationUrl, configService) {
    const nodeEnv = configService?.get('NODE_ENV') || process.env.NODE_ENV;
    if (nodeEnv === 'development') {
        const timestamp = new Date().toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
        const colors = {
            reset: '\x1b[0m',
            bright: '\x1b[1m',
            cyan: '\x1b[36m',
            green: '\x1b[32m',
            yellow: '\x1b[33m',
            blue: '\x1b[34m',
            gray: '\x1b[90m',
        };
        console.log(`\n${colors.cyan}╭─────────────────────────────────────────────────────────────╮${colors.reset}`);
        console.log(`${colors.cyan}│${colors.reset} ${colors.bright}📧 EMAIL SENT ${colors.gray}(Development Mode)${colors.reset}                   ${colors.cyan}│${colors.reset}`);
        console.log(`${colors.cyan}├─────────────────────────────────────────────────────────────┤${colors.reset}`);
        console.log(`${colors.cyan}│${colors.reset} ${colors.yellow}Time:${colors.reset} ${timestamp}                          ${colors.cyan}│${colors.reset}`);
        console.log(`${colors.cyan}│${colors.reset} ${colors.yellow}To:${colors.reset}   ${colors.green}${to}${colors.reset}${' '.repeat(Math.max(0, 48 - to.length))}${colors.cyan}│${colors.reset}`);
        console.log(`${colors.cyan}│${colors.reset} ${colors.yellow}Subject:${colors.reset} ${subject}${' '.repeat(Math.max(0, 44 - subject.length))}${colors.cyan}│${colors.reset}`);
        if (verificationUrl) {
            console.log(`${colors.cyan}├─────────────────────────────────────────────────────────────┤${colors.reset}`);
            console.log(`${colors.cyan}│${colors.reset} ${colors.blue}🔗 Verification Link:${colors.reset}                             ${colors.cyan}│${colors.reset}`);
            const maxUrlLength = 55;
            if (verificationUrl.length > maxUrlLength) {
                const chunks = [];
                for (let i = 0; i < verificationUrl.length; i += maxUrlLength) {
                    chunks.push(verificationUrl.slice(i, i + maxUrlLength));
                }
                chunks.forEach((chunk) => {
                    const padding = ' '.repeat(Math.max(0, 59 - chunk.length));
                    console.log(`${colors.cyan}│${colors.reset} ${colors.gray}${chunk}${colors.reset}${padding}${colors.cyan}│${colors.reset}`);
                });
            }
            else {
                const padding = ' '.repeat(Math.max(0, 59 - verificationUrl.length));
                console.log(`${colors.cyan}│${colors.reset} ${colors.gray}${verificationUrl}${colors.reset}${padding}${colors.cyan}│${colors.reset}`);
            }
        }
        console.log(`${colors.cyan}├─────────────────────────────────────────────────────────────┤${colors.reset}`);
        console.log(`${colors.cyan}│${colors.reset} ${colors.gray}💡 Click the link above to verify your email${colors.reset}        ${colors.cyan}│${colors.reset}`);
        console.log(`${colors.cyan}╰─────────────────────────────────────────────────────────────╯${colors.reset}\n`);
    }
}
//# sourceMappingURL=email.js.map
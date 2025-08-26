interface EmailTemplate {
    subject: string;
    html: string;
    text: string;
}
export declare function createEmailVerificationTemplate(nickname: string, verificationUrl: string): EmailTemplate;
export declare function createPasswordResetTemplate(nickname: string, resetUrl: string): EmailTemplate;
export {};

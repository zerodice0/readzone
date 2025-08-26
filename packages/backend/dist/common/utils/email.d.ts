interface EmailTemplate {
    subject: string;
    html: string;
    text: string;
}
export declare function sendEmail(to: string, template: EmailTemplate, fromName?: string): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
}>;
export declare function sendEmailVerification(email: string, nickname: string, verificationToken: string): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
}>;
export declare function sendPasswordResetEmail(email: string, nickname: string, resetToken: string): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
}>;
export declare function isValidEmail(email: string): boolean;
export declare function logEmailInDevelopment(to: string, subject: string, verificationUrl?: string): void;
export {};

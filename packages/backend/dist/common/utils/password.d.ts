export declare function hashPassword(password: string): Promise<string>;
export declare function verifyPassword(password: string, hashedPassword: string): Promise<boolean>;
export interface PasswordStrengthResult {
    isValid: boolean;
    score: number;
    errors: string[];
    suggestions: string[];
}
export declare function validatePasswordStrength(password: string): PasswordStrengthResult;
export declare function validatePasswordPolicy(password: string): {
    isValid: boolean;
    message?: string;
};

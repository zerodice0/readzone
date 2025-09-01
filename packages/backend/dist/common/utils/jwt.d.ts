import type ms from 'ms';
export interface JWTPayload {
    userId: string;
    email: string | null;
    nickname: string;
    type: 'access' | 'refresh' | 'email-verification' | 'password-reset';
    iat?: number;
    exp?: number;
    jti?: string;
}
export declare function generateAccessToken(payload: Omit<JWTPayload, 'type' | 'iat' | 'exp'>): string;
export declare function generateRefreshToken(payload: Omit<JWTPayload, 'type' | 'iat' | 'exp'>, expiresInOverride?: ms.StringValue | number): string;
export declare function generateEmailVerificationToken(payload: Omit<JWTPayload, 'type' | 'iat' | 'exp'>): string;
export declare function generatePasswordResetToken(payload: Omit<JWTPayload, 'type' | 'iat' | 'exp'>): string;
export declare function verifyToken(token: string): JWTPayload;
export declare function extractUserIdFromToken(token: string): string | null;
export declare function generateTokenPair(payload: Omit<JWTPayload, 'type' | 'iat' | 'exp'>, refreshExpiresInOverride?: ms.StringValue | number): {
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
    tokenType: string;
};
export declare function getTokenExpirationTime(expiresIn: string): number;
export declare function getTokenExpirationTimeMs(expiresIn: string): number;
export declare function generateSecureToken(length?: number): string;
export declare function validateTokenType(token: string, expectedType: JWTPayload['type']): boolean;
export declare function getTimeUntilExpiration(token: string): number | null;

import type { Response as ExpressResponse } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CheckDuplicateDto } from './dto/check-duplicate.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(registerDto: RegisterDto): Promise<{
        success: boolean;
        message: string;
        user: {
            userid: string;
            email: string | null;
            nickname: string;
            id: string;
            bio: string | null;
            profileImage: string | null;
            isVerified: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    login(loginDto: LoginDto, res: ExpressResponse): Promise<{
        success: boolean;
        message: string;
        user: {
            id: string;
            userid: string;
            email: string | null;
            nickname: string;
            bio: string | null;
            profileImage: string | null;
            isVerified: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
        tokens: {
            accessToken: string;
        };
    }>;
    checkDuplicate(checkDuplicateDto: CheckDuplicateDto): Promise<{
        success: boolean;
        data: {
            field: string;
            value: string;
            isDuplicate: boolean;
        };
    }>;
    forgotPassword(body: ForgotPasswordDto, req: {
        headers?: Record<string, string>;
        ip?: string;
    }): Promise<{
        readonly success: true;
        readonly message: "비밀번호 재설정 안내 이메일을 확인해주세요. 가입 여부와 관계없이 동일한 메시지를 표시합니다.";
        readonly sentTo: string;
        readonly rateLimitInfo: {
            readonly remainingAttempts: 0;
            readonly resetAt: string;
            readonly dailyLimitReached: false;
        };
        readonly suggestedActions: {
            signup: boolean;
            message: string;
        } | undefined;
    }>;
    validateResetToken(token: string): Promise<{
        readonly success: false;
        readonly status: "invalid";
        readonly message: "유효하지 않은 토큰입니다.";
        readonly canRequestNew: true;
        readonly tokenInfo?: undefined;
    } | {
        readonly success: false;
        readonly status: "used";
        readonly message: "이미 사용되었거나 무효화된 토큰입니다.";
        readonly canRequestNew: true;
        readonly tokenInfo?: undefined;
    } | {
        readonly success: false;
        readonly status: "expired";
        readonly message: "만료된 토큰입니다.";
        readonly canRequestNew: true;
        readonly tokenInfo?: undefined;
    } | {
        readonly success: true;
        readonly status: "valid";
        readonly message: "유효한 토큰입니다.";
        readonly tokenInfo: {
            readonly email: string;
            readonly expiresAt: string;
            readonly createdAt: string;
        };
        readonly canRequestNew: false;
    }>;
    resetPassword(body: ResetPasswordDto, res: ExpressResponse): Promise<{
        success: boolean;
        message: "비밀번호가 재설정되었습니다.";
        user: {
            readonly id: string;
            readonly email: string | null;
            readonly nickname: string;
        };
        tokens: {
            accessToken: string;
        };
        invalidatedSessions: number;
    }>;
    verifyEmail(token: string): Promise<{
        success: boolean;
        message: string;
    }>;
    refresh(req: {
        cookies?: {
            refreshToken?: string;
        };
    }, res: ExpressResponse): Promise<{
        success: boolean;
        data: {
            user: {
                id: string;
                userid: string;
                email: string | null;
                nickname: string;
                bio: string | null;
                profileImage: string | null;
                isVerified: boolean;
                createdAt: Date;
                updatedAt: Date;
            };
            tokens: {
                accessToken: string;
            };
        };
    }>;
    logout(res: ExpressResponse): {
        success: boolean;
        message: string;
    };
    verifyToken(req: {
        user: unknown;
    }): {
        success: boolean;
        data: {
            valid: boolean;
            user: unknown;
        };
    };
    getCurrentUser(req: {
        user: unknown;
    }): {
        success: boolean;
        data: {
            user: unknown;
        };
    };
    getProfile(req: {
        user: unknown;
    }): {
        success: boolean;
        user: unknown;
    };
}

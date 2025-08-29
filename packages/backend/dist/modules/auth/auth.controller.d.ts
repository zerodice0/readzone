import type { Response as ExpressResponse } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CheckDuplicateDto } from './dto/check-duplicate.dto';
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

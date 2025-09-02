import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CheckDuplicateDto } from './dto/check-duplicate.dto';
export declare class AuthService {
    private readonly prismaService;
    private readonly configService;
    private verificationCooldown;
    private ipWindow;
    constructor(prismaService: PrismaService, configService: ConfigService);
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
    login(loginDto: LoginDto): Promise<{
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
            refreshToken: string;
            expiresIn: string;
            tokenType: string;
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
        readonly success: true;
        readonly message: "이미 인증된 계정입니다.";
    } | {
        readonly success: true;
        readonly message: "이메일 인증이 완료되었습니다.";
    }>;
    requestEmailVerification(email: string, meta?: {
        ip?: string;
        userAgent?: string;
    }): Promise<{
        readonly message: "요청이 너무 잦습니다. 잠시 후 다시 시도해주세요.";
        readonly email: string;
        readonly expiresIn: string;
    } | {
        readonly message: "인증 이메일이 발송되었습니다. 메일함을 확인해주세요. (가입한 이메일이 아니라면 무시하셔도 됩니다)";
        readonly email: string;
        readonly expiresIn: string;
    } | {
        readonly message: "이미 인증된 계정입니다.";
        readonly email: string;
        readonly expiresIn: string;
    } | {
        readonly message: "인증 이메일이 발송되었습니다. 메일함을 확인해주세요.";
        readonly email: string;
        readonly expiresIn: string;
    }>;
    refresh(refreshToken: string): Promise<{
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
            refreshToken: string;
            expiresIn: string;
            tokenType: string;
        };
        refreshTokenMaxAgeMs: number;
    }>;
    private maskEmail;
    requestPasswordReset(email: string, recaptchaToken: string, meta?: {
        userAgent?: string;
        ip?: string;
    }): Promise<{
        readonly success: true;
        readonly message: "비밀번호 재설정 안내 이메일을 확인해주세요. 가입 여부와 관계없이 동일한 메시지를 표시합니다.";
        readonly sentTo: string;
    }>;
    checkResetToken(token: string): Promise<{
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
    resetPassword(token: string, newPassword: string, confirmPassword: string): Promise<{
        readonly message: "비밀번호가 재설정되었습니다.";
        readonly user: {
            readonly id: string;
            readonly email: string | null;
            readonly nickname: string;
        };
        readonly tokens: {
            accessToken: string;
            refreshToken: string;
            expiresIn: string;
            tokenType: string;
        };
        readonly invalidatedSessions: number;
    }>;
    private validatePasswordStrength;
}

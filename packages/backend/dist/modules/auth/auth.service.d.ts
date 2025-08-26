import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CheckDuplicateDto } from './dto/check-duplicate.dto';
export declare class AuthService {
    private readonly prismaService;
    private readonly configService;
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
            [key: string]: boolean;
        };
    }>;
    verifyEmail(token: string): Promise<{
        success: boolean;
        message: string;
    }>;
}

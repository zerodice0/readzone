import { ConfigService } from '@nestjs/config';
import { Strategy } from 'passport-jwt';
import { PrismaService } from '../../../prisma/prisma.service';
interface JwtPayload {
    userId: string;
    email: string;
    nickname: string;
    type: 'access' | 'refresh';
}
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly configService;
    private readonly prismaService;
    constructor(configService: ConfigService, prismaService: PrismaService);
    validate(payload: JwtPayload): Promise<{
        userid: string;
        email: string | null;
        nickname: string;
        id: string;
        bio: string | null;
        profileImage: string | null;
        isVerified: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
export {};

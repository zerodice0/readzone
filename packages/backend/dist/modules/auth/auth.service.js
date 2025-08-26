"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../prisma/prisma.service");
const password_1 = require("../../common/utils/password");
const jwt_1 = require("../../common/utils/jwt");
const email_1 = require("../../common/utils/email");
let AuthService = class AuthService {
    prismaService;
    configService;
    constructor(prismaService, configService) {
        this.prismaService = prismaService;
        this.configService = configService;
    }
    async register(registerDto) {
        const existingUser = await this.prismaService.user.findFirst({
            where: {
                OR: [
                    { userid: registerDto.userid },
                    { email: registerDto.email },
                    { nickname: registerDto.nickname },
                ],
            },
        });
        if (existingUser) {
            if (existingUser.userid === registerDto.userid) {
                throw new common_1.ConflictException('이미 사용 중인 사용자 ID입니다.');
            }
            if (existingUser.email === registerDto.email) {
                throw new common_1.ConflictException('이미 사용 중인 이메일입니다.');
            }
            if (existingUser.nickname === registerDto.nickname) {
                throw new common_1.ConflictException('이미 사용 중인 닉네임입니다.');
            }
        }
        const hashedPassword = await (0, password_1.hashPassword)(registerDto.password);
        const tempPayload = {
            userId: 'temp',
            email: registerDto.email,
            nickname: registerDto.nickname,
        };
        const verificationToken = (0, jwt_1.generateEmailVerificationToken)(tempPayload);
        const user = await this.prismaService.user.create({
            data: {
                userid: registerDto.userid,
                email: registerDto.email,
                nickname: registerDto.nickname,
                password: hashedPassword,
                verificationToken,
                isVerified: false,
            },
            select: {
                id: true,
                userid: true,
                email: true,
                nickname: true,
                bio: true,
                profileImage: true,
                isVerified: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        await this.prismaService.account.create({
            data: {
                userId: user.id,
                type: 'email',
                provider: 'email',
                providerAccountId: user.id,
                email: registerDto.email,
            },
        });
        await (0, email_1.sendEmailVerification)(registerDto.email, registerDto.nickname, verificationToken);
        return {
            success: true,
            message: '회원가입이 완료되었습니다. 이메일을 확인하여 인증을 완료해주세요.',
            user,
        };
    }
    async login(loginDto) {
        const user = await this.prismaService.user.findFirst({
            where: { email: loginDto.email },
        });
        if (!user || !user.password) {
            throw new common_1.UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
        }
        const isPasswordValid = await (0, password_1.verifyPassword)(loginDto.password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
        }
        const tokenPayload = {
            userId: user.id,
            email: user.email,
            nickname: user.nickname,
        };
        const tokens = (0, jwt_1.generateTokenPair)(tokenPayload);
        return {
            success: true,
            message: '로그인에 성공했습니다.',
            user: {
                id: user.id,
                userid: user.userid,
                email: user.email,
                nickname: user.nickname,
                bio: user.bio,
                profileImage: user.profileImage,
                isVerified: user.isVerified,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
            tokens,
        };
    }
    async checkDuplicate(checkDuplicateDto) {
        const conditions = [];
        if (checkDuplicateDto.userid) {
            conditions.push({ userid: checkDuplicateDto.userid });
        }
        if (checkDuplicateDto.email) {
            conditions.push({ email: checkDuplicateDto.email });
        }
        if (checkDuplicateDto.nickname) {
            conditions.push({ nickname: checkDuplicateDto.nickname });
        }
        if (conditions.length === 0) {
            throw new common_1.BadRequestException('확인할 필드를 하나 이상 제공해주세요.');
        }
        const existingUser = await this.prismaService.user.findFirst({
            where: { OR: conditions },
            select: { userid: true, email: true, nickname: true },
        });
        const result = {};
        if (checkDuplicateDto.userid) {
            result.userid = existingUser?.userid === checkDuplicateDto.userid;
        }
        if (checkDuplicateDto.email) {
            result.email = existingUser?.email === checkDuplicateDto.email;
        }
        if (checkDuplicateDto.nickname) {
            result.nickname = existingUser?.nickname === checkDuplicateDto.nickname;
        }
        return {
            success: true,
            data: result,
        };
    }
    async verifyEmail(token) {
        const user = await this.prismaService.user.findFirst({
            where: { verificationToken: token },
        });
        if (!user) {
            throw new common_1.BadRequestException('유효하지 않은 인증 토큰입니다.');
        }
        if (user.isVerified) {
            throw new common_1.BadRequestException('이미 인증된 계정입니다.');
        }
        await this.prismaService.user.update({
            where: { id: user.id },
            data: {
                isVerified: true,
                verificationToken: null,
            },
        });
        return {
            success: true,
            message: '이메일 인증이 완료되었습니다.',
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map
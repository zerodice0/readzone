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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../prisma/prisma.service");
const password_1 = require("../../common/utils/password");
const jwt_1 = require("../../common/utils/jwt");
const email_1 = require("../../common/utils/email");
const crypto_1 = __importDefault(require("crypto"));
const axios_1 = __importDefault(require("axios"));
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
        await (0, email_1.sendEmailVerification)(registerDto.email, registerDto.nickname, verificationToken, this.configService);
        return {
            success: true,
            message: '회원가입이 완료되었습니다. 이메일을 확인하여 인증을 완료해주세요.',
            user,
        };
    }
    async login(loginDto) {
        const user = await this.prismaService.user.findFirst({
            where: { userid: loginDto.userid },
        });
        if (!user || !user.password) {
            throw new common_1.UnauthorizedException('아이디 또는 비밀번호가 올바르지 않습니다.');
        }
        const isPasswordValid = await (0, password_1.verifyPassword)(loginDto.password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('아이디 또는 비밀번호가 올바르지 않습니다.');
        }
        const tokenPayload = {
            userId: user.id,
            email: user.email,
            nickname: user.nickname,
        };
        const tokens = (0, jwt_1.generateTokenPair)(tokenPayload);
        try {
            const rtPayload = (0, jwt_1.verifyToken)(tokens.refreshToken);
            const jti = rtPayload.jti;
            if (jti && rtPayload.exp) {
                const jtiHash = crypto_1.default.createHash('sha256').update(jti).digest('hex');
                const expiresAt = new Date(rtPayload.exp * 1000);
                await this.prismaService.refreshToken.create({
                    data: {
                        userId: user.id,
                        jtiHash,
                        expiresAt,
                    },
                });
            }
        }
        catch {
        }
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
        let field;
        let value;
        if (checkDuplicateDto.userid) {
            field = 'userid';
            value = checkDuplicateDto.userid;
        }
        else if (checkDuplicateDto.email) {
            field = 'email';
            value = checkDuplicateDto.email;
        }
        else if (checkDuplicateDto.nickname) {
            field = 'nickname';
            value = checkDuplicateDto.nickname;
        }
        else {
            throw new common_1.BadRequestException('확인할 필드를 하나 제공해주세요.');
        }
        const existingUser = await this.prismaService.user.findFirst({
            where: {
                [field]: value,
            },
            select: { userid: true, email: true, nickname: true },
        });
        const isDuplicate = !!existingUser;
        return {
            success: true,
            data: {
                field,
                value,
                isDuplicate,
            },
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
    async refresh(refreshToken) {
        try {
            const decoded = (0, jwt_1.verifyToken)(refreshToken);
            if (decoded.type !== 'refresh') {
                throw new common_1.UnauthorizedException('Invalid refresh token type');
            }
            if (!decoded.exp) {
                throw new common_1.UnauthorizedException('Invalid refresh token');
            }
            const now = Math.floor(Date.now() / 1000);
            const remainingSeconds = Math.max(0, decoded.exp - now);
            if (remainingSeconds <= 0) {
                throw new common_1.UnauthorizedException('Refresh token expired');
            }
            const user = await this.prismaService.user.findUnique({
                where: { id: decoded.userId },
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
            if (!user) {
                throw new common_1.UnauthorizedException('User not found');
            }
            if (!decoded.jti) {
                throw new common_1.UnauthorizedException('Invalid refresh token');
            }
            const incomingJtiHash = crypto_1.default
                .createHash('sha256')
                .update(decoded.jti)
                .digest('hex');
            const rtRecord = await this.prismaService.refreshToken.findUnique({
                where: { jtiHash: incomingJtiHash },
            });
            if (!rtRecord || rtRecord.isRevoked) {
                throw new common_1.UnauthorizedException('Invalid refresh token');
            }
            if (rtRecord.expiresAt.getTime() <= Date.now()) {
                throw new common_1.UnauthorizedException('Refresh token expired');
            }
            const tokens = (0, jwt_1.generateTokenPair)({
                userId: user.id,
                email: user.email,
                nickname: user.nickname,
            }, remainingSeconds);
            const newRtPayload = (0, jwt_1.verifyToken)(tokens.refreshToken);
            if (!newRtPayload.jti) {
                throw new common_1.UnauthorizedException('Invalid refresh token');
            }
            const newJtiHash = crypto_1.default
                .createHash('sha256')
                .update(newRtPayload.jti)
                .digest('hex');
            await this.prismaService.$transaction([
                this.prismaService.refreshToken.update({
                    where: { jtiHash: incomingJtiHash },
                    data: { isRevoked: true },
                }),
                this.prismaService.refreshToken.create({
                    data: {
                        userId: user.id,
                        jtiHash: newJtiHash,
                        expiresAt: rtRecord.expiresAt,
                    },
                }),
            ]);
            return {
                success: true,
                message: 'Tokens refreshed successfully',
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
                refreshTokenMaxAgeMs: remainingSeconds * 1000,
            };
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
    }
    maskEmail(email) {
        const [local, domain] = email.split('@');
        if (!domain)
            return email;
        const visible = local.slice(0, 1);
        const masked = '*'.repeat(Math.max(1, local.length - 1));
        return `${visible}${masked}@${domain}`;
    }
    async requestPasswordReset(email, recaptchaToken, meta) {
        const bypass = this.configService.get('RECAPTCHA_BYPASS') === 'true';
        const secret = this.configService.get('RECAPTCHA_SECRET') ||
            process.env.RECAPTCHA_SECRET;
        const minScore = Number(this.configService.get('RECAPTCHA_MIN_SCORE') ?? '0.5');
        let captchaValid = true;
        if (!bypass && secret) {
            try {
                const params = new URLSearchParams();
                params.append('secret', secret);
                params.append('response', recaptchaToken);
                if (meta?.ip) {
                    params.append('remoteip', meta.ip);
                }
                const { data } = await axios_1.default.post('https://www.google.com/recaptcha/api/siteverify', params, {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    timeout: 5000,
                });
                captchaValid =
                    data.success === true &&
                        data.action === 'forgot_password' &&
                        (data.score ?? 0) >= minScore;
            }
            catch {
                captchaValid = false;
            }
        }
        if (!captchaValid) {
            return {
                success: true,
                message: '비밀번호 재설정 안내 이메일을 확인해주세요. 가입 여부와 관계없이 동일한 메시지를 표시합니다.',
                sentTo: this.maskEmail(email),
                rateLimitInfo: {
                    remainingAttempts: 0,
                    resetAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
                    dailyLimitReached: false,
                },
                suggestedActions: undefined,
            };
        }
        const user = await this.prismaService.user.findFirst({
            where: { email },
        });
        if (user) {
            const payload = {
                userId: user.id,
                email: user.email,
                nickname: user.nickname,
            };
            const resetToken = (0, jwt_1.generatePasswordResetToken)(payload);
            let expires = null;
            try {
                const decoded = (0, jwt_1.verifyToken)(resetToken);
                if (decoded.exp) {
                    expires = new Date(decoded.exp * 1000);
                }
            }
            catch {
            }
            await this.prismaService.user.update({
                where: { id: user.id },
                data: {
                    resetToken,
                    resetTokenExpires: expires ?? new Date(Date.now() + 60 * 60 * 1000),
                },
            });
            try {
                await (0, email_1.sendPasswordResetEmail)(user.email, user.nickname, resetToken, this.configService);
            }
            catch {
            }
            void meta;
        }
        const suggestedActions = user
            ? undefined
            : {
                signup: true,
                message: '해당 이메일로 가입 내역이 없습니다. 회원가입을 진행해 주세요.',
            };
        return {
            success: true,
            message: '비밀번호 재설정 안내 이메일을 확인해주세요. 가입 여부와 관계없이 동일한 메시지를 표시합니다.',
            sentTo: this.maskEmail(email),
            rateLimitInfo: {
                remainingAttempts: 0,
                resetAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
                dailyLimitReached: false,
            },
            suggestedActions,
        };
    }
    async checkResetToken(token) {
        try {
            const decoded = (0, jwt_1.verifyToken)(token);
            if (decoded.type !== 'password-reset') {
                return {
                    success: false,
                    status: 'invalid',
                    message: '유효하지 않은 토큰입니다.',
                    canRequestNew: true,
                };
            }
            const user = await this.prismaService.user.findFirst({
                where: { id: decoded.userId, resetToken: token },
                select: { email: true, resetTokenExpires: true, updatedAt: true },
            });
            if (!user) {
                return {
                    success: false,
                    status: 'used',
                    message: '이미 사용되었거나 무효화된 토큰입니다.',
                    canRequestNew: true,
                };
            }
            if (!user.resetTokenExpires ||
                user.resetTokenExpires.getTime() <= Date.now()) {
                return {
                    success: false,
                    status: 'expired',
                    message: '만료된 토큰입니다.',
                    canRequestNew: true,
                };
            }
            return {
                success: true,
                status: 'valid',
                message: '유효한 토큰입니다.',
                tokenInfo: {
                    email: this.maskEmail(user.email),
                    expiresAt: user.resetTokenExpires.toISOString(),
                    createdAt: new Date((decoded.iat ?? Math.floor(Date.now() / 1000)) * 1000).toISOString(),
                },
                canRequestNew: false,
            };
        }
        catch {
            return {
                success: false,
                status: 'invalid',
                message: '유효하지 않은 토큰입니다.',
                canRequestNew: true,
            };
        }
    }
    async resetPassword(token, newPassword, confirmPassword) {
        if (newPassword !== confirmPassword) {
            throw new common_1.BadRequestException('비밀번호 확인이 일치하지 않습니다.');
        }
        if (!this.validatePasswordStrength(newPassword)) {
            throw new common_1.BadRequestException('비밀번호가 보안 기준을 만족하지 않습니다.');
        }
        let decoded;
        try {
            decoded = (0, jwt_1.verifyToken)(token);
        }
        catch {
            throw new common_1.UnauthorizedException('유효하지 않은 재설정 토큰입니다.');
        }
        if (!decoded || decoded.type !== 'password-reset') {
            throw new common_1.UnauthorizedException('유효하지 않은 재설정 토큰입니다.');
        }
        const user = await this.prismaService.user.findFirst({
            where: { id: decoded.userId, resetToken: token },
            select: { id: true, email: true, nickname: true },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('이미 사용되었거나 무효화된 토큰입니다.');
        }
        const userWithExpiry = await this.prismaService.user.findUnique({
            where: { id: user.id },
            select: { resetTokenExpires: true },
        });
        if (!userWithExpiry?.resetTokenExpires ||
            userWithExpiry.resetTokenExpires.getTime() <= Date.now()) {
            throw new common_1.UnauthorizedException('만료된 토큰입니다.');
        }
        const hashed = await (0, password_1.hashPassword)(newPassword);
        await this.prismaService.user.update({
            where: { id: user.id },
            data: { password: hashed, resetToken: null, resetTokenExpires: null },
        });
        const revoke = await this.prismaService.refreshToken.updateMany({
            where: { userId: user.id, isRevoked: false },
            data: { isRevoked: true },
        });
        const tokens = (0, jwt_1.generateTokenPair)({
            userId: user.id,
            email: user.email,
            nickname: user.nickname,
        });
        try {
            const rtPayload = (0, jwt_1.verifyToken)(tokens.refreshToken);
            const jti = rtPayload.jti;
            if (jti && rtPayload.exp) {
                const jtiHash = crypto_1.default.createHash('sha256').update(jti).digest('hex');
                const expiresAt = new Date(rtPayload.exp * 1000);
                await this.prismaService.refreshToken.create({
                    data: { userId: user.id, jtiHash, expiresAt },
                });
            }
        }
        catch {
        }
        return {
            message: '비밀번호가 재설정되었습니다.',
            user: { id: user.id, email: user.email, nickname: user.nickname },
            tokens,
            invalidatedSessions: revoke.count,
        };
    }
    validatePasswordStrength(pw) {
        const longEnough = pw.length >= 8;
        const hasLetter = /[A-Za-z]/.test(pw);
        const hasNumber = /\d/.test(pw);
        return longEnough && hasLetter && hasNumber;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map
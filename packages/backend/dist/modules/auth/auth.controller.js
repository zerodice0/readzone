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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const register_dto_1 = require("./dto/register.dto");
const login_dto_1 = require("./dto/login.dto");
const check_duplicate_dto_1 = require("./dto/check-duplicate.dto");
const forgot_password_dto_1 = require("./dto/forgot-password.dto");
const reset_password_dto_1 = require("./dto/reset-password.dto");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
const jwt_1 = require("../../common/utils/jwt");
const class_validator_1 = require("class-validator");
class ResendVerificationDto {
    email;
}
__decorate([
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ResendVerificationDto.prototype, "email", void 0);
class VerifyEmailDto {
    token;
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], VerifyEmailDto.prototype, "token", void 0);
let AuthController = class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    async register(registerDto) {
        return this.authService.register(registerDto);
    }
    async login(loginDto, res) {
        const result = await this.authService.login(loginDto);
        const refreshTokenMaxAge = (0, jwt_1.getTokenExpirationTimeMs)(process.env.JWT_REFRESH_EXPIRES_IN ?? '7d');
        res.cookie('refreshToken', result.tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
            maxAge: refreshTokenMaxAge,
            path: '/',
        });
        return {
            success: true,
            message: result.message,
            user: result.user,
            tokens: {
                accessToken: result.tokens.accessToken,
            },
        };
    }
    async checkDuplicate(checkDuplicateDto) {
        return this.authService.checkDuplicate(checkDuplicateDto);
    }
    async forgotPassword(body, req) {
        const userAgent = req.headers?.['user-agent'];
        const ip = req.ip;
        return this.authService.requestPasswordReset(body.email, body.recaptchaToken, {
            userAgent,
            ip,
        });
    }
    async validateResetToken(token) {
        return this.authService.checkResetToken(token);
    }
    async resetPassword(body, res) {
        const result = await this.authService.resetPassword(body.token, body.newPassword, body.confirmPassword);
        const refreshTokenMaxAge = (0, jwt_1.getTokenExpirationTimeMs)(process.env.JWT_REFRESH_EXPIRES_IN ?? '7d');
        res.cookie('refreshToken', result.tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
            maxAge: refreshTokenMaxAge,
            path: '/',
        });
        return {
            success: true,
            message: result.message,
            user: result.user,
            tokens: {
                accessToken: result.tokens.accessToken,
            },
            invalidatedSessions: result.invalidatedSessions,
        };
    }
    async verifyEmail(token) {
        return this.authService.verifyEmail((token || '').trim());
    }
    async verifyEmailPost(body) {
        const token = (body.token || '').trim();
        const result = await this.authService.verifyEmail(token);
        return {
            success: true,
            data: {
                message: result.message,
            },
        };
    }
    async sendVerification(body, req) {
        const result = await this.authService.requestEmailVerification(body.email, {
            ip: req.ip,
            userAgent: req.headers?.['user-agent'],
        });
        return {
            success: true,
            data: result,
        };
    }
    async resendVerification(body, req) {
        const result = await this.authService.requestEmailVerification(body.email, {
            ip: req.ip,
            userAgent: req.headers?.['user-agent'],
        });
        return {
            success: true,
            data: result,
        };
    }
    async refresh(req, res) {
        const refreshToken = req.cookies?.refreshToken;
        if (!refreshToken) {
            throw new Error('No refresh token provided');
        }
        const result = await this.authService.refresh(refreshToken);
        const refreshTokenMaxAge = result.refreshTokenMaxAgeMs;
        res.cookie('refreshToken', result.tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
            maxAge: refreshTokenMaxAge,
            path: '/',
        });
        return {
            success: true,
            data: {
                user: result.user,
                tokens: {
                    accessToken: result.tokens.accessToken,
                },
            },
        };
    }
    logout(res) {
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
            path: '/',
        });
        return {
            success: true,
            message: 'Logged out successfully',
        };
    }
    verifyToken(req) {
        return {
            success: true,
            data: {
                valid: true,
                user: req.user,
            },
        };
    }
    getCurrentUser(req) {
        return {
            success: true,
            data: {
                user: req.user,
            },
        };
    }
    getProfile(req) {
        return {
            success: true,
            user: req.user,
        };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('register'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_dto_1.RegisterDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Response)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('check-duplicate'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [check_duplicate_dto_1.CheckDuplicateDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "checkDuplicate", null);
__decorate([
    (0, common_1.Post)('forgot-password'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [forgot_password_dto_1.ForgotPasswordDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "forgotPassword", null);
__decorate([
    (0, common_1.Get)('reset-password'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Query)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "validateResetToken", null);
__decorate([
    (0, common_1.Post)('reset-password'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Response)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [reset_password_dto_1.ResetPasswordDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.Get)('verify-email'),
    __param(0, (0, common_1.Query)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyEmail", null);
__decorate([
    (0, common_1.Post)('verify-email'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [VerifyEmailDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyEmailPost", null);
__decorate([
    (0, common_1.Post)('send-verification'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ResendVerificationDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "sendVerification", null);
__decorate([
    (0, common_1.Post)('resend-verification'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ResendVerificationDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resendVerification", null);
__decorate([
    (0, common_1.Post)('refresh'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Response)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Response)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Post)('verify-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "verifyToken", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "getCurrentUser", null);
__decorate([
    (0, common_1.Get)('profile'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "getProfile", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map
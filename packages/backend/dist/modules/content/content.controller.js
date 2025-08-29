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
exports.ContentController = void 0;
const common_1 = require("@nestjs/common");
const content_service_1 = require("./content.service");
const get_content_dto_1 = require("./dto/get-content.dto");
let ContentController = class ContentController {
    contentService;
    constructor(contentService) {
        this.contentService = contentService;
    }
    async getTerms(query) {
        try {
            const result = await this.contentService.getContent('terms', query.version);
            return {
                success: true,
                data: result,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    async getPrivacy(query) {
        try {
            const result = await this.contentService.getContent('privacy', query.version);
            return {
                success: true,
                data: result,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    async getAllMetadata() {
        try {
            const result = await this.contentService.getAllContentMetadata();
            return {
                success: true,
                data: result,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    async getLatestVersion(type) {
        try {
            if (!['terms', 'privacy'].includes(type)) {
                return {
                    success: false,
                    error: 'Invalid content type. Must be "terms" or "privacy".',
                };
            }
            const version = await this.contentService.getLatestVersion(type);
            return {
                success: true,
                data: { version },
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    async getVersionHistory(type) {
        try {
            if (!['terms', 'privacy'].includes(type)) {
                return {
                    success: false,
                    error: 'Invalid content type. Must be "terms" or "privacy".',
                };
            }
            const history = await this.contentService.getVersionHistory(type);
            return {
                success: true,
                data: { history },
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    async validateContent(type) {
        try {
            if (!['terms', 'privacy'].includes(type)) {
                return {
                    success: false,
                    error: 'Invalid content type. Must be "terms" or "privacy".',
                };
            }
            const validation = await this.contentService.validateContent(type);
            return {
                success: true,
                data: validation,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
};
exports.ContentController = ContentController;
__decorate([
    (0, common_1.Get)('terms'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_content_dto_1.GetContentDto]),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "getTerms", null);
__decorate([
    (0, common_1.Get)('privacy'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_content_dto_1.GetContentDto]),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "getPrivacy", null);
__decorate([
    (0, common_1.Get)('metadata'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "getAllMetadata", null);
__decorate([
    (0, common_1.Get)(':type/version'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "getLatestVersion", null);
__decorate([
    (0, common_1.Get)(':type/history'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "getVersionHistory", null);
__decorate([
    (0, common_1.Get)(':type/validate'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "validateContent", null);
exports.ContentController = ContentController = __decorate([
    (0, common_1.Controller)('content'),
    __metadata("design:paramtypes", [content_service_1.ContentService])
], ContentController);
//# sourceMappingURL=content.controller.js.map
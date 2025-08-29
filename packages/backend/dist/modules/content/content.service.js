"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentService = void 0;
const common_1 = require("@nestjs/common");
const promises_1 = require("fs/promises");
const path_1 = require("path");
let ContentService = class ContentService {
    contentDir = (0, path_1.join)(process.cwd(), 'src', 'content');
    async getContent(type, version) {
        try {
            const metaFileName = type === 'terms' ? 'terms-meta.json' : 'privacy-meta.json';
            const metaPath = (0, path_1.join)(this.contentDir, metaFileName);
            const metaContent = await (0, promises_1.readFile)(metaPath, 'utf-8');
            const metadata = JSON.parse(metaContent);
            if (version &&
                version !== metadata.version &&
                !metadata.previousVersions.includes(version)) {
                throw new Error(`Version ${version} not found`);
            }
            if (!metadata.isActive) {
                throw new Error('Content is currently inactive');
            }
            const contentFileName = type === 'terms' ? 'terms.md' : 'privacy.md';
            const contentPath = (0, path_1.join)(this.contentDir, contentFileName);
            const content = await (0, promises_1.readFile)(contentPath, 'utf-8');
            return {
                metadata,
                content,
            };
        }
        catch (error) {
            throw new Error(`Failed to load ${type} content: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getAllContentMetadata() {
        try {
            const termsData = await this.getContentMetadata('terms');
            const privacyData = await this.getContentMetadata('privacy');
            return [termsData, privacyData];
        }
        catch (error) {
            throw new Error(`Failed to load content metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getContentMetadata(type) {
        const metaFileName = type === 'terms' ? 'terms-meta.json' : 'privacy-meta.json';
        const metaPath = (0, path_1.join)(this.contentDir, metaFileName);
        const metaContent = await (0, promises_1.readFile)(metaPath, 'utf-8');
        return JSON.parse(metaContent);
    }
    async getLatestVersion(type) {
        try {
            const metadata = await this.getContentMetadata(type);
            return metadata.version;
        }
        catch (error) {
            throw new Error(`Failed to get latest version for ${type}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getVersionHistory(type) {
        try {
            const metadata = await this.getContentMetadata(type);
            return metadata.changeLog;
        }
        catch (error) {
            throw new Error(`Failed to get version history for ${type}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async validateContent(type) {
        try {
            const metadata = await this.getContentMetadata(type);
            const now = new Date();
            const nextReviewDate = new Date(metadata.nextReviewDate);
            const needsReview = nextReviewDate < now;
            const isValid = metadata.isActive;
            return {
                isValid,
                needsReview,
                reviewReason: needsReview ? '정기 검토 기간 도래' : undefined,
                nextReviewDate: metadata.nextReviewDate,
                lastModified: metadata.lastModified,
            };
        }
        catch (error) {
            throw new Error(`Failed to validate ${type} content: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
};
exports.ContentService = ContentService;
exports.ContentService = ContentService = __decorate([
    (0, common_1.Injectable)()
], ContentService);
//# sourceMappingURL=content.service.js.map
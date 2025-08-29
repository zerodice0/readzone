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
exports.ContentResponse = exports.ContentMetadata = exports.GetContentByTypeDto = exports.GetContentDto = void 0;
const class_validator_1 = require("class-validator");
class GetContentDto {
    version;
}
exports.GetContentDto = GetContentDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetContentDto.prototype, "version", void 0);
class GetContentByTypeDto {
    type;
}
exports.GetContentByTypeDto = GetContentByTypeDto;
__decorate([
    (0, class_validator_1.IsIn)(['terms', 'privacy']),
    __metadata("design:type", String)
], GetContentByTypeDto.prototype, "type", void 0);
class ContentMetadata {
    title;
    type;
    version;
    effectiveDate;
    lastModified;
    language;
    previousVersions;
    changeLog;
    nextReviewDate;
    isActive;
    legalBasis;
    contentPath;
}
exports.ContentMetadata = ContentMetadata;
class ContentResponse {
    metadata;
    content;
}
exports.ContentResponse = ContentResponse;
//# sourceMappingURL=get-content.dto.js.map
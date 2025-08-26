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
exports.FeedQueryDto = exports.FeedTab = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
var FeedTab;
(function (FeedTab) {
    FeedTab["RECOMMENDED"] = "recommended";
    FeedTab["LATEST"] = "latest";
    FeedTab["FOLLOWING"] = "following";
})(FeedTab || (exports.FeedTab = FeedTab = {}));
class FeedQueryDto {
    tab = FeedTab.RECOMMENDED;
    cursor;
    limit = 20;
}
exports.FeedQueryDto = FeedQueryDto;
__decorate([
    (0, class_validator_1.IsEnum)(FeedTab),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FeedQueryDto.prototype, "tab", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FeedQueryDto.prototype, "cursor", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Transform)(({ value }) => typeof value === 'string' ? parseInt(value) : value),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(50),
    __metadata("design:type", Number)
], FeedQueryDto.prototype, "limit", void 0);
//# sourceMappingURL=feed-query.dto.js.map
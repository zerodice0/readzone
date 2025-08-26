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
exports.GetUserProfileDto = void 0;
const class_validator_1 = require("class-validator");
class GetUserProfileDto {
    userid;
}
exports.GetUserProfileDto = GetUserProfileDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3, { message: '사용자 ID는 최소 3자 이상이어야 합니다.' }),
    (0, class_validator_1.MaxLength)(30, { message: '사용자 ID는 최대 30자까지 입력할 수 있습니다.' }),
    __metadata("design:type", String)
], GetUserProfileDto.prototype, "userid", void 0);
//# sourceMappingURL=get-user-profile.dto.js.map
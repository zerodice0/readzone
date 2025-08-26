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
exports.RegisterDto = void 0;
const class_validator_1 = require("class-validator");
class RegisterDto {
    userid;
    email;
    nickname;
    password;
}
exports.RegisterDto = RegisterDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2, { message: '사용자 ID는 최소 2자 이상이어야 합니다.' }),
    (0, class_validator_1.MaxLength)(30, { message: '사용자 ID는 최대 30자까지 입력할 수 있습니다.' }),
    (0, class_validator_1.Matches)(/^[a-zA-Z0-9_-]+$/, {
        message: '사용자 ID는 영문, 숫자, 밑줄(_), 하이픈(-)만 사용할 수 있습니다.',
    }),
    __metadata("design:type", String)
], RegisterDto.prototype, "userid", void 0);
__decorate([
    (0, class_validator_1.IsEmail)({}, { message: '올바른 이메일 형식이 아닙니다.' }),
    (0, class_validator_1.MaxLength)(320, { message: '이메일은 최대 320자까지 입력할 수 있습니다.' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50, { message: '닉네임은 최대 50자까지 입력할 수 있습니다.' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "nickname", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' }),
    (0, class_validator_1.MaxLength)(255, { message: '비밀번호는 최대 255자까지 입력할 수 있습니다.' }),
    (0, class_validator_1.Matches)(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
        message: '비밀번호는 대문자, 소문자, 숫자, 특수문자를 각각 최소 1개씩 포함해야 합니다.',
    }),
    __metadata("design:type", String)
], RegisterDto.prototype, "password", void 0);
//# sourceMappingURL=register.dto.js.map
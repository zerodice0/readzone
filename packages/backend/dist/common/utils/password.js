"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
exports.validatePasswordStrength = validatePasswordStrength;
exports.validatePasswordPolicy = validatePasswordPolicy;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const SALT_ROUNDS = 12;
async function hashPassword(password) {
    try {
        const salt = await bcryptjs_1.default.genSalt(SALT_ROUNDS);
        const hashedPassword = await bcryptjs_1.default.hash(password, salt);
        return hashedPassword;
    }
    catch {
        throw new Error('Failed to hash password');
    }
}
async function verifyPassword(password, hashedPassword) {
    try {
        return await bcryptjs_1.default.compare(password, hashedPassword);
    }
    catch {
        throw new Error('Failed to verify password');
    }
}
function validatePasswordStrength(password) {
    const errors = [];
    const suggestions = [];
    let score = 0;
    if (password.length < 8) {
        errors.push('비밀번호는 최소 8자 이상이어야 합니다');
        suggestions.push('더 긴 비밀번호를 사용하세요');
    }
    else {
        score += 1;
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('대문자를 포함해야 합니다');
        suggestions.push('대문자(A-Z)를 추가하세요');
    }
    else {
        score += 1;
    }
    if (!/[a-z]/.test(password)) {
        errors.push('소문자를 포함해야 합니다');
        suggestions.push('소문자(a-z)를 추가하세요');
    }
    else {
        score += 1;
    }
    if (!/\d/.test(password)) {
        errors.push('숫자를 포함해야 합니다');
        suggestions.push('숫자(0-9)를 추가하세요');
    }
    else {
        score += 1;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('특수문자를 포함해야 합니다');
        suggestions.push('특수문자(!@#$%^&* 등)를 추가하세요');
    }
    else {
        score += 1;
    }
    if (/(.)\1{2,}/.test(password)) {
        errors.push('동일한 문자가 3회 이상 연속되면 안됩니다');
        suggestions.push('연속된 동일 문자를 피하세요');
        score = Math.max(0, score - 1);
    }
    const commonPatterns = [
        /123456/,
        /password/i,
        /qwerty/i,
        /abc123/i,
        /admin/i,
        /letmein/i,
    ];
    for (const pattern of commonPatterns) {
        if (pattern.test(password)) {
            errors.push('일반적인 패턴이나 단어는 사용할 수 없습니다');
            suggestions.push('예측하기 어려운 조합을 사용하세요');
            score = Math.max(0, score - 1);
            break;
        }
    }
    return {
        isValid: errors.length === 0 && score >= 4,
        score: Math.min(score, 4),
        errors,
        suggestions,
    };
}
function validatePasswordPolicy(password) {
    if (password.length < 6) {
        return {
            isValid: false,
            message: '비밀번호는 최소 6자 이상이어야 합니다',
        };
    }
    if (password.length > 128) {
        return {
            isValid: false,
            message: '비밀번호는 128자 이하여야 합니다',
        };
    }
    const hasLetterOrNumber = /[a-zA-Z0-9]/.test(password);
    if (!hasLetterOrNumber) {
        return {
            isValid: false,
            message: '비밀번호는 영문자 또는 숫자를 포함해야 합니다',
        };
    }
    return { isValid: true };
}
//# sourceMappingURL=password.js.map
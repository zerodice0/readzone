"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAccessToken = generateAccessToken;
exports.generateRefreshToken = generateRefreshToken;
exports.generateEmailVerificationToken = generateEmailVerificationToken;
exports.generatePasswordResetToken = generatePasswordResetToken;
exports.verifyToken = verifyToken;
exports.extractUserIdFromToken = extractUserIdFromToken;
exports.generateTokenPair = generateTokenPair;
exports.getTokenExpirationTime = getTokenExpirationTime;
exports.generateSecureToken = generateSecureToken;
exports.validateTokenType = validateTokenType;
exports.getTimeUntilExpiration = getTimeUntilExpiration;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const JWT_SECRET = process.env.JWT_SECRET ?? 'default-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN ?? '7d';
const EMAIL_TOKEN_EXPIRES_IN = process.env.EMAIL_TOKEN_EXPIRES_IN ?? '24h';
function generateAccessToken(payload) {
    const payloadData = { ...payload, type: 'access' };
    const options = {
        expiresIn: JWT_EXPIRES_IN,
        issuer: 'readzone-api',
        audience: 'readzone-client',
        jwtid: crypto_1.default.randomUUID(),
    };
    return jsonwebtoken_1.default.sign(payloadData, JWT_SECRET, options);
}
function generateRefreshToken(payload) {
    const payloadData = { ...payload, type: 'refresh' };
    const options = {
        expiresIn: JWT_REFRESH_EXPIRES_IN,
        issuer: 'readzone-api',
        audience: 'readzone-client',
        jwtid: crypto_1.default.randomUUID(),
    };
    return jsonwebtoken_1.default.sign(payloadData, JWT_SECRET, options);
}
function generateEmailVerificationToken(payload) {
    const payloadData = { ...payload, type: 'email-verification' };
    const options = {
        expiresIn: EMAIL_TOKEN_EXPIRES_IN,
        issuer: 'readzone-api',
        audience: 'readzone-client',
    };
    return jsonwebtoken_1.default.sign(payloadData, JWT_SECRET, options);
}
function generatePasswordResetToken(payload) {
    const payloadData = { ...payload, type: 'password-reset' };
    const options = {
        expiresIn: '1h',
        issuer: 'readzone-api',
        audience: 'readzone-client',
    };
    return jsonwebtoken_1.default.sign(payloadData, JWT_SECRET, options);
}
function verifyToken(token) {
    try {
        const options = {
            issuer: 'readzone-api',
            audience: 'readzone-client',
        };
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET, options);
        return decoded;
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            throw new Error('Invalid token');
        }
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            throw new Error('Token expired');
        }
        if (error instanceof jsonwebtoken_1.default.NotBeforeError) {
            throw new Error('Token not active');
        }
        throw new Error('Token verification failed');
    }
}
function extractUserIdFromToken(token) {
    try {
        const payload = verifyToken(token);
        return payload.userId;
    }
    catch {
        return null;
    }
}
function generateTokenPair(payload) {
    return {
        accessToken: generateAccessToken(payload),
        refreshToken: generateRefreshToken(payload),
        expiresIn: JWT_EXPIRES_IN,
        tokenType: 'Bearer',
    };
}
function getTokenExpirationTime(expiresIn) {
    const unit = expiresIn.slice(-1);
    const value = parseInt(expiresIn.slice(0, -1));
    switch (unit) {
        case 's':
            return value;
        case 'm':
            return value * 60;
        case 'h':
            return value * 60 * 60;
        case 'd':
            return value * 60 * 60 * 24;
        default:
            return 900;
    }
}
function generateSecureToken(length = 32) {
    return crypto_1.default.randomBytes(length).toString('hex');
}
function validateTokenType(token, expectedType) {
    try {
        const payload = verifyToken(token);
        return payload.type === expectedType;
    }
    catch {
        return false;
    }
}
function getTimeUntilExpiration(token) {
    try {
        const payload = verifyToken(token);
        if (!payload.exp) {
            return null;
        }
        const now = Math.floor(Date.now() / 1000);
        return Math.max(0, payload.exp - now);
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=jwt.js.map
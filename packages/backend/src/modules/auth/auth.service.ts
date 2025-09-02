import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CheckDuplicateDto } from './dto/check-duplicate.dto';
import { hashPassword, verifyPassword } from '../../common/utils/password';
import {
  generateTokenPair,
  generateEmailVerificationToken,
  generatePasswordResetToken,
  verifyToken,
} from '../../common/utils/jwt';
import {
  sendEmailVerification,
  sendPasswordResetEmail,
} from '../../common/utils/email';
import crypto from 'crypto';
import axios from 'axios';

@Injectable()
export class AuthService {
  // 간단한 인메모리 쿨다운 (이메일별 60초)
  private verificationCooldown = new Map<string, number>();
  private ipWindow: Map<string, number[]> = new Map();

  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    // Check for duplicates
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
        throw new ConflictException('이미 사용 중인 사용자 ID입니다.');
      }
      if (existingUser.email === registerDto.email) {
        throw new ConflictException('이미 사용 중인 이메일입니다.');
      }
      if (existingUser.nickname === registerDto.nickname) {
        throw new ConflictException('이미 사용 중인 닉네임입니다.');
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(registerDto.password);

    // Generate verification token (temporary payload for email verification)
    const tempPayload = {
      userId: 'temp',
      email: registerDto.email,
      nickname: registerDto.nickname,
    };
    const verificationToken = generateEmailVerificationToken(tempPayload);

    // Create user
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

    // Create email account
    await this.prismaService.account.create({
      data: {
        userId: user.id,
        type: 'email',
        provider: 'email',
        providerAccountId: user.id,
        email: registerDto.email,
      },
    });

    // Send verification email
    await sendEmailVerification(
      registerDto.email,
      registerDto.nickname,
      verificationToken,
      this.configService,
    );

    return {
      success: true,
      message:
        '회원가입이 완료되었습니다. 이메일을 확인하여 인증을 완료해주세요.',
      user,
    };
  }

  async login(loginDto: LoginDto) {
    // Find user by userid
    const user = await this.prismaService.user.findFirst({
      where: { userid: loginDto.userid },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException(
        '아이디 또는 비밀번호가 올바르지 않습니다.',
      );
    }

    // Verify password
    const isPasswordValid = await verifyPassword(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException(
        '아이디 또는 비밀번호가 올바르지 않습니다.',
      );
    }

    // Generate tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      nickname: user.nickname,
    };
    const tokens = generateTokenPair(tokenPayload);

    // Refresh Token jti를 DB에 저장 (해시로 보관)
    try {
      const rtPayload = verifyToken(tokens.refreshToken);
      const jti = rtPayload.jti;
      if (jti && rtPayload.exp) {
        const jtiHash = crypto.createHash('sha256').update(jti).digest('hex');
        const expiresAt = new Date(rtPayload.exp * 1000);

        await this.prismaService.refreshToken.create({
          data: {
            userId: user.id,
            jtiHash,
            expiresAt,
          },
        });
      }
    } catch {
      // 저장 실패는 로그인 자체를 막지 않음 (로그만 가능)
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

  async checkDuplicate(checkDuplicateDto: CheckDuplicateDto) {
    // 단일 필드만 처리하도록 변경
    let field: string;
    let value: string;

    if (checkDuplicateDto.userid) {
      field = 'userid';
      value = checkDuplicateDto.userid;
    } else if (checkDuplicateDto.email) {
      field = 'email';
      value = checkDuplicateDto.email;
    } else if (checkDuplicateDto.nickname) {
      field = 'nickname';
      value = checkDuplicateDto.nickname;
    } else {
      throw new BadRequestException('확인할 필드를 하나 제공해주세요.');
    }

    // 해당 필드로 사용자 조회
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

  async verifyEmail(token: string) {
    // 1) 토큰으로 직접 매칭
    const user = await this.prismaService.user.findFirst({
      where: { verificationToken: token },
      select: { id: true, email: true, nickname: true, isVerified: true },
    });

    if (user) {
      // 이미 인증된 상태인 경우에도 성공 응답(idempotent)
      if (user.isVerified) {
        return {
          success: true,
          message: '이미 인증된 계정입니다.',
        } as const;
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
      } as const;
    }

    // 2) 매칭된 토큰이 없는 경우: 토큰 복호화 후, 이미 인증된 사용자라면 성공 처리
    try {
      const decoded = verifyToken(token);
      if (decoded.type !== 'email-verification') {
        throw new Error('Invalid type');
      }

      const userByEmail = await this.prismaService.user.findFirst({
        where: { email: decoded.email ?? undefined },
        select: { id: true, isVerified: true },
      });

      if (userByEmail) {
        if (userByEmail.isVerified) {
          return {
            success: true,
            message: '이미 인증된 계정입니다.',
          } as const;
        }

        // 토큰은 유효하나 저장된 verificationToken이 갱신된 경우에도 인증 허용
        await this.prismaService.user.update({
          where: { id: userByEmail.id },
          data: { isVerified: true, verificationToken: null },
        });

        return {
          success: true,
          message: '이메일 인증이 완료되었습니다.',
        } as const;
      }
    } catch {
      // ignore and fallthrough to error
    }

    throw new BadRequestException('유효하지 않은 인증 토큰입니다.');
  }

  /**
   * Send or resend email verification link
   */
  async requestEmailVerification(
    email: string,
    meta?: { ip?: string; userAgent?: string },
  ) {
    const key = email.toLowerCase();
    const now = Date.now();
    const last = this.verificationCooldown.get(key) || 0;
    const COOLDOWN_MS = 60 * 1000;

    if (now - last < COOLDOWN_MS) {
      const expiresIn =
        this.configService.get<string>('EMAIL_TOKEN_EXPIRES_IN') || '24h';

      return {
        message: '요청이 너무 잦습니다. 잠시 후 다시 시도해주세요.',
        email: this.maskEmail(email),
        expiresIn,
      } as const;
    }

    // IP 기반 간단 레이트 리밋(분당 최대 5회)
    const ip = meta?.ip || 'unknown';
    const NOW_SEC = Math.floor(now / 1000);
    const WINDOW_SEC = 60;
    const MAX_PER_WINDOW = 5;
    const arr = this.ipWindow.get(ip) || [];
    // 최근 60초 이내만 보존
    const pruned = arr.filter((ts) => NOW_SEC - ts < WINDOW_SEC);
    pruned.push(NOW_SEC);
    this.ipWindow.set(ip, pruned);
    if (pruned.length > MAX_PER_WINDOW) {
      const expiresIn =
        this.configService.get<string>('EMAIL_TOKEN_EXPIRES_IN') || '24h';
      return {
        message: '요청이 너무 잦습니다. 잠시 후 다시 시도해주세요.',
        email: this.maskEmail(email),
        expiresIn,
      } as const;
    }

    // Normalize expiresIn from env (default 24h)
    const expiresIn =
      this.configService.get<string>('EMAIL_TOKEN_EXPIRES_IN') || '24h';

    // Find user by email
    const user = await this.prismaService.user.findFirst({
      where: { email },
      select: { id: true, email: true, nickname: true, isVerified: true },
    });

    // If user not found, avoid user enumeration: respond success generically
    if (!user) {
      return {
        message:
          '인증 이메일이 발송되었습니다. 메일함을 확인해주세요. (가입한 이메일이 아니라면 무시하셔도 됩니다)',
        email,
        expiresIn,
      } as const;
    }

    // Already verified: do not send again
    if (user.isVerified) {
      return {
        message: '이미 인증된 계정입니다.',
        email: this.maskEmail(user.email!),
        expiresIn,
      } as const;
    }

    // Generate new token and store
    const tokenPayload = {
      userId: user.id,
      email: user.email!,
      nickname: user.nickname,
    } as const;
    const newToken = generateEmailVerificationToken(tokenPayload);

    await this.prismaService.user.update({
      where: { id: user.id },
      data: { verificationToken: newToken },
    });

    // Send email
    await sendEmailVerification(
      user.email!,
      user.nickname,
      newToken,
      this.configService,
    );

    // 쿨다운 시작
    this.verificationCooldown.set(key, now);

    return {
      message: '인증 이메일이 발송되었습니다. 메일함을 확인해주세요.',
      email: this.maskEmail(user.email!),
      expiresIn,
    } as const;
  }

  async refresh(refreshToken: string) {
    try {
      // RefreshToken 검증
      const decoded = verifyToken(refreshToken);

      if (decoded.type !== 'refresh') {
        throw new UnauthorizedException('Invalid refresh token type');
      }

      // 절대 만료 유지: 기존 RefreshToken의 남은 수명 계산
      if (!decoded.exp) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      const now = Math.floor(Date.now() / 1000);
      const remainingSeconds = Math.max(0, decoded.exp - now);
      if (remainingSeconds <= 0) {
        throw new UnauthorizedException('Refresh token expired');
      }

      // 사용자 조회
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
        throw new UnauthorizedException('User not found');
      }

      // DB에 저장된 jti 확인 및 재사용 방지
      if (!decoded.jti) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      const incomingJtiHash = crypto
        .createHash('sha256')
        .update(decoded.jti)
        .digest('hex');

      const rtRecord = await this.prismaService.refreshToken.findUnique({
        where: { jtiHash: incomingJtiHash },
      });

      if (!rtRecord || rtRecord.isRevoked) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      if (rtRecord.expiresAt.getTime() <= Date.now()) {
        throw new UnauthorizedException('Refresh token expired');
      }

      // 새 토큰 쌍 생성 (Token Rotation)
      // Refresh 토큰은 남은 수명으로 재발급하여 절대 만료 유지
      const tokens = generateTokenPair(
        {
          userId: user.id,
          email: user.email,
          nickname: user.nickname,
        },
        remainingSeconds,
      );

      // 새 RefreshToken의 jti를 저장하고, 이전 jti는 폐기 (원자적 수행)
      const newRtPayload = verifyToken(tokens.refreshToken);
      if (!newRtPayload.jti) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      const newJtiHash = crypto
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
            // 절대 만료 유지: 기존 레코드의 expiresAt 사용
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
        // 쿠키 maxAge로 사용할 남은 수명(ms)
        refreshTokenMaxAgeMs: remainingSeconds * 1000,
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  // 이메일 마스킹 유틸
  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!domain) return email;
    const visible = local.slice(0, 1);
    const masked = '*'.repeat(Math.max(1, local.length - 1));
    return `${visible}${masked}@${domain}`;
  }

  /**
   * 비밀번호 재설정 요청 처리
   */
  async requestPasswordReset(
    email: string,
    recaptchaToken: string,
    meta?: { userAgent?: string; ip?: string },
  ) {
    // reCAPTCHA 검증 (v3)
    const bypass =
      this.configService.get<string>('RECAPTCHA_BYPASS') === 'true';
    const secret =
      this.configService.get<string>('RECAPTCHA_SECRET') ||
      process.env.RECAPTCHA_SECRET;
    const minScore = Number(
      this.configService.get<string>('RECAPTCHA_MIN_SCORE') ?? '0.5',
    );

    let captchaValid = true;
    if (!bypass && secret) {
      try {
        const params = new URLSearchParams();
        params.append('secret', secret);
        params.append('response', recaptchaToken);
        if (meta?.ip) {
          params.append('remoteip', meta.ip);
        }

        const { data } = await axios.post<{
          success: boolean;
          score?: number;
          action?: string;
          challenge_ts?: string;
          hostname?: string;
          'error-codes'?: string[];
        }>('https://www.google.com/recaptcha/api/siteverify', params, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          timeout: 5000,
        });

        captchaValid =
          data.success === true &&
          data.action === 'forgot_password' &&
          (data.score ?? 0) >= minScore;
      } catch {
        // 네트워크/검증 오류는 보안상 실패로 간주
        captchaValid = false;
      }
    }

    // 보안상 캡차 실패여도 동일 응답을 반환(실제 발송/저장은 생략)
    if (!captchaValid) {
      return {
        success: true,
        message:
          '비밀번호 재설정 안내 이메일을 확인해주세요. 가입 여부와 관계없이 동일한 메시지를 표시합니다.',
        sentTo: this.maskEmail(email),
      } as const;
    }
    const user = await this.prismaService.user.findFirst({
      where: { email },
    });

    // 보안상 존재 여부를 노출하지 않음. 계정이 있으면 토큰 발급 및 메일 발송
    if (user) {
      const payload = {
        userId: user.id,
        email: user.email,
        nickname: user.nickname,
      } as const;

      const resetToken = generatePasswordResetToken(payload);
      // exp에서 만료 시각 계산
      let expires: Date | null = null;
      try {
        const decoded = verifyToken(resetToken);
        if (decoded.exp) {
          expires = new Date(decoded.exp * 1000);
        }
      } catch {
        // ignore
      }

      await this.prismaService.user.update({
        where: { id: user.id },
        data: {
          resetToken,
          resetTokenExpires: expires ?? new Date(Date.now() + 60 * 60 * 1000), // fallback 1h
        },
      });

      // 메일 발송 (실패해도 성공 응답 유지)
      try {
        await sendPasswordResetEmail(
          user.email!,
          user.nickname,
          resetToken,
          this.configService,
        );
      } catch {
        // ignore send failure in response
      }

      // 선택: 리프레시 토큰 전체 무효화는 재설정 시점에 수행
      void meta; // 현재는 미사용
    }

    // 미가입자 안내 등 부가 정보는 응답에 포함하지 않음(정보 노출 최소화)

    return {
      success: true,
      message:
        '비밀번호 재설정 안내 이메일을 확인해주세요. 가입 여부와 관계없이 동일한 메시지를 표시합니다.',
      sentTo: this.maskEmail(email),
    } as const;
  }

  /**
   * 재설정 토큰 검증
   */
  async checkResetToken(token: string) {
    try {
      const decoded = verifyToken(token);
      if (decoded.type !== 'password-reset') {
        return {
          success: false,
          status: 'invalid',
          message: '유효하지 않은 토큰입니다.',
          canRequestNew: true,
        } as const;
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
        } as const;
      }
      if (
        !user.resetTokenExpires ||
        user.resetTokenExpires.getTime() <= Date.now()
      ) {
        return {
          success: false,
          status: 'expired',
          message: '만료된 토큰입니다.',
          canRequestNew: true,
        } as const;
      }

      return {
        success: true,
        status: 'valid',
        message: '유효한 토큰입니다.',
        tokenInfo: {
          email: this.maskEmail(user.email!),
          expiresAt: user.resetTokenExpires.toISOString(),
          createdAt: new Date(
            (decoded.iat ?? Math.floor(Date.now() / 1000)) * 1000,
          ).toISOString(),
        },
        canRequestNew: false,
      } as const;
    } catch {
      return {
        success: false,
        status: 'invalid',
        message: '유효하지 않은 토큰입니다.',
        canRequestNew: true,
      } as const;
    }
  }

  /**
   * 비밀번호 재설정 처리 + 세션 무효화 + 자동 로그인용 토큰 발급
   */
  async resetPassword(
    token: string,
    newPassword: string,
    confirmPassword: string,
  ) {
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('비밀번호 확인이 일치하지 않습니다.');
    }
    if (!this.validatePasswordStrength(newPassword)) {
      throw new BadRequestException(
        '비밀번호가 보안 기준을 만족하지 않습니다.',
      );
    }

    // 토큰 검증 및 사용자 조회
    let decoded: ReturnType<typeof verifyToken> | undefined;
    try {
      decoded = verifyToken(token);
    } catch {
      throw new UnauthorizedException('유효하지 않은 재설정 토큰입니다.');
    }
    if (!decoded || decoded.type !== 'password-reset') {
      throw new UnauthorizedException('유효하지 않은 재설정 토큰입니다.');
    }

    const user = await this.prismaService.user.findFirst({
      where: { id: decoded.userId, resetToken: token },
      select: { id: true, email: true, nickname: true },
    });
    if (!user) {
      throw new UnauthorizedException('이미 사용되었거나 무효화된 토큰입니다.');
    }

    // 토큰 만료 확인
    const userWithExpiry = await this.prismaService.user.findUnique({
      where: { id: user.id },
      select: { resetTokenExpires: true },
    });
    if (
      !userWithExpiry?.resetTokenExpires ||
      userWithExpiry.resetTokenExpires.getTime() <= Date.now()
    ) {
      throw new UnauthorizedException('만료된 토큰입니다.');
    }

    // 비밀번호 해시 업데이트 및 토큰 무효화
    const hashed = await hashPassword(newPassword);
    await this.prismaService.user.update({
      where: { id: user.id },
      data: { password: hashed, resetToken: null, resetTokenExpires: null },
    });

    // 기존 세션(리프레시 토큰) 전부 무효화
    const revoke = await this.prismaService.refreshToken.updateMany({
      where: { userId: user.id, isRevoked: false },
      data: { isRevoked: true },
    });

    // 자동 로그인용 새 토큰 발급
    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email,
      nickname: user.nickname,
    });

    // 새 RT의 jti 저장
    try {
      const rtPayload = verifyToken(tokens.refreshToken);
      const jti = rtPayload.jti;
      if (jti && rtPayload.exp) {
        const jtiHash = crypto.createHash('sha256').update(jti).digest('hex');
        const expiresAt = new Date(rtPayload.exp * 1000);
        await this.prismaService.refreshToken.create({
          data: { userId: user.id, jtiHash, expiresAt },
        });
      }
    } catch {
      // ignore
    }

    return {
      message: '비밀번호가 재설정되었습니다.',
      user: { id: user.id, email: user.email, nickname: user.nickname },
      tokens,
      invalidatedSessions: revoke.count,
    } as const;
  }

  private validatePasswordStrength(pw: string): boolean {
    // 간단한 기준: 8자 이상, 숫자/문자 포함
    const longEnough = pw.length >= 8;
    const hasLetter = /[A-Za-z]/.test(pw);
    const hasNumber = /\d/.test(pw);
    return longEnough && hasLetter && hasNumber;
  }
}

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
} from '../../common/utils/jwt';
import { sendEmailVerification } from '../../common/utils/email';

@Injectable()
export class AuthService {
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
    );

    return {
      success: true,
      message:
        '회원가입이 완료되었습니다. 이메일을 확인하여 인증을 완료해주세요.',
      user,
    };
  }

  async login(loginDto: LoginDto) {
    // Find user by email
    const user = await this.prismaService.user.findFirst({
      where: { email: loginDto.email },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 올바르지 않습니다.',
      );
    }

    // Verify password
    const isPasswordValid = await verifyPassword(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 올바르지 않습니다.',
      );
    }

    // Generate tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      nickname: user.nickname,
    };
    const tokens = generateTokenPair(tokenPayload);

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
    const conditions: Array<{
      userid?: string;
      email?: string;
      nickname?: string;
    }> = [];

    if (checkDuplicateDto.userid) {
      conditions.push({ userid: checkDuplicateDto.userid });
    }
    if (checkDuplicateDto.email) {
      conditions.push({ email: checkDuplicateDto.email });
    }
    if (checkDuplicateDto.nickname) {
      conditions.push({ nickname: checkDuplicateDto.nickname });
    }

    if (conditions.length === 0) {
      throw new BadRequestException('확인할 필드를 하나 이상 제공해주세요.');
    }

    const existingUser = await this.prismaService.user.findFirst({
      where: { OR: conditions },
      select: { userid: true, email: true, nickname: true },
    });

    const result: { [key: string]: boolean } = {};

    if (checkDuplicateDto.userid) {
      result.userid = existingUser?.userid === checkDuplicateDto.userid;
    }
    if (checkDuplicateDto.email) {
      result.email = existingUser?.email === checkDuplicateDto.email;
    }
    if (checkDuplicateDto.nickname) {
      result.nickname = existingUser?.nickname === checkDuplicateDto.nickname;
    }

    return {
      success: true,
      data: result,
    };
  }

  async verifyEmail(token: string) {
    const user = await this.prismaService.user.findFirst({
      where: { verificationToken: token },
    });

    if (!user) {
      throw new BadRequestException('유효하지 않은 인증 토큰입니다.');
    }

    if (user.isVerified) {
      throw new BadRequestException('이미 인증된 계정입니다.');
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
    };
  }
}

import { IsEnum, IsString } from 'class-validator';

enum SocialProvider {
  GOOGLE = 'GOOGLE',
  KAKAO = 'KAKAO',
  NAVER = 'NAVER',
}

export class ConnectAccountDto {
  @IsEnum(SocialProvider)
  provider: SocialProvider;

  @IsString()
  authCode: string;
}

export class ConnectAccountResponseDto {
  success: boolean;
  connectedAccount: {
    provider: string;
    email: string;
    connectedAt: string;
  };
}

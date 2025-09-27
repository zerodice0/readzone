import { IsEnum } from 'class-validator';

enum SocialProvider {
  GOOGLE = 'GOOGLE',
  KAKAO = 'KAKAO',
  NAVER = 'NAVER',
}

export class DisconnectAccountDto {
  @IsEnum(SocialProvider)
  provider: SocialProvider;
}

export class DisconnectAccountResponseDto {
  success: boolean;
  remainingMethods: string[];
  warning?: string;
}

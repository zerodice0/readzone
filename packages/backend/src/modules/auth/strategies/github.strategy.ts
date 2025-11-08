import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-github2';
import { OAuthService } from '../services/oauth.service';

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    private readonly configService: ConfigService,
    private readonly oauthService: OAuthService
  ) {
    super({
      clientID: configService.get<string>('GITHUB_CLIENT_ID'),
      clientSecret: configService.get<string>('GITHUB_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GITHUB_CALLBACK_URL'),
      scope: ['user:email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile
  ): Promise<Profile> {
    const { emails, displayName, username, photos } = profile;

    if (!emails || emails.length === 0 || !emails[0].value) {
      throw new Error('No email found in GitHub profile');
    }

    const oauthProfile = {
      provider: 'GITHUB' as const,
      providerId: profile.id,
      email: emails[0].value,
      name: displayName || username || emails[0].value,
      profileImage: photos?.[0]?.value,
    };

    const user = await this.oauthService.handleOAuthLogin(oauthProfile);
    return user;
  }
}

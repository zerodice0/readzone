import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-github2';
import type { User } from '@prisma/client';
import { OAuthService } from '../services/oauth.service';

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    configService: ConfigService,
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
    _accessToken: string,
    _refreshToken: string,
    profile: Profile
  ): Promise<User> {
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
    if (!user) {
      throw new Error('Failed to create or find user');
    }
    return user;
  }
}

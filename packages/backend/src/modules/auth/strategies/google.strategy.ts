import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { OAuthService } from '../services/oauth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    configService: ConfigService,
    private readonly oauthService: OAuthService
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback
  ): Promise<void> {
    const { emails, displayName, photos } = profile;

    if (!emails || emails.length === 0 || !emails[0].value) {
      done(new Error('No email found in Google profile'), false);
      return;
    }

    const oauthProfile = {
      provider: 'GOOGLE' as const,
      providerId: profile.id,
      email: emails[0].value,
      name: displayName || emails[0].value,
      profileImage: photos?.[0]?.value,
    };

    try {
      const user = await this.oauthService.handleOAuthLogin(oauthProfile);
      if (!user) {
        done(new Error('Failed to create or find user'), false);
        return;
      }
      // Type assertion: Passport expects Express.User but we use Prisma User
      // This is safe because we control the user object structure
      done(null, user as unknown as Express.User);
    } catch (error) {
      done(error as Error, false);
    }
  }
}

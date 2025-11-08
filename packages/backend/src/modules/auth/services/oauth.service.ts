import { Injectable } from '@nestjs/common';
import { OAuthProvider } from '@prisma/client';
import { PrismaService } from '../../../common/utils/prisma';

export interface OAuthProfile {
  provider: OAuthProvider;
  providerId: string;
  email: string;
  name: string;
  profileImage?: string;
}

@Injectable()
export class OAuthService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Handles OAuth login flow
   * - If user exists by email: creates/updates OAuthConnection
   * - If user is new: creates User + OAuthConnection
   * Returns the authenticated user
   */
  async handleOAuthLogin(profile: OAuthProfile) {
    // T073: Check if user exists by email
    let user = await this.prisma.user.findUnique({
      where: { email: profile.email.toLowerCase() },
      include: { oauthConnections: true },
    });

    if (user) {
      // T073: Existing user - link/update OAuth connection
      await this.createOrUpdateOAuthConnection(
        user.id,
        profile.provider,
        profile.providerId,
        profile.email,
        profile.name,
        profile.profileImage
      );

      // Reload user with updated connections
      user = await this.prisma.user.findUnique({
        where: { id: user.id },
        include: { oauthConnections: true },
      });
    } else {
      // T074: New user - create User + OAuthConnection
      user = await this.prisma.user.create({
        data: {
          email: profile.email.toLowerCase(),
          name: profile.name,
          profileImage: profile.profileImage,
          emailVerified: true, // OAuth users are auto-verified
          oauthConnections: {
            create: {
              provider: profile.provider,
              providerId: profile.providerId,
              email: profile.email,
              profile: {
                name: profile.name,
                profileImage: profile.profileImage,
              },
            },
          },
        },
        include: { oauthConnections: true },
      });
    }

    return user;
  }

  /**
   * Creates or updates OAuth connection for a user
   * - If connection exists for this provider: updates provider ID
   * - If connection doesn't exist: creates new connection
   */
  private async createOrUpdateOAuthConnection(
    userId: string,
    provider: OAuthProvider,
    providerId: string,
    email: string,
    name: string,
    profileImage?: string
  ) {
    const existing = await this.prisma.oAuthConnection.findFirst({
      where: { userId, provider },
    });

    if (existing) {
      // Update provider ID if changed
      return this.prisma.oAuthConnection.update({
        where: { id: existing.id },
        data: {
          providerId,
          email,
          profile: {
            name,
            profileImage,
          },
          updatedAt: new Date(),
        },
      });
    }
    // Create new connection
    return this.prisma.oAuthConnection.create({
      data: {
        userId,
        provider,
        providerId,
        email,
        profile: {
          name,
          profileImage,
        },
      },
    });
  }
}

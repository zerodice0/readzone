import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GetUserProfileDto } from './dto/get-user-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async getUserProfile(getUserProfileDto: GetUserProfileDto) {
    const user = await this.prismaService.user.findUnique({
      where: { userid: getUserProfileDto.userid },
      select: {
        id: true,
        userid: true,
        nickname: true,
        bio: true,
        profileImage: true,
        isVerified: true,
        createdAt: true,
        _count: {
          select: {
            reviews: true,
            followers: true,
            following: true,
            likes: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    return {
      success: true,
      data: {
        user: {
          ...user,
          createdAt: user.createdAt.toISOString(),
        },
      },
    };
  }
}

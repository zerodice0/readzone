import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  UseGuards,
  Req,
  Query,
  Body,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { GetUserProfileDto } from './dto/get-user-profile.dto';
import { OptionalAuthGuard } from '../auth/guards/optional-auth.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserProfileResponse } from './dto/user-profile.dto';
import {
  UserReviewsQueryDto,
  UserLikesQueryDto,
  UserBooksQueryDto,
  UserFollowsQueryDto,
  UserReviewsResponse,
  UserLikesResponse,
  UserBooksResponse,
  UserFollowsResponse,
} from './dto/user-content.dto';
import { FollowUserDto, FollowUserResponse } from './dto/follow.dto';
import {
  UpdateProfileDto,
  UpdateProfileResponse,
  UseridCheckResponse,
  AvatarCropDto,
  UpdateAvatarResponse,
} from './dto/update-profile.dto';
import { AvatarService } from './avatar.service';

interface OptionalAuthRequest extends Request {
  user?: {
    id: string;
    userid: string;
    email: string;
    nickname: string;
  };
}

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly avatarService: AvatarService,
  ) {}

  @Get(':userid')
  @UseGuards(OptionalAuthGuard)
  async getUserProfile(
    @Param() getUserProfileDto: GetUserProfileDto,
    @Req() req: OptionalAuthRequest,
  ): Promise<{ success: boolean; data: UserProfileResponse }> {
    return this.usersService.getUserProfile(getUserProfileDto, req.user?.id);
  }

  @Get(':userid/reviews')
  @UseGuards(OptionalAuthGuard)
  async getUserReviews(
    @Param('userid') userid: string,
    @Query() query: UserReviewsQueryDto,
    @Req() req: OptionalAuthRequest,
  ): Promise<{ success: boolean; data: UserReviewsResponse }> {
    return this.usersService.getUserReviews(userid, query, req.user?.id);
  }

  @Get(':userid/likes')
  @UseGuards(OptionalAuthGuard)
  async getUserLikes(
    @Param('userid') userid: string,
    @Query() query: UserLikesQueryDto,
    @Req() req: OptionalAuthRequest,
  ): Promise<{ success: boolean; data: UserLikesResponse }> {
    return this.usersService.getUserLikes(userid, query, req.user?.id);
  }

  @Get(':userid/books')
  @UseGuards(OptionalAuthGuard)
  async getUserBooks(
    @Param('userid') userid: string,
    @Query() query: UserBooksQueryDto,
    @Req() req: OptionalAuthRequest,
  ): Promise<{ success: boolean; data: UserBooksResponse }> {
    return this.usersService.getUserBooks(userid, query, req.user?.id);
  }

  @Get(':userid/follows')
  @UseGuards(OptionalAuthGuard)
  async getUserFollows(
    @Param('userid') userid: string,
    @Query() query: UserFollowsQueryDto,
    @Req() req: OptionalAuthRequest,
  ): Promise<{ success: boolean; data: UserFollowsResponse }> {
    return this.usersService.getUserFollows(userid, query, req.user?.id);
  }

  @Post(':userid/follow')
  @UseGuards(JwtAuthGuard)
  async toggleFollow(
    @Param('userid') userid: string,
    @Body() body: FollowUserDto,
    @Request() req: { user: { id: string } },
  ): Promise<FollowUserResponse> {
    // userid를 실제 user ID로 변환
    const targetUser = await this.usersService.getUserProfile(
      { userid },
      req.user.id,
    );
    const targetUserId = targetUser.data.user.id;

    return this.usersService.toggleFollow(
      req.user.id,
      targetUserId,
      body.action,
    );
  }

  @Put(':userid/profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Param('userid') userid: string,
    @Body() updateData: UpdateProfileDto,
    @Request() req: { user: { id: string } },
  ): Promise<UpdateProfileResponse> {
    // userid를 실제 user ID로 변환
    const targetUser = await this.usersService.getUserProfile(
      { userid },
      req.user.id,
    );
    const targetUserId = targetUser.data.user.id;

    // 본인만 수정 가능
    if (req.user.id !== targetUserId) {
      throw new ForbiddenException('본인의 프로필만 수정할 수 있습니다.');
    }

    return this.usersService.updateProfile(targetUserId, updateData);
  }

  @Get('check-userid/:userid')
  @UseGuards(OptionalAuthGuard)
  async checkUseridAvailability(
    @Param('userid') userid: string,
  ): Promise<UseridCheckResponse> {
    return this.usersService.checkUseridAvailability(userid);
  }

  @Post(':userid/avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('image', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      fileFilter: (_req, file, callback) => {
        if (!file.mimetype.match(/^image\/(jpeg|jpg|png|webp)$/)) {
          callback(
            new BadRequestException('지원하지 않는 이미지 형식입니다.'),
            false,
          );
        } else {
          callback(null, true);
        }
      },
    }),
  )
  async updateAvatar(
    @Param('userid') userid: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() cropData: AvatarCropDto,
    @Request() req: { user: { id: string } },
  ): Promise<UpdateAvatarResponse> {
    // userid를 실제 user ID로 변환
    const targetUser = await this.usersService.getUserProfile(
      { userid },
      req.user.id,
    );
    const targetUserId = targetUser.data.user.id;

    // 본인만 변경 가능
    if (req.user.id !== targetUserId) {
      throw new ForbiddenException('본인의 프로필 사진만 변경할 수 있습니다.');
    }

    if (!file) {
      throw new BadRequestException('이미지 파일이 필요합니다.');
    }

    return this.avatarService.uploadAvatar(targetUserId, file, cropData);
  }
}

import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LikesService } from './likes.service';

interface RequestWithUser {
  user: {
    id: string;
    email: string;
  };
}

@Controller()
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post('reviews/:reviewId/like')
  @UseGuards(AuthGuard('jwt'))
  async toggleLike(
    @Param('reviewId') reviewId: string,
    @Request() req: RequestWithUser
  ) {
    return this.likesService.toggleLike(reviewId, req.user.id);
  }

  @Get('reviews/:reviewId/likes')
  async getReviewLikes(
    @Param('reviewId') reviewId: string,
    @Query('page') page = 0,
    @Query('limit') limit = 20
  ) {
    return this.likesService.getReviewLikes(reviewId, {
      page: Number(page),
      limit: Number(limit),
    });
  }

  @Get('users/me/likes')
  @UseGuards(AuthGuard('jwt'))
  async getUserLikes(
    @Request() req: RequestWithUser,
    @Query('page') page = 0,
    @Query('limit') limit = 20
  ) {
    return this.likesService.getUserLikes(req.user.id, {
      page: Number(page),
      limit: Number(limit),
    });
  }
}

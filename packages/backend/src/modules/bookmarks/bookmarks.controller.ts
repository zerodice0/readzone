import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BookmarksService } from './bookmarks.service';

interface RequestWithUser {
  user: {
    id: string;
    email: string;
  };
}

@Controller()
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Post('reviews/:reviewId/bookmark')
  @UseGuards(AuthGuard('jwt'))
  async toggleBookmark(
    @Param('reviewId') reviewId: string,
    @Request() req: RequestWithUser
  ) {
    return this.bookmarksService.toggleBookmark(reviewId, req.user.id);
  }

  @Get('users/me/bookmarks')
  @UseGuards(AuthGuard('jwt'))
  async getUserBookmarks(
    @Request() req: RequestWithUser,
    @Query('page') page = 0,
    @Query('limit') limit = 20
  ) {
    return this.bookmarksService.getUserBookmarks(req.user.id, {
      page: Number(page),
      limit: Number(limit),
    });
  }

  @Delete('bookmarks/:id')
  @UseGuards(AuthGuard('jwt'))
  async deleteBookmark(
    @Param('id') id: string,
    @Request() req: RequestWithUser
  ) {
    return this.bookmarksService.deleteBookmark(id, req.user.id);
  }
}

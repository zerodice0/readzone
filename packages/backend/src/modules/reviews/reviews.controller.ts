import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { FeedQueryDto } from './dto/feed-query.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { LikeActionDto } from './dto/like-action.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('feed')
  async getFeed(@Query() feedQueryDto: FeedQueryDto) {
    return this.reviewsService.getFeed(feedQueryDto);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createReview(
    @Body() createReviewDto: CreateReviewDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.reviewsService.createReview(createReviewDto, req.user.id);
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  async likeReview(
    @Param('id') reviewId: string,
    @Body() likeActionDto: LikeActionDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.reviewsService.likeReview(reviewId, likeActionDto, req.user.id);
  }
}

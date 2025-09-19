import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TrendingService } from './trending.service';
import { OptionalAuthGuard } from '../auth/guards/optional-auth.guard';

@ApiTags('trending')
@Controller('trending')
export class TrendingController {
  constructor(private readonly trendingService: TrendingService) {}

  @Get('recent')
  @UseGuards(OptionalAuthGuard)
  @ApiOperation({ summary: 'Get recently reviewed books (last 24 hours)' })
  @ApiResponse({
    status: 200,
    description: 'Returns books with recent review activity',
  })
  async getRecentlyReviewedBooks(@Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : 5;
    const books =
      await this.trendingService.getRecentlyReviewedBooks(parsedLimit);

    return {
      success: true,
      data: books,
    };
  }

  @Get('popular')
  @UseGuards(OptionalAuthGuard)
  @ApiOperation({ summary: 'Get popular books this month' })
  @ApiResponse({
    status: 200,
    description: 'Returns most popular books based on likes',
  })
  async getPopularBooksThisMonth(@Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : 5;
    const books =
      await this.trendingService.getPopularBooksThisMonth(parsedLimit);

    return {
      success: true,
      data: books,
    };
  }

  @Get('tags')
  @UseGuards(OptionalAuthGuard)
  @ApiOperation({ summary: 'Get popular tags' })
  @ApiResponse({ status: 200, description: 'Returns most used tags' })
  async getPopularTags(@Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    const tags = await this.trendingService.getPopularTags(parsedLimit);

    return {
      success: true,
      data: tags,
    };
  }

  @Get('suggestions')
  @UseGuards(OptionalAuthGuard)
  @ApiOperation({ summary: 'Get search suggestions' })
  @ApiResponse({
    status: 200,
    description: 'Returns search suggestions based on recent activity',
  })
  async getSearchSuggestions(
    @Query('query') query?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 5;
    const suggestions = await this.trendingService.getSearchSuggestions(
      query,
      parsedLimit,
    );

    return {
      success: true,
      data: suggestions,
    };
  }
}

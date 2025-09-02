import { Controller, Get, Query } from '@nestjs/common';
import { TagsService } from './tags.service';

@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get('suggestions')
  async suggestions(
    @Query('query') query?: string,
    @Query('limit') limit?: string,
  ) {
    const l = limit ? parseInt(limit) : 10;
    return this.tagsService.getSuggestions(query, isNaN(l) ? 10 : l);
  }
}

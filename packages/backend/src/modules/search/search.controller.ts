import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { UnifiedSearchDto } from './dto/unified-search.dto';
import { SearchSuggestionsDto } from './dto/search-suggestions.dto';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async unifiedSearch(@Query() searchDto: UnifiedSearchDto) {
    return this.searchService.unifiedSearch(searchDto);
  }

  @Get('suggestions')
  async getSearchSuggestions(@Query() suggestionsDto: SearchSuggestionsDto) {
    return this.searchService.getSearchSuggestions(suggestionsDto);
  }

  @Get('books')
  async searchBooks(@Query() searchDto: UnifiedSearchDto) {
    // Override type to books only
    return this.searchService.unifiedSearch({ ...searchDto, type: 'books' });
  }
}

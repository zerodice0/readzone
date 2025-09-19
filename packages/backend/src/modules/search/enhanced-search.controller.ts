import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';
import { BookSearchService } from './book-search.service';
import { ReviewSearchService } from './review-search.service';
import { UserSearchService } from './user-search.service';
import { UnifiedSearchDto } from './dto/unified-search.dto';
import { BookSearchDto, ManualBookDto } from './dto/book-search.dto';
import { ReviewSearchDto } from './dto/review-search.dto';
import { UserSearchDto } from './dto/user-search.dto';
import { SearchSuggestionsDto } from './dto/search-suggestions.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('search')
export class EnhancedSearchController {
  constructor(
    private readonly searchService: SearchService,
    private readonly bookSearchService: BookSearchService,
    private readonly reviewSearchService: ReviewSearchService,
    private readonly userSearchService: UserSearchService,
  ) {}

  /**
   * Unified search endpoint
   * GET /api/search
   */
  @Get()
  async unifiedSearch(@Query() searchDto: UnifiedSearchDto) {
    return this.searchService.unifiedSearch(searchDto);
  }

  /**
   * Book-specific search with 3-stage logic
   * GET /api/search/books
   */
  @Get('books')
  async searchBooks(@Query() searchDto: BookSearchDto) {
    return this.bookSearchService.searchBooks(searchDto);
  }

  /**
   * Review-specific search with advanced filters
   * GET /api/search/reviews
   */
  @Get('reviews')
  async searchReviews(@Query() searchDto: ReviewSearchDto) {
    return this.reviewSearchService.searchReviews(searchDto);
  }

  /**
   * User-specific search
   * GET /api/search/users
   */
  @Get('users')
  async searchUsers(@Query() searchDto: UserSearchDto) {
    return this.userSearchService.searchUsers(searchDto);
  }

  /**
   * Search suggestions (autocomplete)
   * GET /api/search/suggestions
   */
  @Get('suggestions')
  async getSearchSuggestions(@Query() suggestionsDto: SearchSuggestionsDto) {
    return this.searchService.getSearchSuggestions(suggestionsDto);
  }

  /**
   * Manual book addition (requires authentication)
   * POST /api/books/manual
   */
  @Post('/books/manual')
  @UseGuards(JwtAuthGuard)
  async addManualBook(@Body() manualBookDto: ManualBookDto) {
    const book = await this.bookSearchService.addManualBook(manualBookDto);
    return {
      success: true,
      book,
      message: '도서가 성공적으로 추가되었습니다.',
    };
  }
}

import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BooksController } from './controllers/books.controller';
import { BooksService } from './services/books.service';
import { BookApiService } from './external/book-api.service';

/**
 * Books Module
 *
 * Provides endpoints for:
 * - Search: GET /books/search (external APIs: Google Books, Aladin)
 * - Create/Find: POST /books (cache book in DB with deduplication)
 * - Details: GET /books/:id (with reviewCount)
 * - Reviews: GET /books/:id/reviews (book-specific review feed)
 *
 * Dependencies:
 * - PrismaService (injected globally from AppModule)
 * - HttpModule (for external API calls)
 * - ConfigService (for API keys)
 * - CacheManager (for search result caching, 5 min TTL)
 */
@Module({
  imports: [HttpModule],
  controllers: [BooksController],
  providers: [BooksService, BookApiService],
  exports: [BooksService],
})
export class BooksModule {}

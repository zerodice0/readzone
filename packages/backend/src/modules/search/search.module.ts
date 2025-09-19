import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EnhancedSearchController } from './enhanced-search.controller';
import { TrendingController } from './trending.controller';
import { SearchService } from './search.service';
import { BookSearchService } from './book-search.service';
import { ReviewSearchService } from './review-search.service';
import { UserSearchService } from './user-search.service';
import { KakaoBooksService } from './kakao-books.service';
import { TrendingService } from './trending.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [EnhancedSearchController, TrendingController],
  providers: [
    SearchService,
    BookSearchService,
    ReviewSearchService,
    UserSearchService,
    KakaoBooksService,
    TrendingService,
  ],
  exports: [
    SearchService,
    BookSearchService,
    ReviewSearchService,
    UserSearchService,
    TrendingService,
  ],
})
export class SearchModule {}

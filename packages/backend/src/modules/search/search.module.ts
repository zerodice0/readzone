import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EnhancedSearchController } from './enhanced-search.controller';
import { SearchService } from './search.service';
import { BookSearchService } from './book-search.service';
import { ReviewSearchService } from './review-search.service';
import { UserSearchService } from './user-search.service';
import { KakaoBooksService } from './kakao-books.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [EnhancedSearchController],
  providers: [
    SearchService,
    BookSearchService,
    ReviewSearchService,
    UserSearchService,
    KakaoBooksService,
  ],
  exports: [
    SearchService,
    BookSearchService,
    ReviewSearchService,
    UserSearchService,
  ],
})
export class SearchModule {}

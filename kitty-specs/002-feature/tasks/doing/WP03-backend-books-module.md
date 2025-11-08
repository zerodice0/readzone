---
work_package_id: 'WP03'
subtasks:
  - 'T021'
  - 'T022'
  - 'T023'
  - 'T024'
  - 'T025'
  - 'T026'
  - 'T027'
  - 'T028'
  - 'T029'
  - 'T030'
  - 'T031'
  - 'T032'
  - 'T033'
  - 'T034'
title: 'Backend - Books Module'
phase: 'Phase 1 - Foundation'
lane: 'doing'
assignee: ''
agent: 'claude'
shell_pid: '95788'
history:
  - timestamp: '2025-11-08T17:52:47Z'
    lane: 'planned'
    agent: 'system'
    shell_pid: ''
    action: 'Prompt generated via /spec-kitty.tasks'
---

# Work Package Prompt: WP03 – Backend - Books Module

## Objectives & Success Criteria

**Goal**: Implement Books API with external API search (Google Books, Aladin), internal DB caching, and book info retrieval.

**Success Criteria**:

- [ ] GET /api/books/search returns results from external APIs (Google Books, Aladin)
- [ ] POST /api/books caches book in internal DB with deduplication
- [ ] GET /api/books/:id returns cached book with reviewCount
- [ ] GET /api/books/:id/reviews returns book-specific review feed
- [ ] External API calls complete within 10s timeout
- [ ] Search results cached in Redis (5 min TTL)
- [ ] Parallel API calls with Promise.allSettled()
- [ ] Deduplication works (ISBN or title+author)
- [ ] All endpoints validate input with class-validator
- [ ] Books module registered in app.module.ts

## Context & Constraints

**Related Documents**:

- `kitty-specs/002-feature/contracts/books-api.md` - Complete API specification
- `kitty-specs/002-feature/data-model.md` - Book model schema
- `kitty-specs/002-feature/plan.md` - Technical stack (NestJS 10, Prisma 6.19)

**Constraints**:

- External API timeout: 10 seconds
- Google Books API: 1000 req/day (free tier)
- Aladin API: requires API key
- Search results cached in Redis (TTL: 5 min)
- Fallback strategy: if one API fails, return results from other
- Deduplication: ISBN (primary) or title+author (fallback)

**Architectural Decisions**:

- Module structure follows NestJS conventions
- External API service layer for Google Books and Aladin
- Caching strategy: Redis for search results, DB for book entities
- Parallel search: Promise.allSettled() for multiple sources

## Subtasks & Detailed Guidance

### Subtask T021 – Create books.module.ts

**Purpose**: Define Books module with controllers, services, and dependencies.

**Steps**:

1. Create file: `packages/backend/src/books/books.module.ts`
2. Import necessary NestJS decorators:
   ```typescript
   import { Module } from '@nestjs/common';
   import { BooksController } from './books.controller';
   import { BooksService } from './books.service';
   import { BookApiService } from './external/book-api.service';
   import { PrismaModule } from '../prisma/prisma.module';
   import { HttpModule } from '@nestjs/axios';
   ```
3. Define module:
   ```typescript
   @Module({
     imports: [PrismaModule, HttpModule],
     controllers: [BooksController],
     providers: [BooksService, BookApiService],
     exports: [BooksService],
   })
   export class BooksModule {}
   ```

**Files**: `packages/backend/src/books/books.module.ts`

**Parallel?**: Yes (can proceed in parallel with T022-T026)

**Validation**:

```bash
pnpm --filter backend type-check
```

---

### Subtask T022 – Create books.controller.ts

**Purpose**: Define REST API endpoints for books.

**Steps**:

1. Create file: `packages/backend/src/books/books.controller.ts`
2. Define controller with routes:

   ```typescript
   import {
     Controller,
     Get,
     Post,
     Param,
     Query,
     Body,
     UseGuards,
     Req,
   } from '@nestjs/common';
   import { AuthGuard } from '@nestjs/passport';
   import { BooksService } from './books.service';
   import { SearchBookDto } from './dto/search-book.dto';
   import { CreateBookDto } from './dto/create-book.dto';

   @Controller('books')
   export class BooksController {
     constructor(private readonly booksService: BooksService) {}

     @Get('search')
     @UseGuards(AuthGuard('jwt'))
     async search(@Query() query: SearchBookDto) {
       return this.booksService.searchBooks(query);
     }

     @Post()
     @UseGuards(AuthGuard('jwt'))
     async createBook(@Body() dto: CreateBookDto) {
       return this.booksService.createOrFindBook(dto);
     }

     @Get(':id')
     async getBook(@Param('id') id: string) {
       return this.booksService.getBook(id);
     }

     @Get(':id/reviews')
     async getBookReviews(
       @Param('id') id: string,
       @Query('page') page = 0,
       @Query('limit') limit = 20,
       @Req() req?
     ) {
       const userId = req?.user?.id || null;
       return this.booksService.getBookReviews(id, { page, limit }, userId);
     }
   }
   ```

**Files**: `packages/backend/src/books/books.controller.ts`

**Parallel?**: Yes (after T021)

**Notes**:

- Search requires authentication (독후감 작성 시에만 사용)
- GET endpoints are public

---

### Subtask T023 – Create books.service.ts

**Purpose**: Implement business logic for book operations.

**Steps**:

1. Create file: `packages/backend/src/books/books.service.ts`
2. Implement search method with caching:

   ```typescript
   import { Injectable, NotFoundException, Inject } from '@nestjs/common';
   import { PrismaService } from '../prisma/prisma.service';
   import { BookApiService } from './external/book-api.service';
   import { CACHE_MANAGER } from '@nestjs/cache-manager';
   import { Cache } from 'cache-manager';

   @Injectable()
   export class BooksService {
     constructor(
       private prisma: PrismaService,
       private bookApi: BookApiService,
       @Inject(CACHE_MANAGER) private cacheManager: Cache
     ) {}

     async searchBooks(query: SearchBookDto) {
       const cacheKey = `book:search:${query.source}:${query.q}:${query.page}`;

       // Check cache
       const cached = await this.cacheManager.get(cacheKey);
       if (cached) {
         return cached;
       }

       // Fetch from external APIs
       const results = await this.bookApi.search(query);

       // Cache for 5 minutes
       await this.cacheManager.set(cacheKey, results, 300000);

       return results;
     }

     async createOrFindBook(dto: CreateBookDto) {
       // Deduplication logic
       let existingBook = null;

       if (dto.isbn) {
         existingBook = await this.prisma.book.findUnique({
           where: { isbn: dto.isbn },
         });
       }

       if (!existingBook && dto.title && dto.author) {
         existingBook = await this.prisma.book.findFirst({
           where: {
             title: { contains: dto.title, mode: 'insensitive' },
             author: { contains: dto.author, mode: 'insensitive' },
           },
         });
       }

       if (existingBook) {
         return {
           data: existingBook,
           meta: {
             isNew: false,
             timestamp: new Date().toISOString(),
           },
         };
       }

       // Create new book
       const book = await this.prisma.book.create({
         data: dto,
       });

       return {
         data: book,
         meta: {
           isNew: true,
           timestamp: new Date().toISOString(),
         },
       };
     }

     async getBook(id: string) {
       const book = await this.prisma.book.findUnique({
         where: { id },
       });

       if (!book) {
         throw new NotFoundException('책을 찾을 수 없습니다');
       }

       // Aggregate review count
       const reviewCount = await this.prisma.review.count({
         where: {
           bookId: id,
           status: 'PUBLISHED',
         },
       });

       return {
         data: {
           ...book,
           reviewCount,
         },
         meta: {
           timestamp: new Date().toISOString(),
         },
       };
     }

     async getBookReviews(
       id: string,
       pagination: { page: number; limit: number },
       userId?: string
     ) {
       const book = await this.prisma.book.findUnique({ where: { id } });
       if (!book) {
         throw new NotFoundException('책을 찾을 수 없습니다');
       }

       const { page, limit } = pagination;
       const skip = page * limit;

       const reviews = await this.prisma.review.findMany({
         where: {
           bookId: id,
           status: 'PUBLISHED',
         },
         include: {
           user: {
             select: { id: true, name: true, profileImage: true },
           },
           likes: userId ? { where: { userId } } : false,
           bookmarks: userId ? { where: { userId } } : false,
         },
         orderBy: {
           publishedAt: 'desc',
         },
         skip,
         take: limit + 1,
       });

       const hasMore = reviews.length > limit;
       const data = hasMore ? reviews.slice(0, limit) : reviews;

       const mappedData = data.map((review) => ({
         ...review,
         content: review.content.substring(0, 150),
         isLikedByMe: userId ? review.likes.length > 0 : undefined,
         isBookmarkedByMe: userId ? review.bookmarks.length > 0 : undefined,
         likes: undefined,
         bookmarks: undefined,
       }));

       const total = await this.prisma.review.count({
         where: { bookId: id, status: 'PUBLISHED' },
       });

       return {
         data: mappedData,
         meta: {
           page,
           limit,
           total,
           hasMore,
           timestamp: new Date().toISOString(),
         },
       };
     }
   }
   ```

**Files**: `packages/backend/src/books/books.service.ts`

**Parallel?**: No (depends on DTOs and BookApiService)

---

### Subtask T024 – Create external/book-api.service.ts

**Purpose**: External API integration layer for Google Books and Aladin.

**Steps**:

1. Create file: `packages/backend/src/books/external/book-api.service.ts`
2. Implement parallel API calls:

   ```typescript
   import { Injectable } from '@nestjs/common';
   import { HttpService } from '@nestjs/axios';
   import { ConfigService } from '@nestjs/config';
   import { firstValueFrom } from 'rxjs';

   @Injectable()
   export class BookApiService {
     constructor(
       private httpService: HttpService,
       private configService: ConfigService
     ) {}

     async search(query: {
       q: string;
       source?: string;
       page?: number;
       limit?: number;
     }) {
       const { q, source = 'all', page = 0, limit = 10 } = query;

       if (source === 'google') {
         return this.searchGoogleBooks(q, page, limit);
       } else if (source === 'aladin') {
         return this.searchAladin(q, page, limit);
       } else {
         // Parallel search
         const results = await Promise.allSettled([
           this.searchGoogleBooks(q, page, limit),
           this.searchAladin(q, page, limit),
         ]);

         // Merge and deduplicate
         const allBooks = [];

         if (results[0].status === 'fulfilled') {
           allBooks.push(...results[0].value.data);
         }

         if (results[1].status === 'fulfilled') {
           allBooks.push(...results[1].value.data);
         }

         // Deduplicate by ISBN
         const uniqueBooks = this.deduplicateBooks(allBooks);

         return {
           data: uniqueBooks.slice(0, limit),
           meta: {
             source: 'all',
             page,
             limit,
             total: uniqueBooks.length,
             hasMore: uniqueBooks.length > limit,
             timestamp: new Date().toISOString(),
           },
         };
       }
     }

     private async searchGoogleBooks(
       query: string,
       page: number,
       limit: number
     ) {
       const apiKey = this.configService.get('GOOGLE_BOOKS_API_KEY');
       const startIndex = page * limit;

       try {
         const response = await firstValueFrom(
           this.httpService.get('https://www.googleapis.com/books/v1/volumes', {
             params: {
               q: query,
               maxResults: limit,
               startIndex,
               key: apiKey,
             },
             timeout: 10000,
           })
         );

         const books =
           response.data.items?.map((item) => ({
             externalId: item.id,
             externalSource: 'GOOGLE_BOOKS',
             isbn: item.volumeInfo.industryIdentifiers?.find(
               (id) => id.type === 'ISBN_13'
             )?.identifier,
             title: item.volumeInfo.title,
             author: item.volumeInfo.authors?.join(', '),
             publisher: item.volumeInfo.publisher,
             publishedDate: item.volumeInfo.publishedDate,
             coverImageUrl: item.volumeInfo.imageLinks?.thumbnail,
             description: item.volumeInfo.description,
             pageCount: item.volumeInfo.pageCount,
             language: item.volumeInfo.language,
           })) || [];

         return {
           data: books,
           meta: {
             source: 'GOOGLE_BOOKS',
             page,
             limit,
             total: response.data.totalItems || 0,
             hasMore: startIndex + limit < (response.data.totalItems || 0),
             timestamp: new Date().toISOString(),
           },
         };
       } catch (error) {
         console.error('Google Books API error:', error);
         return {
           data: [],
           meta: {
             source: 'GOOGLE_BOOKS',
             page,
             limit,
             total: 0,
             hasMore: false,
             timestamp: new Date().toISOString(),
             error: 'Google Books API 호출 실패',
           },
         };
       }
     }

     private async searchAladin(query: string, page: number, limit: number) {
       const apiKey = this.configService.get('ALADIN_API_KEY');
       const start = page * limit + 1;

       try {
         const response = await firstValueFrom(
           this.httpService.get(
             'http://www.aladin.co.kr/ttb/api/ItemSearch.aspx',
             {
               params: {
                 Query: query,
                 QueryType: 'Keyword',
                 MaxResults: limit,
                 start,
                 output: 'js',
                 Version: '20131101',
                 ttbkey: apiKey,
               },
               timeout: 10000,
             }
           )
         );

         const books =
           response.data.item?.map((item) => ({
             externalId: item.itemId,
             externalSource: 'ALADIN',
             isbn: item.isbn13,
             title: item.title,
             author: item.author,
             publisher: item.publisher,
             publishedDate: item.pubDate,
             coverImageUrl: item.cover,
             description: item.description,
             pageCount: null,
             language: 'ko',
           })) || [];

         return {
           data: books,
           meta: {
             source: 'ALADIN',
             page,
             limit,
             total: response.data.totalResults || 0,
             hasMore: start + limit - 1 < (response.data.totalResults || 0),
             timestamp: new Date().toISOString(),
           },
         };
       } catch (error) {
         console.error('Aladin API error:', error);
         return {
           data: [],
           meta: {
             source: 'ALADIN',
             page,
             limit,
             total: 0,
             hasMore: false,
             timestamp: new Date().toISOString(),
             error: 'Aladin API 호출 실패',
           },
         };
       }
     }

     private deduplicateBooks(books: any[]): any[] {
       const seen = new Map();
       const result = [];

       for (const book of books) {
         const key = book.isbn || `${book.title}:${book.author}`;
         if (!seen.has(key)) {
           seen.set(key, true);
           result.push(book);
         }
       }

       return result;
     }
   }
   ```

**Files**: `packages/backend/src/books/external/book-api.service.ts`

**Parallel?**: Yes (can proceed in parallel with DTOs)

---

### Subtask T025 – Create dto/search-book.dto.ts

**Purpose**: Validate book search query parameters.

**Steps**:

1. Create file: `packages/backend/src/books/dto/search-book.dto.ts`
2. Define DTO:

   ```typescript
   import {
     IsString,
     IsOptional,
     IsEnum,
     IsInt,
     Min,
     Max,
     MinLength,
   } from 'class-validator';
   import { Type } from 'class-transformer';

   export class SearchBookDto {
     @IsString()
     @MinLength(2, { message: '검색어는 최소 2자 이상이어야 합니다' })
     q: string;

     @IsOptional()
     @IsEnum(['google', 'aladin', 'all'])
     source?: 'google' | 'aladin' | 'all' = 'all';

     @IsOptional()
     @Type(() => Number)
     @IsInt()
     @Min(0)
     page?: number = 0;

     @IsOptional()
     @Type(() => Number)
     @IsInt()
     @Min(1)
     @Max(20)
     limit?: number = 10;
   }
   ```

**Files**: `packages/backend/src/books/dto/search-book.dto.ts`

**Parallel?**: Yes

---

### Subtask T026 – Create dto/create-book.dto.ts

**Purpose**: Validate book creation payload.

**Steps**:

1. Create file: `packages/backend/src/books/dto/create-book.dto.ts`
2. Define DTO:

   ```typescript
   import {
     IsString,
     IsOptional,
     IsEnum,
     IsInt,
     Min,
     IsISO8601,
   } from 'class-validator';

   export class CreateBookDto {
     @IsString()
     externalId: string;

     @IsEnum(['GOOGLE_BOOKS', 'ALADIN', 'MANUAL'])
     externalSource: 'GOOGLE_BOOKS' | 'ALADIN' | 'MANUAL';

     @IsOptional()
     @IsString()
     isbn?: string;

     @IsString()
     title: string;

     @IsString()
     author: string;

     @IsOptional()
     @IsString()
     publisher?: string;

     @IsOptional()
     @IsISO8601()
     publishedDate?: string;

     @IsOptional()
     @IsString()
     coverImageUrl?: string;

     @IsOptional()
     @IsString()
     description?: string;

     @IsOptional()
     @IsInt()
     @Min(1)
     pageCount?: number;

     @IsOptional()
     @IsString()
     language?: string;
   }
   ```

**Files**: `packages/backend/src/books/dto/create-book.dto.ts`

**Parallel?**: Yes

---

### Subtask T027 – Implement Google Books API integration

**Purpose**: Complete Google Books API integration in book-api.service.ts.

**Steps**:

1. Verify `searchGoogleBooks()` method is implemented (done in T024)
2. Test with sample queries:
   ```bash
   curl -H "Authorization: Bearer <token>" \
        "http://localhost:3000/api/books/search?q=채식주의자&source=google"
   ```
3. Verify response mapping:
   - ISBN-13 extraction
   - Author joining with comma
   - Cover image URL from imageLinks.thumbnail

**Files**: `packages/backend/src/books/external/book-api.service.ts`

**Parallel?**: Yes (can proceed in parallel with T028)

**Validation**:

- Test with Korean books: "채식주의자", "소년이 온다"
- Test with English books: "Harry Potter", "1984"
- Verify 10s timeout works

---

### Subtask T028 – Implement Aladin API integration

**Purpose**: Complete Aladin API integration in book-api.service.ts.

**Steps**:

1. Verify `searchAladin()` method is implemented (done in T024)
2. Configure Aladin API key in environment:
   ```bash
   ALADIN_API_KEY=your-api-key
   ```
3. Test with sample queries:
   ```bash
   curl -H "Authorization: Bearer <token>" \
        "http://localhost:3000/api/books/search?q=채식주의자&source=aladin"
   ```
4. Verify response mapping:
   - ISBN-13 from isbn13 field
   - Cover image from cover field
   - Language defaults to "ko"

**Files**: `packages/backend/src/books/external/book-api.service.ts`

**Parallel?**: Yes (can proceed in parallel with T027)

**Validation**:

- Test with Korean books
- Verify fallback to empty array on error

---

### Subtask T029 – Implement GET /books/search with parallel API calls

**Purpose**: Enable parallel search across multiple sources with deduplication.

**Steps**:

1. Verify `search()` method handles `source: 'all'` (done in T024)
2. Test parallel search:
   ```bash
   curl -H "Authorization: Bearer <token>" \
        "http://localhost:3000/api/books/search?q=채식주의자&source=all"
   ```
3. Verify:
   - Both APIs called in parallel
   - Results merged and deduplicated by ISBN
   - If one API fails, other results still returned
   - Total includes both sources

**Files**: `packages/backend/src/books/external/book-api.service.ts`

**Parallel?**: No (depends on T027, T028)

**Validation**:

```bash
# Test with network issues (one API down)
# Verify fallback works
```

---

### Subtask T030 – Implement POST /books with deduplication

**Purpose**: Enable book caching with ISBN and title+author deduplication.

**Steps**:

1. Verify `createOrFindBook()` method is implemented (done in T023)
2. Test ISBN deduplication:
   ```bash
   curl -X POST http://localhost:3000/api/books \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{
       "externalId": "google-123",
       "externalSource": "GOOGLE_BOOKS",
       "isbn": "9788936433598",
       "title": "채식주의자",
       "author": "한강"
     }'
   ```
3. Test title+author deduplication (without ISBN):
   ```bash
   curl -X POST http://localhost:3000/api/books \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{
       "externalId": "manual-456",
       "externalSource": "MANUAL",
       "title": "채식주의자",
       "author": "한강"
     }'
   ```
4. Verify:
   - First request returns `isNew: true`, status 201
   - Second request returns `isNew: false`, status 200, same book ID

**Files**: `packages/backend/src/books/books.service.ts`

**Parallel?**: No (depends on T023, T026)

---

### Subtask T031 – Implement GET /books/:id with reviewCount

**Purpose**: Enable book detail retrieval with review count aggregation.

**Steps**:

1. Verify `getBook()` method is implemented (done in T023)
2. Create a book and add reviews for testing:

   ```bash
   # Create book
   BOOK_ID=$(curl -X POST http://localhost:3000/api/books ... | jq -r '.data.id')

   # Create review for the book
   curl -X POST http://localhost:3000/api/reviews \
     -H "Authorization: Bearer <token>" \
     -d '{"bookId": "'$BOOK_ID'", ...}'
   ```

3. Test detail endpoint:
   ```bash
   curl http://localhost:3000/api/books/$BOOK_ID
   ```
4. Verify:
   - All book fields returned
   - `reviewCount` field present and accurate

**Files**: `packages/backend/src/books/books.service.ts`

**Parallel?**: No (depends on T023)

---

### Subtask T032 – Implement GET /books/:id/reviews

**Purpose**: Enable book-specific review feed.

**Steps**:

1. Verify `getBookReviews()` method is implemented (done in T023)
2. Test book reviews endpoint:
   ```bash
   curl "http://localhost:3000/api/books/$BOOK_ID/reviews?page=0&limit=20"
   ```
3. Verify:
   - Reviews filtered by bookId
   - Ordered by publishedAt DESC
   - Pagination works correctly
   - Content truncated to 150 chars
   - isLikedByMe/isBookmarkedByMe for authenticated users

**Files**: `packages/backend/src/books/books.service.ts`

**Parallel?**: No (depends on T023)

---

### Subtask T033 – Add BooksModule to app.module.ts

**Purpose**: Register Books module in main application module.

**Steps**:

1. Open `packages/backend/src/app.module.ts`
2. Import BooksModule:
   ```typescript
   import { BooksModule } from './books/books.module';
   ```
3. Add to imports array:
   ```typescript
   @Module({
     imports: [
       // ... existing modules
       BooksModule,
     ],
   })
   export class AppModule {}
   ```

**Files**: `packages/backend/src/app.module.ts`

**Parallel?**: No (final integration step)

**Validation**:

```bash
pnpm --filter backend start:dev
# Verify server starts without errors
```

---

### Subtask T034 – Configure environment variables

**Purpose**: Set up API keys for external services.

**Steps**:

1. Open `packages/backend/.env` (or create if not exists)
2. Add environment variables:
   ```bash
   GOOGLE_BOOKS_API_KEY=your-google-books-api-key
   ALADIN_API_KEY=your-aladin-api-key
   ```
3. Update `.env.example`:
   ```bash
   GOOGLE_BOOKS_API_KEY=
   ALADIN_API_KEY=
   ```
4. Verify ConfigService loads variables:

   ```typescript
   // In app.module.ts or books.module.ts
   import { ConfigModule } from '@nestjs/config';

   @Module({
     imports: [
       ConfigModule.forRoot({
         isGlobal: true,
       }),
     ],
   })
   ```

**Files**:

- `packages/backend/.env`
- `packages/backend/.env.example`

**Parallel?**: Yes (can proceed in parallel with other tasks)

**Notes**:

- Ensure `.env` is in `.gitignore`
- Document how to obtain API keys in README

**Validation**:

```bash
# Verify environment variables loaded
pnpm --filter backend start:dev
# Check logs for ConfigService initialization
```

---

## Test Strategy

**Unit Tests**:

- BooksService methods (searchBooks, createOrFindBook, getBook, getBookReviews)
- BookApiService methods (searchGoogleBooks, searchAladin, deduplicateBooks)
- Mock HttpService and PrismaService with jest

**Integration Tests**:

- E2E tests for all endpoints
- Test with real database (test environment)
- Mock external APIs with nock or MSW
- Test caching behavior (Redis)

**External API Tests**:

- Test Google Books API with sample queries
- Test Aladin API with sample queries
- Test parallel search and fallback
- Test timeout handling (10s)

## Risks & Mitigations

**Risk 1: External API rate limits or downtime**

- **Impact**: Search functionality unavailable
- **Mitigation**:
  - Implement caching (5 min TTL in Redis)
  - Fallback to other API if one fails
  - Allow manual book entry (externalSource: MANUAL)
- **Recovery**: Display error message, suggest manual entry

**Risk 2: Duplicate book records**

- **Impact**: Database pollution, inconsistent data
- **Mitigation**:
  - Enforce unique constraints on ISBN and (externalSource, externalId)
  - Deduplication logic in createOrFindBook
  - Case-insensitive fuzzy matching for title+author
- **Recovery**: Database cleanup script to merge duplicates

**Risk 3: Image URL failures**

- **Impact**: Broken images in UI
- **Mitigation**:
  - Frontend displays placeholder on image load error
  - Periodic batch job to validate and update URLs (optional)
- **Recovery**: Update coverImageUrl with new URL from external API

**Risk 4: Search performance degradation**

- **Impact**: Slow search queries
- **Mitigation**:
  - Redis caching with 5 min TTL
  - Index on ISBN, title, author in database
  - Limit search results to max 20 per page
- **Monitor**: Query performance, cache hit rate

## Definition of Done Checklist

- [ ] All subtasks T021-T034 completed and validated
- [ ] BooksModule, controller, service, DTOs, and external API service created
- [ ] GET /books/search returns results from external APIs with caching
- [ ] POST /books creates or finds book with deduplication
- [ ] GET /books/:id returns book with reviewCount
- [ ] GET /books/:id/reviews returns book-specific reviews
- [ ] Google Books API integration working
- [ ] Aladin API integration working
- [ ] Parallel search with Promise.allSettled() implemented
- [ ] Deduplication by ISBN and title+author working
- [ ] Redis caching configured (5 min TTL)
- [ ] Environment variables configured (API keys)
- [ ] Timeout handling (10s) implemented
- [ ] Fallback strategy works (one API failure)
- [ ] All endpoints validate input with class-validator
- [ ] BooksModule registered in app.module.ts
- [ ] Unit tests pass for all service methods
- [ ] Integration tests pass for all endpoints
- [ ] TypeScript compilation passes: `pnpm --filter backend type-check`

## Review Guidance

**Key Acceptance Checkpoints**:

1. **API Completeness**: All 4 endpoints implemented and tested
2. **External Integration**: Google Books and Aladin APIs working
3. **Deduplication**: ISBN and title+author deduplication working
4. **Performance**: Caching and timeout handling verified

**Reviewer Should Verify**:

- [ ] Test GET /books/search - returns results from external APIs
- [ ] Test POST /books - creates or finds book with deduplication
- [ ] Test GET /books/:id - returns book with reviewCount
- [ ] Test GET /books/:id/reviews - returns book-specific reviews
- [ ] Test parallel search (source=all) - both APIs called
- [ ] Test fallback - one API down, other results returned
- [ ] Test caching - same search returns cached results
- [ ] Check Redis - verify cache keys and TTL
- [ ] Run `pnpm --filter backend type-check` - passes

## Activity Log

- 2025-11-08T17:52:47Z – system – lane=planned – Prompt created.

---

### Next Steps After Completion

Once WP03 is done, the following work packages can proceed:

- **WP04**: Backend - Likes & Bookmarks Modules (depends on WP01, WP02)
- **WP05**: Frontend - Feed Store & API Client (can start after backend APIs deployed)
- 2025-11-08T23:28:58Z – claude – shell_pid=95788 – lane=doing – Started implementation

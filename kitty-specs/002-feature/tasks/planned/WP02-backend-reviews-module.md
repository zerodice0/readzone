---
work_package_id: 'WP02'
subtasks:
  - 'T008'
  - 'T009'
  - 'T010'
  - 'T011'
  - 'T012'
  - 'T013'
  - 'T014'
  - 'T015'
  - 'T016'
  - 'T017'
  - 'T018'
  - 'T019'
  - 'T020'
title: 'Backend - Reviews Module'
phase: 'Phase 1 - Foundation'
lane: 'planned'
assignee: ''
agent: ''
shell_pid: ''
history:
  - timestamp: '2025-11-08T17:52:47Z'
    lane: 'planned'
    agent: 'system'
    shell_pid: ''
    action: 'Prompt generated via /spec-kitty.tasks'
---

# Work Package Prompt: WP02 – Backend - Reviews Module

## Objectives & Success Criteria

**Goal**: Implement Reviews API with feed endpoint, CRUD operations, pagination, and N+1 query prevention.

**Success Criteria**:
- [ ] GET /api/reviews/feed returns paginated reviews with book and user info
- [ ] GET /api/reviews/:id returns full review details
- [ ] POST /api/reviews creates new review and returns 201
- [ ] PATCH /api/reviews/:id updates review (author only)
- [ ] DELETE /api/reviews/:id soft-deletes review (sets status=DELETED)
- [ ] Feed endpoint uses Prisma `include` to prevent N+1 queries
- [ ] Pagination works correctly (page, limit, hasMore)
- [ ] Feed endpoint response time <200ms (p95)
- [ ] All endpoints validate input with class-validator
- [ ] Authentication guards protect POST/PATCH/DELETE endpoints

## Context & Constraints

**Related Documents**:
- `kitty-specs/002-feature/contracts/reviews-api.md` - Complete API specification
- `kitty-specs/002-feature/data-model.md` - Review model schema
- `kitty-specs/002-feature/plan.md` - Technical stack (NestJS 10, Prisma 6.19)

**Constraints**:
- Must use Prisma for all database operations
- Must prevent N+1 queries (use `include` for relations)
- Feed endpoint must support both authenticated and anonymous users
- Soft delete pattern: status=DELETED, deletedAt timestamp
- Content field is @db.Text (unlimited length)
- Response time target: <200ms p95

**Architectural Decisions**:
- Module structure follows NestJS conventions (module, controller, service)
- DTOs for all request/response validation
- Pagination: cursor-based using publishedAt + id for stability
- Feed filtering: status=PUBLISHED only

## Subtasks & Detailed Guidance

### Subtask T008 – Create reviews.module.ts

**Purpose**: Define Reviews module with controllers, services, and Prisma dependency.

**Steps**:
1. Create file: `packages/backend/src/reviews/reviews.module.ts`
2. Import necessary NestJS decorators:
   ```typescript
   import { Module } from '@nestjs/common';
   import { ReviewsController } from './reviews.controller';
   import { ReviewsService } from './reviews.service';
   import { PrismaModule } from '../prisma/prisma.module';
   ```
3. Define module:
   ```typescript
   @Module({
     imports: [PrismaModule],
     controllers: [ReviewsController],
     providers: [ReviewsService],
     exports: [ReviewsService],
   })
   export class ReviewsModule {}
   ```
4. Ensure PrismaModule is available (should exist from existing auth system)

**Files**: `packages/backend/src/reviews/reviews.module.ts`

**Parallel?**: Yes (can proceed in parallel with T009-T013)

**Notes**:
- Export ReviewsService for potential use by other modules
- PrismaModule should already exist in the codebase

**Validation**:
```bash
# Check TypeScript compilation
pnpm --filter backend type-check
```

---

### Subtask T009 – Create reviews.controller.ts

**Purpose**: Define REST API endpoints for reviews.

**Steps**:
1. Create file: `packages/backend/src/reviews/reviews.controller.ts`
2. Import necessary decorators:
   ```typescript
   import {
     Controller,
     Get,
     Post,
     Patch,
     Delete,
     Param,
     Query,
     Body,
     UseGuards,
     Req,
   } from '@nestjs/common';
   import { AuthGuard } from '@nestjs/passport';
   import { ReviewsService } from './reviews.service';
   import { FeedQueryDto } from './dto/feed-query.dto';
   import { CreateReviewDto } from './dto/create-review.dto';
   import { UpdateReviewDto } from './dto/update-review.dto';
   ```
3. Define controller with routes:
   ```typescript
   @Controller('reviews')
   export class ReviewsController {
     constructor(private readonly reviewsService: ReviewsService) {}

     @Get('feed')
     async getFeed(@Query() query: FeedQueryDto, @Req() req?) {
       const userId = req?.user?.id || null;
       return this.reviewsService.getFeed(query, userId);
     }

     @Get(':id')
     async getReview(@Param('id') id: string, @Req() req?) {
       const userId = req?.user?.id || null;
       return this.reviewsService.getReview(id, userId);
     }

     @Post()
     @UseGuards(AuthGuard('jwt'))
     async createReview(@Body() dto: CreateReviewDto, @Req() req) {
       return this.reviewsService.createReview(dto, req.user.id);
     }

     @Patch(':id')
     @UseGuards(AuthGuard('jwt'))
     async updateReview(
       @Param('id') id: string,
       @Body() dto: UpdateReviewDto,
       @Req() req,
     ) {
       return this.reviewsService.updateReview(id, dto, req.user.id);
     }

     @Delete(':id')
     @UseGuards(AuthGuard('jwt'))
     async deleteReview(@Param('id') id: string, @Req() req) {
       return this.reviewsService.deleteReview(id, req.user.id);
     }
   }
   ```

**Files**: `packages/backend/src/reviews/reviews.controller.ts`

**Parallel?**: Yes (after T008)

**Notes**:
- Optional authentication: GET endpoints don't require auth
- AuthGuard('jwt') should exist from existing auth system
- userId from req.user is used for isLikedByMe/isBookmarkedByMe checks

---

### Subtask T010 – Create reviews.service.ts

**Purpose**: Implement business logic for review operations with Prisma queries.

**Steps**:
1. Create file: `packages/backend/src/reviews/reviews.service.ts`
2. Implement getFeed method with N+1 prevention:
   ```typescript
   import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
   import { PrismaService } from '../prisma/prisma.service';
   import { FeedQueryDto } from './dto/feed-query.dto';

   @Injectable()
   export class ReviewsService {
     constructor(private prisma: PrismaService) {}

     async getFeed(query: FeedQueryDto, userId?: string) {
       const { page = 0, limit = 20 } = query;
       const skip = page * limit;

       // Fetch reviews with relations (prevent N+1)
       const reviews = await this.prisma.review.findMany({
         where: {
           status: 'PUBLISHED',
         },
         include: {
           user: {
             select: { id: true, name: true, profileImage: true },
           },
           book: {
             select: { id: true, title: true, author: true, coverImageUrl: true },
           },
           likes: userId ? { where: { userId } } : false,
           bookmarks: userId ? { where: { userId } } : false,
         },
         orderBy: {
           publishedAt: 'desc',
         },
         skip,
         take: limit + 1, // Fetch one extra to check hasMore
       });

       // Check if there are more results
       const hasMore = reviews.length > limit;
       const data = hasMore ? reviews.slice(0, limit) : reviews;

       // Map to response format
       const mappedData = data.map((review) => ({
         ...review,
         content: review.content.substring(0, 150), // Truncate to 150 chars
         isLikedByMe: userId ? review.likes.length > 0 : undefined,
         isBookmarkedByMe: userId ? review.bookmarks.length > 0 : undefined,
         likes: undefined, // Remove from response
         bookmarks: undefined,
       }));

       // Count total (for pagination meta)
       const total = await this.prisma.review.count({
         where: { status: 'PUBLISHED' },
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

     async getReview(id: string, userId?: string) {
       const review = await this.prisma.review.findUnique({
         where: { id },
         include: {
           user: {
             select: { id: true, name: true, profileImage: true },
           },
           book: true,
           likes: userId ? { where: { userId } } : false,
           bookmarks: userId ? { where: { userId } } : false,
         },
       });

       if (!review || review.status === 'DELETED') {
         throw new NotFoundException('Review not found');
       }

       // Increment view count
       await this.prisma.review.update({
         where: { id },
         data: { viewCount: { increment: 1 } },
       });

       return {
         data: {
           ...review,
           isLikedByMe: userId ? review.likes.length > 0 : undefined,
           isBookmarkedByMe: userId ? review.bookmarks.length > 0 : undefined,
           likes: undefined,
           bookmarks: undefined,
         },
         meta: {
           timestamp: new Date().toISOString(),
         },
       };
     }

     async createReview(dto: CreateReviewDto, userId: string) {
       const review = await this.prisma.review.create({
         data: {
           ...dto,
           userId,
           status: dto.status || 'PUBLISHED',
           publishedAt: dto.status === 'PUBLISHED' ? new Date() : null,
         },
         include: {
           user: {
             select: { id: true, name: true, profileImage: true },
           },
           book: true,
         },
       });

       return {
         data: review,
         meta: {
           timestamp: new Date().toISOString(),
         },
       };
     }

     async updateReview(id: string, dto: UpdateReviewDto, userId: string) {
       const review = await this.prisma.review.findUnique({
         where: { id },
       });

       if (!review || review.status === 'DELETED') {
         throw new NotFoundException('Review not found');
       }

       if (review.userId !== userId) {
         throw new ForbiddenException('You can only update your own reviews');
       }

       const updated = await this.prisma.review.update({
         where: { id },
         data: {
           ...dto,
           publishedAt:
             dto.status === 'PUBLISHED' && review.status !== 'PUBLISHED'
               ? new Date()
               : review.publishedAt,
         },
         include: {
           user: {
             select: { id: true, name: true, profileImage: true },
           },
           book: true,
         },
       });

       return {
         data: updated,
         meta: {
           timestamp: new Date().toISOString(),
         },
       };
     }

     async deleteReview(id: string, userId: string) {
       const review = await this.prisma.review.findUnique({
         where: { id },
       });

       if (!review || review.status === 'DELETED') {
         throw new NotFoundException('Review not found');
       }

       if (review.userId !== userId) {
         throw new ForbiddenException('You can only delete your own reviews');
       }

       // Soft delete
       await this.prisma.review.update({
         where: { id },
         data: {
           status: 'DELETED',
           deletedAt: new Date(),
         },
       });

       return {
         meta: {
           timestamp: new Date().toISOString(),
         },
       };
     }
   }
   ```

**Files**: `packages/backend/src/reviews/reviews.service.ts`

**Parallel?**: No (depends on DTOs T011-T013)

**Notes**:
- Use `include` to fetch relations in single query (prevent N+1)
- Truncate content to 150 chars for feed endpoint
- Soft delete: update status to DELETED, set deletedAt
- View count increment on detail page load

**Validation**:
```bash
# Test with curl after starting server
curl http://localhost:3000/api/reviews/feed?page=0&limit=20
```

---

### Subtask T011 – Create dto/feed-query.dto.ts

**Purpose**: Validate feed query parameters.

**Steps**:
1. Create file: `packages/backend/src/reviews/dto/feed-query.dto.ts`
2. Define DTO:
   ```typescript
   import { IsOptional, IsInt, Min, Max } from 'class-validator';
   import { Type } from 'class-transformer';

   export class FeedQueryDto {
     @IsOptional()
     @Type(() => Number)
     @IsInt()
     @Min(0)
     page?: number = 0;

     @IsOptional()
     @Type(() => Number)
     @IsInt()
     @Min(1)
     @Max(50)
     limit?: number = 20;
   }
   ```

**Files**: `packages/backend/src/reviews/dto/feed-query.dto.ts`

**Parallel?**: Yes (can proceed in parallel with other DTOs)

**Notes**:
- Default values: page=0, limit=20
- Max limit: 50 to prevent abuse

---

### Subtask T012 – Create dto/create-review.dto.ts

**Purpose**: Validate review creation payload.

**Steps**:
1. Create file: `packages/backend/src/reviews/dto/create-review.dto.ts`
2. Define DTO:
   ```typescript
   import {
     IsString,
     IsOptional,
     IsBoolean,
     IsInt,
     Min,
     Max,
     IsEnum,
     IsUUID,
   } from 'class-validator';

   export class CreateReviewDto {
     @IsOptional()
     @IsString()
     title?: string;

     @IsString()
     content: string;

     @IsOptional()
     @IsBoolean()
     isRecommended?: boolean;

     @IsOptional()
     @IsInt()
     @Min(1)
     @Max(5)
     rating?: number;

     @IsEnum(['READING', 'COMPLETED', 'DROPPED'])
     readStatus: string;

     @IsOptional()
     @IsEnum(['DRAFT', 'PUBLISHED'])
     status?: string;

     @IsUUID()
     bookId: string;
   }
   ```

**Files**: `packages/backend/src/reviews/dto/create-review.dto.ts`

**Parallel?**: Yes

**Notes**:
- Content is required, no max length (use @db.Text in schema)
- Rating is 1-5 scale, optional
- Status defaults to PUBLISHED if not provided

---

### Subtask T013 – Create dto/update-review.dto.ts

**Purpose**: Validate review update payload.

**Steps**:
1. Create file: `packages/backend/src/reviews/dto/update-review.dto.ts`
2. Define DTO:
   ```typescript
   import { PartialType } from '@nestjs/mapped-types';
   import { CreateReviewDto } from './create-review.dto';

   export class UpdateReviewDto extends PartialType(CreateReviewDto) {}
   ```

**Files**: `packages/backend/src/reviews/dto/update-review.dto.ts`

**Parallel?**: Yes (after T012)

**Notes**:
- Use PartialType to make all fields optional
- Reuse validation logic from CreateReviewDto

---

### Subtask T014 – Add index to Review model for performance

**Purpose**: Ensure fast feed queries with composite index.

**Steps**:
1. Open `packages/backend/prisma/schema.prisma`
2. Verify Review model has index:
   ```prisma
   model Review {
     // ... fields ...

     @@index([status, publishedAt(sort: Desc)])
     @@map("reviews")
   }
   ```
3. If index is missing, add it
4. Generate migration:
   ```bash
   cd packages/backend
   pnpm prisma migrate dev --name add-review-feed-index
   ```

**Files**: `packages/backend/prisma/schema.prisma`

**Parallel?**: No (depends on WP01)

**Notes**:
- Composite index on (status, publishedAt DESC) for fast feed queries
- Should already exist from WP01, verify only

**Validation**:
```bash
psql $DATABASE_URL -c "\d reviews"  # Check indexes
```

---

### Subtask T015 – Add ReviewsModule to app.module.ts

**Purpose**: Register Reviews module in main application module.

**Steps**:
1. Open `packages/backend/src/app.module.ts`
2. Import ReviewsModule:
   ```typescript
   import { ReviewsModule } from './reviews/reviews.module';
   ```
3. Add to imports array:
   ```typescript
   @Module({
     imports: [
       // ... existing modules
       ReviewsModule,
     ],
   })
   export class AppModule {}
   ```

**Files**: `packages/backend/src/app.module.ts`

**Parallel?**: No (final integration step)

**Notes**:
- Ensure ReviewsModule is after PrismaModule in imports

**Validation**:
```bash
pnpm --filter backend start:dev
# Check that server starts without errors
```

---

### Subtask T016 – Test GET /reviews/feed endpoint

**Purpose**: Verify feed endpoint returns paginated reviews correctly.

**Steps**:
1. Ensure seed data is loaded (from WP01):
   ```bash
   cd packages/backend
   pnpm db:seed
   ```
2. Start backend server:
   ```bash
   pnpm --filter backend start:dev
   ```
3. Test with curl:
   ```bash
   # Test default pagination
   curl http://localhost:3000/api/reviews/feed

   # Test with pagination
   curl http://localhost:3000/api/reviews/feed?page=1&limit=10

   # Test with authentication (if available)
   curl -H "Authorization: Bearer <token>" \
        http://localhost:3000/api/reviews/feed
   ```
4. Verify response includes:
   - `data` array with reviews
   - `meta` object with page, limit, total, hasMore
   - Each review has user, book, likeCount, bookmarkCount
   - Content is truncated to 150 chars
   - isLikedByMe/isBookmarkedByMe only for authenticated users

**Files**: N/A (testing only)

**Parallel?**: No (depends on all previous subtasks)

**Notes**:
- Test both authenticated and unauthenticated requests
- Verify pagination works (hasMore flag changes)

---

### Subtask T017 – Test GET /reviews/:id endpoint

**Purpose**: Verify detail endpoint returns full review correctly.

**Steps**:
1. Get a review ID from feed endpoint:
   ```bash
   curl http://localhost:3000/api/reviews/feed | jq '.data[0].id'
   ```
2. Test detail endpoint:
   ```bash
   REVIEW_ID=<id-from-step-1>
   curl http://localhost:3000/api/reviews/$REVIEW_ID
   ```
3. Verify response includes:
   - Full content (not truncated)
   - Complete book information
   - viewCount is incremented on each request

**Files**: N/A (testing only)

**Parallel?**: No (depends on T016)

---

### Subtask T018 – Test POST /reviews endpoint

**Purpose**: Verify review creation works correctly.

**Steps**:
1. Get authentication token (from existing auth system)
2. Get a book ID (from seed data or create one):
   ```bash
   curl http://localhost:3000/api/books | jq '.data[0].id'
   ```
3. Create a review:
   ```bash
   curl -X POST http://localhost:3000/api/reviews \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "테스트 독후감",
       "content": "이 책은 정말 좋았습니다. 추천합니다!",
       "isRecommended": true,
       "rating": 5,
       "readStatus": "COMPLETED",
       "status": "PUBLISHED",
       "bookId": "<book-id>"
     }'
   ```
4. Verify:
   - Response returns 201 Created
   - Review appears in feed
   - publishedAt is set correctly

**Files**: N/A (testing only)

**Parallel?**: No (depends on authentication system)

---

### Subtask T019 – Test PATCH /reviews/:id endpoint

**Purpose**: Verify review update works correctly (author only).

**Steps**:
1. Create a review (from T018)
2. Update the review:
   ```bash
   curl -X PATCH http://localhost:3000/api/reviews/$REVIEW_ID \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "수정된 독후감 제목",
       "rating": 4
     }'
   ```
3. Verify:
   - Response returns 200 OK with updated data
   - Only specified fields are updated
   - Attempt to update another user's review returns 403 Forbidden

**Files**: N/A (testing only)

**Parallel?**: No (depends on T018)

---

### Subtask T020 – Test DELETE /reviews/:id endpoint

**Purpose**: Verify soft delete works correctly (author only).

**Steps**:
1. Create a review (from T018)
2. Delete the review:
   ```bash
   curl -X DELETE http://localhost:3000/api/reviews/$REVIEW_ID \
     -H "Authorization: Bearer <token>"
   ```
3. Verify:
   - Response returns 200 OK or 204 No Content
   - Review no longer appears in feed
   - Attempting to GET the review returns 404
   - Database record has status=DELETED and deletedAt timestamp
4. Test authorization:
   ```bash
   # Try to delete another user's review
   curl -X DELETE http://localhost:3000/api/reviews/<other-user-review-id> \
     -H "Authorization: Bearer <token>"
   # Should return 403 Forbidden
   ```

**Files**: N/A (testing only)

**Parallel?**: No (depends on T018)

**Validation**:
```bash
# Check database record
psql $DATABASE_URL -c "SELECT id, status, \"deletedAt\" FROM reviews WHERE id='$REVIEW_ID';"
```

---

## Test Strategy

**Unit Tests**:
- ReviewsService methods (getFeed, getReview, createReview, updateReview, deleteReview)
- Mock PrismaService with jest
- Test pagination logic (hasMore calculation)
- Test soft delete logic

**Integration Tests**:
- E2E tests for all endpoints
- Test with real database (test environment)
- Test authentication and authorization
- Test N+1 query prevention (use Prisma query logging)

**Performance Tests**:
- Measure feed endpoint response time with 1000+ reviews
- Verify index usage with EXPLAIN ANALYZE
- Target: <200ms p95

## Risks & Mitigations

**Risk 1: N+1 query problem**
- **Impact**: Slow feed queries, database overload
- **Mitigation**: Use Prisma `include` for relations, enable query logging, monitor with APM
- **Validation**: Check query count with Prisma debug logs

**Risk 2: Performance degradation with large datasets**
- **Impact**: Slow feed queries as reviews grow
- **Mitigation**: Composite index on (status, publishedAt DESC), limit max page size to 50
- **Monitor**: Query performance in production, add database monitoring

**Risk 3: Soft delete exposing data**
- **Impact**: Deleted reviews still accessible via direct queries
- **Mitigation**: Always filter by status != DELETED, add application-level checks
- **Recovery**: Add database trigger to prevent accidental exposure

**Risk 4: Concurrent update conflicts**
- **Impact**: Lost updates when multiple requests update same review
- **Mitigation**: Use Prisma optimistic locking (version field), handle conflicts gracefully
- **Recovery**: Implement retry logic on version mismatch

## Definition of Done Checklist

- [ ] All subtasks T008-T020 completed and validated
- [ ] ReviewsModule, controller, service, and DTOs created
- [ ] GET /reviews/feed endpoint returns paginated reviews with relations
- [ ] GET /reviews/:id endpoint returns full review details
- [ ] POST /reviews endpoint creates review (authenticated only)
- [ ] PATCH /reviews/:id endpoint updates review (author only)
- [ ] DELETE /reviews/:id endpoint soft-deletes review (author only)
- [ ] All endpoints validate input with class-validator
- [ ] N+1 queries prevented with Prisma `include`
- [ ] Composite index on (status, publishedAt DESC) exists
- [ ] Feed endpoint response time <200ms (p95)
- [ ] Unit tests pass for all service methods
- [ ] Integration tests pass for all endpoints
- [ ] Authorization checks work (403 for non-authors)
- [ ] Soft delete works correctly (status=DELETED, not in feed)
- [ ] ReviewsModule registered in app.module.ts
- [ ] TypeScript compilation passes: `pnpm --filter backend type-check`

## Review Guidance

**Key Acceptance Checkpoints**:
1. **API Completeness**: All 5 endpoints implemented and tested
2. **Performance**: Feed endpoint <200ms p95 with index usage verified
3. **Security**: Authentication and authorization working correctly
4. **Data Integrity**: Soft delete working, no data leaks

**Reviewer Should Verify**:
- [ ] Test GET /reviews/feed - returns paginated results
- [ ] Test GET /reviews/:id - returns full review
- [ ] Test POST /reviews - creates review (auth required)
- [ ] Test PATCH /reviews/:id - updates review (author only)
- [ ] Test DELETE /reviews/:id - soft deletes review (author only)
- [ ] Check Prisma query logs - verify no N+1 queries
- [ ] Check database - verify composite index exists
- [ ] Run `pnpm --filter backend type-check` - passes

## Activity Log

- 2025-11-08T17:52:47Z – system – lane=planned – Prompt created.

---

### Next Steps After Completion

Once WP02 is done, the following work packages can proceed in parallel:
- **WP03**: Backend - Books Module (depends on DB schema)
- **WP04**: Backend - Likes & Bookmarks Modules (depends on DB schema and WP02)
- **WP05**: Frontend - Feed Store & API Client (can start after WP02 is deployed)

---
work_package_id: 'WP04'
subtasks:
  - 'T035'
  - 'T036'
  - 'T037'
  - 'T038'
  - 'T039'
  - 'T040'
  - 'T041'
  - 'T042'
  - 'T043'
  - 'T044'
  - 'T045'
  - 'T046'
  - 'T047'
  - 'T048'
title: 'Backend - Likes & Bookmarks Modules'
phase: 'Phase 1 - Foundation'
lane: 'doing'
assignee: ''
agent: 'claude'
shell_pid: '31753'
history:
  - timestamp: '2025-11-08T17:52:47Z'
    lane: 'planned'
    agent: 'system'
    shell_pid: ''
    action: 'Prompt generated via /spec-kitty.tasks'
---

# Work Package Prompt: WP04 – Backend - Likes & Bookmarks Modules

## Objectives & Success Criteria

**Goal**: Implement Likes and Bookmarks toggle APIs with transaction-safe likeCount/bookmarkCount updates.

**Success Criteria**:

- [ ] POST /api/reviews/:id/like toggles like state and updates count
- [ ] GET /api/reviews/:id/likes returns user list who liked
- [ ] GET /api/users/me/likes returns user's liked reviews
- [ ] POST /api/reviews/:id/bookmark toggles bookmark state and updates count
- [ ] GET /api/users/me/bookmarks returns user's bookmarked reviews
- [ ] DELETE /api/bookmarks/:id removes specific bookmark
- [ ] All toggle operations use Prisma transactions
- [ ] likeCount/bookmarkCount synchronized with actual records
- [ ] Unique constraints prevent duplicate likes/bookmarks
- [ ] Authentication guards protect all endpoints
- [ ] Both modules registered in app.module.ts

## Context & Constraints

**Related Documents**:

- `kitty-specs/002-feature/contracts/likes-api.md` - Likes API specification
- `kitty-specs/002-feature/contracts/bookmarks-api.md` - Bookmarks API specification
- `kitty-specs/002-feature/data-model.md` - Like and Bookmark model schemas

**Constraints**:

- Prisma transactions required for count synchronization
- Toggle behavior: idempotent operations (create if not exists, delete if exists)
- Unique constraint: (userId, reviewId) per table
- Soft-deleted reviews cannot be liked/bookmarked
- Count fields must always match actual record counts

**Architectural Decisions**:

- Separate modules for Likes and Bookmarks (similar patterns)
- Transaction-safe increment/decrement for counts
- Return both state (isLiked/isBookmarked) and count in response

## Subtasks & Detailed Guidance

### Subtask T035 – Create likes.module.ts

**Purpose**: Define Likes module with controllers and services.

**Steps**:

1. Create file: `packages/backend/src/likes/likes.module.ts`
2. Define module:

   ```typescript
   import { Module } from '@nestjs/common';
   import { LikesController } from './likes.controller';
   import { LikesService } from './likes.service';
   import { PrismaModule } from '../prisma/prisma.module';

   @Module({
     imports: [PrismaModule],
     controllers: [LikesController],
     providers: [LikesService],
     exports: [LikesService],
   })
   export class LikesModule {}
   ```

**Files**: `packages/backend/src/likes/likes.module.ts`

**Parallel?**: Yes (can proceed in parallel with Bookmarks module)

---

### Subtask T036 – Create likes.controller.ts

**Purpose**: Define REST API endpoints for likes.

**Steps**:

1. Create file: `packages/backend/src/likes/likes.controller.ts`
2. Define controller:

   ```typescript
   import {
     Controller,
     Post,
     Get,
     Param,
     Query,
     UseGuards,
     Req,
   } from '@nestjs/common';
   import { AuthGuard } from '@nestjs/passport';
   import { LikesService } from './likes.service';

   @Controller()
   export class LikesController {
     constructor(private readonly likesService: LikesService) {}

     @Post('reviews/:reviewId/like')
     @UseGuards(AuthGuard('jwt'))
     async toggleLike(@Param('reviewId') reviewId: string, @Req() req) {
       return this.likesService.toggleLike(reviewId, req.user.id);
     }

     @Get('reviews/:reviewId/likes')
     async getReviewLikes(
       @Param('reviewId') reviewId: string,
       @Query('page') page = 0,
       @Query('limit') limit = 20
     ) {
       return this.likesService.getReviewLikes(reviewId, { page, limit });
     }

     @Get('users/me/likes')
     @UseGuards(AuthGuard('jwt'))
     async getUserLikes(
       @Req() req,
       @Query('page') page = 0,
       @Query('limit') limit = 20
     ) {
       return this.likesService.getUserLikes(req.user.id, { page, limit });
     }
   }
   ```

**Files**: `packages/backend/src/likes/likes.controller.ts`

**Parallel?**: Yes (after T035)

---

### Subtask T037 – Create likes.service.ts

**Purpose**: Implement business logic for like operations with Prisma transactions.

**Steps**:

1. Create file: `packages/backend/src/likes/likes.service.ts`
2. Implement toggle method:

   ```typescript
   import {
     Injectable,
     NotFoundException,
     UnprocessableEntityException,
   } from '@nestjs/common';
   import { PrismaService } from '../prisma/prisma.service';

   @Injectable()
   export class LikesService {
     constructor(private prisma: PrismaService) {}

     async toggleLike(reviewId: string, userId: string) {
       // Check if review exists and is not deleted
       const review = await this.prisma.review.findUnique({
         where: { id: reviewId },
       });

       if (!review) {
         throw new NotFoundException('독후감을 찾을 수 없습니다');
       }

       if (review.status === 'DELETED') {
         throw new UnprocessableEntityException(
           '삭제된 독후감에는 좋아요를 할 수 없습니다'
         );
       }

       // Check if like exists
       const existingLike = await this.prisma.like.findUnique({
         where: {
           userId_reviewId: {
             userId,
             reviewId,
           },
         },
       });

       let isLiked: boolean;
       let likeCount: number;

       if (existingLike) {
         // Unlike: Delete like and decrement count
         await this.prisma.$transaction([
           this.prisma.like.delete({
             where: { id: existingLike.id },
           }),
           this.prisma.review.update({
             where: { id: reviewId },
             data: { likeCount: { decrement: 1 } },
           }),
         ]);

         isLiked = false;
         likeCount = review.likeCount - 1;
       } else {
         // Like: Create like and increment count
         await this.prisma.$transaction([
           this.prisma.like.create({
             data: {
               userId,
               reviewId,
             },
           }),
           this.prisma.review.update({
             where: { id: reviewId },
             data: { likeCount: { increment: 1 } },
           }),
         ]);

         isLiked = true;
         likeCount = review.likeCount + 1;
       }

       return {
         data: {
           isLiked,
           likeCount,
         },
         meta: {
           timestamp: new Date().toISOString(),
         },
       };
     }

     async getReviewLikes(
       reviewId: string,
       pagination: { page: number; limit: number }
     ) {
       const review = await this.prisma.review.findUnique({
         where: { id: reviewId },
       });
       if (!review) {
         throw new NotFoundException('독후감을 찾을 수 없습니다');
       }

       const { page, limit } = pagination;
       const skip = page * limit;

       const likes = await this.prisma.like.findMany({
         where: { reviewId },
         include: {
           user: {
             select: { id: true, name: true, profileImage: true },
           },
         },
         orderBy: {
           createdAt: 'desc',
         },
         skip,
         take: limit + 1,
       });

       const hasMore = likes.length > limit;
       const data = hasMore ? likes.slice(0, limit) : likes;

       const total = await this.prisma.like.count({
         where: { reviewId },
       });

       return {
         data,
         meta: {
           page,
           limit,
           total,
           hasMore,
           timestamp: new Date().toISOString(),
         },
       };
     }

     async getUserLikes(
       userId: string,
       pagination: { page: number; limit: number }
     ) {
       const { page, limit } = pagination;
       const skip = page * limit;

       const likes = await this.prisma.like.findMany({
         where: { userId },
         include: {
           review: {
             include: {
               user: {
                 select: { id: true, name: true, profileImage: true },
               },
               book: {
                 select: {
                   id: true,
                   title: true,
                   author: true,
                   coverImageUrl: true,
                 },
               },
             },
           },
         },
         orderBy: {
           createdAt: 'desc',
         },
         skip,
         take: limit + 1,
       });

       const hasMore = likes.length > limit;
       const data = hasMore ? likes.slice(0, limit) : likes;

       // Map and truncate review content
       const mappedData = data.map((like) => ({
         ...like,
         review: {
           ...like.review,
           content: like.review.content.substring(0, 150),
         },
       }));

       const total = await this.prisma.like.count({
         where: { userId },
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

**Files**: `packages/backend/src/likes/likes.service.ts`

**Parallel?**: No (depends on T035, T036)

**Notes**:

- Use `$transaction` for atomic operations
- Use `increment/decrement` for count updates (race condition safe)
- Unique constraint on (userId, reviewId) prevents duplicate likes

---

### Subtask T038 – Create bookmarks.module.ts

**Purpose**: Define Bookmarks module with controllers and services.

**Steps**:

1. Create file: `packages/backend/src/bookmarks/bookmarks.module.ts`
2. Define module:

   ```typescript
   import { Module } from '@nestjs/common';
   import { BookmarksController } from './bookmarks.controller';
   import { BookmarksService } from './bookmarks.service';
   import { PrismaModule } from '../prisma/prisma.module';

   @Module({
     imports: [PrismaModule],
     controllers: [BookmarksController],
     providers: [BookmarksService],
     exports: [BookmarksService],
   })
   export class BookmarksModule {}
   ```

**Files**: `packages/backend/src/bookmarks/bookmarks.module.ts`

**Parallel?**: Yes (can proceed in parallel with Likes module)

---

### Subtask T039 – Create bookmarks.controller.ts

**Purpose**: Define REST API endpoints for bookmarks.

**Steps**:

1. Create file: `packages/backend/src/bookmarks/bookmarks.controller.ts`
2. Define controller:

   ```typescript
   import {
     Controller,
     Post,
     Get,
     Delete,
     Param,
     Query,
     UseGuards,
     Req,
   } from '@nestjs/common';
   import { AuthGuard } from '@nestjs/passport';
   import { BookmarksService } from './bookmarks.service';

   @Controller()
   export class BookmarksController {
     constructor(private readonly bookmarksService: BookmarksService) {}

     @Post('reviews/:reviewId/bookmark')
     @UseGuards(AuthGuard('jwt'))
     async toggleBookmark(@Param('reviewId') reviewId: string, @Req() req) {
       return this.bookmarksService.toggleBookmark(reviewId, req.user.id);
     }

     @Get('users/me/bookmarks')
     @UseGuards(AuthGuard('jwt'))
     async getUserBookmarks(
       @Req() req,
       @Query('page') page = 0,
       @Query('limit') limit = 20
     ) {
       return this.bookmarksService.getUserBookmarks(req.user.id, {
         page,
         limit,
       });
     }

     @Delete('bookmarks/:id')
     @UseGuards(AuthGuard('jwt'))
     async deleteBookmark(@Param('id') id: string, @Req() req) {
       return this.bookmarksService.deleteBookmark(id, req.user.id);
     }
   }
   ```

**Files**: `packages/backend/src/bookmarks/bookmarks.controller.ts`

**Parallel?**: Yes (after T038)

---

### Subtask T040 – Create bookmarks.service.ts

**Purpose**: Implement business logic for bookmark operations with Prisma transactions.

**Steps**:

1. Create file: `packages/backend/src/bookmarks/bookmarks.service.ts`
2. Implement toggle method:

   ```typescript
   import {
     Injectable,
     NotFoundException,
     ForbiddenException,
     UnprocessableEntityException,
   } from '@nestjs/common';
   import { PrismaService } from '../prisma/prisma.service';

   @Injectable()
   export class BookmarksService {
     constructor(private prisma: PrismaService) {}

     async toggleBookmark(reviewId: string, userId: string) {
       // Check if review exists and is not deleted
       const review = await this.prisma.review.findUnique({
         where: { id: reviewId },
       });

       if (!review) {
         throw new NotFoundException('독후감을 찾을 수 없습니다');
       }

       if (review.status === 'DELETED') {
         throw new UnprocessableEntityException(
           '삭제된 독후감은 북마크할 수 없습니다'
         );
       }

       // Check if bookmark exists
       const existingBookmark = await this.prisma.bookmark.findUnique({
         where: {
           userId_reviewId: {
             userId,
             reviewId,
           },
         },
       });

       let isBookmarked: boolean;
       let bookmarkCount: number;

       if (existingBookmark) {
         // Remove bookmark: Delete bookmark and decrement count
         await this.prisma.$transaction([
           this.prisma.bookmark.delete({
             where: { id: existingBookmark.id },
           }),
           this.prisma.review.update({
             where: { id: reviewId },
             data: { bookmarkCount: { decrement: 1 } },
           }),
         ]);

         isBookmarked = false;
         bookmarkCount = review.bookmarkCount - 1;
       } else {
         // Add bookmark: Create bookmark and increment count
         await this.prisma.$transaction([
           this.prisma.bookmark.create({
             data: {
               userId,
               reviewId,
             },
           }),
           this.prisma.review.update({
             where: { id: reviewId },
             data: { bookmarkCount: { increment: 1 } },
           }),
         ]);

         isBookmarked = true;
         bookmarkCount = review.bookmarkCount + 1;
       }

       return {
         data: {
           isBookmarked,
           bookmarkCount,
         },
         meta: {
           timestamp: new Date().toISOString(),
         },
       };
     }

     async getUserBookmarks(
       userId: string,
       pagination: { page: number; limit: number }
     ) {
       const { page, limit } = pagination;
       const skip = page * limit;

       const bookmarks = await this.prisma.bookmark.findMany({
         where: { userId },
         include: {
           review: {
             include: {
               user: {
                 select: { id: true, name: true, profileImage: true },
               },
               book: {
                 select: {
                   id: true,
                   title: true,
                   author: true,
                   coverImageUrl: true,
                 },
               },
             },
           },
         },
         orderBy: {
           createdAt: 'desc',
         },
         skip,
         take: limit + 1,
       });

       const hasMore = bookmarks.length > limit;
       const data = hasMore ? bookmarks.slice(0, limit) : bookmarks;

       // Map and truncate review content
       const mappedData = data.map((bookmark) => ({
         ...bookmark,
         review: {
           ...bookmark.review,
           content: bookmark.review.content.substring(0, 150),
         },
       }));

       const total = await this.prisma.bookmark.count({
         where: { userId },
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

     async deleteBookmark(id: string, userId: string) {
       const bookmark = await this.prisma.bookmark.findUnique({
         where: { id },
         include: { review: true },
       });

       if (!bookmark) {
         throw new NotFoundException('북마크를 찾을 수 없습니다');
       }

       if (bookmark.userId !== userId) {
         throw new ForbiddenException('본인의 북마크만 삭제할 수 있습니다');
       }

       // Delete bookmark and decrement count
       await this.prisma.$transaction([
         this.prisma.bookmark.delete({
           where: { id },
         }),
         this.prisma.review.update({
           where: { id: bookmark.reviewId },
           data: { bookmarkCount: { decrement: 1 } },
         }),
       ]);

       return {
         meta: {
           timestamp: new Date().toISOString(),
         },
       };
     }
   }
   ```

**Files**: `packages/backend/src/bookmarks/bookmarks.service.ts`

**Parallel?**: No (depends on T038, T039)

---

### Subtask T041 – Implement POST /reviews/:id/like toggle

**Purpose**: Test like toggle functionality.

**Steps**:

1. Start backend server
2. Create a review for testing:
   ```bash
   REVIEW_ID=$(curl -X POST http://localhost:3000/api/reviews ... | jq -r '.data.id')
   ```
3. Test like toggle:

   ```bash
   # First request: Add like
   curl -X POST http://localhost:3000/api/reviews/$REVIEW_ID/like \
     -H "Authorization: Bearer <token>"
   # Response: {"data":{"isLiked":true,"likeCount":1},...}

   # Second request: Remove like
   curl -X POST http://localhost:3000/api/reviews/$REVIEW_ID/like \
     -H "Authorization: Bearer <token>"
   # Response: {"data":{"isLiked":false,"likeCount":0},...}
   ```

4. Verify database:
   ```bash
   psql $DATABASE_URL -c "SELECT * FROM likes WHERE \"reviewId\"='$REVIEW_ID';"
   psql $DATABASE_URL -c "SELECT \"likeCount\" FROM reviews WHERE id='$REVIEW_ID';"
   ```

**Files**: N/A (testing only)

**Parallel?**: No (depends on T035-T037)

---

### Subtask T042 – Implement GET /reviews/:id/likes

**Purpose**: Test like list retrieval.

**Steps**:

1. Create multiple likes on a review (different users)
2. Test like list endpoint:
   ```bash
   curl "http://localhost:3000/api/reviews/$REVIEW_ID/likes?page=0&limit=20"
   ```
3. Verify:
   - List of users who liked
   - Ordered by createdAt DESC
   - Pagination works

**Files**: N/A (testing only)

**Parallel?**: No (depends on T041)

---

### Subtask T043 – Implement GET /users/me/likes

**Purpose**: Test user's liked reviews list.

**Steps**:

1. Like multiple reviews as a user
2. Test user likes endpoint:
   ```bash
   curl -H "Authorization: Bearer <token>" \
        "http://localhost:3000/api/users/me/likes?page=0&limit=20"
   ```
3. Verify:
   - List includes review, user, book info
   - Review content truncated to 150 chars
   - Ordered by Like.createdAt DESC

**Files**: N/A (testing only)

**Parallel?**: No (depends on T041)

---

### Subtask T044 – Implement POST /reviews/:id/bookmark toggle

**Purpose**: Test bookmark toggle functionality.

**Steps**:

1. Test bookmark toggle:

   ```bash
   # First request: Add bookmark
   curl -X POST http://localhost:3000/api/reviews/$REVIEW_ID/bookmark \
     -H "Authorization: Bearer <token>"
   # Response: {"data":{"isBookmarked":true,"bookmarkCount":1},...}

   # Second request: Remove bookmark
   curl -X POST http://localhost:3000/api/reviews/$REVIEW_ID/bookmark \
     -H "Authorization: Bearer <token>"
   # Response: {"data":{"isBookmarked":false,"bookmarkCount":0},...}
   ```

2. Verify database:
   ```bash
   psql $DATABASE_URL -c "SELECT * FROM bookmarks WHERE \"reviewId\"='$REVIEW_ID';"
   psql $DATABASE_URL -c "SELECT \"bookmarkCount\" FROM reviews WHERE id='$REVIEW_ID';"
   ```

**Files**: N/A (testing only)

**Parallel?**: No (depends on T038-T040)

---

### Subtask T045 – Implement GET /users/me/bookmarks

**Purpose**: Test user's bookmarked reviews list.

**Steps**:

1. Bookmark multiple reviews as a user
2. Test user bookmarks endpoint:
   ```bash
   curl -H "Authorization: Bearer <token>" \
        "http://localhost:3000/api/users/me/bookmarks?page=0&limit=20"
   ```
3. Verify:
   - List includes review, user, book info
   - Review content truncated to 150 chars
   - Ordered by Bookmark.createdAt DESC

**Files**: N/A (testing only)

**Parallel?**: No (depends on T044)

---

### Subtask T046 – Implement DELETE /bookmarks/:id

**Purpose**: Test direct bookmark deletion.

**Steps**:

1. Create a bookmark:
   ```bash
   curl -X POST http://localhost:3000/api/reviews/$REVIEW_ID/bookmark \
     -H "Authorization: Bearer <token>"
   ```
2. Get bookmark ID:
   ```bash
   BOOKMARK_ID=$(curl -H "Authorization: Bearer <token>" \
     "http://localhost:3000/api/users/me/bookmarks" | jq -r '.data[0].id')
   ```
3. Test delete:
   ```bash
   curl -X DELETE http://localhost:3000/api/bookmarks/$BOOKMARK_ID \
     -H "Authorization: Bearer <token>"
   # Response: 204 No Content or {"meta":{...}}
   ```
4. Verify:
   - Bookmark removed from database
   - Review.bookmarkCount decremented

**Files**: N/A (testing only)

**Parallel?**: No (depends on T045)

---

### Subtask T047 – Add Likes and Bookmarks modules to app.module.ts

**Purpose**: Register both modules in main application module.

**Steps**:

1. Open `packages/backend/src/app.module.ts`
2. Import modules:
   ```typescript
   import { LikesModule } from './likes/likes.module';
   import { BookmarksModule } from './bookmarks/bookmarks.module';
   ```
3. Add to imports array:
   ```typescript
   @Module({
     imports: [
       // ... existing modules
       LikesModule,
       BookmarksModule,
     ],
   })
   export class AppModule {}
   ```

**Files**: `packages/backend/src/app.module.ts`

**Parallel?**: No (final integration step)

---

### Subtask T048 – Add authentication guards

**Purpose**: Verify all endpoints have proper authentication.

**Steps**:

1. Review all endpoints in controllers
2. Verify `@UseGuards(AuthGuard('jwt'))` applied to:
   - POST /reviews/:id/like
   - GET /users/me/likes
   - POST /reviews/:id/bookmark
   - GET /users/me/bookmarks
   - DELETE /bookmarks/:id
3. Verify GET /reviews/:id/likes is public (no guard)
4. Test unauthorized access:
   ```bash
   # Should return 401 Unauthorized
   curl -X POST http://localhost:3000/api/reviews/$REVIEW_ID/like
   ```

**Files**: Controllers from T036, T039

**Parallel?**: No (verification step)

---

## Test Strategy

**Unit Tests**:

- LikesService methods (toggleLike, getReviewLikes, getUserLikes)
- BookmarksService methods (toggleBookmark, getUserBookmarks, deleteBookmark)
- Mock PrismaService with jest
- Test transaction rollback on errors

**Integration Tests**:

- E2E tests for all endpoints
- Test with real database (test environment)
- Test concurrent toggle operations (race conditions)
- Verify count synchronization

**Transaction Tests**:

- Test transaction atomicity (like creation + count update)
- Test rollback on failures
- Verify no partial updates

## Risks & Mitigations

**Risk 1: Race condition on concurrent toggles**

- **Impact**: Lost updates, count desynchronization
- **Mitigation**:
  - Use database-level unique constraints
  - Use Prisma transactions with increment/decrement
  - Handle 409 Conflict gracefully
- **Recovery**: Background reconciliation job to fix counts

**Risk 2: likeCount/bookmarkCount desynchronization**

- **Impact**: Incorrect counts displayed in UI
- **Mitigation**:
  - Use transactions for all operations
  - Use increment/decrement instead of manual counts
  - Add periodic reconciliation (optional)
- **Recovery**: Admin endpoint to recalculate counts

**Risk 3: Deleted reviews with orphaned likes/bookmarks**

- **Impact**: Invalid foreign key references
- **Mitigation**:
  - Soft delete reviews (don't actually delete)
  - Prevent likes/bookmarks on deleted reviews
  - Keep existing likes/bookmarks for statistics
- **Recovery**: Database cleanup script (optional)

## Definition of Done Checklist

- [ ] All subtasks T035-T048 completed and validated
- [ ] LikesModule with controller, service created
- [ ] BookmarksModule with controller, service created
- [ ] POST /reviews/:id/like toggles like state and updates count
- [ ] GET /reviews/:id/likes returns user list
- [ ] GET /users/me/likes returns user's liked reviews
- [ ] POST /reviews/:id/bookmark toggles bookmark state and updates count
- [ ] GET /users/me/bookmarks returns user's bookmarked reviews
- [ ] DELETE /bookmarks/:id removes specific bookmark
- [ ] All toggle operations use Prisma $transaction
- [ ] Counts synchronized with actual records (verified in DB)
- [ ] Unique constraints prevent duplicate likes/bookmarks
- [ ] Authentication guards protect all endpoints
- [ ] Both modules registered in app.module.ts
- [ ] Unit tests pass for all service methods
- [ ] Integration tests pass for all endpoints
- [ ] Race condition tests pass
- [ ] TypeScript compilation passes: `pnpm --filter backend type-check`

## Review Guidance

**Key Acceptance Checkpoints**:

1. **Toggle Functionality**: Like and bookmark toggles work correctly
2. **Transaction Safety**: Counts always synchronized with records
3. **Authorization**: Only authenticated users can like/bookmark
4. **Data Integrity**: Unique constraints and soft delete checks work

**Reviewer Should Verify**:

- [ ] Test POST /reviews/:id/like - toggles like state
- [ ] Test GET /reviews/:id/likes - returns user list
- [ ] Test GET /users/me/likes - returns user's liked reviews
- [ ] Test POST /reviews/:id/bookmark - toggles bookmark state
- [ ] Test GET /users/me/bookmarks - returns user's bookmarked reviews
- [ ] Test DELETE /bookmarks/:id - removes bookmark
- [ ] Check database - counts match actual records
- [ ] Test concurrent toggles - no race conditions
- [ ] Test deleted reviews - cannot be liked/bookmarked
- [ ] Run `pnpm --filter backend type-check` - passes

## Activity Log

- 2025-11-08T17:52:47Z – system – lane=planned – Prompt created.

---

### Next Steps After Completion

Once WP04 is done, the following work packages can proceed:

- **WP05**: Frontend - Feed Store & API Client (depends on WP02, WP03, WP04)
- Backend foundation complete, frontend can begin integration
- 2025-11-09T00:05:17Z – claude – shell_pid=31753 – lane=doing – Started WP04 Likes & Bookmarks implementation

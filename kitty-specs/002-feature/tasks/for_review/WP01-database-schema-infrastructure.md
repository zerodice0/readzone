---
work_package_id: 'WP01'
subtasks:
  - 'T001'
  - 'T002'
  - 'T003'
  - 'T004'
  - 'T005'
  - 'T006'
  - 'T007'
title: 'Database Schema & Infrastructure'
phase: 'Phase 1 - Foundation'
lane: "for_review"
assignee: ''
agent: "claude"
shell_pid: "51802"
history:
  - timestamp: '2025-11-08T17:52:47Z'
    lane: 'planned'
    agent: 'system'
    shell_pid: ''
    action: 'Prompt generated via /spec-kitty.tasks'
  - timestamp: '2025-11-08T22:32:50Z'
    lane: 'doing'
    agent: 'claude'
    shell_pid: '51802'
    action: 'Started implementation'
  - timestamp: '2025-11-09T07:40:00Z'
    lane: 'for_review'
    agent: 'claude'
    shell_pid: '51802'
    action: 'Completed all subtasks, moved to review'
---

# Work Package Prompt: WP01 – Database Schema & Infrastructure

## Objectives & Success Criteria

**Goal**: Establish database foundation with Book, Review, Like, Bookmark entities and all necessary relations, enums, and indexes.

**Success Criteria**:
- [ ] Prisma schema includes all 4 new models (Book, Review, Like, Bookmark) with correct field types
- [ ] All 3 enums (ExternalSource, ReadStatus, ReviewStatus) are defined
- [ ] Existing User model updated with new relations (reviews, likes, bookmarks)
- [ ] All indexes from data-model.md are implemented
- [ ] Migration applies cleanly on fresh PostgreSQL database
- [ ] Prisma Client regenerates without errors
- [ ] Seed script creates sample data (at least 3 books, 10 reviews)
- [ ] Migration rollback works correctly

## Context & Constraints

**Related Documents**:
- `kitty-specs/002-feature/data-model.md` - Complete schema specification
- `kitty-specs/002-feature/plan.md` - Technical stack (Prisma 6.19.0, PostgreSQL)
- `kitty-specs/002-feature/contracts/` - API contracts showing data requirements

**Constraints**:
- Must not break existing User, Session, OAuth, MFA, AuditLog tables
- All new foreign keys must use `onDelete: Cascade` or `Restrict` appropriately
- Performance-critical indexes must be created (feed query optimization)
- Seed data must be realistic for testing API responses

**Architectural Decisions**:
- Soft delete pattern for reviews (status=DELETED, deletedAt timestamp)
- Denormalized likeCount/bookmarkCount in Review for query performance
- Book caching strategy (external API → internal DB)

## Subtasks & Detailed Guidance

### Subtask T001 – Update schema.prisma with new models

**Purpose**: Add Book, Review, Like, Bookmark models to Prisma schema per data-model.md specification.

**Steps**:
1. Open `packages/backend/prisma/schema.prisma`
2. Locate the existing User model section
3. Below existing models, add the following sections in order:
   - Book model (with all fields from data-model.md)
   - Review model (with User and Book relations)
   - Like model (with User and Review relations)
   - Bookmark model (with User and Review relations)
4. Copy the exact schema from `kitty-specs/002-feature/data-model.md` lines 193-311
5. Ensure all `@map()` directives match (books, reviews, likes, bookmarks)
6. Validate field types match TypeScript usage (String for UUID, Int for counts, DateTime for timestamps)

**Files**: `packages/backend/prisma/schema.prisma`

**Parallel?**: No (prerequisite for all other subtasks)

**Notes**:
- Pay attention to `@db.Text` for long content fields (Review.content, Book.description)
- Nullable fields use `?` suffix (e.g., `isbn String?`)
- Default values use `@default()` directive

**Validation**:
```bash
pnpm prisma format  # Auto-formats schema
pnpm prisma validate  # Checks for errors
```

---

### Subtask T002 – Add enums to schema

**Purpose**: Define ExternalSource, ReadStatus, ReviewStatus enums for type safety.

**Steps**:
1. In `schema.prisma`, add enum definitions before the model definitions
2. Add ExternalSource enum:
   ```prisma
   enum ExternalSource {
     GOOGLE_BOOKS
     ALADIN
     MANUAL
   }
   ```
3. Add ReadStatus enum:
   ```prisma
   enum ReadStatus {
     READING
     COMPLETED
     DROPPED
   }
   ```
4. Add ReviewStatus enum:
   ```prisma
   enum ReviewStatus {
     DRAFT
     PUBLISHED
     DELETED
   }
   ```
5. Ensure Review model references these enums:
   - `readStatus: ReadStatus`
   - `status: ReviewStatus`
   - Book model: `externalSource: ExternalSource?`

**Files**: `packages/backend/prisma/schema.prisma`

**Parallel?**: No (part of schema definition)

**Notes**:
- Enum values are uppercase by Prisma convention
- These enums will be available in Prisma Client as TypeScript types
- Review.status defaults to PUBLISHED, readStatus defaults to COMPLETED

---

### Subtask T003 – Update User model with relations

**Purpose**: Add reviews, likes, bookmarks relations to existing User model.

**Steps**:
1. Locate the existing `model User` in schema.prisma
2. Add three new relation fields at the end of the User model:
   ```prisma
   reviews    Review[]
   likes      Like[]
   bookmarks  Bookmark[]
   ```
3. Ensure these are added after existing User fields but before the closing brace
4. Verify no syntax errors (missing commas, brackets)

**Files**: `packages/backend/prisma/schema.prisma`

**Parallel?**: No (modifies existing model)

**Notes**:
- These are relation fields (no database columns created)
- They enable Prisma queries like `user.reviews()`, `user.likes()`
- Do NOT add `@relation()` directives here (they're on the other side of the relation)

**Validation**:
```bash
pnpm prisma format
pnpm prisma validate
```

---

### Subtask T004 – Generate migration

**Purpose**: Create Prisma migration file for all schema changes.

**Steps**:
1. Ensure PostgreSQL is running and accessible
2. Verify `.env` file has correct `DATABASE_URL`
3. Run migration command:
   ```bash
   cd packages/backend
   pnpm prisma migrate dev --name add-review-feed-entities
   ```
4. Review generated migration file in `packages/backend/prisma/migrations/`
5. Verify migration includes:
   - CREATE TABLE for books, reviews, likes, bookmarks
   - CREATE TYPE for enums
   - CREATE INDEX for all specified indexes
   - ALTER TABLE for User relations (if applicable)
6. If migration looks incorrect, reset and regenerate:
   ```bash
   pnpm prisma migrate reset  # WARNING: Drops all data
   pnpm prisma migrate dev --name add-review-feed-entities
   ```

**Files**: `packages/backend/prisma/migrations/<timestamp>_add-review-feed-entities/migration.sql`

**Parallel?**: No (database operation)

**Notes**:
- Migration will auto-apply to local database
- Save migration file for production deployment
- Migration is idempotent (safe to re-run)
- Review SQL before committing

**Validation**:
```bash
psql $DATABASE_URL -c "\dt"  # List tables
psql $DATABASE_URL -c "\d reviews"  # Describe reviews table
```

---

### Subtask T005 – Regenerate Prisma Client

**Purpose**: Generate TypeScript types and query API for new models.

**Steps**:
1. Run Prisma Client generation:
   ```bash
   cd packages/backend
   pnpm prisma generate
   ```
2. Verify success message: "Generated Prisma Client"
3. Check that `node_modules/.prisma/client/` contains new types
4. Verify TypeScript compilation still works:
   ```bash
   pnpm type-check
   ```
5. Test importing new models in TypeScript:
   ```typescript
   import { PrismaClient, Book, Review, Like, Bookmark } from '@prisma/client';
   ```

**Files**: `node_modules/.prisma/client/` (generated)

**Parallel?**: No (depends on T004)

**Notes**:
- Prisma Client is generated into node_modules (not committed)
- Types are automatically available after generation
- If types don't appear in IDE, restart TypeScript server

**Validation**:
```bash
pnpm prisma studio  # Opens visual database browser
```

---

### Subtask T006 – Update seed.ts with sample data

**Purpose**: Create seed script for realistic test data (books and reviews).

**Steps**:
1. Open `packages/backend/prisma/seed.ts`
2. Add sample books (at least 3):
   ```typescript
   const book1 = await prisma.book.create({
     data: {
       isbn: '9788936433598',
       title: '채식주의자',
       author: '한강',
       publisher: '창비',
       publishedDate: new Date('2007-10-30'),
       coverImageUrl: 'https://image.aladin.co.kr/product/...',
       description: '채식주의자는 한강의 장편소설이다...',
       pageCount: 192,
       language: 'ko',
       externalSource: 'ALADIN',
       externalId: 'K432433598',
     },
   });
   ```
3. Add sample reviews (at least 10) referencing existing users and created books:
   ```typescript
   await prisma.review.create({
     data: {
       userId: user1.id,  // Assume user1 exists from existing seed
       bookId: book1.id,
       title: '충격적이고 아름다운 이야기',
       content: '한강 작가의 문체는 정말 독특하다. 채식주의자라는 주제를...',
       rating: 5,
       isRecommended: true,
       readStatus: 'COMPLETED',
       status: 'PUBLISHED',
       publishedAt: new Date(),
     },
   });
   ```
4. Add variety in data:
   - Different readStatus values (READING, COMPLETED, DROPPED)
   - Mix of ratings (1-5)
   - Both recommended and not recommended reviews
   - Some reviews with null rating
   - At least one DRAFT status review
5. Run seed script:
   ```bash
   pnpm db:seed
   ```

**Files**: `packages/backend/prisma/seed.ts`

**Parallel?**: No (depends on T004, T005)

**Notes**:
- Seed data should be idempotent (check for existing data first)
- Use realistic Korean book titles and content
- Vary publishedAt dates to test time sorting
- Ensure at least one user from existing seed has reviews

**Validation**:
```bash
pnpm prisma studio  # View seeded data visually
psql $DATABASE_URL -c "SELECT COUNT(*) FROM reviews;"
```

---

### Subtask T007 – Verify migrations on clean database

**Purpose**: Test migration robustness and rollback capability.

**Steps**:
1. Backup current database (if needed):
   ```bash
   pg_dump $DATABASE_URL > backup.sql
   ```
2. Reset database and re-apply migrations:
   ```bash
   cd packages/backend
   pnpm prisma migrate reset --force
   ```
3. Verify all tables exist:
   ```bash
   psql $DATABASE_URL -c "\dt"
   ```
4. Check indexes:
   ```bash
   psql $DATABASE_URL -c "\d reviews"  # Should show indexes
   ```
5. Verify foreign keys:
   ```bash
   psql $DATABASE_URL -c "\d reviews" | grep FOREIGN
   ```
6. Test seed script:
   ```bash
   pnpm db:seed
   ```
7. Query sample data:
   ```bash
   psql $DATABASE_URL -c "SELECT r.id, r.title, b.title as book, u.name as author FROM reviews r JOIN books b ON r.\"bookId\" = b.id JOIN users u ON r.\"userId\" = u.id LIMIT 5;"
   ```

**Files**: N/A (verification only)

**Parallel?**: No (final validation)

**Notes**:
- This verifies clean-slate migration works
- Critical for production deployment readiness
- Test rollback if needed: `pnpm prisma migrate rollback`

**Validation Checklist**:
- [ ] All 4 new tables created
- [ ] All 3 enums exist
- [ ] User model has new relations
- [ ] All indexes created (check with `\d table_name`)
- [ ] Foreign keys enforced
- [ ] Seed data loads without errors
- [ ] Sample queries return expected results

---

## Test Strategy (include only when tests are required)

**Not applicable for this work package** - Database setup is validated through manual verification and seed script execution.

## Risks & Mitigations

**Risk 1: Migration conflicts with existing schema**
- **Impact**: Migration fails, existing data at risk
- **Mitigation**: Test on fresh database first, backup production data, use staging environment
- **Rollback**: `pnpm prisma migrate rollback` or restore from backup

**Risk 2: Index performance not as expected**
- **Impact**: Slow feed queries despite indexes
- **Mitigation**: Use EXPLAIN ANALYZE to validate index usage, adjust indexes if needed
- **Monitor**: Query performance in development, tune before production

**Risk 3: Seed data conflicts or validation errors**
- **Impact**: Cannot load test data, blocks frontend development
- **Mitigation**: Make seed script idempotent (check existing data), use try-catch blocks
- **Recovery**: Reset database and fix seed script

**Risk 4: Prisma Client generation fails**
- **Impact**: TypeScript compilation breaks, backend cannot start
- **Mitigation**: Validate schema before generating, check Prisma version compatibility
- **Recovery**: Fix schema errors, regenerate client

## Definition of Done Checklist

- [ ] All subtasks T001-T007 completed and validated
- [ ] Prisma schema includes Book, Review, Like, Bookmark models with all fields from data-model.md
- [ ] All 3 enums defined and used correctly
- [ ] User model updated with new relations
- [ ] Migration generated and applied successfully on clean database
- [ ] All indexes created (verify with `\d table_name`)
- [ ] Prisma Client regenerated without errors
- [ ] Seed script creates at least 3 books and 10 reviews
- [ ] Sample queries return expected data
- [ ] Migration rollback tested and works
- [ ] Schema validation passes: `pnpm prisma validate`
- [ ] TypeScript compilation passes: `pnpm type-check`
- [ ] Committed migration file to git
- [ ] Updated `tasks.md` with WP01 completion status

## Review Guidance

**Key Acceptance Checkpoints**:
1. **Schema Completeness**: All models, fields, enums from data-model.md present
2. **Index Coverage**: All performance-critical indexes created
3. **Data Integrity**: Foreign keys and unique constraints enforced
4. **Seed Data Quality**: Realistic, varied, sufficient for frontend development
5. **Migration Safety**: Clean application on fresh database, rollback tested

**Reviewer Should Verify**:
- [ ] Run `pnpm prisma validate` - passes
- [ ] Run `pnpm prisma studio` - all 4 new tables visible
- [ ] Query sample review with joins: `SELECT * FROM reviews JOIN books ON reviews."bookId" = books.id LIMIT 1;`
- [ ] Check index exists: `\d reviews` shows `reviews_status_publishedAt_idx`
- [ ] Verify enum values: `SELECT enum_range(NULL::review_status);`

## Activity Log

- 2025-11-08T17:52:47Z – system – lane=planned – Prompt created.

---

### Next Steps After Completion

Once WP01 is done, the following work packages can proceed in parallel:
- **WP02**: Backend - Reviews Module (depends on DB schema)
- **WP03**: Backend - Books Module (depends on DB schema)
- **WP04**: Backend - Likes & Bookmarks Modules (depends on DB schema)
- 2025-11-08T22:32:50Z – claude – shell_pid=51802 – lane=doing – Started implementation

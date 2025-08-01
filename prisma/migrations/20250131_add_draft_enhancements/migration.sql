-- ReadZone Draft System Enhancement Migration
-- Adding new fields for server-based draft management
-- Created: 2025-01-31
-- PRD: Enhanced Draft System v1.0

-- CreateEnum for DraftStatus
CREATE TYPE "draft_status" AS ENUM ('DRAFT', 'EXPIRED', 'ABANDONED', 'MIGRATED');

-- CreateEnum for AuditAction
CREATE TYPE "audit_action" AS ENUM ('CREATED', 'UPDATED', 'BOOK_SYNCED', 'EXPIRED', 'DELETED');

-- Add new columns to ReviewDraft table
ALTER TABLE "ReviewDraft" ADD COLUMN "bookData" TEXT;
ALTER TABLE "ReviewDraft" ADD COLUMN "status" "draft_status" NOT NULL DEFAULT 'DRAFT';
ALTER TABLE "ReviewDraft" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "ReviewDraft" ADD COLUMN "expiresAt" DATETIME NOT NULL DEFAULT (datetime('now', '+7 days'));
ALTER TABLE "ReviewDraft" ADD COLUMN "lastAccessed" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Update existing records with default values
UPDATE "ReviewDraft" SET 
  "expiresAt" = datetime('now', '+7 days'),
  "lastAccessed" = "updatedAt",
  "status" = 'DRAFT',
  "version" = 1
WHERE "expiresAt" IS NULL;

-- Drop existing indexes that will be replaced
DROP INDEX IF EXISTS "ReviewDraft_userId_idx";
DROP INDEX IF EXISTS "ReviewDraft_bookId_idx";
DROP INDEX IF EXISTS "ReviewDraft_updatedAt_idx";

-- Create optimized indexes based on query patterns
CREATE INDEX "ReviewDraft_user_drafts_timeline_idx" ON "ReviewDraft"("userId", "updatedAt" DESC);
CREATE INDEX "ReviewDraft_cleanup_queue_idx" ON "ReviewDraft"("expiresAt", "status");
CREATE INDEX "ReviewDraft_status_activity_idx" ON "ReviewDraft"("status", "lastAccessed");
CREATE INDEX "ReviewDraft_book_drafts_idx" ON "ReviewDraft"("bookId");
CREATE INDEX "ReviewDraft_user_status_idx" ON "ReviewDraft"("userId", "status");

-- Create ReviewDraftAudit table for change tracking
CREATE TABLE "review_draft_audit" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' || '4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    "draftId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" "audit_action" NOT NULL,
    "oldData" TEXT,
    "newData" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "review_draft_audit_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "ReviewDraft" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "review_draft_audit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for audit table
CREATE INDEX "review_draft_audit_draftId_createdAt_idx" ON "review_draft_audit"("draftId", "createdAt");
CREATE INDEX "review_draft_audit_userId_createdAt_idx" ON "review_draft_audit"("userId", "createdAt");

-- Add constraints for data validation
-- Content size limit (1MB)
CREATE CHECK CONSTRAINT "ReviewDraft_content_size_check" 
CHECK (length("content") <= 1048576);

-- JSON validation for metadata field
CREATE CHECK CONSTRAINT "ReviewDraft_metadata_json_check" 
CHECK (json_valid("metadata"));

-- JSON validation for bookData field  
CREATE CHECK CONSTRAINT "ReviewDraft_bookData_json_check" 
CHECK ("bookData" IS NULL OR json_valid("bookData"));

-- Version must be positive
CREATE CHECK CONSTRAINT "ReviewDraft_version_positive_check" 
CHECK ("version" > 0);

-- expiresAt must be in the future for active drafts
CREATE CHECK CONSTRAINT "ReviewDraft_expires_future_check" 
CHECK ("status" != 'DRAFT' OR "expiresAt" > CURRENT_TIMESTAMP);
-- CreateEnum
CREATE TYPE "ExternalSource" AS ENUM ('GOOGLE_BOOKS', 'ALADIN', 'MANUAL');

-- CreateEnum
CREATE TYPE "ReadStatus" AS ENUM ('READING', 'COMPLETED', 'DROPPED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'DELETED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'MFA_VERIFY';
ALTER TYPE "AuditAction" ADD VALUE 'MFA_BACKUP_REGENERATE';
ALTER TYPE "AuditAction" ADD VALUE 'OAUTH_LOGIN';
ALTER TYPE "AuditAction" ADD VALUE 'SESSION_LOGOUT';
ALTER TYPE "AuditAction" ADD VALUE 'SESSION_LOGOUT_ALL';

-- CreateTable
CREATE TABLE "books" (
    "id" TEXT NOT NULL,
    "isbn" TEXT,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "publisher" TEXT,
    "publishedDate" TIMESTAMP(3),
    "coverImageUrl" TEXT,
    "description" TEXT,
    "pageCount" INTEGER,
    "language" TEXT,
    "externalId" TEXT,
    "externalSource" "ExternalSource",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "rating" INTEGER,
    "isRecommended" BOOLEAN NOT NULL,
    "readStatus" "ReadStatus" NOT NULL DEFAULT 'COMPLETED',
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "bookmarkCount" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PUBLISHED',
    "publishedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "likes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookmarks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "books_isbn_key" ON "books"("isbn");

-- CreateIndex
CREATE INDEX "books_title_author_idx" ON "books"("title", "author");

-- CreateIndex
CREATE UNIQUE INDEX "books_externalSource_externalId_key" ON "books"("externalSource", "externalId");

-- CreateIndex
CREATE INDEX "reviews_userId_status_publishedAt_idx" ON "reviews"("userId", "status", "publishedAt");

-- CreateIndex
CREATE INDEX "reviews_bookId_status_publishedAt_idx" ON "reviews"("bookId", "status", "publishedAt");

-- CreateIndex
CREATE INDEX "reviews_status_publishedAt_idx" ON "reviews"("status", "publishedAt" DESC);

-- CreateIndex
CREATE INDEX "reviews_status_deletedAt_idx" ON "reviews"("status", "deletedAt");

-- CreateIndex
CREATE INDEX "likes_reviewId_createdAt_idx" ON "likes"("reviewId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "likes_userId_reviewId_key" ON "likes"("userId", "reviewId");

-- CreateIndex
CREATE INDEX "bookmarks_userId_createdAt_idx" ON "bookmarks"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "bookmarks_reviewId_idx" ON "bookmarks"("reviewId");

-- CreateIndex
CREATE UNIQUE INDEX "bookmarks_userId_reviewId_key" ON "bookmarks"("userId", "reviewId");

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "books"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

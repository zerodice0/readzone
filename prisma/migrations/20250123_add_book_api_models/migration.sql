-- AlterTable
ALTER TABLE "Book" ADD COLUMN "isbn13" TEXT;
ALTER TABLE "Book" ADD COLUMN "translators" TEXT;
ALTER TABLE "Book" ADD COLUMN "contents" TEXT;
ALTER TABLE "Book" ADD COLUMN "url" TEXT;
ALTER TABLE "Book" ADD COLUMN "datetime" TEXT;
ALTER TABLE "Book" ADD COLUMN "price" INTEGER;
ALTER TABLE "Book" ADD COLUMN "salePrice" INTEGER;
ALTER TABLE "Book" ADD COLUMN "status" TEXT;
ALTER TABLE "Book" ADD COLUMN "kakaoId" TEXT;
ALTER TABLE "Book" ADD COLUMN "lastSyncedAt" DATETIME;

-- CreateTable
CREATE TABLE "BookApiCache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "query" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "searchCount" INTEGER NOT NULL DEFAULT 1,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ApiUsageLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "searchCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ManualBookEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookId" TEXT NOT NULL,
    "submittedBy" TEXT NOT NULL,
    "verifiedAt" DATETIME,
    "verifiedBy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "rejectReason" TEXT,
    "originalData" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "_BookToBookApiCache" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_BookToBookApiCache_A_fkey" FOREIGN KEY ("A") REFERENCES "Book" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_BookToBookApiCache_B_fkey" FOREIGN KEY ("B") REFERENCES "BookApiCache" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "BookApiCache_query_key" ON "BookApiCache"("query");

-- CreateIndex
CREATE INDEX "BookApiCache_query_idx" ON "BookApiCache"("query");

-- CreateIndex
CREATE INDEX "BookApiCache_expiresAt_idx" ON "BookApiCache"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "ApiUsageLog_date_endpoint_key" ON "ApiUsageLog"("date", "endpoint");

-- CreateIndex
CREATE INDEX "ApiUsageLog_date_idx" ON "ApiUsageLog"("date");

-- CreateIndex
CREATE INDEX "ManualBookEntry_status_idx" ON "ManualBookEntry"("status");

-- CreateIndex
CREATE INDEX "ManualBookEntry_submittedBy_idx" ON "ManualBookEntry"("submittedBy");

-- CreateIndex
CREATE UNIQUE INDEX "_BookToBookApiCache_AB_unique" ON "_BookToBookApiCache"("A", "B");

-- CreateIndex
CREATE INDEX "_BookToBookApiCache_B_index" ON "_BookToBookApiCache"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Book_kakaoId_key" ON "Book"("kakaoId");

-- CreateIndex
CREATE INDEX "Book_title_idx" ON "Book"("title");

-- CreateIndex
CREATE INDEX "Book_isbn_idx" ON "Book"("isbn");

-- CreateIndex
CREATE INDEX "Book_isbn13_idx" ON "Book"("isbn13");
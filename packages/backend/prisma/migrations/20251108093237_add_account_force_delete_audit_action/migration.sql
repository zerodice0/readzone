-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'PASSWORD_RESET_REQUEST';
ALTER TYPE "AuditAction" ADD VALUE 'PASSWORD_RESET_REQUEST_FAILED';
ALTER TYPE "AuditAction" ADD VALUE 'EMAIL_VERIFY_REQUEST';
ALTER TYPE "AuditAction" ADD VALUE 'PROFILE_UPDATE';
ALTER TYPE "AuditAction" ADD VALUE 'ACCOUNT_FORCE_DELETE';

-- AlterEnum
ALTER TYPE "AuditSeverity" ADD VALUE 'MEDIUM';

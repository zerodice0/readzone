#!/bin/bash
set -e

# Convex Production → Development 데이터 백업 스크립트
# 사용법: pnpm backup:prod-to-dev

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/prod_backup_$TIMESTAMP.zip"

# 백업 디렉토리 생성
mkdir -p "$BACKUP_DIR"

echo "========================================"
echo "Convex Production → Development Backup"
echo "========================================"
echo ""

# Step 1: Production 데이터 Export
echo "🔄 Step 1: Exporting production data..."
npx convex export --path "$BACKUP_FILE" --prod --include-file-storage
echo "✅ Export complete: $BACKUP_FILE"
echo ""

# Step 2: Development로 Import
echo "📥 Step 2: Importing to development..."
npx convex import "$BACKUP_FILE" --replace-all -y
echo "✅ Import complete!"
echo ""

# 완료 메시지
echo "========================================"
echo "✅ Backup completed successfully!"
echo "========================================"
echo ""
echo "📁 Backup file: $BACKUP_FILE"
echo "💡 Verify data at: https://dashboard.convex.dev"
echo ""

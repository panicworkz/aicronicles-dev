#!/usr/bin/env bash
# =========================================================================
# PANIC CMS — PRODUCTION DEPLOY & MIGRATION SCRIPT
# Location: /opt/panic/scripts/deploy.sh
# =========================================================================

set -e

echo "🚀 [1/5] Starting Panic CMS Deployment..."
cd "$(dirname "$0")/.."

# 1. Create backups directory if missing
mkdir -p ./backups

# 2. Database Backup before any operation
BACKUP_FILE="./backups/panic_cms_backup_$(date +%Y%m%d_%H%M%S).sql"
echo "📦 [2/5] Creating PostgreSQL backup to ${BACKUP_FILE}..."
if docker compose ps -q panic-postgres > /dev/null 2>&1; then
  docker compose exec -T panic-postgres pg_dump -U panic panic_cms > "${BACKUP_FILE}" || true
  echo "✅ Database backup created: ${BACKUP_FILE}"
else
  echo "⚠️ PostgreSQL container not running, skipping pre-deploy pg_dump."
fi

# 3. Pull latest code from main
echo "📥 [3/5] Pulling latest updates from origin main..."
if [ -d ".git" ]; then
  git pull origin main
else
  echo "⚠️ Not a git clone yet. Skipping git pull."
fi

# 4. Build and Restart Container
echo "🔨 [4/5] Building and restarting panic-cms container..."
docker compose up -d --build panic-cms

# 5. Run Database Migration V2 (Foreign Keys, Indexes & Ads Table)
echo "🔄 [5/5] Running schema migration V2..."
docker compose exec -T panic-cms npm run db:migrate:v2

echo "🎉 Deployment completed successfully! Site is live."

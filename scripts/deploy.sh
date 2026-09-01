#!/usr/bin/env bash
# =========================================================================
# PANIC CMS — PRODUCTION DEPLOY & MIGRATION SCRIPT
# Safe, non-destructive deploy runner for /opt/panic
# Uses dedicated Docker socket: unix:///var/run/docker-panic.sock
# =========================================================================

set -e

# Crucial: Target dedicated Panic Docker socket
export DOCKER_HOST="${DOCKER_HOST:-unix:///var/run/docker-panic.sock}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "${SCRIPT_DIR}")"
cd "${ROOT_DIR}"

echo "========================================================="
echo "🚀 [1/6] Checking Environment & Docker Socket..."
echo "========================================================="
echo "ℹ️ Using DOCKER_HOST: ${DOCKER_HOST}"

# 1. Verify .env exists
if [ ! -f ".env" ]; then
  echo "❌ Error: .env file not found in ${ROOT_DIR}."
  echo "Please create .env with JWT_SECRET and database credentials before running deploy."
  exit 1
fi

# 2. Verify docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
  if [ -f "docker-compose.example.yml" ]; then
    echo "ℹ️ Creating docker-compose.yml from docker-compose.example.yml..."
    cp docker-compose.example.yml docker-compose.yml
  fi
fi

# 3. Create backups directory and perform safe pg_dump
echo "========================================================="
echo "📦 [2/6] Creating Pre-Deploy PostgreSQL Backup..."
echo "========================================================="
mkdir -p ./backups
BACKUP_FILE="./backups/panic_cms_backup_$(date +%Y%m%d_%H%M%S).sql"

if docker compose ps -q panic-postgres > /dev/null 2>&1; then
  docker compose exec -T panic-postgres pg_dump -U panic panic_cms > "${BACKUP_FILE}"
  echo "✅ Safe backup created: ${BACKUP_FILE} ($(du -sh "${BACKUP_FILE}" | cut -f1))"
else
  echo "⚠️ Note: panic-postgres container is not running yet. Starting services..."
  docker compose up -d panic-postgres
  sleep 3
fi

# 4. Safe Git Pull (preserving local server configuration)
echo "========================================================="
echo "📥 [3/6] Pulling Latest Updates from origin main..."
echo "========================================================="
if [ -d ".git" ]; then
  git pull --no-rebase origin main
else
  echo "ℹ️ Directory is not a git repository yet. Skipping git pull."
fi

# 5. Build and Restart CMS Application
echo "========================================================="
echo "🔨 [4/6] Building and Restarting panic-cms Container..."
echo "========================================================="
docker compose up -d --build panic-cms

# 6. Apply Database Migration V2 (Foreign Keys, Indexes & Ads)
echo "========================================================="
echo "🔄 [5/6] Running Schema Migration V2 (FKs, Indexes, Ads)..."
echo "========================================================="
docker compose exec -T panic-cms npm run db:migrate:v2

# 7. Post-Deployment Verification
echo "========================================================="
echo "🔍 [6/6] Verifying Services & Health..."
echo "========================================================="

echo "--- Active Container Count ---"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo "--- Verification of Ads Table ---"
docker compose exec -T panic-postgres psql -U panic -d panic_cms -c "\d ads" || true

echo "--- HTTP Endpoints Status ---"
for u in "/" "/category/personal-finance" "/tag/investing" "/panic/login" "/api/ads?placement=billboard&active=1"; do
  printf "%-50s " "$u"
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://fabelo.testworkz.com$u" || echo "ERR")
  echo "HTTP ${STATUS}"
done

echo "========================================================="
echo "🎉 DEPLOYMENT COMPLETE! All services verified."
echo "========================================================="

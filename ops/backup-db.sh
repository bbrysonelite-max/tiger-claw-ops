#!/bin/bash
# Tiger Bot Scout — Nightly Database Backup
# Runs via cron: 0 2 * * * /home/ubuntu/tiger-bot-api/ops/backup-db.sh >> /home/ubuntu/tiger-bot-api/logs/backup.log 2>&1

set -euo pipefail

BACKUP_DIR="/home/ubuntu/tiger-bot-api/backups"
DB_NAME="tiger_bot"
DB_USER="postgres"
DB_HOST="127.0.0.1"
TIMESTAMP=$(date +%Y-%m-%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/tiger_bot_${TIMESTAMP}.sql.gz"
KEEP_DAYS=14  # Keep 2 weeks of backups

mkdir -p "$BACKUP_DIR"

echo "[backup] Starting backup at $(date)"

# Dump and compress
PGPASSWORD=chatwoot123 pg_dump -h "$DB_HOST" -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"

SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
echo "[backup] Saved: $BACKUP_FILE ($SIZE)"

# Remove backups older than KEEP_DAYS
find "$BACKUP_DIR" -name "tiger_bot_*.sql.gz" -mtime +${KEEP_DAYS} -delete
REMAINING=$(ls "$BACKUP_DIR" | wc -l)
echo "[backup] Cleanup done. $REMAINING backup(s) retained."

echo "[backup] Complete at $(date)"

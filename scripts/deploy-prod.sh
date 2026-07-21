#!/usr/bin/env bash
# Publica el código local al droplet y reconstruye.
# Uso: npm run deploy
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOST="${DEPLOY_HOST:-138.197.167.137}"
USER="${DEPLOY_USER:-root}"
REMOTE="${DEPLOY_PATH:-/var/www/universo-nomada}"
SSH_OPTS=(-o StrictHostKeyChecking=accept-new)

echo "==> Sync → ${USER}@${HOST}:${REMOTE}"
rsync -az --delete \
  --exclude '.git/' \
  --exclude 'node_modules/' \
  --exclude '.next/' \
  --exclude '.env' \
  --exclude '.env.local' \
  --exclude '.env.production' \
  --exclude '.env.development' \
  --exclude 'prisma/dev.db' \
  --exclude 'prisma/dev.db-journal' \
  --exclude 'public/uploads/' \
  --exclude '-p' \
  --exclude '3001' \
  --exclude '.cursor/' \
  --exclude 'dev.log' \
  --exclude 'server.log' \
  -e "ssh ${SSH_OPTS[*]}" \
  "$ROOT/" "${USER}@${HOST}:${REMOTE}/"

echo "==> Build remoto"
ssh "${SSH_OPTS[@]}" "${USER}@${HOST}" "chmod +x ${REMOTE}/deploy/remote-build.sh && ${REMOTE}/deploy/remote-build.sh"

echo "==> Listo: https://universonomada.cl"

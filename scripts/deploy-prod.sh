#!/usr/bin/env bash
# Publica el código local al droplet y reconstruye.
# Uso: npm run deploy
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOST="${DEPLOY_HOST:-138.197.167.137}"
USER="${DEPLOY_USER:-root}"
REMOTE="${DEPLOY_PATH:-/var/www/universo-nomada}"
SSH_OPTS=(-o StrictHostKeyChecking=accept-new -o ConnectTimeout=20)

echo "==> Preflight remoto (¿hay deploy en curso?)"
if ssh "${SSH_OPTS[@]}" "${USER}@${HOST}" \
  'if [[ -f /var/lock/universo-nomada-build.lock ]] && ! flock -n /var/lock/universo-nomada-build.lock -c true 2>/dev/null; then
     echo BUSY
     pgrep -af "remote-build|next build" || true
     exit 1
   fi
   curl -sf --max-time 5 http://127.0.0.1:3001/api/health >/dev/null || echo "aviso: health no responde (se intentará igual)"
   echo FREE'; then
  :
else
  echo ":: error: ya hay un build/deploy en el servidor. Esperá a que termine e intentá de nuevo."
  exit 1
fi

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
  --exclude 'docker-compose.yml' \
  -e "ssh ${SSH_OPTS[*]}" \
  "$ROOT/" "${USER}@${HOST}:${REMOTE}/"

echo "==> Build remoto"
ssh "${SSH_OPTS[@]}" "${USER}@${HOST}" "chmod +x ${REMOTE}/deploy/*.sh && ${REMOTE}/deploy/remote-build.sh"

echo "==> Smoke público"
home_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 20 "https://universonomada.cl/" || echo 000)
cuenta_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 20 "https://universonomada.cl/mi-cuenta" || echo 000)
health=$(curl -sf --max-time 20 "https://universonomada.cl/api/health" || true)
echo "    home=$home_code cuenta=$cuenta_code health=${health:0:120}"
if [[ "$home_code" != "200" || "$cuenta_code" != "200" ]] || ! grep -q '"db":"connected"' <<<"$health"; then
  echo ":: error: smoke público falló tras deploy"
  exit 1
fi

echo "==> Listo: https://universonomada.cl"

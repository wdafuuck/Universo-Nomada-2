#!/usr/bin/env bash
# Watchdog producción — si la app no responde, intenta recuperar.
# Cron: cada minuto. Log: /var/log/universo-nomada-watchdog.log
set -euo pipefail

ROOT=/var/www/universo-nomada
HEALTH_URL=http://127.0.0.1:3001/api/health
LOG=/var/log/universo-nomada-watchdog.log
LOCK=/var/lock/universo-nomada-watchdog.lock

exec 8>"$LOCK"
if ! flock -n 8; then
  exit 0
fi

ts() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }

# No pelear con un deploy en curso (flock no bloqueante sobre el mismo archivo)
if [[ -f /var/lock/universo-nomada-build.lock ]]; then
  if ! flock -n /var/lock/universo-nomada-build.lock -c true 2>/dev/null; then
    echo "$(ts) skip: deploy en curso" >>"$LOG"
    exit 0
  fi
fi

if curl -sf --max-time 5 "$HEALTH_URL" | grep -q '"db":"connected"'; then
  exit 0
fi

echo "$(ts) FAIL health — intentando recuperación" >>"$LOG"

if [[ ! -f "$ROOT/.next/standalone/server.js" ]]; then
  echo "$(ts) server.js ausente" >>"$LOG"
  if [[ -f "$ROOT/.next/standalone.bak/server.js" ]]; then
    echo "$(ts) restaurando standalone.bak" >>"$LOG"
    rm -rf "$ROOT/.next/standalone"
    mv "$ROOT/.next/standalone.bak" "$ROOT/.next/standalone"
    mkdir -p "$ROOT/public/uploads"
    rm -rf "$ROOT/.next/standalone/public/uploads"
    ln -sfn "$ROOT/public/uploads" "$ROOT/.next/standalone/public/uploads"
  else
    echo "$(ts) sin backup — solo systemctl start" >>"$LOG"
  fi
fi

systemctl start universo-nomada || true
sleep 4

if curl -sf --max-time 5 "$HEALTH_URL" | grep -q '"db":"connected"'; then
  echo "$(ts) RECOVERED" >>"$LOG"
  exit 0
fi

echo "$(ts) STILL DOWN" >>"$LOG"
systemctl status universo-nomada --no-pager >>"$LOG" 2>&1 || true
exit 1

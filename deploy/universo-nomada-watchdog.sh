#!/usr/bin/env bash
# Watchdog producción — si la app no responde o las páginas dan 500, intenta recuperar.
# Cron: cada minuto. Log: /var/log/universo-nomada-watchdog.log
set -euo pipefail

ROOT=/var/www/universo-nomada
HEALTH_URL=http://127.0.0.1:3001/api/health
HOME_URL=http://127.0.0.1:3001/
CUENTA_URL=http://127.0.0.1:3001/mi-cuenta
LOG=/var/log/universo-nomada-watchdog.log
LOCK=/var/lock/universo-nomada-watchdog.lock

cd "$ROOT"
# shellcheck disable=SC1091
source ./deploy/standalone-utils.sh

exec 8>"$LOCK"
if ! flock -n 8; then
  exit 0
fi

ts() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }

# No pelear con un deploy en curso
if [[ -f /var/lock/universo-nomada-build.lock ]]; then
  if ! flock -n /var/lock/universo-nomada-build.lock -c true 2>/dev/null; then
    echo "$(ts) skip: deploy en curso" >>"$LOG"
    exit 0
  fi
fi

page_ok() {
  local url="$1"
  local out="$2"
  local code
  code=$(curl -s -o "$out" -w "%{http_code}" --max-time 8 "$url" || echo 000)
  [[ "$code" == "200" ]] || return 1
  ! grep -qi "Internal Server Error" "$out" 2>/dev/null
}

healthy=1
reason=""

if ! curl -sf --max-time 5 "$HEALTH_URL" | grep -q '"db":"connected"'; then
  healthy=0
  reason="health"
elif ! page_ok "$HOME_URL" /tmp/un-wd-home.html; then
  healthy=0
  reason="home"
elif ! page_ok "$CUENTA_URL" /tmp/un-wd-cuenta.html; then
  healthy=0
  reason="mi-cuenta"
fi

if [[ "$healthy" -eq 1 ]]; then
  # Si el standalone vivo está corrupto pero aún sirve (raro), al menos asegurar bak
  if standalone_is_valid .next/standalone && ! standalone_is_valid .next/standalone.bak; then
    backup_standalone_atomic .next/standalone >>"$LOG" 2>&1 || true
  fi
  exit 0
fi

echo "$(ts) FAIL $reason — intentando recuperación" >>"$LOG"

restored=0
if ! standalone_is_valid .next/standalone; then
  echo "$(ts) standalone inválido" >>"$LOG"
  if restore_standalone_from_bak >>"$LOG" 2>&1; then
    restored=1
  fi
elif [[ "$reason" != "health" ]]; then
  # Health OK pero páginas rotas → típico de manifests rotos; forzar bak
  echo "$(ts) páginas rotas con health OK — restaurando bak" >>"$LOG"
  if restore_standalone_from_bak >>"$LOG" 2>&1; then
    restored=1
  fi
fi

systemctl restart universo-nomada || systemctl start universo-nomada || true
sleep 5

if curl -sf --max-time 5 "$HEALTH_URL" | grep -q '"db":"connected"' \
  && page_ok "$HOME_URL" /tmp/un-wd-home.html \
  && page_ok "$CUENTA_URL" /tmp/un-wd-cuenta.html; then
  echo "$(ts) RECOVERED (restored=$restored reason=$reason)" >>"$LOG"
  exit 0
fi

echo "$(ts) STILL DOWN (reason=$reason restored=$restored)" >>"$LOG"
systemctl status universo-nomada --no-pager >>"$LOG" 2>&1 || true
exit 1

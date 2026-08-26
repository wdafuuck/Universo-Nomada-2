#!/usr/bin/env bash
# Sincroniza GEMINI_API_KEY del .env local → .env de producción y reinicia el servicio.
# No imprime el valor de la key.
# Uso: bash scripts/sync-gemini-key-prod.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOST="${DEPLOY_HOST:-138.197.167.137}"
USER="${DEPLOY_USER:-root}"
REMOTE="${DEPLOY_PATH:-/var/www/universo-nomada}"
SSH_OPTS=(-o StrictHostKeyChecking=accept-new -o ConnectTimeout=20)

cd "$ROOT"
if [[ ! -f .env ]]; then
  echo ":: error: no hay .env local" >&2
  exit 1
fi

KEY_B64="$(python3 - <<'PY'
from pathlib import Path
import base64
raw = Path(".env").read_text(encoding="utf-8", errors="replace")
for line in raw.splitlines():
    if line.startswith("GEMINI_API_KEY=") or line.startswith("GOOGLE_GEMINI_API_KEY="):
        val = line.split("=", 1)[1].strip().strip('"').strip("'")
        if val:
            print(base64.b64encode(val.encode()).decode())
            break
PY
)"

if [[ -z "${KEY_B64}" ]]; then
  echo ":: error: GEMINI_API_KEY vacía en .env local. Crea una en https://aistudio.google.com/apikey" >&2
  exit 1
fi

echo "==> Sync GEMINI_API_KEY → ${USER}@${HOST}:${REMOTE}/.env (sin mostrar valor)"

ssh "${SSH_OPTS[@]}" "${USER}@${HOST}" \
  "REMOTE='$REMOTE' KEY_B64='$KEY_B64' bash -s" <<'REMOTE_SCRIPT'
set -euo pipefail
cd "$REMOTE"
KEY="$(printf '%s' "$KEY_B64" | base64 -d)"
if [[ -z "$KEY" || ${#KEY} -lt 20 ]]; then
  echo "key inválida tras decode" >&2
  exit 1
fi
touch .env
chmod 600 .env || true
if grep -qE '^(GEMINI_API_KEY|GOOGLE_GEMINI_API_KEY)=' .env; then
  grep -vE '^(GEMINI_API_KEY|GOOGLE_GEMINI_API_KEY)=' .env > .env.tmp || true
  mv .env.tmp .env
fi
# Escribir sin echo visible en process list lo más posible
printf 'GEMINI_API_KEY=%s\n' "$KEY" >> .env
chown universo-nomada:universo-nomada .env 2>/dev/null || true
chmod 600 .env
systemctl restart universo-nomada
sleep 3
systemctl is-active universo-nomada
sudo -u universo-nomada bash -lc 'set -a; source /var/www/universo-nomada/.env; set +a; if [[ -n "${GEMINI_API_KEY:-}" ]]; then echo gemini_env=OK len=${#GEMINI_API_KEY}; else echo gemini_env=MISSING; exit 1; fi'
REMOTE_SCRIPT

echo "==> Key en prod OK. Sigue deploy + Actualizar ahora en Noticias."

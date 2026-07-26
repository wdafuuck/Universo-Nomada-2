#!/usr/bin/env bash
# Arranque producción — usado por systemd (universo-nomada.service)
set -euo pipefail
cd /var/www/universo-nomada

# shellcheck disable=SC1091
source ./deploy/standalone-utils.sh

# Si falta server.js o manifests, restaurar backup antes de que systemd marque fallo
if ! standalone_is_valid .next/standalone; then
  echo "[start] ERROR: standalone inválido o incompleto" >&2
  if restore_standalone_from_bak; then
    echo "[start] Restaurando standalone.bak…" >&2
  elif [[ -f .next/standalone.prebuild/server.js ]]; then
    echo "[start] Restaurando standalone.prebuild…" >&2
    rm -rf .next/standalone
    cp -a .next/standalone.prebuild .next/standalone
    ensure_uploads_symlink .next/standalone "$(pwd)"
  else
    echo "[start] FATAL: sin standalone válido ni backup" >&2
    exit 1
  fi
fi

if ! standalone_is_valid .next/standalone; then
  echo "[start] FATAL: restore no dejó un standalone válido" >&2
  exit 1
fi

ensure_uploads_symlink .next/standalone "$(pwd)"

set -a
# shellcheck disable=SC1091
source ./.env
set +a
# Forzar bind público: el shell ya trae HOSTNAME=nombre-de-máquina (rompe 0.0.0.0)
# Solo localhost: Caddy hace de proxy público (80/443)
export HOSTNAME=127.0.0.1
export PORT="${PORT:-3001}"
export NODE_ENV=production
# Ruta absoluta: standalone cambia cwd a .next/standalone
export UPLOAD_DIR="${UPLOAD_DIR:-/var/www/universo-nomada/public/uploads}"
# Caddy (user caddy) debe poder leer uploads
chmod a+rx /var/www/universo-nomada /var/www/universo-nomada/public 2>/dev/null || true
chmod -R a+rX "${UPLOAD_DIR}" 2>/dev/null || true
# Standalone a veces no resuelve el engine tras el restart; fijar ruta explícita
ENGINE_CANDIDATES=(
  ".next/standalone/node_modules/.prisma/client/libquery_engine-debian-openssl-3.0.x.so.node"
  "node_modules/.prisma/client/libquery_engine-debian-openssl-3.0.x.so.node"
)
for eng in "${ENGINE_CANDIDATES[@]}"; do
  if [[ -f "$eng" ]]; then
    export PRISMA_QUERY_ENGINE_LIBRARY="$(pwd)/$eng"
    break
  fi
done
exec /usr/bin/node .next/standalone/server.js

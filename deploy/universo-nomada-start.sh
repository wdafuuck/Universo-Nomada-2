#!/usr/bin/env bash
# Arranque producción — usado por systemd (universo-nomada.service)
set -euo pipefail
cd /var/www/universo-nomada

# Si falta server.js, restaurar backup antes de que systemd marque fallo
if [[ ! -f .next/standalone/server.js ]]; then
  echo "[start] ERROR: falta .next/standalone/server.js" >&2
  if [[ -f .next/standalone.bak/server.js ]]; then
    echo "[start] Restaurando standalone.bak…" >&2
    rm -rf .next/standalone
    cp -a .next/standalone.bak .next/standalone
    mkdir -p public/uploads
    rm -rf .next/standalone/public/uploads
    ln -sfn "$(pwd)/public/uploads" .next/standalone/public/uploads
  else
    exit 1
  fi
fi

if [[ ! -f .next/standalone/server.js ]]; then
  echo "[start] FATAL: sin server.js ni backup" >&2
  exit 1
fi

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

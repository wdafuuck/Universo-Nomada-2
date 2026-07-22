#!/usr/bin/env bash
# Arranque producción — usado por systemd (universo-nomada.service)
set -euo pipefail
cd /var/www/universo-nomada
set -a
# shellcheck disable=SC1091
source ./.env
set +a
# Forzar bind público: el shell ya trae HOSTNAME=nombre-de-máquina (rompe 0.0.0.0)
# Solo localhost: Caddy hace de proxy público (80/443)
export HOSTNAME=127.0.0.1
export PORT="${PORT:-3001}"
export NODE_ENV=production
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

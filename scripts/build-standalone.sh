#!/usr/bin/env bash
# Build Next.js standalone de forma más segura:
# 1) next build
# 2) ensambla static/server/prisma en un staging
# 3) swap atómico hacia .next/standalone
# Así un rsync --delete a medias no deja el árbol vivo a medio borrar.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> next build"
npx next build

STAGE=".next/standalone-new"
LIVE=".next/standalone"

if [[ ! -f "$LIVE/server.js" ]]; then
  echo ":: error: next build no generó $LIVE/server.js"
  exit 1
fi

echo "==> Ensamblar staging"
rm -rf "$STAGE"
cp -a "$LIVE" "$STAGE"
mkdir -p "$STAGE/.next" "$STAGE/node_modules"

rsync -a --delete .next/static/ "$STAGE/.next/static/"
rsync -a --delete .next/server/ "$STAGE/.next/server/"
rm -rf "$STAGE/public"
cp -a public "$STAGE/public"
mkdir -p public/uploads
rm -rf "$STAGE/public/uploads"
ln -sfn "$ROOT/public/uploads" "$STAGE/public/uploads"

rm -rf "$STAGE/node_modules/.prisma" "$STAGE/node_modules/@prisma"
cp -R node_modules/.prisma "$STAGE/node_modules/"
cp -R node_modules/@prisma "$STAGE/node_modules/"

echo "==> Validar staging"
test -f "$STAGE/server.js"
test -f "$STAGE/.next/server/app/page_client-reference-manifest.js"
ssr_stage=$(ls "$STAGE/.next/server/chunks/ssr" | wc -l | tr -d ' ')
ssr_root=$(ls .next/server/chunks/ssr | wc -l | tr -d ' ')
if [[ "$ssr_stage" -lt "$ssr_root" ]]; then
  echo ":: error: chunks SSR incompletos en staging ($ssr_stage < $ssr_root)"
  rm -rf "$STAGE"
  exit 1
fi
manifests=$(find "$STAGE/.next" -name '*client-reference-manifest*' | wc -l | tr -d ' ')
if [[ "$manifests" -lt 10 ]]; then
  echo ":: error: pocos manifests en staging ($manifests)"
  rm -rf "$STAGE"
  exit 1
fi

echo "==> Swap atómico staging → live"
rm -rf "${LIVE}.old"
mv "$LIVE" "${LIVE}.old"
mv "$STAGE" "$LIVE"
rm -rf "${LIVE}.old"

echo "==> Build standalone OK (ssr=$ssr_stage manifests=$manifests)"

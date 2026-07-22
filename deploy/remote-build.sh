#!/usr/bin/env bash
# Build + restart en el servidor (llamado por CI o por scripts/deploy-prod.sh)
# IMPORTANTE: detener la app ANTES del build. Compilar sobre .next mientras
# el proceso corre provoca "client reference manifest" / página caída.
set -euo pipefail
cd /var/www/universo-nomada

# El repo local puede traer sqlite; en producción siempre PostgreSQL
if grep -q 'provider = "sqlite"' prisma/schema.prisma; then
  echo "==> Ajustando Prisma provider → postgresql"
  sed -i 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma
fi

echo "==> Dependencias"
npm ci
npx prisma generate

echo "==> Schema DB (no destructivo)"
npx prisma db push --skip-generate

echo "==> Stop (evitar build sobre proceso vivo)"
systemctl stop universo-nomada || true
# Liberar puerto por si quedó zombie
sleep 1

echo "==> Build"
npm run build

if [ ! -f .next/standalone/.next/server/app/page_client-reference-manifest.js ]; then
  echo ":: error: falta page_client-reference-manifest.js tras el build"
  systemctl start universo-nomada || true
  exit 1
fi

echo "==> Permisos scripts"
chmod +x deploy/universo-nomada-start.sh deploy/remote-build.sh 2>/dev/null || true

echo "==> Start"
systemctl start universo-nomada

ok=0
for i in $(seq 1 45); do
  if curl -sf http://127.0.0.1:3001/api/health >/tmp/un-health.json 2>/dev/null \
    && grep -q '"db":"connected"' /tmp/un-health.json; then
    ok=1
    break
  fi
  sleep 1
done
systemctl is-active universo-nomada
if [ "$ok" -ne 1 ]; then
  echo ":: error: /api/health no quedó con db connected a tiempo"
  cat /tmp/un-health.json 2>/dev/null || true
  journalctl -u universo-nomada -n 40 --no-pager || true
  exit 1
fi

home_code=$(curl -s -o /tmp/un-home.html -w "%{http_code}" http://127.0.0.1:3001/)
if [ "$home_code" != "200" ] || grep -qi "Internal Server Error" /tmp/un-home.html; then
  echo ":: error: home respondió $home_code (posible standalone incompleto)"
  head -c 300 /tmp/un-home.html; echo
  journalctl -u universo-nomada -n 40 --no-pager || true
  exit 1
fi

head -c 200 /tmp/un-health.json
echo
echo "==> Deploy OK"

#!/usr/bin/env bash
# Build + restart en el servidor (llamado por CI o por scripts/deploy-prod.sh)
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

echo "==> Build"
npm run build

echo "==> Permisos scripts"
chmod +x deploy/universo-nomada-start.sh deploy/remote-build.sh 2>/dev/null || true

echo "==> Restart"
systemctl restart universo-nomada
# Esperar a que el health responda (no solo systemd active)
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
head -c 200 /tmp/un-health.json
echo
echo "==> Deploy OK"

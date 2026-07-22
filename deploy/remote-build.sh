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
# Esperar a que pase de activating → active
for i in 1 2 3 4 5 6 7 8; do
  if systemctl is-active --quiet universo-nomada; then
    break
  fi
  sleep 1
done
systemctl is-active universo-nomada
curl -sf http://127.0.0.1:3001/api/health | head -c 200
echo
echo "==> Deploy OK"

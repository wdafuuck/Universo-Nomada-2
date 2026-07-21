#!/usr/bin/env bash
# Build + restart en el servidor (llamado por CI o por scripts/deploy-prod.sh)
set -euo pipefail
cd /var/www/universo-nomada

echo "==> Dependencias"
npm ci
npx prisma generate

echo "==> Schema DB (no destructivo)"
npx prisma db push --skip-generate

echo "==> Build"
npm run build

echo "==> Restart"
systemctl restart universo-nomada
sleep 2
systemctl is-active universo-nomada
curl -sf http://127.0.0.1:3001/api/health | head -c 200
echo
echo "==> Deploy OK"

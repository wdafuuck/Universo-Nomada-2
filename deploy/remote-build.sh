#!/usr/bin/env bash
# Build + restart en el servidor (llamado por CI o por scripts/deploy-prod.sh)
#
# Estrategia anti-caídas:
# 1) flock — un solo deploy a la vez
# 2) backup de standalone ANTES del build
# 3) NO detener la app hasta que el build nuevo esté listo
#    (el Node en curso sigue con los inodes viejos aunque se reescriba el tree)
# 4) restart corto + healthcheck
# 5) rollback automático a standalone.bak si el arranque falla
set -euo pipefail
cd /var/www/universo-nomada

exec 9>/var/lock/universo-nomada-build.lock
if ! flock -n 9; then
  echo ":: error: ya hay un build/deploy en curso. Esperá a que termine."
  exit 1
fi

rollback_standalone() {
  echo "==> ROLLBACK → .next/standalone.bak"
  if [[ -f .next/standalone.bak/server.js ]]; then
    # cp (no mv): el .bak debe seguir existiendo para el watchdog
    rm -rf .next/standalone
    cp -a .next/standalone.bak .next/standalone
    mkdir -p public/uploads
    rm -rf .next/standalone/public/uploads
    ln -sfn "$(pwd)/public/uploads" .next/standalone/public/uploads
    systemctl start universo-nomada || true
  else
    echo ":: error: no hay backup válido para rollback"
  fi
}

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

echo "==> Backup standalone (app sigue viva)"
if [[ -f .next/standalone/server.js ]]; then
  rm -rf .next/standalone.bak
  cp -a .next/standalone .next/standalone.bak
  echo "    backup OK"
else
  echo "    sin standalone previo (primer deploy o ya roto)"
fi

echo "==> Build (sin detener servicio aún)"
if ! npm run build; then
  echo ":: error: build falló — restaurando backup"
  rollback_standalone
  exit 1
fi

if [[ ! -f .next/standalone/server.js ]]; then
  echo ":: error: falta .next/standalone/server.js tras el build"
  rollback_standalone
  exit 1
fi

if [[ ! -f .next/standalone/.next/server/app/page_client-reference-manifest.js ]]; then
  echo ":: error: falta page_client-reference-manifest.js tras el build"
  rollback_standalone
  exit 1
fi

ssr_standalone=$(ls .next/standalone/.next/server/chunks/ssr | wc -l | tr -d ' ')
ssr_root=$(ls .next/server/chunks/ssr | wc -l | tr -d ' ')
if [[ "$ssr_standalone" -lt "$ssr_root" ]]; then
  echo ":: error: chunks SSR incompletos ($ssr_standalone < $ssr_root)"
  rollback_standalone
  exit 1
fi
echo "    SSR chunks OK ($ssr_standalone)"

echo "==> Symlink uploads persistente"
mkdir -p public/uploads
rm -rf .next/standalone/public/uploads
ln -sfn "$(pwd)/public/uploads" .next/standalone/public/uploads

echo "==> Permisos scripts"
chmod +x deploy/universo-nomada-start.sh deploy/remote-build.sh deploy/universo-nomada-watchdog.sh 2>/dev/null || true

echo "==> Restart (ventana corta)"
systemctl restart universo-nomada

ok=0
for i in $(seq 1 45); do
  if curl -sf http://127.0.0.1:3001/api/health >/tmp/un-health.json 2>/dev/null \
    && grep -q '"db":"connected"' /tmp/un-health.json; then
    ok=1
    break
  fi
  sleep 1
done
systemctl is-active universo-nomada || true

if [[ "$ok" -ne 1 ]]; then
  echo ":: error: health falló tras restart — rollback"
  systemctl stop universo-nomada || true
  rollback_standalone
  sleep 2
  if curl -sf http://127.0.0.1:3001/api/health >/tmp/un-health.json 2>/dev/null \
    && grep -q '"db":"connected"' /tmp/un-health.json; then
    echo "==> Rollback OK (sitio restaurado)"
  else
    echo ":: error: rollback también falló"
    journalctl -u universo-nomada -n 40 --no-pager || true
  fi
  exit 1
fi

home_code=$(curl -s -o /tmp/un-home.html -w "%{http_code}" http://127.0.0.1:3001/)
if [[ "$home_code" != "200" ]] || grep -qi "Internal Server Error" /tmp/un-home.html; then
  echo ":: error: home respondió $home_code — rollback"
  systemctl stop universo-nomada || true
  rollback_standalone
  exit 1
fi

head -c 200 /tmp/un-health.json
echo
echo "==> Deploy OK"

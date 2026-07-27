#!/usr/bin/env bash
# Build + restart en el servidor (llamado por CI o por scripts/deploy-prod.sh)
#
# Estrategia anti-caídas:
# 1) flock — un solo deploy a la vez
# 2) si standalone está roto → restaurar bak ANTES de tocar nada
# 3) backup atómico solo desde standalone válido (nunca dejar sin bak)
# 4) build sin detener el servicio
# 5) validar manifests + smoke (health, home, mi-cuenta) ANTES/DESPUÉS del restart
# 6) rollback automático si falla
set -euo pipefail
cd /var/www/universo-nomada

# shellcheck disable=SC1091
source ./deploy/standalone-utils.sh

exec 9>/var/lock/universo-nomada-build.lock
if ! flock -n 9; then
  echo ":: error: ya hay un build/deploy en curso. Esperá a que termine."
  exit 1
fi

smoke_ok() {
  local health_ok=0 home_ok=0 cuenta_ok=0
  if curl -sf --max-time 8 http://127.0.0.1:3001/api/health >/tmp/un-health.json 2>/dev/null \
    && grep -q '"db":"connected"' /tmp/un-health.json; then
    health_ok=1
  fi
  local home_code cuenta_code
  home_code=$(curl -s -o /tmp/un-home.html -w "%{http_code}" --max-time 12 http://127.0.0.1:3001/ || echo 000)
  cuenta_code=$(curl -s -o /tmp/un-cuenta.html -w "%{http_code}" --max-time 12 http://127.0.0.1:3001/mi-cuenta || echo 000)
  if [[ "$home_code" == "200" ]] && ! grep -qi "Internal Server Error" /tmp/un-home.html 2>/dev/null; then
    home_ok=1
  fi
  if [[ "$cuenta_code" == "200" ]] && ! grep -qi "Internal Server Error" /tmp/un-cuenta.html 2>/dev/null; then
    cuenta_ok=1
  fi
  echo "    smoke health=$health_ok home=$home_code cuenta=$cuenta_code"
  [[ "$health_ok" -eq 1 && "$home_ok" -eq 1 && "$cuenta_ok" -eq 1 ]]
}

rollback_and_verify() {
  echo "==> ROLLBACK → .next/standalone.bak"
  systemctl stop universo-nomada || true
  if restore_standalone_from_bak; then
    systemctl start universo-nomada || true
    sleep 3
    if smoke_ok; then
      echo "==> Rollback OK (sitio restaurado)"
      return 0
    fi
    echo ":: error: rollback restauró archivos pero smoke falló"
    journalctl -u universo-nomada -n 40 --no-pager || true
    return 1
  fi
  echo ":: error: no hay backup válido para rollback"
  systemctl start universo-nomada || true
  return 1
}

# El repo local puede traer sqlite; en producción siempre PostgreSQL
if grep -q 'provider = "sqlite"' prisma/schema.prisma; then
  echo "==> Ajustando Prisma provider → postgresql"
  sed -i 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma
fi

echo "==> Dependencias"
npm ci
npx prisma generate

echo "==> Schema DB"
# Preferir migraciones versionadas; si el historial no aplica, caer a db push no destructivo
if npx prisma migrate deploy; then
  echo "    migrate deploy OK"
else
  echo "    migrate deploy falló — fallback a db push (no destructivo)"
  npx prisma db push --skip-generate
fi

echo "==> Estado pre-build"
if ! standalone_is_valid .next/standalone; then
  echo "    standalone actual inválido — intentando restaurar bak antes del build"
  if restore_standalone_from_bak; then
    systemctl restart universo-nomada || true
    sleep 2
  else
    echo "    aviso: sin bak válido; el servicio puede estar degradado durante el build"
  fi
fi

echo "==> Backup standalone (app sigue viva)"
if backup_standalone_atomic .next/standalone; then
  :
elif standalone_is_valid .next/standalone.bak; then
  echo "    se conserva bak previo (válido)"
else
  echo "    aviso: no hay bak válido — un fallo de build no podrá hacer rollback"
fi

echo "==> Build (sin detener servicio aún)"
if ! npm run build; then
  echo ":: error: build falló — restaurando backup"
  rollback_and_verify || true
  exit 1
fi

if ! standalone_is_valid .next/standalone; then
  echo ":: error: standalone post-build inválido"
  rollback_and_verify || true
  exit 1
fi

ssr_standalone=$(ls .next/standalone/.next/server/chunks/ssr | wc -l | tr -d ' ')
ssr_root=$(ls .next/server/chunks/ssr | wc -l | tr -d ' ')
if [[ "$ssr_standalone" -lt "$ssr_root" ]]; then
  echo ":: error: chunks SSR incompletos ($ssr_standalone < $ssr_root)"
  rollback_and_verify || true
  exit 1
fi
echo "    SSR chunks OK ($ssr_standalone)"

echo "==> Symlink uploads persistente"
ensure_uploads_symlink .next/standalone "$(pwd)"
ensure_indexnow_key_file "$(pwd)"
chmod a+rx /var/www/universo-nomada /var/www/universo-nomada/public 2>/dev/null || true
chmod -R a+rX public/uploads 2>/dev/null || true

echo "==> Permisos scripts"
chmod +x deploy/*.sh 2>/dev/null || true

echo "==> Restart (ventana corta)"
systemctl restart universo-nomada

ok=0
for i in $(seq 1 60); do
  if smoke_ok; then
    ok=1
    break
  fi
  sleep 1
done
systemctl is-active universo-nomada || true

if [[ "$ok" -ne 1 ]]; then
  echo ":: error: smoke falló tras restart — rollback"
  rollback_and_verify || true
  exit 1
fi

# Tras deploy OK, refrescar bak con la versión nueva (último known-good)
echo "==> Actualizando bak post-deploy (último known-good)"
backup_standalone_atomic .next/standalone || true

head -c 200 /tmp/un-health.json 2>/dev/null || true
echo
echo "==> Deploy OK"

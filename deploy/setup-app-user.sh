#!/usr/bin/env bash
# Crea usuario de sistema para correr la app (no root).
# Uso (en el droplet, como root):
#   bash /var/www/universo-nomada/deploy/setup-app-user.sh
set -euo pipefail

APP_USER="${APP_USER:-universo-nomada}"
APP_DIR="${APP_DIR:-/var/www/universo-nomada}"
UPLOAD_DIR="${UPLOAD_DIR:-$APP_DIR/public/uploads}"

if ! id "$APP_USER" >/dev/null 2>&1; then
  useradd --system --home "$APP_DIR" --shell /usr/sbin/nologin "$APP_USER"
  echo "[setup-app-user] creado usuario $APP_USER"
else
  echo "[setup-app-user] usuario $APP_USER ya existe"
fi

mkdir -p "$UPLOAD_DIR"
chown -R "$APP_USER:$APP_USER" "$APP_DIR"
# Caddy (lectura de imágenes públicas)
chmod a+rx "$APP_DIR" "$APP_DIR/public" 2>/dev/null || true
chmod -R a+rX "$UPLOAD_DIR" 2>/dev/null || true
# .env solo el dueño
if [[ -f "$APP_DIR/.env" ]]; then
  chown "$APP_USER:$APP_USER" "$APP_DIR/.env"
  chmod 600 "$APP_DIR/.env"
fi

# Instalar unit systemd
cp "$APP_DIR/deploy/universo-nomada.service" /etc/systemd/system/universo-nomada.service
systemctl daemon-reload
systemctl enable universo-nomada
systemctl restart universo-nomada
systemctl --no-pager --full status universo-nomada | head -20

echo "[setup-app-user] OK — servicio corre como $APP_USER"

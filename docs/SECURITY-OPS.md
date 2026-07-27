# Operaciones de seguridad — guía rápida

## 1. Secreto webhook Mercado Pago (obligatorio en prod)

Sin esto, cualquiera podría simular notificaciones de pago.

### Pasos (5 minutos)

1. Entrá a [Mercado Pago Developers](https://www.mercadopago.cl/developers/panel)
2. Abrí tu aplicación → **Webhooks** (o “Notificaciones IPN/Webhooks”)
3. URL de producción:
   ```
   https://universonomada.cl/api/payments/mercadopago/webhook
   ```
4. Eventos: al menos **Pagos** (`payment`)
5. Copiá el **secreto de firma** (signing secret)
6. En el servidor:
   ```bash
   ssh root@138.197.167.137
   nano /var/www/universo-nomada/.env
   ```
7. Agregá o editá:
   ```bash
   MERCADOPAGO_WEBHOOK_SECRET=pegá_aquí_el_secreto
   # Opcional (por defecto en prod ya se exige el secreto):
   MERCADOPAGO_WEBHOOK_REQUIRE_SECRET=true
   ```
8. Guardá (`Ctrl+O`, Enter, `Ctrl+X`) y reiniciá:
   ```bash
   systemctl restart universo-nomada
   ```
9. Probá un pago de prueba o el botón “Simular” del panel MP.

**Importante:** no borres el resto del `.env` al editar. Si nano se ve vacío, **no guardes** — salí sin guardar (`Ctrl+X`).

---

## 2. Usuario no-root (ya automatizado)

En el droplet, una sola vez tras el deploy:

```bash
ssh root@138.197.167.137
bash /var/www/universo-nomada/deploy/setup-app-user.sh
```

Eso crea el usuario `universo-nomada` y hace que el servicio no corra como root.

---

## 3. Caddy (PDFs protegidos)

Tras deploy, aplicá el Caddyfile:

```bash
cp /var/www/universo-nomada/deploy/Caddyfile.prod /etc/caddy/Caddyfile
caddy validate --config /etc/caddy/Caddyfile
systemctl reload caddy
```

Las imágenes de `/uploads/` siguen públicas; los PDF pasan por la app con sesión o link firmado.

---

## 4. Checklist post-cambio

- [ ] Home carga: https://universonomada.cl
- [ ] Health OK: https://universonomada.cl/api/health
- [ ] Un PDF de viaje **sin** login → 401
- [ ] Admin / Mi cuenta pueden abrir documentos
- [ ] `systemctl status universo-nomada` muestra `User=universo-nomada` (tras setup)
- [ ] Webhook MP con secreto configurado

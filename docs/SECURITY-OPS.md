# Operaciones de seguridad — Universo Nómada

Plataforma **Next.js propio** (sin WordPress ni plugins de terceros en el front). Actualizaciones vía `npm` + deploy controlado (`npm run deploy`).

## Arquitectura de seguridad

| Capa | Medida |
|------|--------|
| **Edge (Caddy)** | HTTPS obligatorio, HSTS preload, `nosniff`, `X-Frame-Options DENY` |
| **App (Next.js)** | CSP, `upgrade-insecure-requests`, COOP, CORP, rate limits |
| **Middleware** | Anti-scanner, bloqueo `.php`/`.exe` en uploads, rate limit global API |
| **Auth** | Sesión HMAC, cookies HttpOnly/Secure, bcrypt, OTP con 5 intentos |
| **Uploads** | Magic bytes (JPEG/PNG/WebP/GIF/PDF), sin ejecución de scripts |
| **Pagos** | Webhook MP con firma HMAC, validación de monto vs lead |

---

## 1. SSL / HTTPS

- Producción: **DigitalOcean + Caddy** (no Vercel)
- HSTS: `max-age=63072000; includeSubDomains; preload` (Caddy + Next.js)
- `upgrade-insecure-requests` en CSP cuando `NEXT_PUBLIC_SITE_URL` es HTTPS

Tras cambiar Caddyfile:

```bash
cp /var/www/universo-nomada/deploy/Caddyfile.prod /etc/caddy/Caddyfile
caddy validate --config /etc/caddy/Caddyfile
systemctl reload caddy
```

---

## 2. Firewall / fuerza bruta

### Login (contraseña admin)

- **5 intentos fallidos** → bloqueo **15 minutos** (por email e IP)
- Rate limit adicional: 15 req/min por IP
- Código: `src/lib/auth-lockout.ts` + `src/app/api/auth/login/route.ts`

### OTP (clientes)

- 5 intentos por código OTP (`src/lib/otp-auth.ts`)
- 5 req/min IP + 3 req/10 min por email en solicitud de código

### Rate limits por endpoint

| Ruta | Límite |
|------|--------|
| `POST /api/auth/login` | 15/min IP + lockout 5/15min |
| `POST /api/cart/checkout` | 6/min IP |
| `POST /api/payments/create` | 10/min IP |
| `POST /api/hotels/availability` | 20/min IP |
| `POST /api/booking/availability` | 20/min IP |
| `GET /api/reservations/[id]` | 30/min IP |
| `POST /api/flights/search` | 15/min IP |
| `POST /api/leads` | 8/min IP |
| **Global API** | 120/min IP (middleware) |
| **Admin API** | 180/min IP (middleware) |

Exentos del global: `/api/health`, `/api/cron/*`, webhooks y returns de pago.

---

## 3. Escaneo malware / uploads

- Solo admins suben archivos (`requireAdmin`)
- Validación **magic bytes** (`src/lib/upload-mime.ts`): JPEG, PNG, WebP, GIF, PDF
- Rechaza PHP, scripts y tipos spoofeados
- Imágenes re-procesadas con Sharp (validación adicional)
- Middleware bloquea `.php`, `.js`, `.html`, `.exe` en `/uploads/`
- Caddy sirve solo imágenes públicas; PDFs pasan por Next con sesión/firma

---

## 4. Monitoreo

- Health: `GET /api/health` (watchdog cron cada minuto)
- Logs: `journalctl -u universo-nomada -f`
- Rate limit devuelve **429** con header `Retry-After`
- Sin WordPress = sin superficie de plugins vulnerables

---

## 5. Secreto webhook Mercado Pago (obligatorio en prod)

Sin esto, cualquiera podría simular notificaciones de pago.

### Pasos (5 minutos)

1. Entrá a [Mercado Pago Developers](https://www.mercadopago.cl/developers/panel)
2. Abrí tu aplicación → **Webhooks**
3. URL de producción:
   ```
   https://universonomada.cl/api/payments/mercadopago/webhook
   ```
4. Eventos: al menos **Pagos** (`payment`)
5. Copiá el **secreto de firma**
6. En el servidor:
   ```bash
   ssh root@138.197.167.137
   nano /var/www/universo-nomada/.env
   ```
7. Agregá:
   ```bash
   MERCADOPAGO_WEBHOOK_SECRET=pegá_aquí_el_secreto
   MERCADOPAGO_WEBHOOK_REQUIRE_SECRET=true
   ```
8. Reiniciá: `systemctl restart universo-nomada`

---

## 6. Usuario no-root

```bash
ssh root@138.197.167.137
bash /var/www/universo-nomada/deploy/setup-app-user.sh
```

Servicio corre como `universo-nomada`, no root.

---

## 7. Checklist post-cambio

- [ ] Home: https://universonomada.cl
- [ ] Health: https://universonomada.cl/api/health
- [ ] PDF sin login → 401
- [ ] Admin / Mi cuenta abren documentos
- [ ] `systemctl status universo-nomada` → `User=universo-nomada`
- [ ] Webhook MP con secreto
- [ ] Caddy recargado tras cambio de headers
- [ ] `npm run test` pasa (incluye `auth-lockout-upload.test.ts`)

---

## 8. Reportar vulnerabilidades

Contacto: ver `public/.well-known/security.txt` y política `/politica-seguridad`.

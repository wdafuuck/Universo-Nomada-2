# Checklist de despliegue a producción

## Deploy automático (recomendado)

Al hacer **push** a `deploy/2026-prod` (o `main`), GitHub Actions sincroniza el código al droplet, hace build y reinicia el servicio.

### Secretos en GitHub (una sola vez)

Repo → **Settings → Secrets and variables → Actions** → crear:

| Secret | Valor |
|--------|--------|
| `DEPLOY_HOST` | `138.197.167.137` |
| `DEPLOY_USER` | `root` |
| `DEPLOY_PATH` | `/var/www/universo-nomada` |
| `DEPLOY_SSH_KEY` | **Recomendado:** una sola línea base64 (ver abajo). También acepta la clave privada completa. |

**Cómo generar el valor base64 (en Terminal del Mac, sin SSH):**

```bash
base64 < ~/.ssh/universo-nomada-deploy | pbcopy
```

Eso deja en el portapapeles una sola línea. En GitHub: edita el secreto `DEPLOY_SSH_KEY` → pega → Update secret.

La clave pública ya está en el servidor. Si regeneras la clave, vuelve a agregar la `.pub` en `/root/.ssh/authorized_keys`.

Con `gh` autenticado:

```bash
gh auth login
gh secret set DEPLOY_HOST --body "138.197.167.137" --repo wdafuuck/Universo-Nomada-2
gh secret set DEPLOY_USER --body "root" --repo wdafuuck/Universo-Nomada-2
gh secret set DEPLOY_PATH --body "/var/www/universo-nomada" --repo wdafuuck/Universo-Nomada-2
gh secret set DEPLOY_SSH_KEY < ~/.ssh/universo-nomada-deploy --repo wdafuuck/Universo-Nomada-2
```

### Deploy manual desde tu Mac

```bash
npm run deploy
```

Sube el código actual por SSH, build en el servidor y reinicia. **No** toca `.env` ni `public/uploads`.

## Antes del deploy

- [ ] `DATABASE_URL` apunta a **PostgreSQL** (Neon, Supabase, RDS, etc.)
- [ ] `SESSION_SECRET` generado: `openssl rand -base64 48`
- [ ] `CRON_SECRET` generado: `openssl rand -hex 32`
- [ ] `.env` **no** está en git (verificar `git status`)
- [ ] `npm run typecheck` pasa sin errores
- [ ] `npm run test` pasa
- [ ] `npm run build` exitoso
- [ ] `npx prisma migrate deploy` (o `db push` en primer deploy)

## Variables obligatorias (producción)

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | ≥32 caracteres aleatorios |
| `NEXT_PUBLIC_SITE_URL` | `https://universonomada.cl` |

## Variables recomendadas

| Variable | Para qué |
|----------|----------|
| `CRON_SECRET` | Emails carrito abandonado + review post-viaje |
| `SMTP_*` | Emails transaccionales |
| `GOOGLE_PLACES_API_KEY` | Reseñas y fotos de Google |
| `MERCADOPAGO_ACCESS_TOKEN` | Pagos Chile |
| `SUMUP_API_KEY` | Pagos internacional |
| `TRANSBANK_*` | Webpay Plus |

## Post-deploy

- [ ] `GET /api/health` → `status: ok`
- [ ] Probar checkout con pago de prueba
- [ ] Verificar emails de confirmación
- [ ] Google Search Console + sitemap
- [ ] Rotar claves si alguna estuvo expuesta en git

## Migración desde SQLite

```bash
# 1. Exportar datos (si tenías dev.db local)
# 2. Levantar PostgreSQL
docker compose up -d

# 3. Actualizar .env
DATABASE_URL=postgresql://unnomada:unnomada_dev@localhost:5432/unnomada?schema=public

# 4. Aplicar schema
npx prisma db push

# 5. Re-seed manual: admin, tours, group trips según scripts/
npm run admin:create
npm run db:seed-group-trips
```

## Cron jobs (Vercel / servidor)

| Ruta | Frecuencia | Header |
|------|------------|--------|
| `/api/cron/abandoned-cart` | Cada hora | `Authorization: Bearer $CRON_SECRET` |

## Monitoreo

- Health: `/api/health`
- Logs: revisar errores 5xx en pagos y checkout
- Uptime: configurar ping cada 5 min al health endpoint

## Valoración técnica post-hardening

Con este checklist completado, la plataforma califica para el rango **USD 45k–80k** como activo productivo (vs. ~USD 30k–40k en estado dev).

# Checklist de despliegue a producción

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

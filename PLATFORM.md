# Plataforma Universo Nómada — handoff técnico

Documento interno de transferencia. **No cambia la web pública.**

## Qué es

Next.js standalone + Prisma + panel admin embebido + pagos (SumUp / Mercado Pago / Transbank).

Tenant default: `universo-nomada` (multi-tenant preparado, un solo cliente activo).

## Secretos críticos (nunca en git)

| Variable | Uso |
|----------|-----|
| `DATABASE_URL` | Postgres en prod |
| `SESSION_SECRET` | Cookies de sesión (≥32 chars) |
| `CRON_SECRET` | Cron emails |
| `SMTP_*` | Correo |
| `SUMUP_*` / `MERCADOPAGO_*` / `TRANSBANK_*` | Pagos |
| `SENTRY_DSN` | Errores (opcional) |
| `GA4_*` / `GEMINI_API_KEY` | Admin tráfico/SEO |
| `TENANT_ID` | Override tenant (default `universo-nomada`) |

Ver `.env.example` y `DEPLOY.md`.

## Roles de staff

| Rol | Acceso panel |
|-----|----------------|
| `admin` | Todo + Plataforma |
| `ops` | Leads, clientes, grupales, abandonos, tráfico |
| `finance` | Leads, códigos, precios, abandonos |
| `marketing` | Contenido, blog, anuncios, paquetes, portada |

Asignar cambiando `User.role` en DB (solo full admin debe hacerlo).

## Runbook rápido

1. Health: `GET /api/health`
2. Backup DB: `npm run db:backup`
3. Migraciones: `npm run db:migrate:deploy`
4. Deploy: `npm run deploy` o push a `deploy/2026-prod`
5. Crear admin: `npm run admin:create`

## Checklist transferencia IP / ops

- [ ] Acceso GitHub + secretos Actions
- [ ] Acceso droplet SSH + `.env` prod
- [ ] Dominio DNS + TLS (Caddy)
- [ ] Pasarelas (SumUp/MP) + webhooks
- [ ] SMTP verificado
- [ ] Backup automático documentado
- [ ] Contacto soporte 30–90 días acordado

## Garantía visual

Cambios de plataforma (tenant, RBAC, flags, CRM admin) **no** alteran tipografía, colores ni layout de la landing que ve el visitante.

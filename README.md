# Universo Nómada — Plataforma de reservas boutique

Agencia de viajes con checkout, pagos, CRM admin, blog, Mi cuenta y marketing automatizado.

## Stack

- **Next.js 16** (App Router, standalone)
- **PostgreSQL** + Prisma ORM
- **Pagos:** MercadoPago, SumUp, Transbank
- **Integraciones:** Google Places, LiteAPI, RateHawk

## Inicio rápido (desarrollo)

```bash
# 1. Dependencias
npm install

# 2. Base de datos PostgreSQL
docker compose up -d

# 3. Variables de entorno
cp .env.example .env
# Edita .env con tus claves

# 4. Schema + cliente Prisma
npm run db:push
npx prisma generate

# 5. Admin inicial (opcional)
npm run admin:create

# 6. Servidor dev (puerto 3001)
npm run dev
```

Abre [http://localhost:3001](http://localhost:3001)

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Desarrollo en puerto 3001 |
| `npm run build` | Build producción (standalone) |
| `npm run start` | Servidor producción |
| `npm run typecheck` | Verificación TypeScript |
| `npm run lint` | ESLint |
| `npm run test` | Tests unitarios (Vitest) |
| `npm run db:push` | Sincronizar schema con DB |
| `npm run db:backup` | Backup de base de datos |

## Health check

```
GET /api/health
```

Respuesta `200` con `{ status: "ok", db: "connected" }` cuando todo está operativo.

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`):

1. PostgreSQL en contenedor
2. `typecheck` + `lint` + `test` + `build`

## Documentación de deploy

Ver [DEPLOY.md](./DEPLOY.md) para checklist de producción.

## Estructura

```
src/
  app/          # Rutas y API (73 endpoints)
  components/   # UI + admin embebido
  lib/          # Lógica de negocio, pagos, email, SEO
prisma/         # Schema PostgreSQL
tests/          # Tests unitarios
```

## Seguridad

- CSP, HSTS, rate limiting en APIs sensibles
- `.env` ignorado por git — usar `.env.example` como plantilla
- `SESSION_SECRET` obligatorio en producción (≥32 caracteres)
- SQLite **no permitido** en producción

## Licencia

Propietario — Universo Nómada © 2026

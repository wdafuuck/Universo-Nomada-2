# Informe de réplica — Plataforma Universo Nómada 2026

> **Para agentes Cursor / desarrolladores:** este documento es el canon para **replicar, actualizar o mejorar** otros proyectos basándose en esta plataforma.  
> **Repo origen:** `/Users/ricardo/Desktop/Pag Universo Nomada 2026`  
> **Prod origen:** https://universonomada.cl · DigitalOcean `/var/www/universo-nomada`  
> **Fecha:** 2026-07-27  
> **Nota Obsidian:** [[pag-universo-nomada-2026]] · ADRs 003–007

---

## 0. Instrucciones al agente que recibe este informe

1. Lee este archivo completo antes de tocar código.
2. Clasifica cada tarea: **(A) plataforma genérica** vs **(B) marca/cliente específico**.
3. No copies ciegamente WhatsApp, banco, destinos, tipografía ni copy de Universo Nómada.
4. Respeta las **reglas inviolables** (sección 12).
5. Al terminar: actualiza `README`/`PLATFORM` del proyecto destino y deja checklist de env/deploy.
6. Preferir patrones existentes del repo origen sobre reinventar.

**Cómo usar este informe**

```text
@docs/INFORME-REPLICA-PARA-AGENTES.md
Quiero llevar a [PROYECTO_DESTINO] las capacidades: [lista].
Marca destino: [nombre]. No tocar visual UN. Separar genérico vs branding.
```

---

## 1. Qué es esta web (producto)

Plataforma **e-commerce turística boutique** monolítica:

| Capa | Qué hace |
|------|----------|
| Pública | Landing cinematográfica, catálogo paquetes, hubs SEO `/viajes/*`, blog, checkout, mi cuenta |
| Admin | Panel embebido en la misma app (footer → admin), 16 tabs, RBAC |
| Ops | Leads/CRM, pagos multi-pasarela, emails, cron abandonos, documentos viaje |
| SEO | Sitemap dinámico, IndexNow, JSON-LD, GSC/Bing, asistente Gemini opcional |
| Plataforma | `tenantId`, feature flags, Sentry opcional, stubs channel manager |

**No es:** WordPress, app admin separada, ni SaaS multi-cliente facturado (el multi-tenant está preparado, un solo tenant activo).

---

## 2. Stack canónico (copiar versiones)

| Tecnología | Versión / nota |
|------------|----------------|
| Next.js | `^16.1.1` — `output: "standalone"` |
| React | `^19.0.0` |
| Prisma | `^6.11.1` |
| Zustand | carrito persistente |
| TanStack Query | data fetching admin/público |
| Zod + RHF | forms |
| Framer Motion | motion system |
| Tailwind 4 + shadcn/Radix | UI |
| nodemailer | SMTP |
| Pagos | SumUp (API), Mercado Pago, `transbank-sdk` |
| Auth real | Cookie HMAC `un_session` (`src/lib/auth-session.ts`) — **no** NextAuth en runtime |
| i18n real | `LanguageContext` + `translations*.ts` — **no** next-intl en rutas |
| Tests | Vitest |
| Deploy | rsync + `deploy/remote-build.sh` + Caddy + systemd |

Scripts: `dev` :3001 · `build` → `scripts/build-standalone.sh` · `deploy` → `scripts/deploy-prod.sh`.

---

## 3. Árbol que debe existir al clonar

```text
src/
  app/                 # pages + api + sitemap/robots
  components/
    admin/             # LandingAdminPanel + *Admin.tsx
    seo/               # JsonLd helpers
    motion/            # GravityReveal, FlowField, MagneticHover…
    package/           # detalle paquete
    blog/
    ui/                # shadcn
  contexts/            # Language, AdminTheme, Cart/Announcer…
  hooks/
  lib/                 # dominio (pagos, email, tours, SEO…)
  stores/cart-store.ts
  middleware.ts
  instrumentation.ts
prisma/schema.prisma + migrations/
deploy/                # remote-build, systemd, Caddy, watchdog, standalone-utils
scripts/               # build, deploy, seed, backup, IndexNow, admin:create
public/                # images, manifest, sw.js, uploads/, llms.txt
docs/
.env.example
PLATFORM.md
DEPLOY.md
```

---

## 4. Modelos Prisma (dominio)

Provider en schema: SQLite (dev). **Prod:** PostgreSQL (ADR-007). Casi todo lleva `tenantId` default `"universo-nomada"`.

### Núcleo comercial

- **Tour** — paquetes: precio, JSON galería/FAQ, `optionalToursJson`, `flightOrigin/Destination/flightBudgetMax`, `taxType` (`afecto`|`exento`), depósito, ofertas
- **TourPricing** — tiers hotel/ocupación (`tiersJson`)
- **GroupTrip** + **GroupDeparture** — grupales + cupos
- **Lead** — CRM/reserva: contacto, `status`, `source`, `cartJson`, montos, método/plan pago, ids pasarela
- **LeadNote**, **LeadEvent**, **LeadPayment** — timeline + abonos
- **TripDocument** — docs pasajero (`fileUrl`, retención ~90d)
- **DiscountCode**, **RouletteSpin**, **CartAbandonment**
- **Promotion** (modelo; UI ofertas también vía flags en Tour)

### Contenido / CMS

- **BlogArticle** — `slug`, `titleJson/excerptJson/contentJson/categoryJson`, image, active, sortOrder
- **BlogSubscriber**
- **HeroSlide**, **InstagramPost**, **SiteContent** (key→JSON)
- **NomadBenefit**, **BenefitPartnerLogo**, **PassportBadge**

### Auth / plataforma

- **User** — `role`: `user|admin|ops|finance|marketing`
- **EmailOtp**
- **Tenant** — `slug`, `configJson`

Al replicar: renombrar labels “Nómada/Pasaporte” si el cliente no usa esa marca; mantener el modelo.

---

## 5. Rutas públicas (App Router)

| Ruta | Función |
|------|---------|
| `/` | Landing + toggle admin embebido |
| `/detalle-paquete/[id]` | Ficha + add to cart |
| `/viajes`, `/viajes/[slug]` | Hubs destino SEO |
| `/viajes/atacama-grupal`, `/ballenas-elqui`, `/tapati-2027` | Landings estacionales (específico UN — adaptar) |
| `/blog`, `/blog/[slug]` | Blog |
| `/mi-cuenta` | Miembros OTP |
| `/reserva/confirmacion` | Post-pago / transferencia |
| `/cotizacion-enviada` | Lead enviado |
| `/ruleta`, `/ruleta/premio` | Ruleta (feature flag) |
| `/recuperar` | Limpieza cache/SW |
| `/offline` | PWA offline |
| Legales | privacidad, seguridad, cancelación, términos, vuelos, accesibilidad |
| SEO | `sitemap.ts` (force-dynamic), `sitemap-index.xml`, `sitemap-images.xml`, `robots.ts` |

---

## 6. API routes (~90) — mapa por dominio

### Auth
`/api/auth/login|register|logout|me` · `/api/auth/otp/request|verify` · `/api/auth/welcome-signup`

### Cart / checkout / pagos
`/api/cart/checkout` · `abandon-track` · `pricing-info`  
`/api/payments/create` · `sumup/return` · `mercadopago` + `webhook` · `transbank/return`

### Catálogo
`/api/tours` · `tours/[tourId]` · `tours/pricing` · `group-trips` · `promotions` · `hero-slides` · `instagram` · `site-content`

### Vuelos / hoteles
`/api/flights/search` · `flights/allowed-dates` · `hotels/availability` · `booking/availability`

### Leads / blog / miembros
`/api/leads` · `/api/blog` · `blog/[slug]` · `blog-subscribe`  
`/api/me/trips` · `me/trips/[leadId]/documents` · `me/passport` · `me/benefits`

### Ruleta / cupones / cron / ops
`/api/roulette/spin|status` · `discount-codes/validate`  
`/api/cron/abandoned-cart` · `cron/cleanup-trip-documents`  
`/api/health` · `secure-file` · `google-reviews` · `reservations/[leadId]`

### Admin (`/api/admin/*`)
tours, tour-pricing, group-trips, leads (+ notes/payments/documents/export), blog (+ **index-all**), campaigns, discount-codes, promotions, hero-slides, instagram, nomad-benefits, passport-badges, cart-abandonments, users, stats, analytics, seo/chat, payments/reconciliation, platform, **upload**

---

## 7. Admin embebido (ADR-003)

- Entrada: footer “Acceso administradores” → UI en `HomePageClient` con `dynamic(() => LandingAdminPanel)`.
- Shell: `AdminShell` + RBAC `src/lib/admin-rbac.ts`.
- **No crear** `/admin` como app separada.

### Tabs (ids)

| id | Componente | Roles |
|----|------------|-------|
| dashboard | stats | staff |
| trafico | TrafficSeoAdmin | admin, ops, marketing |
| portada | HeroSlidesAdmin | admin, marketing |
| paquetes | PackagesAdmin | admin, marketing |
| grupales | GroupTripsAdmin | admin, ops |
| precios | TourPricingAdmin | admin, finance |
| codigos | DiscountCodesAdmin | admin, finance |
| contenido | SiteContentAdmin | admin, marketing |
| blog | BlogAdmin (+ Indexar todo) | admin, marketing |
| anuncios | CampaignsAdmin | admin, marketing |
| beneficios | NomadBenefitsAdmin | admin, marketing |
| pasaporte | PassportBadgesAdmin | admin, marketing |
| clientes | MembersAdmin | admin, ops |
| leads | LeadsAdmin | admin, ops, finance |
| abandonos | AbandonedCartsAdmin | admin, ops, finance |
| plataforma | PlatformAdmin | **solo admin** |

Imágenes admin: siempre `UploadAwareImage` para `/uploads/` (optimizer Next falla detrás de Caddy).

---

## 8. Flujos de negocio (implementar igual)

### 8.1 Checkout dinámico (ADR-006)

Origen: `AddToCartDialog` → pasos según paquete → Zustand `cart-store` → `CartSheet`.

Orden típico:

1. Pasajeros  
2. Vuelos (si aplica) — **solo horarios**  
3. Alojamiento  
4. Tours incluidos (`optionalToursJson.pickCount`)  
5. Extras / actividades  
6. Confirmar → carrito → pago  

Pago: `card` | `transferencia`; plan `total` | `deposito`.

### 8.2 Pagos (ADR-004)

Archivo: `src/lib/payments/*` + `PAYMENT_PROVIDER` (fallback).

| Tax carrito | Pasarela |
|-------------|----------|
| Exento / mixto (hay internacional) | Solo SumUp |
| Afecto (nacional) | Cliente elige SumUp **o** Mercado Pago |
| Transferencia | `bank-transfer.ts` (datos bancarios del **cliente destino**) |

### 8.3 Auth OTP

`otp-auth.ts` (SHA-256, TTL 10m, max 5 intentos) → cookie `un_session` 7 días.  
Welcome signup puede emitir cupón bienvenida (`NOMAD5` es específico UN).

### 8.4 Vuelos (ADR-005 — crítico)

- Admin define `flightBudgetMax`.  
- UI cliente: horarios **sin precio**.  
- Sin vuelo: deducción interna oculta (`flightReferenceDeduction`).  
- Nunca exponer precio de API de vuelos al front.

### 8.5 Blog + indexación

- CRUD admin → `BlogArticle`.  
- Al publicar: `notifyBlogSearchEngines` (`src/lib/indexnow.ts`) → IndexNow (Bing/Yandex) + ping sitemap.  
- `sortOrder = max+1` (**nunca** `Date.now()` → overflow INT4).  
- Sitemap: `dynamic = "force-dynamic"` (no congelar en build).  
- `INDEXNOW_KEY` + `/{key}.txt` (start recrea con `ensure_indexnow_key_file`).  
- Botón admin: `POST /api/admin/blog/index-all`.

### 8.6 Carrito abandonado

Track `/api/cart/abandon-track` → cron `/api/cron/abandoned-cart` con `CRON_SECRET` + flag `FEATURE_ABANDONED_CART`.

### 8.7 Documentos viaje

Upload admin/miembro → storage uploads · acceso vía `/api/secure-file` (firmado) · Caddy solo imágenes públicas `/uploads/*.(jpg|png|…)`.

---

## 9. Variables de entorno (mínimo al clonar)

Copiar de `.env.example`. Críticas:

```text
NEXT_PUBLIC_SITE_URL=
DATABASE_URL=                 # Postgres en prod
SESSION_SECRET=               # ≥32 chars
CRON_SECRET=
SMTP_HOST/PORT/USER/PASS/FROM=
PAYMENT_PROVIDER=             # fallback
SUMUP_API_KEY / SUMUP_MERCHANT_CODE=
MERCADOPAGO_ACCESS_TOKEN / NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=
MERCADOPAGO_WEBHOOK_SECRET=
INDEXNOW_KEY=
NEXT_PUBLIC_GA_ID / NEXT_PUBLIC_GTM_ID / NEXT_PUBLIC_META_PIXEL_ID=
TENANT_ID=                    # slug del nuevo cliente
FEATURE_ABANDONED_CART=
FEATURE_ROULETTE=
```

Opcionales: `GA4_*`, `GEMINI_API_KEY`, `SENTRY_DSN`, LiteAPI/RateHawk/Booking, Transbank.

---

## 10. Deploy (patrón anti-caída)

1. `scripts/deploy-prod.sh` → rsync (excluye `.env`, `uploads`, `.next`)  
2. `deploy/remote-build.sh`: flock · backup standalone válido · build sin stop · swap · smoke health/home/mi-cuenta · rollback  
3. systemd: `deploy/universo-nomada-start.sh` + `standalone-utils.sh`  
4. Caddy: reverse proxy `127.0.0.1:3001`; uploads imágenes `file_server`  
5. Nunca `systemctl stop` antes del build  
6. `ensure_uploads_symlink` idempotente (no tumbar por Permission denied)  
7. `ensure_indexnow_key_file` best-effort (no `set -e` fatal)

Docs: `DEPLOY.md`, `.cursor/rules/prod-reliability.mdc` (si existe).

---

## 11. SEO / analytics / motion / PWA / i18n

### SEO
- `src/app/sitemap.ts` force-dynamic  
- JSON-LD: `components/seo/*`  
- Hubs: `lib/destination-hubs.ts` · estacionales: `lib/seasonal-landings.ts`  
- IndexNow multi-endpoint  
- `public/llms.txt`

### Analytics
- `Analytics.tsx` / `ConditionalAnalytics.tsx` (consent)  
- Admin: GA4 Data API `lib/ga4-data.ts`

### Motion
- `lib/motion-presets.ts` + `components/motion/*`  
- No meter motion genérico AI-slop (purple glow, etc.) — respetar design system del **destino**

### PWA
- `manifest.json` · `/offline` · SW hoy puede desregistrar caches (anti-loops) — revisar antes de reactivar

### i18n
- Langs: `es|en|fr|zh|pt`  
- CMS override site-content principalmente ES  
- Sin rutas `/en/...` (hreflang `es-CL` + `x-default` en UN)

---

## 12. Reglas inviolables

1. Vuelos: **nunca** precio al cliente.  
2. Admin **embebido**, no app separada.  
3. Checkout multi-paso con incluidos/extras según paquete.  
4. Pagos según `taxType` / carrito (SumUp vs MP).  
5. Deploy atómico + health; no ampliar `ignoreBuildErrors` a la ligera.  
6. Uploads: `UploadAwareImage` + symlink persistente + secure-file para no-imágenes.  
7. Blog `sortOrder` entero pequeño (max+1).  
8. Cambios “plataforma” no deben romper look público del cliente activo sin pedido explícito.  
9. Secretos solo `.env` (nunca commit).  
10. RBAC: solo `admin` → tab Plataforma.

---

## 13. Libs `src/lib/` — mapa rápido para el agente

| Archivo | Usar cuando… |
|---------|----------------|
| `auth-session.ts` / `otp-auth.ts` | Login cookie / OTP |
| `admin-rbac.ts` | Tabs por rol |
| `checkout.ts` / `cart-items.ts` | Totales, depósito, IVA |
| `payments/*` | Crear cobro / webhooks |
| `bank-transfer.ts` | Datos transferencia (**rebrandeár**) |
| `flight-*.ts` / `travelpayouts-flights.ts` | Vuelos tope oculto |
| `tour-pricing.ts` / `tour-ofertas.ts` | Precios e ofertas |
| `blog-store.ts` / `indexnow.ts` | Blog + indexación |
| `seo-config.ts` / `seo-metadata.ts` | Metadata/hreflang |
| `email/*` | Templates SMTP |
| `feature-flags.ts` / `tenant.ts` | Flags y tenant |
| `trip-documents.ts` / `signed-file-url.ts` | Docs pax |
| `discount-codes.ts` / `roulette.ts` | Cupones / ruleta |
| `overbooking.ts` | Cupos grupales |
| `ga4-data.ts` / `analytics-events.ts` | Métricas |
| `destination-hubs.ts` / `default-tours.ts` | Contenido SEO (**específico**) |
| `legal-policies.ts` | Textos legales |
| `translations*.ts` | UI i18n |

---

## 14. Genérico vs específico UN (checklist de limpieza al clonar)

### Copiar (plataforma)

- [ ] Monolito Next + Prisma + admin embebido + RBAC  
- [ ] Checkout, carrito, leads, pagos factory  
- [ ] OTP + sesión  
- [ ] Blog CMS + IndexNow + sitemap dinámico  
- [ ] Cron abandonos, códigos, feature flags, tenantId  
- [ ] Scripts deploy/watchdog/Caddy pattern  
- [ ] UploadAwareImage + secure-file  

### Reemplazar (marca)

- [ ] `TENANT_ID`, nombre, dominio, `NEXT_PUBLIC_SITE_URL`  
- [ ] WhatsApp, email, direcciones, SERNATUR si aplica  
- [ ] `bank-transfer.ts` (RUT/banco/cuenta)  
- [ ] `default-tours`, hubs, landings estacionales, imágenes `public/images`  
- [ ] SEO brand/keywords, `manifest.json`, Google Place/reviews  
- [ ] Firmas email (nombres equipo)  
- [ ] Colores/tipografía/landing sections  
- [ ] Cupón bienvenida / copy “Nómada”  
- [ ] Unit systemd / path Caddy / hostname  

---

## 15. Playbooks listos para pegar en otro chat Cursor

### Playbook A — “Quiero el mismo checkout + pagos”

```text
Lee docs/INFORME-REPLICA-PARA-AGENTES.md §8.1–8.2 y §13 (payments/checkout).
Implementa en [DESTINO] carrito Zustand + AddToCartDialog multi-paso + CartSheet
+ /api/cart/checkout + /api/payments/create con factory SumUp/MP según taxType.
No copies datos bancarios UN. Usa .env.example del origen como plantilla.
```

### Playbook B — “Quiero admin embebido + blog + SEO”

```text
Lee informe §5–7 y §8.5.
Porta LandingAdminPanel tabs: portada, paquetes, blog, leads (mínimo).
Blog: sortOrder max+1, UploadAwareImage, IndexNow al publicar, sitemap force-dynamic.
Admin embebido en home — no crear /admin app.
```

### Playbook C — “Quiero deploy anti-caída”

```text
Copia deploy/remote-build.sh, standalone-utils.sh, start script, Caddyfile pattern.
Smoke: /api/health + home 200. Symlink uploads. INDEXNOW key file best-effort.
Nunca stop del servicio antes del build.
```

### Playbook D — “Solo mejorar proyecto existente con piezas UN”

```text
Lista gaps del destino vs informe §4–11.
Prioriza: (1) health+deploy (2) auth (3) CMS (4) checkout (5) SEO.
No rebrandear a Universo Nómada. Mantén design system del destino.
```

---

## 16. Bugs / lecciones ops (no repetir)

| Problema | Causa | Fix |
|----------|-------|-----|
| Imagen admin rota en `/uploads` | next/image optimizer | `UploadAwareImage` unoptimized |
| Error crear blog | `sortOrder: Date.now()` INT4 | `max+1` |
| Sitemap sin blogs nuevos | prerender build | `force-dynamic` + regen |
| Deploy 502 | symlink uploads / key IndexNow root-owned + set -e | idempotent + best-effort |
| Indexar `.../blog/tu-slug` | era ejemplo | usar slug real |
| GSC “descubierta sin indexar” | normal | esperar + solicitar indexación URLs reales |

---

## 17. Valoración de referencia (contexto comercial)

Activo operativo web (jul 2026): ~**$30–45M CLP**; costo reposición ~**$35–70M CLP**.  
No implica valoración de la agencia ni ARR SaaS.

---

## 18. Archivos companion en este repo

| Doc | Uso |
|-----|-----|
| `PLATFORM.md` | Handoff corto ops |
| `DEPLOY.md` | Deploy detallado |
| `docs/platform-capabilities.md` | Capacidades white-label |
| `docs/SECURITY-OPS.md` | Seguridad ops |
| `.env.example` | Plantilla secretos |
| `.cursor/rules/proyecto-universo-nomada.mdc` | Reglas agente UN |

Vault Obsidian:

- `08 Empresas/Universo Nómada/pag-universo-nomada-2026.md`
- `25 Ideas/Gota — Blog 51 + indexación GSC Bing auto 27 jul 2026.md`
- ADRs: `29 Decisiones/ADR-003` … `ADR-007`

---

## 19. Definition of Done al replicar

- [ ] `GET /api/health` → `db: connected`  
- [ ] Home 200 + admin login OTP/password según destino  
- [ ] Crear tour + blog + lead smoke  
- [ ] Checkout test (sandbox pasarela o transferencia)  
- [ ] Sitemap lista URLs del nuevo dominio  
- [ ] `.env` prod sin secretos en git  
- [ ] Branding del **cliente destino** (cero restos UN visibles)  
- [ ] Documentado en Obsidian/README del proyecto destino  

---

*Fin del informe. Origen: Universo Nómada plataforma 2026 — Luminarys / Ricardo.*

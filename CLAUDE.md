# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Universo Nómada — marketing + lead-capture site for a Chilean boutique travel agency. Single-tenant, Spanish-language content, **Supabase-backed** (Postgres + Auth + Storage). A custom `/admin` dashboard lets the non-technical agency owner manage leads, promotions, and destinations.

## Commands

- `npm run dev` — start Next.js dev server on **port 3001** (hardcoded in `package.json`), pipes output to `dev.log`.
- `npm run build` — `next build` (standalone output) + copies `.next/static` and `public` into `.next/standalone/`.
- `npm run start` — production: runs the standalone bundle with `bun .next/standalone/server.js`. **Requires `bun`**, not Node.
- `npm run lint` — ESLint. Most rules are disabled in `eslint.config.mjs` — lint is a smoke test, not a quality gate.
- `npm run db:migrate` — `prisma migrate dev`, creates a new migration in `prisma/migrations/`. **This is the canonical schema-change flow** (we use Postgres now; `db:push` would still work but loses history).
- `npm run db:generate` — regenerate Prisma client after editing `prisma/schema.prisma`.
- `npm run db:seed` / `npx tsx prisma/seed.ts` — seed destinations + promotions (idempotent via upsert).
- `npm run db:reset` — destructive: drops and recreates the DB. **Will wipe Supabase data — be careful.**

No test runner is configured. The build now runs full type checking (`typescript.ignoreBuildErrors` was removed); `npx tsc --noEmit` is still useful for fast feedback during edits.

## Supabase setup

The app talks to Supabase via three channels:

1. **Prisma** (`src/lib/db.ts`) → Postgres via the Transaction Pooler. Connects with the `postgres` role and **bypasses RLS entirely**. This is how all app data reads/writes go.
2. **Supabase JS browser client** (`src/lib/supabase/client.ts`) → uses `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Only used for auth state today.
3. **Supabase JS server client** (`src/lib/supabase/server.ts`, `admin.ts`) → SSR cookie-based session (`@supabase/ssr`) and a secret-key admin client for Storage operations.

`.env` keys (all required):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — new key system (`sb_publishable_…`), safe in the browser.
- `SUPABASE_SECRET_KEY` — new key system (`sb_secret_…`), **server-only**. Used by `src/lib/supabase/admin.ts`.
- `DATABASE_URL` — Supabase Transaction Pooler (port 6543). **Must include** `?pgbouncer=true&connection_limit=1` or Prisma errors with `prepared statement "s0" already exists` because PgBouncer transaction-pooling and Prisma's prepared-statement cache collide.
- `DIRECT_URL` — Session Pooler (port 5432). Used by Prisma migrations only.

First-time Supabase setup: run `prisma/supabase-setup.sql` once in the Supabase SQL Editor. It creates the public `media` Storage bucket (for promo/destino images) and enables RLS on `Lead`, `Promotion`, `Destination` (deny-all by default — Prisma bypasses RLS, so app reads/writes keep working; RLS is defense-in-depth against PostgREST `/rest/v1/*` access using the publishable key).

Create the first admin user in **Supabase Dashboard → Authentication → Users → Add user** with **Auto Confirm User** checked.

## Architecture

### Stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + TypeScript
- **TailwindCSS 4** + **shadcn/ui** (`new-york` style, components live in `src/components/ui/`, do not hand-edit — regenerate via shadcn CLI)
- **Prisma 6** + **Supabase Postgres**
- **@supabase/ssr** + **@supabase/supabase-js** for auth (cookie-based SSR) and Storage
- **framer-motion** for animations, **sonner** for toasts, **lucide-react** for icons

### Routing & pages

The public site:
- `src/app/page.tsx` — **Server Component**. Fetches active destinations + promotions from the DB and renders `<LandingPage />`. `export const dynamic = "force-dynamic"` (admin saves call `revalidatePath("/")`, but force-dynamic guarantees freshness in dev).
- `src/app/landing-page.tsx` — Big `"use client"` component (~1300 lines) with the entire landing UI: hero, destinations grid (each card a `<Link>` to detalle), promotions, testimonials, popups (LeadPopup, TravelFormPopup). Receives `destinations: Destination[]` and `promotions: Promotion[]` as props. `destinoOptions` is derived inside via `useMemo`. **No data is hardcoded here anymore.** Auto-open lead popup fires at most once per browser session (guarded by `sessionStorage`).
- `src/app/detalle-paquete/[id]/page.tsx` — server component: fetches the destination, sets metadata, pre-renders all active destinations via `generateStaticParams`. `detalle-content.tsx` (~280 lines, client) renders the page from props — hero, description, highlights/includes/notIncludes (data-driven, hidden if empty), price sidebar with WhatsApp deep-link, inline `<LeadFormInline>` that posts to `/api/leads` with `destino` pre-filled.
- `src/app/sitemap.ts` and `src/app/robots.ts` — Next.js metadata routes. Sitemap lists `/` plus every active destination (using `updatedAt` as `lastModified`). Robots allows everything except `/admin/`, `/login`, `/api/`.
- `src/app/error.tsx` and `src/app/global-error.tsx` — route segment + root error boundaries. Spanish UI, retry button, link home.

The admin dashboard (all server components, protected by middleware):
- `src/app/admin/layout.tsx` — checks Supabase session, redirects to `/login` if absent, renders `<AdminShell>`.
- `src/app/admin/page.tsx` — home, shows live counts of leads/promotions/destinations.
- `src/app/admin/leads/page.tsx` — leads table with status filter, WhatsApp link, inline notes, CSV export. Mutations via server actions in `actions.ts`.
- `src/app/admin/promociones/` — list + `/new` + `/[id]` edit. Form + actions + dropdown menu for toggle/delete.
- `src/app/admin/destinos/` — same shape as promociones. Slug auto-generated from name; icon/color pickers in `options.ts`.
- `src/app/login/` — server-action-based login (`signIn`/`signOut`) using `supabase.auth.signInWithPassword`.

`middleware.ts` (root) + `src/lib/supabase/middleware.ts` refresh the Supabase session on every request, redirect `/admin/*` → `/login` when unauthenticated, and `/login` → `/admin` when already logged in.

### API routes (`src/app/api/`)

- `POST /api/leads` — **public**, creates a `Lead` from the contact form. Validates email + phone (7–15 digits via `isValidPhone`), silently drops requests with a non-empty honeypot field (`_website`), and rate-limits by IP at 5 req/min via `src/lib/rate-limit.ts`. Returns 429 with `Retry-After` when the bucket is full. This is the only endpoint the public site hits.

All admin-facing data reads/writes use **server actions** (`"use server"` files inside `src/app/admin/*/actions.ts`) protected by `requireAdmin()` from `src/lib/auth/require-admin.ts`. No `/api/admin/*` REST routes — they were deleted in the Supabase migration.

### Database (`prisma/schema.prisma`)

Three models + one enum:
- `Destination` — string `id` (slug, e.g. `rapa-nui`), the catalog of trips. `icon` is a Lucide name string (e.g. `"Compass"`); `tagColor` is a Tailwind class string. `highlights`, `includes`, `notIncludes` are `String[]` (Postgres array) that drive the detail page sections; the admin form takes them as one-per-line textareas.
- `Promotion` — autoincrement `Int` id, featured offers with `validUntil: DateTime`, `image` (Supabase Storage URL), `emoji`, `active`/`order`.
- `Lead` — contact form submissions with `LeadStatus` enum (`NEW`/`CONTACTED`/`IN_PROGRESS`/`CONVERTED`/`LOST`), `notes`, `contactedAt`.
- `LeadStatus` — enum used by leads.

`User` and `Post` models were removed — Supabase Auth handles users.

Migrations live in `prisma/migrations/`. To change the schema: edit `prisma/schema.prisma`, then `npm run db:migrate -- --name describe_change`. `src/lib/db.ts` exports a singleton `db` (PrismaClient) cached on `globalThis`. Always import via `@/lib/db`.

### Storage

Promotion and destination images live in the **public `media` bucket** in Supabase Storage. Two prefixes: `media/promotions/<uuid>.webp` and `media/destinations/<uuid>.webp`.

Upload flow (`src/components/admin/image-upload-field.tsx`):
1. Client picks a file.
2. `src/lib/optimize-image.ts` resizes to max 2000×2000 and re-encodes as WEBP @ 85% via Canvas. **This is essential** — Next.js Server Actions have a default 1 MB body limit, and unoptimized phone photos blow past it.
3. `uploadImage()` server action (`src/lib/storage.ts`, `"use server"`) validates type/size, uploads via the admin client, returns the public URL.
4. The URL is stored on the model row. On delete/replace, `deleteImage()` strips the old object.

GIFs and files <200 KB skip optimization.

### Auth

Custom is gone. Uses Supabase Auth with cookies (`@supabase/ssr`):
- `src/app/login/actions.ts` — `signIn` server action calls `supabase.auth.signInWithPassword`; `signOut` calls `supabase.auth.signOut`.
- `middleware.ts` runs `updateSession()` from `src/lib/supabase/middleware.ts` on every request (excluding static asset paths in the matcher).
- `src/lib/auth/require-admin.ts` — call at the top of any server action that mutates admin data; redirects to `/login` if no session.

There are no roles — anyone with a Supabase user can reach `/admin`. The first user must be created in the Supabase dashboard manually.

### i18n

Custom, not `next-intl`. Strings live in `src/lib/translations.ts` (`es`, `en`, `fr` objects); components read them via `useLanguage()` from `src/contexts/LanguageContext.tsx`. **The language switcher was removed from the nav** because only the home is translated — `detalle-paquete`, `/login`, `/admin/*` are Spanish-only. The context still works for whoever wants to re-enable it; default is `es`, in-memory only.

### Anti-spam

- `src/components/honeypot.tsx` — hidden `<input name="_website">` positioned off-screen. Used in `TravelFormPopup`, `LeadPopup`, the home contact form, and `LeadFormInline` on detalle. The server silently drops requests where it's filled.
- `src/lib/rate-limit.ts` — in-memory sliding-window limiter (5 reqs / IP / minute on `/api/leads`). Fine for single-instance deploys; swap for Upstash/Redis if going horizontal.

### Path alias

`@/*` → `src/*` (see `tsconfig.json`). Use this everywhere; do not use relative `../../` imports across `src/` subdirs.

## Known footguns

- **Strict mode is on** (`reactStrictMode: true`). Effects run twice in dev; ensure cleanup functions are correct.
- **Server Action body size limit is the default 1 MB.** Don't try to send raw camera photos through a server action — always optimize client-side first (see `src/lib/optimize-image.ts`). Raising the limit in `next.config.ts` is possible but we chose optimization instead.
- **Prisma bypasses RLS.** All app data access goes through Prisma (postgres role). RLS exists only as defense against PostgREST `/rest/v1/*` access from the browser using the publishable key. If you start using `supabase.from('Lead').select()` directly, you have to add explicit policies.
- **PgBouncer + Prisma quirk.** `DATABASE_URL` must include `?pgbouncer=true&connection_limit=1`. Migrations use `DIRECT_URL` (session-pooler port 5432) to avoid the same issue.
- **`output: "standalone"`** + `npm run start` uses `bun` — `node .next/standalone/server.js` won't match the documented prod workflow. The `build` script also `cp`s static/public into the standalone dir; if you change `build`, preserve those copies or `/public/` won't serve in production.
- **`landing-page.tsx` is a client component** — module-level data fetching is not possible there. Always fetch in `page.tsx` (server) and pass props down.
- **`NEXT_PUBLIC_SITE_URL`** — optional, defaults to `https://universonomada.cl` for `metadataBase` and the sitemap. Override in `.env` for staging.
- **Prisma client cache after `migrate dev`** — the dev server keeps the old generated client in memory. After any schema change, `Ctrl+C` and restart `npm run dev` or you'll get runtime `Cannot read properties of undefined` on the new columns.
- **Wave/mountain dividers between sections** (`landing-page.tsx`) — each `<div>` divider has a wrapper bg matching the END color of the section above, and an SVG `<path fill>` matching the START color of the section below. If you change a section's gradient stops, you must update its neighbour dividers too. Section backgrounds intentionally **do not use** `texture-topo`/`texture-grain` overlays so the colors at the boundaries don't tint differently than the dividers (the texture CSS classes still exist in `globals.css` but are not currently applied anywhere).
- **`download/` and `upload/`** at the repo root are owner reference material (strategy PDF, screenshots, source images), not used by the build. Not in `.gitignore` today — confirm with the owner before committing them.

## Conventions worth keeping

- Adding a new shadcn/ui component: use the shadcn CLI (`new-york` style, base color `neutral`, icon library `lucide` — see `components.json`); it will land in `src/components/ui/`.
- Currency: always use `formatCLP(n)` from `@/lib/format` (single source of truth).
- Phones for WhatsApp: use `whatsappUrl(phone, text?)` from `@/lib/format`. It normalizes to Chilean +56 when no international prefix is present.
- Lead capture goes to `POST /api/leads` — keep new capture surfaces pointed there, include the `<Honeypot ref={...}>` field, and pass `_website: ref.current?.value` in the body.
- Admin mutations: server actions only, always start with `await requireAdmin()`, always `revalidatePath()` the affected routes (typically the admin list, `/admin`, and `/` if it surfaces on the public site).
- New admin sections: mirror the structure of `src/app/admin/promociones/` (list page + `actions.ts` + form component + `[id]/page.tsx` + `new/page.tsx` + dropdown menu component).
- Array-of-strings fields on a model (`highlights`, `includes`, etc.): in the admin form use a `<Textarea>` with `defaultValue={value.join("\n")}`; in the action, `value.split(/\r?\n/).map(s => s.trim()).filter(Boolean)`. See `src/app/admin/destinos/` for the canonical example (`ListField` helper + `parseLines`).

-- ============================================================================
-- Universo Nomada · Supabase setup (Storage bucket + RLS)
-- ============================================================================
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
-- All statements are idempotent; safe to re-run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Storage bucket "media" for promotion/destination images
-- ---------------------------------------------------------------------------
-- Public so <Image> on the marketing site can load URLs without signing.
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

-- Anyone can read uploaded images (public bucket).
drop policy if exists "media: public read" on storage.objects;
create policy "media: public read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'media');

-- Only authenticated users (logged-in admins) can write/delete via PostgREST.
-- The server-side admin client uses the secret key and bypasses RLS entirely,
-- so this only matters as defense-in-depth.
drop policy if exists "media: authenticated write" on storage.objects;
create policy "media: authenticated write"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'media');

drop policy if exists "media: authenticated update" on storage.objects;
create policy "media: authenticated update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'media');

drop policy if exists "media: authenticated delete" on storage.objects;
create policy "media: authenticated delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'media');

-- ---------------------------------------------------------------------------
-- 2. Row Level Security on app tables
-- ---------------------------------------------------------------------------
-- Prisma connects with the postgres role and bypasses RLS. RLS here only
-- protects the auto-generated PostgREST API (/rest/v1/*), which is reachable
-- with the publishable key from any browser. We deny everything by default;
-- the Next.js app reads/writes via Prisma + server actions.
alter table "Lead"        enable row level security;
alter table "Promotion"   enable row level security;
alter table "Destination" enable row level security;

-- Drop any pre-existing policies (idempotent reset)
do $$
declare r record;
begin
  for r in
    select policyname, schemaname, tablename
    from pg_policies
    where schemaname = 'public'
      and tablename in ('Lead', 'Promotion', 'Destination')
  loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end$$;

-- No policies = no access via PostgREST for anon or authenticated.
-- Prisma still works (bypass) — that's the intent.

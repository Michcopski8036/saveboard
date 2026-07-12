-- App version gate: per-platform latest/min version used by the native
-- UpdateGate to show a soft "update available" banner (below latest_version)
-- or a blocking "update required" screen (below min_version).
--
-- Apply in the Supabase SQL editor (prod) BEFORE shipping the native build
-- that contains src/app/components/UpdateGate.tsx.

create table if not exists public.app_config (
  platform       text primary key check (platform in ('ios', 'android')),
  latest_version text not null,   -- newest version in the store (soft prompt below this)
  min_version    text not null,   -- hard floor (blocking prompt below this) — keep <= latest normally
  store_url      text not null,   -- where the "Update" / "Open store" button sends the user
  updated_at     timestamptz not null default now()
);

-- Anyone (incl. the anon key the app ships with) may read it; nobody writes via the API.
alter table public.app_config enable row level security;

drop policy if exists "app_config public read" on public.app_config;
create policy "app_config public read"
  on public.app_config for select
  using (true);

-- Seed. latest = min = the first version that actually contains the UpdateGate,
-- so the gate has a sane floor. On future releases: bump latest_version to show
-- a soft banner; also bump min_version only for critical releases (forces update).
insert into public.app_config (platform, latest_version, min_version, store_url) values
  ('ios',     '1.0.5',  '1.0.5',  'https://apps.apple.com/app/id6770486850'),
  ('android', '1.0.10', '1.0.10', 'https://play.google.com/store/apps/details?id=app.saveboard.saveboard')
on conflict (platform) do update
  set latest_version = excluded.latest_version,
      min_version    = excluded.min_version,
      store_url      = excluded.store_url,
      updated_at     = now();

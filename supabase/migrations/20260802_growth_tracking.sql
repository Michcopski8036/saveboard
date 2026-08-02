-- Anonymous traffic + routine self-reporting. Both are insert-only from the
-- outside: the anon key can add rows but never read them back, so nothing here
-- is exposed to the public even though the key ships in the web bundle.

create table if not exists public.page_events (
  id          uuid primary key default gen_random_uuid(),
  event       text not null check (event in ('pageview', 'board_click', 'signup_click')),
  path        text not null,
  referrer    text,
  meta        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists page_events_created_idx on public.page_events (created_at desc);
create index if not exists page_events_path_idx    on public.page_events (path);

create table if not exists public.automation_runs (
  id            uuid primary key default gen_random_uuid(),
  routine       text not null,
  status        text not null check (status in ('success', 'partial', 'failed')),
  summary       text,
  artifact_url  text,
  ran_at        timestamptz not null default now()
);
create index if not exists automation_runs_ran_idx on public.automation_runs (ran_at desc);

alter table public.page_events     enable row level security;
alter table public.automation_runs enable row level security;

-- INSERT only. No select policy exists, so anon/authenticated can never read
-- these back; the admin endpoint reads them with the service role, which
-- bypasses RLS.
drop policy if exists page_events_insert on public.page_events;
create policy page_events_insert on public.page_events
  for insert to anon, authenticated with check (true);

drop policy if exists automation_runs_insert on public.automation_runs;
create policy automation_runs_insert on public.automation_runs
  for insert to anon, authenticated with check (true);

-- Unified boards — Phase 1 (2026-07-02). ADDITIVE + non-breaking.
-- Turns "boards" into real entities and backfills from existing categories/links.
-- Does NOT change the links RLS yet, so the current live client keeps working.
-- The links.category column is kept as a fallback (dropped later in Phase 3).
-- ⚠️ BACK UP first (export the `links` and `categories` tables), then run in the SQL editor.

-- ── 1. Tables ────────────────────────────────────────────────────────────────
create table if not exists public.boards (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references auth.users(id) on delete cascade,
  name         text not null,
  sort_order   int  not null default 0,
  invite_token uuid,                       -- set when the board is first shared
  created_at   timestamptz not null default now()
);
create index if not exists boards_owner_idx on public.boards(owner_id);
create unique index if not exists boards_owner_name_uq on public.boards(owner_id, name);

create table if not exists public.board_members (
  board_id  uuid not null references public.boards(id) on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  role      text not null default 'member',        -- 'owner' | 'member'
  joined_at timestamptz not null default now(),
  primary key (board_id, user_id)
);
create index if not exists board_members_user_idx on public.board_members(user_id);

-- ── 2. links.board_id (nullable; old client ignores it) ──────────────────────
alter table public.links add column if not exists board_id uuid references public.boards(id) on delete set null;
create index if not exists links_board_idx on public.links(board_id);

-- ── 3. Backfill existing data ────────────────────────────────────────────────
-- boards from the categories table
insert into public.boards (owner_id, name, sort_order)
select c.user_id, c.name, coalesce(c.sort_order, 0)
from public.categories c
where c.name is not null and btrim(c.name) <> ''
  and not exists (select 1 from public.boards b where b.owner_id = c.user_id and b.name = c.name);

-- boards from any link categories that aren't in the categories table
insert into public.boards (owner_id, name)
select distinct l.user_id, l.category
from public.links l
where l.category is not null and btrim(l.category) <> ''
  and not exists (select 1 from public.boards b where b.owner_id = l.user_id and b.name = l.category);

-- owner memberships
insert into public.board_members (board_id, user_id, role)
select b.id, b.owner_id, 'owner' from public.boards b
where not exists (select 1 from public.board_members m where m.board_id = b.id and m.user_id = b.owner_id);

-- point links at their board (unsorted links keep board_id = null)
update public.links l
set board_id = b.id
from public.boards b
where b.owner_id = l.user_id and b.name = l.category and l.board_id is null;

-- ── 4. Helpers (SECURITY DEFINER → bypass RLS, avoid policy recursion) ───────
create or replace function public.is_board_member(p_board uuid)
returns boolean language sql security definer set search_path = public as $$
  select exists (select 1 from public.board_members where board_id = p_board and user_id = auth.uid());
$$;
create or replace function public.is_board_owner(p_board uuid)
returns boolean language sql security definer set search_path = public as $$
  select exists (select 1 from public.boards where id = p_board and owner_id = auth.uid());
$$;
grant execute on function public.is_board_member(uuid) to authenticated;
grant execute on function public.is_board_owner(uuid)  to authenticated;

-- ── 5. RLS on the new tables (links RLS unchanged until Phase 2) ─────────────
alter table public.boards        enable row level security;
alter table public.board_members enable row level security;

drop policy if exists boards_select on public.boards;
create policy boards_select on public.boards for select to authenticated
  using (owner_id = auth.uid() or public.is_board_member(id));
drop policy if exists boards_update on public.boards;
create policy boards_update on public.boards for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists boards_delete on public.boards;
create policy boards_delete on public.boards for delete to authenticated
  using (owner_id = auth.uid());
-- (INSERT goes through the create_board RPC added in Phase 2)

drop policy if exists board_members_select on public.board_members;
create policy board_members_select on public.board_members for select to authenticated
  using (user_id = auth.uid() or public.is_board_owner(board_id));
drop policy if exists board_members_delete on public.board_members;
create policy board_members_delete on public.board_members for delete to authenticated
  using (user_id = auth.uid() or public.is_board_owner(board_id));

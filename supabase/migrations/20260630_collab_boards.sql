-- Team plan: collaborative boards (live, multi-member), 2026-06-30
-- Free tier: 1 owned collab board, up to 5 members (incl. owner) — a "try it" trial.
-- Team plan (subscriptions.plan='team', active): unlimited boards + members.
-- Invited members edit for FREE; only the board OWNER needs Team to go past the trial.
--
-- ⚠️ Apply this in the Supabase SQL editor BEFORE deploying the client that uses it.

-- ── Tables ───────────────────────────────────────────────────────────────────
create table if not exists public.collab_boards (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references auth.users(id) on delete cascade,
  name         text not null,
  invite_token uuid not null default gen_random_uuid() unique,
  created_at   timestamptz not null default now()
);
create index if not exists collab_boards_owner_idx on public.collab_boards(owner_id);

create table if not exists public.collab_board_members (
  board_id  uuid not null references public.collab_boards(id) on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  role      text not null default 'member',          -- 'owner' | 'member'
  joined_at timestamptz not null default now(),
  primary key (board_id, user_id)
);
create index if not exists collab_members_user_idx on public.collab_board_members(user_id);

create table if not exists public.collab_links (
  id          uuid primary key default gen_random_uuid(),
  board_id    uuid not null references public.collab_boards(id) on delete cascade,
  url         text,
  title       text,
  description text,
  image       text,
  tags        text[],
  notes       text,
  added_by    uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists collab_links_board_idx on public.collab_links(board_id);

-- ── Helper functions (SECURITY DEFINER → bypass RLS, so policies don't recurse) ─
create or replace function public.is_collab_member(p_board uuid)
returns boolean language sql security definer set search_path = public as $$
  select exists (select 1 from public.collab_board_members
                 where board_id = p_board and user_id = auth.uid());
$$;

create or replace function public.is_collab_owner(p_board uuid)
returns boolean language sql security definer set search_path = public as $$
  select exists (select 1 from public.collab_boards
                 where id = p_board and owner_id = auth.uid());
$$;

create or replace function public.has_team_plan(p_user uuid)
returns boolean language sql security definer set search_path = public as $$
  select exists (select 1 from public.subscriptions
                 where user_id = p_user and status = 'active' and plan = 'team');
$$;

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table public.collab_boards        enable row level security;
alter table public.collab_board_members enable row level security;
alter table public.collab_links         enable row level security;

-- collab_boards: members read; owner writes (creation goes through create_collab_board RPC)
drop policy if exists collab_boards_select on public.collab_boards;
create policy collab_boards_select on public.collab_boards for select to authenticated
  using (owner_id = auth.uid() or public.is_collab_member(id));
drop policy if exists collab_boards_update on public.collab_boards;
create policy collab_boards_update on public.collab_boards for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists collab_boards_delete on public.collab_boards;
create policy collab_boards_delete on public.collab_boards for delete to authenticated
  using (owner_id = auth.uid());

-- collab_board_members: you see your own row; owner sees all. Join via RPC; leave/remove via delete.
drop policy if exists collab_members_select on public.collab_board_members;
create policy collab_members_select on public.collab_board_members for select to authenticated
  using (user_id = auth.uid() or public.is_collab_owner(board_id));
drop policy if exists collab_members_delete on public.collab_board_members;
create policy collab_members_delete on public.collab_board_members for delete to authenticated
  using (user_id = auth.uid() or public.is_collab_owner(board_id));

-- collab_links: any member can read + write
drop policy if exists collab_links_select on public.collab_links;
create policy collab_links_select on public.collab_links for select to authenticated
  using (public.is_collab_member(board_id));
drop policy if exists collab_links_insert on public.collab_links;
create policy collab_links_insert on public.collab_links for insert to authenticated
  with check (public.is_collab_member(board_id) and added_by = auth.uid());
drop policy if exists collab_links_update on public.collab_links;
create policy collab_links_update on public.collab_links for update to authenticated
  using (public.is_collab_member(board_id)) with check (public.is_collab_member(board_id));
drop policy if exists collab_links_delete on public.collab_links;
create policy collab_links_delete on public.collab_links for delete to authenticated
  using (public.is_collab_member(board_id));

-- ── RPCs (enforce free-tier limits + safe joins) ─────────────────────────────
-- Create a board (adds the owner as a member). Free tier: max 1 owned board.
create or replace function public.create_collab_board(p_name text)
returns public.collab_boards language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_count int; v_board public.collab_boards;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if not public.has_team_plan(v_uid) then
    select count(*) into v_count from public.collab_boards where owner_id = v_uid;
    if v_count >= 1 then
      raise exception 'free_limit_boards' using hint = 'Upgrade to Team for unlimited collaborative boards.';
    end if;
  end if;
  insert into public.collab_boards (owner_id, name)
    values (v_uid, coalesce(nullif(trim(p_name), ''), 'Team board'))
    returning * into v_board;
  insert into public.collab_board_members (board_id, user_id, role) values (v_board.id, v_uid, 'owner');
  return v_board;
end; $$;

-- Join a board via its invite token. Free owner → cap total members at 5. Idempotent.
create or replace function public.join_collab_board(p_token uuid)
returns public.collab_boards language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_board public.collab_boards; v_members int;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  select * into v_board from public.collab_boards where invite_token = p_token;
  if v_board.id is null then raise exception 'board_not_found'; end if;
  if exists (select 1 from public.collab_board_members where board_id = v_board.id and user_id = v_uid) then
    return v_board;                                   -- already a member
  end if;
  if not public.has_team_plan(v_board.owner_id) then
    select count(*) into v_members from public.collab_board_members where board_id = v_board.id;
    if v_members >= 5 then
      raise exception 'free_limit_members' using hint = 'This board is full — the owner can upgrade to Team for more members.';
    end if;
  end if;
  insert into public.collab_board_members (board_id, user_id, role) values (v_board.id, v_uid, 'member');
  return v_board;
end; $$;

-- Preview a board from its invite token without joining (for the join screen).
create or replace function public.get_collab_board_by_token(p_token uuid)
returns table (id uuid, name text, owner_name text, member_count int)
language sql security definer set search_path = public as $$
  select b.id, b.name,
         coalesce((select coalesce(raw_user_meta_data->>'name', raw_user_meta_data->>'full_name', '')
                   from auth.users where id = b.owner_id), ''),
         (select count(*)::int from public.collab_board_members m where m.board_id = b.id)
  from public.collab_boards b where b.invite_token = p_token;
$$;

-- ── Grants ───────────────────────────────────────────────────────────────────
grant execute on function public.create_collab_board(text)       to authenticated;
grant execute on function public.join_collab_board(uuid)         to authenticated;
grant execute on function public.get_collab_board_by_token(uuid) to anon, authenticated;
grant execute on function public.is_collab_member(uuid)          to authenticated;
grant execute on function public.is_collab_owner(uuid)           to authenticated;

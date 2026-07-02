-- Unified boards — Phase 2 (2026-07-02). RPCs + broaden links RLS to board members.
-- ADDITIVE and safe for the current client (only GRANTS more access; nothing removed).
-- Tiers: boards 5/15/50 · shared boards 1/5/10 · members/shared board 5/10/25.
-- ⚠️ Apply in the SQL editor AFTER Phase 1.

-- ── Create a board (enforces the total-board tier limit); adds owner as member ─
create or replace function public.create_board(p_name text)
returns public.boards language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_plan text; v_max int; v_count int; v_board public.boards;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  select coalesce((select plan from public.subscriptions where user_id = v_uid and status = 'active' limit 1), 'free') into v_plan;
  v_max := case v_plan when 'team' then 50 when 'pro' then 15 else 5 end;
  select count(*) into v_count from public.boards where owner_id = v_uid;
  if v_count >= v_max then raise exception 'board_limit' using hint = 'You have reached your plan''s board limit.'; end if;
  insert into public.boards (owner_id, name, sort_order)
    values (v_uid, coalesce(nullif(trim(p_name), ''), 'Untitled'), v_count) returning * into v_board;
  insert into public.board_members (board_id, user_id, role) values (v_board.id, v_uid, 'owner');
  return v_board;
end; $$;

-- ── Make a board shareable (generate invite token); enforces shared-board limit ─
create or replace function public.share_board(p_board uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_plan text; v_max int; v_shared int; v_owner uuid; v_existing uuid; v_token uuid;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  select owner_id, invite_token into v_owner, v_existing from public.boards where id = p_board;
  if v_owner is null then raise exception 'board_not_found'; end if;
  if v_owner <> v_uid then raise exception 'not_owner'; end if;
  if v_existing is not null then return v_existing; end if;         -- already shared
  select coalesce((select plan from public.subscriptions where user_id = v_uid and status = 'active' limit 1), 'free') into v_plan;
  v_max := case v_plan when 'team' then 10 when 'pro' then 5 else 1 end;
  select count(*) into v_shared from public.boards where owner_id = v_uid and invite_token is not null;
  if v_shared >= v_max then raise exception 'share_limit' using hint = 'You have reached your plan''s shared-board limit.'; end if;
  v_token := gen_random_uuid();
  update public.boards set invite_token = v_token where id = p_board;
  return v_token;
end; $$;

-- ── Join a shared board via its invite token (member cap set by owner's plan) ──
create or replace function public.join_board(p_token uuid)
returns public.boards language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_board public.boards; v_plan text; v_max int; v_members int;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  select * into v_board from public.boards where invite_token = p_token;
  if v_board.id is null then raise exception 'board_not_found'; end if;
  if exists (select 1 from public.board_members where board_id = v_board.id and user_id = v_uid) then return v_board; end if;
  select coalesce((select plan from public.subscriptions where user_id = v_board.owner_id and status = 'active' limit 1), 'free') into v_plan;
  v_max := case v_plan when 'team' then 25 when 'pro' then 10 else 5 end;
  select count(*) into v_members from public.board_members where board_id = v_board.id;
  if v_members >= v_max then raise exception 'limit_members' using hint = 'This board is full.'; end if;
  insert into public.board_members (board_id, user_id, role) values (v_board.id, v_uid, 'member');
  return v_board;
end; $$;

-- ── Preview a board from its invite token (join screen) ──────────────────────
create or replace function public.get_board_by_token(p_token uuid)
returns table (id uuid, name text, owner_name text, member_count int)
language sql security definer set search_path = public as $$
  select b.id, b.name,
    coalesce((select coalesce(raw_user_meta_data->>'name', raw_user_meta_data->>'full_name', '') from auth.users where id = b.owner_id), ''),
    (select count(*)::int from public.board_members m where m.board_id = b.id)
  from public.boards b where b.invite_token = p_token;
$$;

grant execute on function public.create_board(text)        to authenticated;
grant execute on function public.share_board(uuid)         to authenticated;
grant execute on function public.join_board(uuid)          to authenticated;
grant execute on function public.get_board_by_token(uuid)  to anon, authenticated;

-- ── Broaden links RLS: board members can read/write that board's links ───────
-- (Permissive → OR's with existing owner policies. board_id null = owner-only,
--  since is_board_member(null) is false. Nothing is removed.)
drop policy if exists links_member_select on public.links;
create policy links_member_select on public.links for select to authenticated
  using (public.is_board_member(board_id));
drop policy if exists links_member_insert on public.links;
create policy links_member_insert on public.links for insert to authenticated
  with check (user_id = auth.uid() and public.is_board_member(board_id));
drop policy if exists links_member_update on public.links;
create policy links_member_update on public.links for update to authenticated
  using (public.is_board_member(board_id)) with check (public.is_board_member(board_id));
drop policy if exists links_member_delete on public.links;
create policy links_member_delete on public.links for delete to authenticated
  using (public.is_board_member(board_id));

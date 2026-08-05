-- System accounts exempt from the per-plan board limits.
--
-- The guides bot publishes a board a week. It is not a customer, so the honest
-- way to lift its limit is NOT to write it a `subscriptions` row: that table is
-- the Stripe/Apple webhook's alone to write, and admin-stats counts it into
-- proCount/teamCount — a fake row would show up as a paying Team customer and
-- quietly corrupt the revenue numbers.
--
-- Instead: a tiny allowlist that create_board and share_board consult. Nothing
-- else reads it, and a row here grants no extra data access — only the right to
-- own more of your own boards.

create table if not exists public.system_accounts (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  note       text not null,
  created_at timestamptz not null default now()
);

alter table public.system_accounts enable row level security;
-- No policies at all: unreachable from anon and authenticated. Only the
-- SECURITY DEFINER functions below (and the service role) can see it.

insert into public.system_accounts (user_id, note)
values ('b749a7b5-ccb6-432f-b475-2abc424d3ff5', 'SaveBoard Guides — publishes one public board per /guides/ post')
on conflict (user_id) do nothing;

create or replace function public.is_system_account(p_user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.system_accounts where user_id = p_user);
$$;

-- ── create_board: same as 20260702, plus the system-account exemption ─────────
create or replace function public.create_board(p_name text)
returns public.boards language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_plan text; v_max int; v_count int; v_board public.boards;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  select coalesce((select plan from public.subscriptions where user_id = v_uid and status = 'active' limit 1), 'free') into v_plan;
  v_max := case v_plan when 'team' then 50 when 'pro' then 15 else 5 end;
  select count(*) into v_count from public.boards where owner_id = v_uid;
  if v_count >= v_max and not public.is_system_account(v_uid) then
    raise exception 'board_limit' using hint = 'You have reached your plan''s board limit.';
  end if;
  insert into public.boards (owner_id, name, sort_order)
    values (v_uid, coalesce(nullif(trim(p_name), ''), 'Untitled'), v_count) returning * into v_board;
  insert into public.board_members (board_id, user_id, role) values (v_board.id, v_uid, 'owner');
  return v_board;
end; $$;

-- ── share_board: same as 20260702, plus the system-account exemption ──────────
create or replace function public.share_board(p_board uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_plan text; v_max int; v_shared int; v_owner uuid; v_existing uuid; v_token uuid;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  select owner_id, invite_token into v_owner, v_existing from public.boards where id = p_board;
  if v_owner is null then raise exception 'board_not_found'; end if;
  if v_owner <> v_uid then raise exception 'not_owner'; end if;
  if v_existing is not null then return v_existing; end if;
  select coalesce((select plan from public.subscriptions where user_id = v_uid and status = 'active' limit 1), 'free') into v_plan;
  v_max := case v_plan when 'team' then 10 when 'pro' then 5 else 1 end;
  select count(*) into v_shared from public.boards where owner_id = v_uid and invite_token is not null;
  if v_shared >= v_max and not public.is_system_account(v_uid) then
    raise exception 'share_limit' using hint = 'You have reached your plan''s shared-board limit.';
  end if;
  v_token := gen_random_uuid();
  update public.boards set invite_token = v_token where id = p_board;
  return v_token;
end; $$;

revoke all on function public.is_system_account(uuid) from public, anon, authenticated;
grant execute on function public.create_board(text) to authenticated;
grant execute on function public.share_board(uuid)  to authenticated;

notify pgrst, 'reload schema';

-- Tiered caps for collaborative boards (2026-07-01).
-- Prevents one flat sub from carrying unlimited free members, and differentiates Pro.
--   Free : 1 collab board,  5 members/board
--   Pro  : 5 collab boards, 10 members/board
--   Team : 25 collab boards, 25 members/board
-- (Personal saves/boards + the 10GB storage cap are unchanged.)
-- ⚠️ Apply in the Supabase SQL editor.

create or replace function public.create_collab_board(p_name text)
returns public.collab_boards language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_count int; v_max int; v_plan text; v_board public.collab_boards;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  select coalesce((select plan from public.subscriptions where user_id = v_uid and status = 'active' limit 1), 'free') into v_plan;
  v_max := case v_plan when 'team' then 25 when 'pro' then 5 else 1 end;
  select count(*) into v_count from public.collab_boards where owner_id = v_uid;
  if v_count >= v_max then
    if    v_plan = 'team' then raise exception 'team_limit_boards' using hint = 'Team is limited to 25 collaborative boards.';
    elsif v_plan = 'pro'  then raise exception 'pro_limit_boards'  using hint = 'Upgrade to Team for up to 25 collaborative boards.';
    else  raise exception 'free_limit_boards' using hint = 'Upgrade for more collaborative boards.';
    end if;
  end if;
  insert into public.collab_boards (owner_id, name)
    values (v_uid, coalesce(nullif(trim(p_name), ''), 'Team board')) returning * into v_board;
  insert into public.collab_board_members (board_id, user_id, role) values (v_board.id, v_uid, 'owner');
  return v_board;
end; $$;

create or replace function public.join_collab_board(p_token uuid)
returns public.collab_boards language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_board public.collab_boards; v_members int; v_max int; v_plan text;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  select * into v_board from public.collab_boards where invite_token = p_token;
  if v_board.id is null then raise exception 'board_not_found'; end if;
  if exists (select 1 from public.collab_board_members where board_id = v_board.id and user_id = v_uid) then
    return v_board;                                   -- already a member (idempotent)
  end if;
  -- member cap is set by the board OWNER's plan
  select coalesce((select plan from public.subscriptions where user_id = v_board.owner_id and status = 'active' limit 1), 'free') into v_plan;
  v_max := case v_plan when 'team' then 25 when 'pro' then 10 else 5 end;
  select count(*) into v_members from public.collab_board_members where board_id = v_board.id;
  if v_members >= v_max then
    raise exception 'limit_members' using hint = 'This board has reached its member limit.';
  end if;
  insert into public.collab_board_members (board_id, user_id, role) values (v_board.id, v_uid, 'member');
  return v_board;
end; $$;

grant execute on function public.create_collab_board(text) to authenticated;
grant execute on function public.join_collab_board(uuid)   to authenticated;

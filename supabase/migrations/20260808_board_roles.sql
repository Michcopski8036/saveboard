-- Board member roles: 'viewer' (read-only) joins 'owner' | 'member'.
-- Default behaviour is unchanged — members keep full link edit rights; only a
-- Team-plan owner can demote a member to viewer (enforced in set_member_role,
-- the ONLY write path: board_members has no UPDATE policy).
-- Apply BEFORE deploying the client that calls set_member_role.

-- ── 1. Editor check: member whose role is not 'viewer' ───────────────────────
create or replace function public.is_board_editor(p_board uuid)
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from public.board_members
    where board_id = p_board and user_id = auth.uid() and role <> 'viewer'
  );
$$;
grant execute on function public.is_board_editor(uuid) to authenticated;

-- ── 2. Link writes require editor; reads stay open to every member ───────────
drop policy if exists links_member_insert on public.links;
create policy links_member_insert on public.links for insert to authenticated
  with check (user_id = auth.uid() and public.is_board_editor(board_id));
drop policy if exists links_member_update on public.links;
create policy links_member_update on public.links for update to authenticated
  using (public.is_board_editor(board_id)) with check (public.is_board_editor(board_id));
drop policy if exists links_member_delete on public.links;
create policy links_member_delete on public.links for delete to authenticated
  using (public.is_board_editor(board_id));

-- ── 3. Role changes: board owner on the Team plan only ───────────────────────
create or replace function public.set_member_role(p_board uuid, p_user uuid, p_role text)
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_plan text;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if not exists (select 1 from public.boards where id = p_board and owner_id = v_uid) then
    raise exception 'not_owner';
  end if;
  if p_role not in ('member', 'viewer') then raise exception 'bad_role'; end if;
  if p_user = v_uid then raise exception 'own_role'; end if;
  select coalesce((select plan from public.subscriptions
                   where user_id = v_uid and status = 'active' limit 1), 'free') into v_plan;
  if v_plan <> 'team' then
    raise exception 'team_required' using hint = 'Member roles are a Team feature.';
  end if;
  update public.board_members set role = p_role
  where board_id = p_board and user_id = p_user and role <> 'owner';
end; $$;
grant execute on function public.set_member_role(uuid, uuid, text) to authenticated;

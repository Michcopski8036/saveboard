-- Harden shared_board_views inserts: route them through a SECURITY DEFINER RPC
-- so viewer identity can't be spoofed by the client.
--
-- Context: previously the public share page inserted view rows directly
-- (shared_board_views_insert policy, with check board_token_exists(token)).
-- That blocked views for non-existent tokens, but anyone holding a real share
-- token could still insert arbitrary rows and supply any `viewer_email` they
-- liked (the client passed it in). Low severity — analytics pollution only,
-- owner-only SELECT still protected reads — but the email field was untrusted.
--
-- Fix: record_board_view(p_token) derives viewer_id from auth.uid() and
-- viewer_email from the JWT, validates the token, inserts as definer, and folds
-- in the view-count bump so the client makes a single round trip. The direct
-- INSERT policy is then dropped, removing the spoofable path entirely.
--
-- Compatibility: increment_board_view() is intentionally kept. Already-released
-- native clients (iOS <=11, Android versionCode <=2) still call the old direct
-- insert (which now fails silently — fire-and-forget, acceptable analytics loss)
-- plus increment_board_view (still works, so view counts keep ticking for them).

create or replace function public.record_board_view(p_token uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_viewer_id   uuid := auth.uid();
  v_viewer_email text := nullif(auth.jwt() ->> 'email', '');
begin
  -- Ignore views for tokens that don't map to a real board.
  if not exists (select 1 from public.shared_boards where token = p_token) then
    return;
  end if;

  insert into public.shared_board_views (token, viewer_id, viewer_email)
  values (p_token, v_viewer_id, v_viewer_email);

  update public.shared_boards
  set view_count = coalesce(view_count, 0) + 1
  where token = p_token;
end;
$$;

revoke all on function public.record_board_view(uuid) from public;
grant execute on function public.record_board_view(uuid) to anon, authenticated;

-- Remove the direct, spoofable insert path. With no INSERT policy, anon and
-- authenticated can no longer insert directly; the definer RPC above is the
-- only way in. The owner-only SELECT policy (shared_board_views_owner_select)
-- and the service-role bypass are unaffected.
drop policy if exists shared_board_views_insert on public.shared_board_views;

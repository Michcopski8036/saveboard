-- Board invite preview (2026-08-19). Lets the /team/<invite_token> landing page
-- show the board's actual links BEFORE the visitor joins — the "see it, then
-- one click to join" conversion bridge (viewer → member). Before this, the
-- invite page demanded sign-in while showing nothing of the board.
--
-- Security: knowing the invite token ALREADY grants the ability to join the
-- board (join_board is open to any authenticated user with the token, and the
-- sign-up → auto-join flow makes that one click away for anon too) and thereby
-- read every link in it. A token-gated read-only preview therefore exposes
-- nothing a token holder could not already reach. notes and user_id are
-- deliberately NOT returned. The public /share snapshot link is untouched —
-- it stays read-only and never bridges into membership.
--
-- ⚠️ Apply in the SQL editor BEFORE deploying the client that calls it.
--    (The client falls back to the old meta-only join card while this RPC is
--    missing, so the ordering is fail-safe either way.)

create or replace function public.get_board_invite_preview(p_token uuid)
returns table (id text, url text, title text, description text, image text, created_at bigint)
language sql security definer set search_path = public as $$
  select l.id, l.url, l.title, l.description, l.image, l.created_at::bigint
  from public.links l
  join public.boards b on b.id = l.board_id
  where b.invite_token = p_token
  order by l.created_at desc
  limit 60;
$$;

revoke all on function public.get_board_invite_preview(uuid) from public;
grant execute on function public.get_board_invite_preview(uuid) to anon, authenticated;

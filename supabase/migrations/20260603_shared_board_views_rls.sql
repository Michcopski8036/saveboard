-- Enable Row Level Security on shared_board_views and lock down access.
--
-- Context: shared_board_views records who viewed a public shared board.
-- It contains viewer PII (viewer_email). With RLS disabled, the anon
-- (publishable) key could SELECT every row and harvest all viewer emails
-- across all boards, and could UPDATE/DELETE arbitrary rows.
--
-- Legitimate access paths that must keep working:
--   1. Anyone viewing a shared board records a view  (INSERT, anon or authed)
--   2. A board owner reads views for their own boards (SELECT, authed owner)
--   3. Admin stats counts rows                        (service role, bypasses RLS)
--
-- Note: `token` is a public share token (it appears in the share URL), not a
-- secret credential — the sensitivity flag on that column is a false positive.

alter table public.shared_board_views enable row level security;

-- (1) Allow anyone to record a view. The viewer's client never reads the row
-- back (insert is return=minimal), so no SELECT grant is needed for this path.
-- Note: we intentionally do NOT gate this on the board existing in
-- shared_boards. Once shared_boards has RLS enabled (see
-- 20260603_shared_boards_rls.sql), anon can no longer SELECT that table
-- directly, so an EXISTS subquery here would always be false and would silently
-- drop every view record. A stray view row for a non-existent token is
-- harmless; the owner-only SELECT policy below never surfaces it.
drop policy if exists shared_board_views_insert on public.shared_board_views;
create policy shared_board_views_insert
  on public.shared_board_views
  for insert
  to anon, authenticated
  with check (true);

-- (2) Only the owner of the referenced board may read its view records.
drop policy if exists shared_board_views_owner_select on public.shared_board_views;
create policy shared_board_views_owner_select
  on public.shared_board_views
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.shared_boards b
      where b.token = (shared_board_views.token)::uuid
        and b.owner_id = auth.uid()
    )
  );

-- No UPDATE or DELETE policies are defined, so those operations are denied
-- for anon and authenticated roles by default. The service role used by
-- api/admin-stats.ts bypasses RLS and is unaffected.

-- Enable Row Level Security on shared_boards and route public access through
-- SECURITY DEFINER functions so anonymous visitors can neither enumerate the
-- table nor write to it directly.
--
-- Problem with plain RLS here: "anyone with the link can view" means anon must
-- be able to fetch a board *by token*. A permissive `using (true)` SELECT policy
-- would also let anon run `select * from shared_boards` with no filter and dump
-- every user's email + entire links_snapshot. RLS cannot require that a caller
-- supply the token, so public reads go through get_shared_board(token) instead,
-- and direct anon access is denied entirely.
--
-- Likewise, the public share page used to let anon UPDATE view_count directly;
-- granting anon UPDATE on the table can't be restricted to a single column, so
-- that is replaced by increment_board_view(token).
--
-- Legitimate access paths after this migration:
--   * Public share page / OG preview / unauth import  -> get_shared_board()  (anon)
--   * View counter                                    -> increment_board_view() (anon)
--   * A board owner managing their own boards          -> direct table access (RLS)
--   * Account deletion / admin stats                   -> service role (bypasses RLS)

alter table public.shared_boards enable row level security;

-- Owners get full access to their own rows only. This single FOR ALL policy
-- covers the SELECT (own boards), INSERT (create share), UPDATE (sync snapshot)
-- and DELETE (revoke) paths in App.tsx and ShareModal.tsx.
drop policy if exists shared_boards_owner_all on public.shared_boards;
create policy shared_boards_owner_all
  on public.shared_boards
  for all
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- No anon policy: anonymous and non-owner direct access is denied. Public reads
-- and the view counter go through the SECURITY DEFINER functions below, which
-- run as the function owner and therefore bypass the policy above.

-- ── Public read by token ────────────────────────────────────────────────────
-- Returns the single board matching the token (or no rows). SETOF the table
-- keeps the column types exactly in sync with the schema. owner_id is included
-- but is a non-secret user UUID that grants no access on its own.
-- p_token is uuid because shared_boards.token is a uuid column. The client
-- passes the token as a JSON string and PostgREST coerces it to uuid.
create or replace function public.get_shared_board(p_token uuid)
returns setof public.shared_boards
language sql
security definer
set search_path = public
stable
as $$
  select * from public.shared_boards where token = p_token;
$$;

-- ── View counter ────────────────────────────────────────────────────────────
create or replace function public.increment_board_view(p_token uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.shared_boards
  set view_count = coalesce(view_count, 0) + 1
  where token = p_token;
$$;

-- Expose the functions to the publishable (anon) and authenticated roles only.
revoke all on function public.get_shared_board(uuid)    from public;
revoke all on function public.increment_board_view(uuid) from public;
grant execute on function public.get_shared_board(uuid)    to anon, authenticated;
grant execute on function public.increment_board_view(uuid) to anon, authenticated;

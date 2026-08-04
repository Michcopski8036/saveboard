-- Bilingual shared boards.
--
-- A /guides/ post ships in English and Korean but points both versions at ONE
-- board, so the board has to render in the reader's language rather than pick a
-- side. Item-level Korean lives inside links_snapshot (title_ko /
-- description_ko, added by the board script); the board's own name needs a
-- column.
--
-- Nullable, so every board a normal user shares is unaffected — the client
-- falls back to `category` whenever `category_ko` is absent.

alter table public.shared_boards
  add column if not exists category_ko text;

-- get_shared_board is `returns setof public.shared_boards` + `select *`, so the
-- new column flows through on its own. Recreate it anyway so the function's
-- cached result type is rebuilt, then tell PostgREST to reload its schema cache
-- (otherwise the REST layer keeps serving the old column list).
create or replace function public.get_shared_board(p_token uuid)
returns setof public.shared_boards
language sql
security definer
set search_path = public
stable
as $$
  select * from public.shared_boards where token = p_token;
$$;

revoke all on function public.get_shared_board(uuid) from public;
grant execute on function public.get_shared_board(uuid) to anon, authenticated;

notify pgrst, 'reload schema';

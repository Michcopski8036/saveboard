-- Unified boards — Phase 2b cleanup (2026-07-02).
-- The Phase 1 backfill created a board named 'None' for every user whose
-- unsorted links were stored with category = 'None'. 'None' is the unsorted
-- sentinel, not a real board — remove those boards and return their links to
-- unsorted (board_id null). Safe/idempotent. Run in the SQL editor.

-- 1. Detach links from any 'None' board → unsorted.
update public.links l
set board_id = null
from public.boards b
where l.board_id = b.id and b.name = 'None';

-- 2. Drop memberships of 'None' boards.
delete from public.board_members m
using public.boards b
where m.board_id = b.id and b.name = 'None';

-- 3. Drop the 'None' boards themselves.
delete from public.boards where name = 'None';

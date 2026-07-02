-- Unified boards — Phase 3a (2026-07-02). Drop the dead collaborative-boards
-- subsystem (superseded by unified boards) and the dead `categories` table
-- (superseded by `boards`; its data was backfilled in Phase 1).
--
-- The client no longer references any of these (verified: no collab_* reads;
-- categories only remained in delete-account/admin-stats, now repointed to
-- boards). `links.category` COLUMN is intentionally KEPT for now — dropping it
-- is Phase 3b and needs the link-save paths refactored first.
--
-- ⚠️ DESTRUCTIVE. Back up (export collab_* + categories) first, and run only
-- AFTER the 3a client changes are deployed to prod.

-- ── Tables first: dropping a table drops its RLS policies, which frees the
--    is_collab_* helper functions to be dropped afterwards. Children → parents. ──
drop table if exists public.collab_links;
drop table if exists public.collab_board_members;
drop table if exists public.collab_boards;

-- Dead categories table (boards is the source of truth now).
drop table if exists public.categories;

-- ── Now the orphaned collab functions ───────────────────────────────────────
drop function if exists public.create_collab_board(text);
drop function if exists public.join_collab_board(uuid);
drop function if exists public.get_collab_board_by_token(uuid);
drop function if exists public.is_collab_member(uuid);
drop function if exists public.is_collab_owner(uuid);
drop function if exists public.has_team_plan(uuid);

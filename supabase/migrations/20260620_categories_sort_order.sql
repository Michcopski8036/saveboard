-- Board ordering: add a per-user sort_order to categories so boards can be
-- drag-reordered and the order syncs across devices.
-- Idempotent: safe to run more than once / via the Supabase dashboard SQL editor.

alter table public.categories
  add column if not exists sort_order int;

-- Backfill any existing rows that don't have an order yet, per user, by creation order.
with ordered as (
  select id,
         row_number() over (partition by user_id order by created_at, id) - 1 as rn
  from public.categories
  where sort_order is null
)
update public.categories c
set sort_order = o.rn
from ordered o
where c.id = o.id;

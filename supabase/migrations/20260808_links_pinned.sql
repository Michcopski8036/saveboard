-- Pinned (announcement) cards: board owners can pin a link so it surfaces
-- first in every view. Apply BEFORE deploying the client that reads/writes it.
alter table links add column if not exists pinned boolean not null default false;
